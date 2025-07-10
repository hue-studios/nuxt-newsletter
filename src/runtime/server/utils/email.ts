// src/runtime/services/email.ts
import { useRuntimeConfig } from '#imports'
import sgMail from '@sendgrid/mail'
// Import SendGrid's MailDataRequired type directly.
// MailContent and Personalization types are not directly exported and will be defined locally.
import type { MailDataRequired } from '@sendgrid/mail'
import crypto from 'node:crypto'
import type {
  Newsletter,
  NewsletterSend,
  Subscriber,
} from '../../types/newsletter'

// Locally defined interface for MailContent, as it's not directly exported by @sendgrid/mail
interface MailContent {
  type: string // e.g., 'text/plain', 'text/html'
  value: string // The actual content string
}

// Locally defined interface for Personalization, as it's not directly exported by @sendgrid/mail
// This mirrors the structure expected within MailDataRequired's 'personalizations' array.
// Ensuring 'to' is explicitly an array of objects where 'name' is always string.
interface Personalization {
  to: { email: string, name: string }[] // 'to' is required and 'name' is always string
  cc?: { email: string, name?: string }[]
  bcc?: { email: string, name?: string }[]
  subject?: string
  headers?: Record<string, string>
  substitutions?: Record<string, string> // For legacy template engine or manual replacements
  dynamicTemplateData?: Record<string, any> // For dynamic templates with templateId
  customArgs?: Record<string, string> // Ensure all values are string
  sendAt?: number
}

export interface EmailConfig {
  apiKey: string
  defaultFromEmail: string
  defaultFromName: string
  webhookSecret?: string
  enableTracking?: boolean
  enableClickTracking?: boolean
  enableOpenTracking?: boolean
}

// *** IMPORTANT: The custom EmailData interface has been removed. ***
// *** We are now directly using MailDataRequired from '@sendgrid/mail' ***
// *** to ensure full type compatibility with the SendGrid library. ***

export interface SendResult {
  headers: any
  messageId: string
  status: string
  recipients: number
  errors?: string[]
}

export interface TestEmailOptions {
  includeAnalytics?: boolean
  customSubject?: string
  testIndicators?: boolean
}

export interface NewsletterSendOptions {
  batchSize?: number
  delayBetweenBatches?: number
  maxRetries?: number
  customArgs?: Record<string, string>
}

// Main email service class
export class EmailService {
  private config: EmailConfig
  private rateLimiter: Map<string, { count: number, resetTime: number }>

  constructor(config: EmailConfig) {
    this.config = {
      enableTracking: true,
      enableClickTracking: true,
      enableOpenTracking: true,
      ...config,
    }

    sgMail.setApiKey(config.apiKey)
    this.rateLimiter = new Map()
  }

  // Send newsletter to multiple recipients
  async sendNewsletter(
    newsletter: Newsletter,
    recipients: Subscriber[],
    sendRecord: NewsletterSend,
    options: NewsletterSendOptions = {},
  ): Promise<SendResult> {
    const {
      batchSize = 100,
      delayBetweenBatches = 1000,
      maxRetries = 3,
      customArgs = {},
    } = options

    let totalSent = 0
    let totalErrors = 0
    const errors: string[] = []

    // Process in batches
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize)

      try {
        await this.sendBatch(newsletter, batch, sendRecord, customArgs)
        totalSent += batch.length
      }
      catch (error: any) {
        totalErrors += batch.length
        errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`)
        console.error('Batch send error:', error)
      }

      // Delay between batches to avoid rate limiting
      if (i + batchSize < recipients.length && delayBetweenBatches > 0) {
        await this.delay(delayBetweenBatches)
      }
    }

    return {
      headers: {},
      messageId: `newsletter-${newsletter.id}-${Date.now()}`,
      status: totalErrors > 0 ? 'partial' : 'success',
      recipients: totalSent,
      errors: errors.length > 0 ? errors : undefined,
    }
  }

  // Send test email
  async sendTestEmail(
    newsletter: Newsletter,
    testEmails: string[],
    options: TestEmailOptions = {},
  ): Promise<SendResult> {
    const {
      includeAnalytics = false,
      customSubject,
      testIndicators = true,
    } = options

    // Prepare email data using SendGrid's MailDataRequired type
    const emailData: MailDataRequired = {
      from: {
        email: newsletter.from_email || this.config.defaultFromEmail,
        name: newsletter.from_name || this.config.defaultFromName,
      },
      subject: customSubject || `[TEST] ${newsletter.subject_line}`,
      // Provide content as an array of MailContent objects, as required by MailDataRequired
      content: [
        {
          type: 'text/html',
          value: this.processTestHtml(
            newsletter.compiled_html as string,
            includeAnalytics,
            testIndicators,
          ),
        },
      ],
      to: testEmails.map(email => ({ email: email.trim().toLowerCase() })),
      categories: ['newsletter-test'],
      customArgs: {
        newsletter_id: newsletter.id?.toString() || '', // Ensure string
        is_test: 'true',
        test_timestamp: new Date().toISOString(),
      },
      trackingSettings: {
        clickTracking: { enable: includeAnalytics },
        openTracking: { enable: includeAnalytics },
        subscriptionTracking: { enable: false },
      },
    }

    try {
      const response = await sgMail.send(emailData)

      return {
        headers: response[0].headers,
        messageId: response[0].headers?.['x-message-id'] || 'unknown',
        status: 'success',
        recipients: testEmails.length,
      }
    }
    catch (error: any) {
      throw new Error(`Test email failed: ${error.message}`)
    }
  }

  // Send batch of emails
  private async sendBatch(
    newsletter: Newsletter,
    recipients: Subscriber[],
    sendRecord: NewsletterSend,
    customArgs: Record<string, string>,
  ): Promise<void> {
    // Check rate limiting
    this.checkRateLimit('newsletter_send')

    // Prepare personalizations using the locally defined Personalization type
    const personalizations: Personalization[] = recipients.map(recipient => ({
      to: [
        {
          email: recipient.email.toLowerCase(),
          // Ensure 'name' is always a string to match Personalization interface
          name: recipient.name || recipient.first_name || recipient.email || '',
        },
      ],
      // 'substitutions' is for SendGrid's legacy template engine or direct HTML string replacement.
      substitutions: this.getSubstitutions(newsletter, recipient, sendRecord),
      customArgs: {
        newsletter_id: newsletter.id?.toString() || '', // Ensure string
        subscriber_id: recipient.id?.toString() || '', // Ensure string
        send_record_id: sendRecord.id?.toString() || '', // Ensure string
        ...customArgs,
      },
    }))

    // Prepare email data using SendGrid's MailDataRequired type
    const emailData: MailDataRequired = {
      from: {
        email: newsletter.from_email || this.config.defaultFromEmail,
        name: newsletter.from_name || this.config.defaultFromName,
      },
      subject: newsletter.subject_line,
      // Provide content as an array of MailContent objects, as required by MailDataRequired
      content: [
        { type: 'text/html', value: newsletter.compiled_html as string },
      ],
      personalizations,
      trackingSettings: {
        clickTracking: {
          enable: this.config.enableClickTracking,
          enableText: true,
        },
        openTracking: {
          enable: this.config.enableOpenTracking,
          substitutionTag: '{{open_tracking}}',
        },
        subscriptionTracking: {
          enable: false,
        },
      },
      categories: ['newsletter', newsletter.category || 'general'],
      customArgs: {
        newsletter_id: newsletter.id?.toString() || '',
        send_record_id: sendRecord.id?.toString() || '',
        batch_timestamp: new Date().toISOString(),
      },
    }

    // Send email
    await sgMail.send(emailData)
  }

  // Generate substitutions for personalization
  private getSubstitutions(
    newsletter: Newsletter,
    recipient: Subscriber,
    sendRecord: NewsletterSend,
  ): Record<string, string> {
    const config = useRuntimeConfig()
    const baseUrl
      = config.public?.siteUrl
        || config.public?.newsletter?.directusUrl
        || 'https://example.com'

    // Generate unsubscribe token
    const unsubscribeToken = this.generateUnsubscribeToken(
      recipient.email,
      newsletter.id?.toString() || '',
    )

    return {
      // Subscriber data
      subscriber_name: recipient.name || recipient.first_name || 'Subscriber',
      subscriber_first_name: recipient.first_name || '',
      subscriber_last_name: recipient.last_name || '',
      subscriber_email: recipient.email,

      // Newsletter data
      newsletter_title: newsletter.title,
      newsletter_id: newsletter.id?.toString() || '',

      // Unsubscribe links
      unsubscribe_url: `${baseUrl}/unsubscribe?email=${encodeURIComponent(
        recipient.email,
      )}&token=${unsubscribeToken}&newsletter=${newsletter.id}`,
      preferences_url: `${baseUrl}/preferences?email=${encodeURIComponent(
        recipient.email,
      )}&token=${unsubscribeToken}`,

      // Tracking
      open_tracking: `<img src="${baseUrl}/api/newsletter/track/open?email=${encodeURIComponent(
        recipient.email,
      )}&newsletter=${
        newsletter.id
      }&token=${unsubscribeToken}" width="1" height="1" style="display:none;" />`,

      // Sender info
      sender_name: newsletter.from_name || this.config.defaultFromName,
      sender_email: newsletter.from_email || this.config.defaultFromEmail,

      // Date/time
      current_date: new Date().toLocaleDateString(),
      current_year: new Date().getFullYear().toString(),
    }
  }

  // Process HTML for test emails
  private processTestHtml(
    html: string,
    includeAnalytics: boolean,
    testIndicators: boolean,
  ): string {
    let processedHtml = html

    // Remove analytics tracking if not requested
    if (!includeAnalytics) {
      // Remove tracking pixels
      processedHtml = processedHtml.replace(
        /<img[^>]*src=[^>]*track[^>]*>/gi,
        '',
      )

      // Remove UTM parameters from links
      processedHtml = processedHtml.replace(/(\?|&)utm_[^&\s"']*/gi, '')
    }

    // Replace merge tags with test values
    const testSubstitutions = {
      '{{subscriber_name}}': 'Test User',
      '{{subscriber_first_name}}': 'Test',
      '{{subscriber_last_name}}': 'User',
      '{{subscriber_email}}': 'test@example.com',
      '{{unsubscribe_url}}': '#test-unsubscribe',
      '{{preferences_url}}': '#test-preferences',
      '{{newsletter_title}}': 'Test Newsletter',
      '{{sender_name}}': 'Test Sender',
      '{{sender_email}}': 'test@example.com',
      '{{current_date}}': new Date().toLocaleDateString(),
      '{{current_year}}': new Date().getFullYear().toString(),
    }

    Object.entries(testSubstitutions).forEach(([tag, value]) => {
      processedHtml = processedHtml.replace(
        new RegExp(tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
        value,
      )
    })

    // Add test indicators
    if (testIndicators) {
      processedHtml = this.addTestIndicators(processedHtml)
    }

    return processedHtml
  }

  // Add visual test indicators
  private addTestIndicators(html: string): string {
    const testBanner = `
      <div style="background-color: #ff6b6b; color: white; padding: 12px; text-align: center; font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; margin-bottom: 20px;">
        🧪 TEST EMAIL - This is a test version of your newsletter
      </div>
    `

    // Insert banner after opening body tag or at the beginning of content
    if (html.includes('<body')) {
      return html.replace(/(<body[^>]*>)/i, `$1${testBanner}`)
    }
    else {
      return testBanner + html
    }
  }

  // Generate secure unsubscribe token
  private generateUnsubscribeToken(
    email: string,
    newsletterId: string,
  ): string {
    const secret = this.config.webhookSecret || 'default-secret'
    const data = `${email}:${newsletterId}:${Date.now()}`

    return crypto.createHmac('sha256', secret).update(data).digest('base64url')
  }

  // Verify unsubscribe token
  verifyUnsubscribeToken(
    token: string,
    email: string,
    newsletterId: string,
  ): boolean {
    try {
      const secret = this.config.webhookSecret || 'default-secret'
      const data = `${email}:${newsletterId}`

      const expectedToken = crypto
        .createHmac('sha256', secret)
        .update(data)
        .digest('base64url')

      return crypto.timingSafeEqual(
        Buffer.from(token, 'base64url'),
        Buffer.from(expectedToken, 'base64url'),
      )
    }
    catch (error) {
      return false
    }
  }

  // Rate limiting
  private checkRateLimit(key: string): void {
    const now = Date.now()
    const limit = 1000 // emails per hour
    const windowMs = 60 * 60 * 1000 // 1 hour

    let record = this.rateLimiter.get(key)

    if (!record || now > record.resetTime) {
      record = { count: 0, resetTime: now + windowMs }
      this.rateLimiter.set(key, record)
    }

    if (record.count >= limit) {
      throw new Error('Rate limit exceeded for email sending')
    }

    record.count++
  }

  // Utility delay function
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Validate email address
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/
    return emailRegex.test(email.trim())
  }

  // Clean email list
  static cleanEmailList(emails: string[]): string[] {
    return emails
      .map(email => email.trim().toLowerCase())
      .filter(email => this.validateEmail(email))
      .filter((email, index, array) => array.indexOf(email) === index) // Remove duplicates
  }

  // Get delivery statistics from SendGrid
  async getDeliveryStats(messageId: string): Promise<any> {
    try {
      // This would require additional SendGrid API integration
      // For now, return placeholder
      return {
        messageId,
        status: 'unknown',
        delivered: 0,
        opens: 0,
        clicks: 0,
        bounces: 0,
      }
    }
    catch (error) {
      console.error('Failed to fetch delivery stats:', error)
      return null
    }
  }

  // Send transactional email (for notifications, etc.)
  async sendTransactional(
    to: string | string[],
    subject: string,
    html: string,
    options: {
      from?: { email: string, name?: string }
      templateId?: string
      templateData?: Record<string, any>
      categories?: string[]
    } = {},
  ): Promise<SendResult> {
    // Build the MailDataRequired object
    const emailData: MailDataRequired = {
      from: options.from || {
        email: this.config.defaultFromEmail,
        name: this.config.defaultFromName,
      },
      to: Array.isArray(to) ? to.map(email => ({ email })) : [{ email: to }],
      subject,
      categories: options.categories || ['transactional'],
      trackingSettings: {
        clickTracking: { enable: false },
        openTracking: { enable: false },
        subscriptionTracking: { enable: false },
      },
      // Directly assign the content array based on templateId to satisfy strict type
      content: options.templateId
        ? [{ type: 'text/plain', value: '' }] // Placeholder for template emails
        : [{ type: 'text/html', value: html }], // Actual HTML for non-template emails
    }

    // Add template-specific properties if templateId is provided
    if (options.templateId) {
      emailData.templateId = options.templateId
      emailData.dynamicTemplateData = options.templateData || {}
      // Note: subject might be overridden by the template's subject if set in SendGrid
      // and not explicitly set in dynamicTemplateData.
    }

    try {
      const response = await sgMail.send(emailData)

      return {
        headers: response[0].headers,
        messageId: response[0].headers?.['x-message-id'] || 'unknown',
        status: 'success',
        recipients: Array.isArray(to) ? to.length : 1,
      }
    }
    catch (error: any) {
      throw new Error(`Transactional email failed: ${error.message}`)
    }
  }
}

// Factory function for creating email service
export function createEmailService(config: EmailConfig): EmailService {
  return new EmailService(config)
}

// Default email service instance
let defaultEmailService: EmailService | null = null

export function getEmailService(): EmailService {
  if (!defaultEmailService) {
    const config = useRuntimeConfig()

    defaultEmailService = new EmailService({
      apiKey: config.newsletter?.sendgridApiKey || '',
      // Corrected: Access from config.public.newsletter for these properties
      defaultFromEmail:
        config.public.newsletter?.defaultFromEmail || 'noreply@example.com',
      defaultFromName:
        config.public.newsletter?.defaultFromName || 'Nuxt Newsletter',
      webhookSecret: config.newsletter?.webhookSecret,
      enableTracking: config.public.newsletter?.enableAnalytics,
      enableClickTracking: config.public.newsletter?.enableAnalytics,
      enableOpenTracking: config.public.newsletter?.enableAnalytics,
    })
  }

  return defaultEmailService
}

// Email template utilities
export function createEmailTemplate(
  subject: string,
  html: string,
  options: {
    preheader?: string
    backgroundColor?: string
    textColor?: string
    linkColor?: string
  } = {},
): string {
  const {
    preheader = '',
    backgroundColor = '#ffffff',
    textColor = '#333333',
    linkColor = '#2563eb',
  } = options

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
            body {
                margin: 0;
                padding: 0;
                background-color: ${backgroundColor};
                color: ${textColor};
                font-family: Arial, sans-serif;
            }
            a { color: ${linkColor}; }
            .preheader { display: none; font-size: 1px; line-height: 1px; max-height: 0; max-width: 0; opacity: 0; overflow: hidden; }
        </style>
    </head>
    <body>
        <div class="preheader">${preheader}</div>
        ${html}
    </body>
    </html>
  `
}
