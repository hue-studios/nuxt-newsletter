// src/runtime/server/api/newsletter/analytics/export.post.ts
import { createDirectus, rest, readItems, readItem } from "@directus/sdk";

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig();
    const body = await readBody(event);

    const {
      newsletter_ids = [],
      date_range,
      format = "csv",
      include_details = false,
    } = body;

    // Initialize Directus client
    const directus = createDirectus(config.public.directusUrl as string).with(
      rest()
    );

    // Build filter for date range
    let dateFilter = {};
    if (date_range) {
      if (date_range.start) {
        dateFilter = { ...dateFilter, created_at: { _gte: date_range.start } };
      }
      if (date_range.end) {
        dateFilter = { ...dateFilter, created_at: { _lte: date_range.end } };
      }
    }

    // Build newsletter filter
    let newsletterFilter = {};
    if (newsletter_ids.length > 0) {
      newsletterFilter = { id: { _in: newsletter_ids } };
    }

    // Combine filters
    const finalFilter = {
      ...newsletterFilter,
      ...dateFilter,
      status: { _eq: "sent" },
    };

    // Fetch newsletters with analytics
    const newsletters = await directus.request(
      readItems("newsletters", {
        filter: finalFilter,
        fields: [
          "id",
          "title",
          "subject_line",
          "category",
          "open_rate",
          "click_rate",
          "total_opens",
          "created_at",
          "from_name",
          "from_email",
        ],
        sort: ["-created_at"],
      })
    );

    if (newsletters.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: "No newsletters found for the specified criteria",
      });
    }

    // Fetch detailed analytics if requested
    let detailedData = [];
    if (include_details) {
      for (const newsletter of newsletters) {
        const sends = await directus.request(
          readItems("newsletter_sends", {
            filter: { newsletter_id: { _eq: newsletter.id } },
            fields: [
              "id",
              "mailing_list_id.name",
              "sent_count",
              "open_count",
              "click_count",
              "sent_at",
              "status",
            ],
          })
        );

        detailedData.push({
          newsletter,
          sends,
        });
      }
    }

    // Format data based on requested format
    if (format === "csv") {
      const csvData = generateCSV(newsletters, detailedData, include_details);

      setHeader(event, "Content-Type", "text/csv");
      setHeader(
        event,
        "Content-Disposition",
        `attachment; filename="newsletter-analytics-${
          new Date().toISOString().split("T")[0]
        }.csv"`
      );

      return csvData;
    } else if (format === "json") {
      const jsonData = {
        export_date: new Date().toISOString(),
        total_newsletters: newsletters.length,
        date_range,
        summary: calculateSummary(newsletters),
        newsletters: include_details ? detailedData : newsletters,
      };

      setHeader(event, "Content-Type", "application/json");
      setHeader(
        event,
        "Content-Disposition",
        `attachment; filename="newsletter-analytics-${
          new Date().toISOString().split("T")[0]
        }.json"`
      );

      return jsonData;
    } else if (format === "excel") {
      // For Excel format, we'd typically use a library like exceljs
      // For now, return CSV with Excel-friendly headers
      const csvData = generateCSV(newsletters, detailedData, include_details);

      setHeader(event, "Content-Type", "application/vnd.ms-excel");
      setHeader(
        event,
        "Content-Disposition",
        `attachment; filename="newsletter-analytics-${
          new Date().toISOString().split("T")[0]
        }.xls"`
      );

      return csvData;
    }

    throw createError({
      statusCode: 400,
      statusMessage: "Unsupported export format. Use 'csv', 'json', or 'excel'",
    });
  } catch (error: any) {
    console.error("Analytics export error:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Failed to export analytics data",
    });
  }
});

function generateCSV(
  newsletters: any[],
  detailedData: any[],
  includeDetails: boolean
): string {
  const headers = [
    "Newsletter ID",
    "Title",
    "Subject Line",
    "Category",
    "Created Date",
    "From Name",
    "From Email",
    "Open Rate (%)",
    "Click Rate (%)",
    "Total Opens",
  ];

  if (includeDetails) {
    headers.push(
      "Mailing List",
      "Recipients",
      "Opens",
      "Clicks",
      "Send Date",
      "Send Status"
    );
  }

  let csvContent = headers.join(",") + "\n";

  if (includeDetails) {
    // Detailed format with send records
    detailedData.forEach(({ newsletter, sends }) => {
      sends.forEach((send: any) => {
        const row = [
          newsletter.id,
          escapeCSV(newsletter.title),
          escapeCSV(newsletter.subject_line),
          newsletter.category,
          newsletter.created_at,
          escapeCSV(newsletter.from_name),
          newsletter.from_email,
          newsletter.open_rate || 0,
          newsletter.click_rate || 0,
          newsletter.total_opens || 0,
          escapeCSV(send.mailing_list_id?.name || "Unknown"),
          send.sent_count || 0,
          send.open_count || 0,
          send.click_count || 0,
          send.sent_at || "",
          send.status,
        ];
        csvContent += row.join(",") + "\n";
      });
    });
  } else {
    // Summary format
    newsletters.forEach((newsletter) => {
      const row = [
        newsletter.id,
        escapeCSV(newsletter.title),
        escapeCSV(newsletter.subject_line),
        newsletter.category,
        newsletter.created_at,
        escapeCSV(newsletter.from_name),
        newsletter.from_email,
        newsletter.open_rate || 0,
        newsletter.click_rate || 0,
        newsletter.total_opens || 0,
      ];
      csvContent += row.join(",") + "\n";
    });
  }

  return csvContent;
}

function escapeCSV(value: string): string {
  if (!value) return "";

  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return '"' + value.replace(/"/g, '""') + '"';
  }

  return value;
}

function calculateSummary(newsletters: any[]) {
  const totalNewsletters = newsletters.length;
  const avgOpenRate =
    newsletters.reduce((sum, n) => sum + (n.open_rate || 0), 0) /
    totalNewsletters;
  const avgClickRate =
    newsletters.reduce((sum, n) => sum + (n.click_rate || 0), 0) /
    totalNewsletters;
  const totalOpens = newsletters.reduce(
    (sum, n) => sum + (n.total_opens || 0),
    0
  );

  const bestPerformer = newsletters.reduce((best, current) =>
    (current.open_rate || 0) > (best.open_rate || 0) ? current : best
  );

  return {
    total_newsletters: totalNewsletters,
    average_open_rate: Math.round(avgOpenRate * 10) / 10,
    average_click_rate: Math.round(avgClickRate * 10) / 10,
    total_opens: totalOpens,
    best_performer: {
      id: bestPerformer.id,
      title: bestPerformer.title,
      open_rate: bestPerformer.open_rate,
    },
  };
}
