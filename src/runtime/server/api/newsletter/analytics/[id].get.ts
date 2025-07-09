import { defineEventHandler, createError, getRouterParam, getQuery } from "h3";
import { useRuntimeConfig } from "#imports";
import {
  createDirectus,
  rest,
  readItem,
  readItems,
  aggregate,
} from "@directus/sdk";

import { getDirectusClient } from "../../../middleware/directus-auth";

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig();
    const newsletterId = getRouterParam(event, "id");

    if (!newsletterId || isNaN(Number(newsletterId))) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid newsletter ID",
      });
    }

    const directus = getDirectusClient(event);

    // Get query parameters for filtering
    const query = getQuery(event);
    const timeRange = query.timeRange || "all"; // all, 24h, 7d, 30d
    const includeDetails = query.details === "true";

    // Fetch newsletter
    const newsletter = await directus.request(
      (readItem as any)("newsletters", Number(newsletterId), {
        fields: [
          "id",
          "title",
          "subject_line",
          "status",
          "date_created",
          "last_sent_at",
          "total_sent",
          "total_opens",
          "total_clicks",
          "total_bounces",
          "total_unsubscribes",
        ],
      })
    );

    if (!newsletter) {
      throw createError({
        statusCode: 404,
        statusMessage: "Newsletter not found",
      });
    }

    // Build time filter
    const timeFilter = buildTimeFilter(timeRange as string);

    // Fetch analytics data
    const [
      sends,
      events,
      topLinks,
      deviceStats,
      locationStats,
      timeSeriesData,
    ] = await Promise.all([
      fetchSendStats(directus, Number(newsletterId), timeFilter),
      fetchEventStats(directus, Number(newsletterId), timeFilter),
      fetchTopLinks(directus, Number(newsletterId), timeFilter),
      fetchDeviceStats(directus, Number(newsletterId), timeFilter),
      fetchLocationStats(directus, Number(newsletterId), timeFilter),
      fetchTimeSeriesData(directus, Number(newsletterId), timeFilter),
    ]);

    // Calculate derived metrics
    const analytics = calculateAnalytics(newsletter, sends, events);

    // Build response
    const response: any = {
      newsletter: {
        id: newsletter.id,
        title: newsletter.title,
        subject_line: newsletter.subject_line,
        status: newsletter.status,
        date_createdt: newsletter.date_created,
        last_sent_at: newsletter.last_sent_at,
      },
      statistics: analytics,
      performance: {
        sends: sends.total_sends || 0,
        deliveries: sends.total_deliveries || 0,
        opens: events.opens || 0,
        clicks: events.clicks || 0,
        bounces: events.bounces || 0,
        unsubscribes: events.unsubscribes || 0,
        complaints: events.complaints || 0,
      },
      rates: {
        delivery_rate: analytics.delivery_rate,
        open_rate: analytics.open_rate,
        click_rate: analytics.click_rate,
        click_to_open_rate: analytics.click_to_open_rate,
        bounce_rate: analytics.bounce_rate,
        unsubscribe_rate: analytics.unsubscribe_rate,
      },
      insights: {
        top_links: topLinks,
        devices: deviceStats,
        locations: locationStats,
        timeline: timeSeriesData,
      },
      metadata: {
        time_range: timeRange,
        generated_at: new Date().toISOString(),
        data_points: events.total_events || 0,
      },
    };

    // Include detailed event data if requested
    if (includeDetails) {
      response.details = await fetchDetailedEvents(
        directus,
        Number(newsletterId),
        timeFilter
      );
    }

    return response;
  } catch (error: any) {
    console.error("Analytics fetch error:", error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch analytics",
      data: {
        error: error.message,
      },
    });
  }
});

// Build time filter based on range
function buildTimeFilter(timeRange: string) {
  const now = new Date();
  let startDate: Date;

  switch (timeRange) {
    case "24h":
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case "7d":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      return {}; // No time filter for "all"
  }

  return {
    date_created: {
      _gte: startDate.toISOString(),
    },
  };
}

// Fetch send statistics
async function fetchSendStats(
  directus: any,
  newsletterId: number,
  timeFilter: any
) {
  const sendStats = await directus.request(
    (aggregate as any)("newsletter_sends", {
      aggregate: {
        count: "*",
        sum: ["sent_count", "failed_count"],
      },
      filter: {
        newsletter_id: { _eq: newsletterId },
        ...timeFilter,
      },
    })
  );

  const result = sendStats[0] || {};
  return {
    total_sends: result.count || 0,
    total_deliveries: result.sum?.sent_count || 0,
    total_failures: result.sum?.failed_count || 0,
  };
}

// Fetch event statistics
async function fetchEventStats(
  directus: any,
  newsletterId: number,
  timeFilter: any
) {
  const eventStats = await directus.request(
    (readItems as any)("newsletter_events", {
      aggregate: {
        count: "*",
      },
      groupBy: ["event_type"],
      filter: {
        newsletter_id: { _eq: newsletterId },
        ...timeFilter,
      },
    })
  );

  const events: any = {
    total_events: 0,
    opens: 0,
    clicks: 0,
    bounces: 0,
    unsubscribes: 0,
    complaints: 0,
  };

  eventStats.forEach((stat: any) => {
    const count = stat.count || 0;
    events.total_events += count;

    switch (stat.event_type) {
      case "open":
        events.opens = count;
        break;
      case "click":
        events.clicks = count;
        break;
      case "bounce":
        events.bounces = count;
        break;
      case "unsubscribe":
        events.unsubscribes = count;
        break;
      case "spamreport":
        events.complaints = count;
        break;
    }
  });

  return events;
}

// Fetch top clicked links
async function fetchTopLinks(
  directus: any,
  newsletterId: number,
  timeFilter: any
) {
  try {
    const links = await directus.request(
      (readItems as any)("newsletter_events", {
        fields: ["url", "count(*)"],
        filter: {
          newsletter_id: { _eq: newsletterId },
          event_type: { _eq: "click" },
          url: { _nnull: true },
          ...timeFilter,
        },
        groupBy: ["url"],
        sort: ["-count"],
        limit: 10,
      })
    );

    return links.map((link: any) => ({
      url: link.url,
      clicks: link.count || 0,
      percentage: 0, // Will be calculated later if needed
    }));
  } catch (error) {
    console.error("Error fetching top links:", error);
    return [];
  }
}

// Fetch device/client statistics
async function fetchDeviceStats(
  directus: any,
  newsletterId: number,
  timeFilter: any
) {
  try {
    const devices = await directus.request(
      (readItems as any)("newsletter_events", {
        fields: ["user_agent", "count(*)"],
        filter: {
          newsletter_id: { _eq: newsletterId },
          event_type: { _eq: "open" },
          user_agent: { _nnull: true },
          ...timeFilter,
        },
        groupBy: ["user_agent"],
        sort: ["-count"],
        limit: 10,
      })
    );

    // Categorize devices
    const categories = {
      mobile: 0,
      desktop: 0,
      tablet: 0,
      unknown: 0,
    };

    const clients: any[] = [];

    devices.forEach((device: any) => {
      const userAgent = device.user_agent?.toLowerCase() || "";
      const count = device.count || 0;

      // Categorize device type
      if (
        userAgent.includes("mobile") ||
        userAgent.includes("android") ||
        userAgent.includes("iphone")
      ) {
        categories.mobile += count;
      } else if (userAgent.includes("tablet") || userAgent.includes("ipad")) {
        categories.tablet += count;
      } else if (
        userAgent.includes("windows") ||
        userAgent.includes("macintosh") ||
        userAgent.includes("linux")
      ) {
        categories.desktop += count;
      } else {
        categories.unknown += count;
      }

      // Extract client name
      let clientName = "Unknown";
      if (userAgent.includes("gmail")) clientName = "Gmail";
      else if (userAgent.includes("outlook")) clientName = "Outlook";
      else if (userAgent.includes("yahoo")) clientName = "Yahoo Mail";
      else if (userAgent.includes("apple mail")) clientName = "Apple Mail";
      else if (userAgent.includes("thunderbird")) clientName = "Thunderbird";

      clients.push({
        name: clientName,
        count,
        user_agent: device.user_agent,
      });
    });

    return {
      categories,
      clients: clients.slice(0, 5), // Top 5 clients
    };
  } catch (error) {
    console.error("Error fetching device stats:", error);
    return { categories: {}, clients: [] };
  }
}

// Fetch location statistics
async function fetchLocationStats(
  directus: any,
  newsletterId: number,
  timeFilter: any
) {
  try {
    const locations = await directus.request(
      (readItems as any)("newsletter_events", {
        fields: ["ip_location", "count(*)"],
        filter: {
          newsletter_id: { _eq: newsletterId },
          event_type: { _eq: "open" },
          ip_location: { _nnull: true },
          ...timeFilter,
        },
        groupBy: ["ip_location"],
        sort: ["-count"],
        limit: 10,
      })
    );

    return locations.map((location: any) => ({
      location: location.ip_location,
      opens: location.count || 0,
    }));
  } catch (error) {
    console.error("Error fetching location stats:", error);
    return [];
  }
}

// Fetch time series data for charts
async function fetchTimeSeriesData(
  directus: any,
  newsletterId: number,
  timeFilter: any
) {
  try {
    const events = await directus.request(
      (readItems as any)("newsletter_events", {
        fields: ["date_created", "event_type", "count(*)"],
        filter: {
          newsletter_id: { _eq: newsletterId },
          ...timeFilter,
        },
        groupBy: ["date_created::date", "event_type"],
        sort: ["date_created"],
      })
    );

    // Group by date
    const timeSeriesMap = new Map<string, any>();

    events.forEach((event: any) => {
      const date = event.date_created?.split("T")[0] || "unknown";

      if (!timeSeriesMap.has(date)) {
        timeSeriesMap.set(date, {
          date,
          opens: 0,
          clicks: 0,
          bounces: 0,
          unsubscribes: 0,
        });
      }

      const dayData = timeSeriesMap.get(date)!;
      const count = event.count || 0;

      switch (event.event_type) {
        case "open":
          dayData.opens += count;
          break;
        case "click":
          dayData.clicks += count;
          break;
        case "bounce":
          dayData.bounces += count;
          break;
        case "unsubscribe":
          dayData.unsubscribes += count;
          break;
      }
    });

    return Array.from(timeSeriesMap.values());
  } catch (error) {
    console.error("Error fetching time series data:", error);
    return [];
  }
}

// Calculate analytics metrics
function calculateAnalytics(newsletter: any, sends: any, events: any) {
  const totalSent = sends.total_deliveries || newsletter.total_sent || 0;
  const opens = events.opens || newsletter.total_opens || 0;
  const clicks = events.clicks || newsletter.total_clicks || 0;
  const bounces = events.bounces || newsletter.total_bounces || 0;
  const unsubscribes =
    events.unsubscribes || newsletter.total_unsubscribes || 0;

  return {
    total_sent: totalSent,
    total_opens: opens,
    total_clicks: clicks,
    total_bounces: bounces,
    total_unsubscribes: unsubscribes,
    unique_opens: opens, // Simplified - you might want to track unique opens separately
    unique_clicks: clicks, // Simplified - you might want to track unique clicks separately

    // Rates
    delivery_rate:
      totalSent > 0 ? ((totalSent - bounces) / totalSent) * 100 : 0,
    open_rate: totalSent > 0 ? (opens / totalSent) * 100 : 0,
    click_rate: totalSent > 0 ? (clicks / totalSent) * 100 : 0,
    click_to_open_rate: opens > 0 ? (clicks / opens) * 100 : 0,
    bounce_rate: totalSent > 0 ? (bounces / totalSent) * 100 : 0,
    unsubscribe_rate: totalSent > 0 ? (unsubscribes / totalSent) * 100 : 0,
  };
}

// Fetch detailed event data (when requested)
async function fetchDetailedEvents(
  directus: any,
  newsletterId: number,
  timeFilter: any
) {
  try {
    const events = await directus.request(
      (readItems as any)("newsletter_events", {
        fields: [
          "id",
          "event_type",
          "email",
          "url",
          "user_agent",
          "ip_address",
          "ip_location",
          "date_created",
        ],
        filter: {
          newsletter_id: { _eq: newsletterId },
          ...timeFilter,
        },
        sort: ["-date_created"],
        limit: 1000, // Limit to prevent huge responses
      })
    );

    return events;
  } catch (error) {
    console.error("Error fetching detailed events:", error);
    return [];
  }
}
