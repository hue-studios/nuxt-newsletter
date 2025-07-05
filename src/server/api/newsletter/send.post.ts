import sgMail from "@sendgrid/mail";
import {
  createDirectus,
  rest,
  readItem,
  updateItem,
  createItem,
} from "@directus/sdk";

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig();
    const body = await readBody(event);

    const { newsletter_id, mailing_list_id, send_type = "regular" } = body;

    if (!newsletter_id || !mailing_list_id) {
      throw createError({
        statusCode: 400,
        statusMessage: "Newsletter ID and mailing list ID are required",
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

    // Fetch newsletter and mailing list
    const newsletter = await directus.request(
      readItem("newsletters", newsletter_id, {
        fields: [
          "id",
          "title",
          "subject_line",
          "from_name",
          "from_email",
          "compiled_html",
          "is_ab_test",
          "ab_test_subject_b",
        ],
      })
    );

    const mailingList = await directus.request(
      readItem("mailing_lists", mailing_list_id, {
        fields: [
          "id",
          "name",
          "subscribers.subscribers_id.id",
          "subscribers.subscribers_id.email",
          "subscribers.subscribers_id.name",
          "subscribers.subscribers_id.first_name",
          "subscribers.subscribers_id.status",
          "subscribers.subscribers_id.custom_fields",
        ],
      })
    );

    if (!newsletter || !mailingList) {
      throw createError({
        statusCode: 404,
        statusMessage: "Newsletter or mailing list not found",
      });
    }

    if (!newsletter.compiled_html) {
      throw createError({
        statusCode: 400,
        statusMessage: "Newsletter must be compiled before sending",
      });
    }

    // Filter active subscribers
    const activeSubscribers =
      mailingList.subscribers?.filter(
        (sub: any) => sub.subscribers_id?.status === "active"
      ) || [];

    if (activeSubscribers.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "No active subscribers in mailing list",
      });
    }

    // Create send record
    const sendRecord = await directus.request(
      createItem("newsletter_sends", {
        newsletter_id,
        mailing_list_id,
        status: "sending",
        send_type,
        total_recipients: activeSubscribers.length,
      })
    );

    try {
      // Prepare email data
      const fromEmail =
        newsletter.from_email ||
        config.defaultFromEmail ||
        "newsletter@example.com";
      const fromName = newsletter.from_name || "Newsletter";

      // Handle A/B testing subject lines
      const subjectLine =
        send_type === "ab_test_b" && newsletter.ab_test_subject_b
          ? newsletter.ab_test_subject_b
          : newsletter.subject_line;

      // Generate unsubscribe tokens and personalize emails
      const personalizations = activeSubscribers.map((subscriber: any) => {
        const sub = subscriber.subscribers_id;
        const unsubscribeToken = generateUnsubscribeToken(
          sub.email,
          config.secretKey
        );
        const unsubscribeUrl = `${
          config.public.siteUrl
        }/unsubscribe?email=${encodeURIComponent(
          sub.email
        )}&token=${unsubscribeToken}`;
        const preferencesUrl = `${
          config.public.siteUrl
        }/preferences?email=${encodeURIComponent(
          sub.email
        )}&token=${unsubscribeToken}`;

        // Personalize HTML content
        const personalizedHtml = newsletter.compiled_html
          .replace(/{{unsubscribe_url}}/g, unsubscribeUrl)
          .replace(/{{preferences_url}}/g, preferencesUrl)
          .replace(
            /{{subscriber_name}}/g,
            sub.name || sub.first_name || "Subscriber"
          )
          .replace(/{{company_name}}/g, sub.custom_fields?.company || "");

        return {
          to: [{ email: sub.email, name: sub.name || "" }],
          custom_args: {
            newsletter_id: newsletter_id.toString(),
            subscriber_id: sub.id.toString(),
            send_record_id: sendRecord.id.toString(),
          },
        };
      });

      // Send email
      const emailData = {
        from: { email: fromEmail, name: fromName },
        subject: subjectLine,
        html: newsletter.compiled_html,
        personalizations,
        tracking_settings: {
          click_tracking: { enable: true, enable_text: true },
          open_tracking: { enable: true },
        },
        categories: ["newsletter", send_type],
        custom_args: {
          newsletter_id: newsletter_id.toString(),
          send_record_id: sendRecord.id.toString(),
        },
      };

      await sgMail.send(emailData);

      // Update send record
      await directus.request(
        updateItem("newsletter_sends", sendRecord.id, {
          status: "sent",
          sent_count: activeSubscribers.length,
          sent_at: new Date().toISOString(),
        })
      );

      // Update newsletter status
      await directus.request(
        updateItem("newsletters", newsletter_id, {
          status: "sent",
        })
      );

      return {
        success: true,
        message: `Newsletter sent to ${activeSubscribers.length} subscribers`,
        send_record_id: sendRecord.id,
        recipients: activeSubscribers.length,
      };
    } catch (error: any) {
      // Update send record with error
      await directus.request(
        updateItem("newsletter_sends", sendRecord.id, {
          status: "failed",
          error_log: error.message,
        })
      );
      throw error;
    }
  } catch (error: any) {
    console.error("Newsletter send error:", error);

    if (error.code && error.code >= 400) {
      // SendGrid error
      throw createError({
        statusCode: 400,
        statusMessage: `SendGrid error: ${error.message}`,
      });
    }

    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Failed to send newsletter",
    });
  }
});
