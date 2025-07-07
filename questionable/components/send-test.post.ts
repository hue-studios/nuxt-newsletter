import sgMail from "@sendgrid/mail";
import { createDirectus, rest, readItem } from "@directus/sdk";

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig();
    const body = await readBody(event);

    const { newsletter_id, test_emails } = body;

    if (!newsletter_id || !test_emails || !Array.isArray(test_emails)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Newsletter ID and test emails are required",
      });
    }

    // Validate SendGrid configuration
    if (!config.sendgridApiKey) {
      throw createError({
        statusCode: 500,
        statusMessage: "SendGrid API key not configured",
      });
    }

    // Initialize SendGrid
    sgMail.setApiKey(config.sendgridApiKey);

    // Initialize Directus client
    const directus = createDirectus(config.public.directusUrl as string).with(
      rest()
    );

    // Fetch newsletter
    const newsletter = await directus.request(
      (readItem as any)("newsletters", newsletter_id, {
        fields: [
          "id",
          "title",
          "subject_line",
          "from_name",
          "from_email",
          "compiled_html",
        ],
      })
    );

    if (!newsletter) {
      throw createError({
        statusCode: 404,
        statusMessage: "Newsletter not found",
      });
    }

    if (!newsletter.compiled_html) {
      throw createError({
        statusCode: 400,
        statusMessage: "Newsletter must be compiled before sending test",
      });
    }

    // Prepare test email
    const fromEmail =
      newsletter.from_email || config.defaultFromEmail || "test@example.com";
    const fromName = newsletter.from_name || "Newsletter Test";

    // Replace placeholder variables with test values
    const testHtml = newsletter.compiled_html
      .replace(/{{unsubscribe_url}}/g, "#")
      .replace(/{{preferences_url}}/g, "#")
      .replace(/{{subscriber_name}}/g, "Test User")
      .replace(/{{company_name}}/g, "Your Company");

    const emailData = {
      from: {
        email: fromEmail,
        name: fromName,
      },
      subject: `[TEST] ${newsletter.subject_line}`,
      html: testHtml,
      to: test_emails.map((email: string) => ({ email: email.trim() })),
      categories: ["newsletter-test"],
    };

    // Send test email
    await sgMail.send(emailData);

    return {
      success: true,
      message: `Test email sent to ${test_emails.length} recipients`,
      recipients: test_emails.length,
    };
  } catch (error: any) {
    console.error("Test email send error:", error);

    if (error.code && error.code >= 400) {
      // SendGrid error
      throw createError({
        statusCode: 400,
        statusMessage: `SendGrid error: ${error.message}`,
      });
    }

    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Failed to send test email",
    });
  }
});
