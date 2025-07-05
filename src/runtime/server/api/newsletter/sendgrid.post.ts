import { createDirectus, rest, updateItem, readItem } from "@directus/sdk";

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig();
    const body = await readBody(event);

    // Verify SendGrid webhook signature if configured
    const signature = getHeader(
      event,
      "x-twilio-email-event-webhook-signature"
    );
    if (config.sendgridWebhookKey && signature) {
      // TODO: Implement signature verification
    }

    // Process webhook events
    const events = Array.isArray(body) ? body : [body];
    const directus = createDirectus(config.public.directusUrl as string).with(
      rest()
    );

    for (const eventData of events) {
      try {
        await processWebhookEvent(directus, eventData);
      } catch (error) {
        console.error("Error processing webhook event:", error);
      }
    }

    return { success: true, processed: events.length };
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Webhook processing failed",
    });
  }
});

async function processWebhookEvent(directus: any, eventData: any) {
  const { event, newsletter_id, subscriber_id, send_record_id } = eventData;

  switch (event) {
    case "open":
      // Update newsletter opens
      if (newsletter_id) {
        const newsletter = await directus.request(
          readItem("newsletters", newsletter_id)
        );
        if (newsletter) {
          await directus.request(
            updateItem("newsletters", newsletter_id, {
              total_opens: (newsletter.total_opens || 0) + 1,
            })
          );
        }
      }

      // Update send record opens
      if (send_record_id) {
        const sendRecord = await directus.request(
          readItem("newsletter_sends", send_record_id)
        );
        if (sendRecord) {
          await directus.request(
            updateItem("newsletter_sends", send_record_id, {
              open_count: (sendRecord.open_count || 0) + 1,
            })
          );
        }
      }
      break;

    case "click":
      // Update newsletter clicks
      if (newsletter_id) {
        // TODO: Implement click tracking
      }
      break;

    case "bounce":
    case "dropped":
      // Update subscriber status
      if (subscriber_id) {
        await directus.request(
          updateItem("subscribers", subscriber_id, {
            status: "bounced",
          })
        );
      }
      break;

    case "unsubscribe":
      // Update subscriber status
      if (subscriber_id) {
        await directus.request(
          updateItem("subscribers", subscriber_id, {
            status: "unsubscribed",
          })
        );
      }
      break;
  }
}

// Utility function for unsubscribe tokens
function generateUnsubscribeToken(email: string, secretKey: string): string {
  const crypto = require("crypto");
  const data = `${email}:${secretKey}`;
  return crypto
    .createHash("sha256")
    .update(data)
    .digest("hex")
    .substring(0, 16);
}
