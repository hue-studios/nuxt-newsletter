import { defineEventHandler, createError, readBody } from "h3";
import { useRuntimeConfig } from "#imports";
import {
  createDirectus,
  rest,
  readItem,
  createItem,
  updateItem,
} from "@directus/sdk";
import { EmailService } from "../../../utils/email";
import { validators, getValidatedData } from "../../../middleware/validation";
import { getDirectusClient } from "../../../middleware/directus-auth";

export default defineEventHandler(async (event) => {
  try {
    // Apply validation middleware
    await validators.sendTest(event);
    const { newsletter_id, test_emails, include_analytics } = getValidatedData(
      event,
      "body"
    );

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

    // Fetch newsletter
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

    // Check if newsletter is compiled
    if (!newsletter.compiled_html) {
      throw createError({
        statusCode: 400,
        statusMessage: "Newsletter must be compiled before sending test emails",
      });
    }

    // Prepare test email data
    const testEmailData = {
      from: {
        email: newsletter.from_email || config.newsletter.defaultFromEmail,
        name: newsletter.from_name || config.newsletter.defaultFromName,
      },
      subject: `[TEST] ${newsletter.subject_line}`,
      html: processTestHtml(newsletter.compiled_html, include_analytics),
      to: test_emails.map((email: string) => ({ email })),
      categories: ["newsletter-test"],
      custom_args: {
        newsletter_id: newsletter_id.toString(),
        is_test: "true",
        test_timestamp: new Date().toISOString(),
      },
    };

    // Add test indicators to HTML
    const modifiedHtml = addTestIndicators(testEmailData.html);
    testEmailData.html = modifiedHtml;

    // Send test emails
    const sendResult = await emailService.sendTestEmail(
      newsletter,
      test_emails
    );

    // Log test send
    await directus.request(
      (createItem as any)("newsletter_test_sends", {
        newsletter_id,
        test_emails: test_emails.join(", "),
        sent_at: new Date().toISOString(),
        sent_by: event.context.user?.id || null,
        sendgrid_message_id: sendResult?.headers?.["x-message-id"] || null,
        status: "sent",
      })
    );

    // Update newsletter stats
    await directus.request(
      (updateItem as any)("newsletters", newsletter_id, {
        test_sends_count:
          (newsletter.test_sends_count || 0) + test_emails.length,
        last_test_sent_at: new Date().toISOString(),
      })
    );

    return {
      success: true,
      message: `Test emails sent to ${test_emails.length} recipient(s)`,
      details: {
        newsletter_id,
        recipients: test_emails,
        sent_at: new Date().toISOString(),
        message_ids: [sendResult.messageId].filter(Boolean),
      },
    };
  } catch (error: any) {
    console.error("Test email sending error:", error);
    const config = useRuntimeConfig();

    const url = config.public.newsletter.directusUrl;
    // Log failed test send
    try {
      const body = await readBody(event);
      const directus = createDirectus(
        config.public.newsletter.directusUrl
      ).with(rest());

      await directus.request(
        (createItem as any)("newsletter_test_sends", {
          newsletter_id: body.newsletter_id,
          test_emails: body.test_emails?.join(", ") || "",
          sent_at: new Date().toISOString(),
          sent_by: event.context.user?.id || null,
          status: "failed",
          error_message: error.message,
        })
      );
    } catch (logError) {
      console.error("Failed to log test send error:", logError);
    }

    // Return appropriate error
    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to send test emails",
      data: {
        error: error.message,
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
    });
  }
});

// Process HTML for test emails
function processTestHtml(
  html: string,
  includeAnalytics: boolean = false
): string {
  let processedHtml = html;

  // Remove analytics tracking if not requested
  if (!includeAnalytics) {
    // Remove tracking pixels
    processedHtml = processedHtml.replace(
      /<img[^>]*src=[^>]*track[^>]*>/gi,
      ""
    );

    // Remove UTM parameters from links
    processedHtml = processedHtml.replace(/(\?|&)utm_[^&\s"']*/gi, "");
  }

  // Replace merge tags with test values
  const testMergeValues = {
    "{{unsubscribe_url}}": "#test-unsubscribe",
    "{{preferences_url}}": "#test-preferences",
    "{{subscriber_name}}": "Test User",
    "{{subscriber_email}}": "test@example.com",
    "{{newsletter_title}}": "Test Newsletter",
  };

  Object.entries(testMergeValues).forEach(([tag, value]) => {
    processedHtml = processedHtml.replace(new RegExp(tag, "g"), value);
  });

  return processedHtml;
}

// Add visual test indicators
function addTestIndicators(html: string): string {
  // Add test banner at the top
  const testBanner = `
    <div style="background-color: #ff6b6b; color: white; padding: 10px; text-align: center; font-family: Arial, sans-serif; font-size: 14px; font-weight: bold;">
      🧪 TEST EMAIL - This is a test version of your newsletter
    </div>
  `;

  // Insert banner after opening body tag
  const modifiedHtml = html.replace(/(<body[^>]*>)/i, `$1${testBanner}`);

  return modifiedHtml;
}

// Validate email addresses
function validateEmailAddresses(emails: string[]): string[] {
  const validEmails: string[] = [];
  const emailRegex = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/;

  for (const email of emails) {
    const trimmedEmail = email.trim().toLowerCase();

    if (emailRegex.test(trimmedEmail)) {
      validEmails.push(trimmedEmail);
    }
  }

  return validEmails;
}

// Rate limiting specifically for test emails
const testEmailLimiter = new Map<
  string,
  { count: number; resetTime: number }
>();

function checkTestEmailRateLimit(userOrIP: string): boolean {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxEmails = 20; // Maximum test emails per window

  const record = testEmailLimiter.get(userOrIP);

  if (!record || now > record.resetTime) {
    testEmailLimiter.set(userOrIP, {
      count: 1,
      resetTime: now + windowMs,
    });
    return true;
  }

  if (record.count >= maxEmails) {
    return false;
  }

  record.count++;
  return true;
}

// Cleanup old rate limit records
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of testEmailLimiter.entries()) {
    if (now > record.resetTime) {
      testEmailLimiter.delete(key);
    }
  }
}, 60 * 1000); // Cleanup every minute
