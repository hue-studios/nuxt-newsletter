import { defineEventHandler, createError } from "h3";
import { useRuntimeConfig } from "#imports";
import {
  createDirectus,
  rest,
  readItem,
  readItems,
  createItem,
  updateItem,
} from "@directus/sdk";
import { EmailService } from "../../../utils/email";
import { validators, getValidatedData } from "../../../middleware/validation";
import { getDirectusClient } from "../../../middleware/directus-auth";

export default defineEventHandler(async (event) => {
  try {
    // Apply validation middleware
    await validators.sendNewsletter(event);
    const {
      newsletter_id,
      mailing_list_ids,
      scheduled_at,
      send_immediately,
      ab_test_config,
    } = getValidatedData(event, "body");

    const config = useRuntimeConfig();

    // Initialize services
    const directus = getDirectusClient(event);
    const emailService = new EmailService({
      apiKey: config.newsletter.sendgridApiKey,
      defaultFromEmail:
        config.newsletter.defaultFromEmail || "G2T9K@example.com",
      defaultFromName: config.newsletter.defaultFromName || "Nuxt Newsletter",
      webhookSecret: config.newsletter.webhookSecret,
    });

    // Fetch newsletter with validation
    const newsletter = await directus.request(
      (readItem as any)("newsletters", newsletter_id, {
        fields: ["*"],
      })
    );

    if (!newsletter) {
      throw createError({
        statusCode: 404,
        statusMessage: "Newsletter not found",
      });
    }

    // Validate newsletter status
    if (newsletter.status !== "ready_to_send") {
      throw createError({
        statusCode: 400,
        statusMessage: "Newsletter must be in 'ready_to_send' status",
      });
    }

    // Check if newsletter is compiled
    if (!newsletter.compiled_html) {
      throw createError({
        statusCode: 400,
        statusMessage: "Newsletter must be compiled before sending",
      });
    }

    // Validate scheduling
    const sendTime = scheduled_at ? new Date(scheduled_at) : new Date();
    if (sendTime < new Date() && !send_immediately) {
      throw createError({
        statusCode: 400,
        statusMessage: "Scheduled time must be in the future",
      });
    }

    // Fetch subscribers from mailing lists
    const subscribers = await fetchSubscribers(directus, mailing_list_ids);

    if (subscribers.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage:
          "No active subscribers found in the selected mailing lists",
      });
    }

    // Create send record
    const sendRecord = await directus.request(
      (createItem as any)("newsletter_sends", {
        newsletter_id,
        mailing_list_ids: mailing_list_ids.join(","),
        total_recipients: subscribers.length,
        scheduled_at: sendTime.toISOString(),
        status: send_immediately ? "sending" : "scheduled",
        created_by: event.context.user?.id || null,
        ab_test_enabled: ab_test_config?.enabled || false,
        ab_test_percentage: ab_test_config?.percentage || 0,
        ab_test_variant_subject: ab_test_config?.variant_subject || null,
      })
    );

    // Handle immediate sending
    if (send_immediately) {
      const result = await processSend(
        emailService,
        directus,
        newsletter,
        subscribers,
        sendRecord,
        ab_test_config
      );

      return {
        success: true,
        message: "Newsletter sent successfully",
        details: result,
      };
    }

    // Handle scheduled sending
    await scheduleNewsletter(
      newsletter_id,
      sendRecord.id,
      sendTime,
      subscribers,
      ab_test_config
    );

    return {
      success: true,
      message: "Newsletter scheduled successfully",
      details: {
        newsletter_id,
        send_record_id: sendRecord.id,
        scheduled_at: sendTime.toISOString(),
        total_recipients: subscribers.length,
        ab_test_enabled: ab_test_config?.enabled || false,
      },
    };
  } catch (error: any) {
    console.error("Newsletter sending error:", error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to send newsletter",
      data: {
        error: error.message,
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
    });
  }
});

// Fetch active subscribers from mailing lists
async function fetchSubscribers(directus: any, mailingListIds: number[]) {
  const subscribers = await directus.request(
    (readItems as any)("mailing_lists_subscribers", {
      fields: [
        "subscriber_id.id",
        "subscriber_id.email",
        "subscriber_id.name",
        "subscriber_id.status",
        "subscriber_id.preferences",
        "subscriber_id.metadata",
      ],
      filter: {
        mailing_list_id: { _in: mailingListIds },
        subscriber_id: {
          status: { _eq: "active" },
          email: { _nnull: true },
        },
      },
    })
  );

  // Deduplicate subscribers and flatten structure
  const uniqueSubscribers = new Map();

  subscribers.forEach((item: any) => {
    const subscriber = item.subscriber_id;
    if (subscriber && !uniqueSubscribers.has(subscriber.email)) {
      uniqueSubscribers.set(subscriber.email, subscriber);
    }
  });

  return Array.from(uniqueSubscribers.values());
}

// Process the actual sending
async function processSend(
  emailService: EmailService,
  directus: any,
  newsletter: any,
  subscribers: any[],
  sendRecord: any,
  abTestConfig?: any
) {
  const startTime = new Date();

  try {
    let results = {
      sent: 0,
      failed: 0,
      errors: [] as string[],
      ab_test_results: null as any,
    };

    // Handle A/B testing
    if (abTestConfig?.enabled) {
      results = await processABTestSend(
        emailService,
        directus,
        newsletter,
        subscribers,
        sendRecord,
        abTestConfig
      );
    } else {
      // Regular send
      results = await processRegularSend(
        emailService,
        directus,
        newsletter,
        subscribers,
        sendRecord
      );
    }

    // Update send record
    await directus.request(
      (updateItem as any)("newsletter_sends", sendRecord.id, {
        status: results.failed > 0 ? "completed_with_errors" : "completed",
        sent_count: results.sent,
        failed_count: results.failed,
        completed_at: new Date().toISOString(),
        processing_time: Date.now() - startTime.getTime(),
        errors: results.errors.length > 0 ? results.errors.join("; ") : null,
      })
    );

    // Update newsletter stats
    await directus.request(
      (updateItem as any)("newsletters", newsletter.id, {
        status: "sent",
        total_sent: (newsletter.total_sent || 0) + results.sent,
        last_sent_at: new Date().toISOString(),
        send_count: (newsletter.send_count || 0) + 1,
      })
    );

    return {
      send_record_id: sendRecord.id,
      total_recipients: subscribers.length,
      sent: results.sent,
      failed: results.failed,
      processing_time: Date.now() - startTime.getTime(),
      ab_test_results: results.ab_test_results,
    };
  } catch (error: any) {
    // Update send record with error
    await directus.request(
      (updateItem as any)("newsletter_sends", sendRecord.id, {
        status: "failed",
        completed_at: new Date().toISOString(),
        errors: error.message,
      })
    );

    throw error;
  }
}

// Process regular newsletter send
async function processRegularSend(
  emailService: EmailService,
  directus: any,
  newsletter: any,
  subscribers: any[],
  sendRecord: any
) {
  const batchSize = 100; // Send in batches
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < subscribers.length; i += batchSize) {
    const batch = subscribers.slice(i, i + batchSize);

    try {
      await emailService.sendNewsletter(newsletter, batch, sendRecord);
      sent += batch.length;

      // Log batch success
      await directus.request(
        (createItem as any)("newsletter_send_logs", {
          send_record_id: sendRecord.id,
          batch_number: Math.floor(i / batchSize) + 1,
          recipients_count: batch.length,
          status: "sent",
          sent_at: new Date().toISOString(),
        })
      );
    } catch (error: any) {
      failed += batch.length;
      const errorMsg = `Batch ${Math.floor(i / batchSize) + 1}: ${
        error.message
      }`;
      errors.push(errorMsg);

      // Log batch failure
      await directus.request(
        (createItem as any)("newsletter_send_logs", {
          send_record_id: sendRecord.id,
          batch_number: Math.floor(i / batchSize) + 1,
          recipients_count: batch.length,
          status: "failed",
          error_message: error.message,
          sent_at: new Date().toISOString(),
        })
      );
    }

    // Update progress
    const progress = Math.round(
      ((i + batch.length) / subscribers.length) * 100
    );
    await directus.request(
      (updateItem as any)("newsletter_sends", sendRecord.id, {
        progress_percentage: progress,
        sent_count: sent,
        failed_count: failed,
      })
    );

    // Small delay between batches to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return { sent, failed, errors };
}

// Process A/B test send
async function processABTestSend(
  emailService: EmailService,
  directus: any,
  newsletter: any,
  subscribers: any[],
  sendRecord: any,
  abTestConfig: any
) {
  const testPercentage = abTestConfig.percentage / 100;
  const testGroupSize = Math.floor(subscribers.length * testPercentage);

  // Split subscribers into groups
  const shuffled = [...subscribers].sort(() => Math.random() - 0.5);
  const groupA = shuffled.slice(0, testGroupSize);
  const groupB = shuffled.slice(testGroupSize, testGroupSize * 2);
  const remaining = shuffled.slice(testGroupSize * 2);

  // Send variant A (original)
  const resultA = await processRegularSend(
    emailService,
    directus,
    newsletter,
    groupA,
    sendRecord
  );

  // Send variant B (with different subject)
  const newsletterB = {
    ...newsletter,
    subject_line: abTestConfig.variant_subject,
  };

  const resultB = await processRegularSend(
    emailService,
    directus,
    newsletterB,
    groupB,
    sendRecord
  );

  // For now, send remaining to variant A (you can implement winner selection later)
  const resultRemaining =
    remaining.length > 0
      ? await processRegularSend(
          emailService,
          directus,
          newsletter,
          remaining,
          sendRecord
        )
      : { sent: 0, failed: 0, errors: [] };

  return {
    sent: resultA.sent + resultB.sent + resultRemaining.sent,
    failed: resultA.failed + resultB.failed + resultRemaining.failed,
    errors: [...resultA.errors, ...resultB.errors, ...resultRemaining.errors],
    ab_test_results: {
      variant_a: {
        subject: newsletter.subject_line,
        recipients: groupA.length,
        sent: resultA.sent,
        failed: resultA.failed,
      },
      variant_b: {
        subject: abTestConfig.variant_subject,
        recipients: groupB.length,
        sent: resultB.sent,
        failed: resultB.failed,
      },
      remaining: {
        recipients: remaining.length,
        sent: resultRemaining.sent,
        failed: resultRemaining.failed,
      },
    },
  };
}

// Schedule newsletter for later sending (placeholder - implement with your preferred job queue)
async function scheduleNewsletter(
  newsletterId: number,
  sendRecordId: number,
  sendTime: Date,
  subscribers: any[],
  abTestConfig?: any
) {
  // This is a placeholder - you would implement this with:
  // - Redis Queue (Bull, BullMQ)
  // - Database-based job queue
  // - Cron jobs
  // - External service like Agenda.js

  console.log(
    `Newsletter ${newsletterId} scheduled for ${sendTime.toISOString()}`
  );
  console.log(
    `Send record: ${sendRecordId}, Recipients: ${subscribers.length}`
  );

  // For now, we'll just log the schedule
  // In production, you'd want to implement a proper job queue system
}
