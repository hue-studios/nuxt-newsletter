// src/runtime/server/utils/email.ts
import sgMail from "@sendgrid/mail";
import type { Newsletter, NewsletterSend } from "~/types/newsletter";

interface EmailConfig {
  apiKey: string;
  defaultFromEmail: string;
  defaultFromName: string;
  webhookSecret?: string;
}

export class EmailService {
  private config: EmailConfig;

  constructor(config: EmailConfig) {
    this.config = config;
    sgMail.setApiKey(config.apiKey);
  }

  async sendNewsletter(
    newsletter: Newsletter,
    recipients: any[],
    sendRecord: NewsletterSend
  ) {
    const personalizations = recipients.map((recipient) => ({
      to: [{ email: recipient.email, name: recipient.name }],
      substitutions: this.getSubstitutions(newsletter, recipient),
      custom_args: {
        newsletter_id: newsletter.id.toString(),
        subscriber_id: recipient.id.toString(),
        send_record_id: sendRecord.id.toString(),
      },
    }));

    const emailData = {
      from: {
        email: newsletter.from_email || this.config.defaultFromEmail,
        name: newsletter.from_name || this.config.defaultFromName,
      },
      subject: newsletter.subject_line,
      html: newsletter.compiled_html,
      personalizations,
      tracking_settings: {
        click_tracking: { enable: true, enable_text: true },
        open_tracking: { enable: true },
      },
      categories: ["newsletter", newsletter.category],
      custom_args: {
        newsletter_id: newsletter.id.toString(),
        send_record_id: sendRecord.id.toString(),
      },
    };

    return await sgMail.send(emailData);
  }

  async sendTestEmail(newsletter: Newsletter, testEmails: string[]) {
    const emailData = {
      from: {
        email: newsletter.from_email || this.config.defaultFromEmail,
        name: newsletter.from_name || this.config.defaultFromName,
      },
      subject: `[TEST] ${newsletter.subject_line}`,
      html: this.processTestHtml(newsletter.compiled_html),
      to: testEmails.map((email) => ({ email })),
      categories: ["newsletter-test"],
    };

    return await sgMail.send(emailData);
  }

  private getSubstitutions(newsletter: Newsletter, recipient: any) {
    const unsubscribeToken = this.generateUnsubscribeToken(recipient.email);
    const baseUrl = process.env.NUXT_PUBLIC_SITE_URL || "http://localhost:3000";

    return {
      unsubscribe_url: `${baseUrl}/unsubscribe?email=${encodeURIComponent(
        recipient.email
      )}&token=${unsubscribeToken}`,
      preferences_url: `${baseUrl}/preferences?email=${encodeURIComponent(
        recipient.email
      )}&token=${unsubscribeToken}`,
      subscriber_name: recipient.name || recipient.first_name || "Subscriber",
      company_name: recipient.custom_fields?.company || "",
      subscriber_email: recipient.email,
    };
  }

  private processTestHtml(html: string): string {
    return html
      .replace(/{{unsubscribe_url}}/g, "#")
      .replace(/{{preferences_url}}/g, "#")
      .replace(/{{subscriber_name}}/g, "Test User")
      .replace(/{{company_name}}/g, "Test Company")
      .replace(/{{subscriber_email}}/g, "test@example.com");
  }

  private generateUnsubscribeToken(email: string): string {
    const crypto = require("crypto");
    const data = `${email}:${this.config.webhookSecret || "default-secret"}`;
    return crypto
      .createHash("sha256")
      .update(data)
      .digest("hex")
      .substring(0, 16);
  }

  verifyWebhookSignature(signature: string, payload: string): boolean {
    if (!this.config.webhookSecret) return true; // Skip verification if no secret

    const crypto = require("crypto");
    const expectedSignature = crypto
      .createHmac("sha256", this.config.webhookSecret)
      .update(payload)
      .digest("base64");

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }
}
