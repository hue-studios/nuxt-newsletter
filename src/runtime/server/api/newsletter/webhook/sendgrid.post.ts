// src/runtime/server/api/newsletter/webhook/sendgrid.post.ts
import {
  createDirectus,
  rest,
  createItem,
  readItem,
  updateItem,
} from "@directus/sdk";
import { validateWebhookSignature } from "~/server/middleware/validation";
import { getDirectusClient } from "~/server/middleware/directus-auth";

// SendGrid event types we track
const TRACKED_EVENTS = [
  "delivered",
  "open",
  "click",
  "bounce",
  "dropped",
  "deferred",
  "processed",
  "unsubscribe",
  "group_unsubscribe",
  "spamreport",
];

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig();

    // Get raw body for signature verification
    const body = await readRawBody(event);
    if (!body) {
      throw createError({
        statusCode: 400,
        statusMessage: "Request body is required",
      });
    }

    // Verify webhook signature if secret is configured
    const webhookSecret = config.newsletter?.webhookSecret;
    if (webhookSecret) {
      const signature
        = getHeader(event, "x-twilio-email-event-webhook-signature")
          || getHeader(event, "x-sendgrid-signature");

      if (!signature) {
        throw createError({
          statusCode: 401,
          statusMessage: "Missing webhook signature",
        });
      }

      const isValidSignature = validateWebhookSignature(
        event,
        body.toString(),
        signature,
        webhookSecret,
      );

      if (!isValidSignature) {
        throw createError({
          statusCode: 401,
          statusMessage: "Invalid webhook signature",
        });
      }
    }

    // Parse the JSON payload
    let events: any[];
    try {
      events = JSON.parse(body.toString());
    } catch (parseError) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid JSON payload",
      });
    }

    if (!Array.isArray(events)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Payload must be an array of events",
      });
    }

    // Initialize Directus client
    const directus = getDirectusClient(event);

    // Process each event
    const results = {
      processed: 0,
      skipped: 0,
      errors: 0,
      details: [] as any[],
    };

    for (const webhookEvent of events) {
      try {
        const result = await processWebhookEvent(directus, webhookEvent);

        if (result.processed) {
          results.processed++;
        } else {
          results.skipped++;
        }

        results.details.push(result);
      } catch (error: any) {
        results.errors++;
        results.details.push({
          event: webhookEvent,
          error: error.message,
          processed: false,
        });

        console.error("Error processing webhook event:", error, webhookEvent);
      }
    }

    return {
      success: true,
      message: `Processed ${results.processed} events, skipped ${results.skipped}, errors ${results.errors}`,
      results,
    };
  } catch (error: any) {
    console.error("SendGrid webhook error:", error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Webhook processing failed",
      data: {
        error: error.message,
      },
    });
  }
});

// Process individual webhook event
async function processWebhookEvent(directus: any, webhookEvent: any) {
  // Extract event data
  const {
    event: eventType,
    email,
    timestamp,
    newsletter_id,
    subscriber_id,
    send_record_id,
    url,
    user_agent,
    ip,
    location,
    sg_message_id,
    sg_event_id,
    reason,
    status,
    response,
    attempt,
    useragent,
    ...additionalData
  } = webhookEvent;

  // Skip events we don't track
  if (!TRACKED_EVENTS.includes(eventType)) {
    return {
      event: webhookEvent,
      processed: false,
      reason: `Event type '${eventType}' not tracked`,
    };
  }

  // Skip events without required data
  if (!email || !timestamp) {
    return {
      event: webhookEvent,
      processed: false,
      reason: "Missing required fields (email, timestamp)",
    };
  }

  // Extract newsletter ID from custom args
  const newsletterIdFromEvent
    = newsletter_id
      || webhookEvent.newsletter_id
      || extractFromCustomArgs(webhookEvent, "newsletter_id");

  if (!newsletterIdFromEvent) {
    return {
      event: webhookEvent,
      processed: false,
      reason: "Newsletter ID not found",
    };
  }

  try {
    // Create newsletter event record
    const eventRecord = await directus.request(
      createItem("newsletter_events", {
        newsletter_id: Number.parseInt(newsletterIdFromEvent),
        event_type: eventType,
        email: email.toLowerCase(),
        timestamp: new Date(timestamp * 1000).toISOString(),
        url: url || null,
        user_agent: user_agent || useragent || null,
        ip_address: ip || null,
        ip_location: location || null,
        sendgrid_message_id: sg_message_id || null,
        sendgrid_event_id: sg_event_id || null,
        bounce_reason: reason || null,
        response_status: response || status || null,
        attempt_number: attempt || null,
        metadata: JSON.stringify(additionalData),
        created_at: new Date().toISOString(),
      }),
    );

    // Update newsletter statistics
    await updateNewsletterStats(
      directus,
      Number.parseInt(newsletterIdFromEvent),
      eventType,
    );

    // Handle specific event types
    await handleSpecificEvent(directus, eventType, email, webhookEvent);

    return {
      event: webhookEvent,
      processed: true,
      event_id: eventRecord.id,
    };
  } catch (error: any) {
    throw new Error(`Failed to save event: ${error.message}`);
  }
}

// Update newsletter statistics
async function updateNewsletterStats(
  directus: any,
  newsletterId: number,
  eventType: string,
) {
  try {
    const newsletter = await directus.request(
      readItem("newsletters", newsletterId, {
        fields: [
          "total_opens",
          "total_clicks",
          "total_bounces",
          "total_unsubscribes",
          "total_complaints",
        ],
      }),
    );

    if (!newsletter) {
      return; // Newsletter not found, skip update
    }

    const updates: any = {};

    switch (eventType) {
      case "open":
        updates.total_opens = (newsletter.total_opens || 0) + 1;
        break;
      case "click":
        updates.total_clicks = (newsletter.total_clicks || 0) + 1;
        break;
      case "bounce":
      case "dropped":
        updates.total_bounces = (newsletter.total_bounces || 0) + 1;
        break;
      case "unsubscribe":
      case "group_unsubscribe":
        updates.total_unsubscribes = (newsletter.total_unsubscribes || 0) + 1;
        break;
      case "spamreport":
        updates.total_complaints = (newsletter.total_complaints || 0) + 1;
        break;
    }

    if (Object.keys(updates).length > 0) {
      await directus.request(updateItem("newsletters", newsletterId, updates));
    }
  } catch (error) {
    console.error("Error updating newsletter stats:", error);
    // Don't throw - stats update failure shouldn't fail the whole webhook
  }
}

// Handle specific event types with additional processing
async function handleSpecificEvent(
  directus: any,
  eventType: string,
  email: string,
  webhookEvent: any,
) {
  switch (eventType) {
    case "unsubscribe":
    case "group_unsubscribe":
      await handleUnsubscribe(directus, email, webhookEvent);
      break;

    case "bounce":
      await handleBounce(directus, email, webhookEvent);
      break;

    case "spamreport":
      await handleSpamComplaint(directus, email, webhookEvent);
      break;

    case "dropped":
      await handleDrop(directus, email, webhookEvent);
      break;
  }
}

// Handle unsubscribe events
async function handleUnsubscribe(
  directus: any,
  email: string,
  webhookEvent: any,
) {
  try {
    // Find subscriber and update status
    const subscribers = await directus.request(
      readItems("subscribers", {
        filter: { email: { _eq: email.toLowerCase() } },
        limit: 1,
      }),
    );

    if (subscribers.length > 0) {
      await directus.request(
        updateItem("subscribers", subscribers[0].id, {
          status: "unsubscribed",
          unsubscribed_at: new Date().toISOString(),
          unsubscribe_reason: "webhook_unsubscribe",
        }),
      );
    }

    // Log unsubscribe
    await directus.request(
      createItem("newsletter_unsubscribes", {
        email: email.toLowerCase(),
        reason: "email_unsubscribe",
        newsletter_id: extractFromCustomArgs(webhookEvent, "newsletter_id"),
        timestamp: new Date(webhookEvent.timestamp * 1000).toISOString(),
        metadata: JSON.stringify(webhookEvent),
      }),
    );
  } catch (error) {
    console.error("Error handling unsubscribe:", error);
  }
}

// Handle bounce events
async function handleBounce(directus: any, email: string, webhookEvent: any) {
  try {
    const bounceType = webhookEvent.type || "unknown";
    const isHardBounce
      = bounceType === "bounce" || webhookEvent.reason?.includes("invalid");

    // Update subscriber status for hard bounces
    if (isHardBounce) {
      const subscribers = await directus.request(
        readItems("subscribers", {
          filter: { email: { _eq: email.toLowerCase() } },
          limit: 1,
        }),
      );

      if (subscribers.length > 0) {
        await directus.request(
          updateItem("subscribers", subscribers[0].id, {
            status: "bounced",
            bounce_count: (subscribers[0].bounce_count || 0) + 1,
            last_bounce_at: new Date().toISOString(),
          }),
        );
      }
    }

    // Log bounce
    await directus.request(
      createItem("newsletter_bounces", {
        email: email.toLowerCase(),
        bounce_type: bounceType,
        reason: webhookEvent.reason || null,
        newsletter_id: extractFromCustomArgs(webhookEvent, "newsletter_id"),
        timestamp: new Date(webhookEvent.timestamp * 1000).toISOString(),
        is_hard_bounce: isHardBounce,
        metadata: JSON.stringify(webhookEvent),
      }),
    );
  } catch (error) {
    console.error("Error handling bounce:", error);
  }
}

// Handle spam complaint events
async function handleSpamComplaint(
  directus: any,
  email: string,
  webhookEvent: any,
) {
  try {
    // Update subscriber status
    const subscribers = await directus.request(
      readItems("subscribers", {
        filter: { email: { _eq: email.toLowerCase() } },
        limit: 1,
      }),
    );

    if (subscribers.length > 0) {
      await directus.request(
        updateItem("subscribers", subscribers[0].id, {
          status: "complained",
          complaint_count: (subscribers[0].complaint_count || 0) + 1,
          last_complaint_at: new Date().toISOString(),
        }),
      );
    }

    // Log complaint
    await directus.request(
      createItem("newsletter_complaints", {
        email: email.toLowerCase(),
        newsletter_id: extractFromCustomArgs(webhookEvent, "newsletter_id"),
        timestamp: new Date(webhookEvent.timestamp * 1000).toISOString(),
        metadata: JSON.stringify(webhookEvent),
      }),
    );
  } catch (error) {
    console.error("Error handling spam complaint:", error);
  }
}

// Handle dropped events
async function handleDrop(directus: any, email: string, webhookEvent: any) {
  try {
    // Log drop
    await directus.request(
      createItem("newsletter_drops", {
        email: email.toLowerCase(),
        reason: webhookEvent.reason || "unknown",
        newsletter_id: extractFromCustomArgs(webhookEvent, "newsletter_id"),
        timestamp: new Date(webhookEvent.timestamp * 1000).toISOString(),
        metadata: JSON.stringify(webhookEvent),
      }),
    );
  } catch (error) {
    console.error("Error handling drop:", error);
  }
}

// Extract data from custom args
function extractFromCustomArgs(webhookEvent: any, key: string) {
  // Try different possible locations for custom args
  const customArgs
    = webhookEvent.custom_args || webhookEvent.unique_args || webhookEvent[key];

  if (typeof customArgs === "object" && customArgs[key]) {
    return customArgs[key];
  }

  if (typeof customArgs === "string") {
    return customArgs;
  }

  // Try to find it in the root level
  return webhookEvent[key];
}
