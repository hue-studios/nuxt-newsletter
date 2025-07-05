import { createDirectus, rest, readItem, readItems } from "@directus/sdk";

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig();
    const newsletterId = getRouterParam(event, "id");

    if (!newsletterId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Newsletter ID is required",
      });
    }

    // Initialize Directus client
    const directus = createDirectus(config.public.directusUrl as string).with(
      rest()
    );

    // Fetch newsletter with analytics
    const newsletter = await directus.request(
      readItem("newsletters", newsletterId, {
        fields: [
          "id",
          "title",
          "subject_line",
          "status",
          "open_rate",
          "click_rate",
          "total_opens",
          "created_at",
        ],
      })
    );

    if (!newsletter) {
      throw createError({
        statusCode: 404,
        statusMessage: "Newsletter not found",
      });
    }

    // Fetch send records
    const sendRecords = await directus.request(
      readItems("newsletter_sends", {
        filter: { newsletter_id: { _eq: newsletterId } },
        fields: [
          "id",
          "status",
          "total_recipients",
          "sent_count",
          "open_count",
          "click_count",
          "sent_at",
          "mailing_list_id.name",
        ],
      })
    );

    // Calculate aggregate statistics
    const totalSent = sendRecords.reduce(
      (sum: number, record: any) => sum + (record.sent_count || 0),
      0
    );
    const totalOpens = sendRecords.reduce(
      (sum: number, record: any) => sum + (record.open_count || 0),
      0
    );
    const totalClicks = sendRecords.reduce(
      (sum: number, record: any) => sum + (record.click_count || 0),
      0
    );

    const openRate = totalSent > 0 ? (totalOpens / totalSent) * 100 : 0;
    const clickRate = totalSent > 0 ? (totalClicks / totalSent) * 100 : 0;
    const clickToOpenRate =
      totalOpens > 0 ? (totalClicks / totalOpens) * 100 : 0;

    return {
      newsletter,
      statistics: {
        total_sent: totalSent,
        total_opens: totalOpens,
        total_clicks: totalClicks,
        open_rate: Math.round(openRate * 10) / 10,
        click_rate: Math.round(clickRate * 10) / 10,
        click_to_open_rate: Math.round(clickToOpenRate * 10) / 10,
      },
      send_records: sendRecords,
      performance_over_time: sendRecords.map((record: any) => ({
        date: record.sent_at,
        opens: record.open_count || 0,
        clicks: record.click_count || 0,
        sent: record.sent_count || 0,
      })),
    };
  } catch (error: any) {
    console.error("Analytics fetch error:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Failed to fetch analytics",
    });
  }
});
