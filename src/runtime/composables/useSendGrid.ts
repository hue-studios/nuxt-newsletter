// src/runtime/composables/useSendGrid.ts - Updated for proper client/server handling
import { useRuntimeConfig } from '#app'
import { $fetch } from 'ofetch'
import type { NewsletterData } from './useNewsletterEditor'

export interface SendGridRecipient {
  email: string
  name?: string
  substitutions?: Record<string, string>
  custom_args?: Record<string, any>
}

export interface SendGridSendOptions {
  fromEmail?: string
  fromName?: string
  replyTo?: string
  categories?: string[]
  sendAt?: Date
  batchId?: string
  asmGroupId?: number
  trackingSettings?: {
    clickTracking?: { enable: boolean; enableText?: boolean }
    openTracking?: { enable: boolean; substitutionTag?: string }
    subscriptionTracking?: { enable: boolean }
  }
  customArgs?: Record<string, string>
}

export function useSendGrid() {
  const config = useRuntimeConfig()
  
  // Check if we're on server side and have access to private config
  const isServer = typeof window === 'undefined'
  const apiKey = isServer ? config.sendgridApiKey : undefined
  
  // Check if SendGrid is configured based on public config flags
  const isConfigured = config.public.newsletter?.features?.sendgridEnabled ?? false

  // Send newsletter via SendGrid (server-side only or via API route)
  const sendNewsletter = async (
    newsletter: NewsletterData & { compiled_html: string },
    recipients: SendGridRecipient[],
    options?: SendGridSendOptions
  ) => {
    // If we're on client side, use the API route proxy
    if (!isServer) {
      return await $fetch('/api/newsletter/send', {
        method: 'POST',
        body: {
          newsletter,
          recipients,
          options
        }
      })
    }

    // Server-side direct SendGrid API call
    if (!apiKey) {
      throw new Error('SendGrid API key not configured. Please set SENDGRID_API_KEY environment variable.')
    }

    if (!newsletter.compiled_html) {
      throw new Error('Newsletter must be compiled before sending')
    }

    const message = {
      personalizations: [{
        to: recipients.map(r => ({ email: r.email, name: r.name })),
        custom_args: {
          newsletter_id: newsletter.id || 'draft',
          newsletter_slug: newsletter.slug || 'draft',
          ...options?.customArgs
        },
        substitutions: recipients[0]?.substitutions || {}
      }],
      from: {
        email: options?.fromEmail || config.public.newsletter?.defaultFromEmail || 'newsletter@example.com',
        name: options?.fromName || config.public.newsletter?.defaultFromName || 'Newsletter'
      },
      subject: newsletter.subject,
      content: [
        { type: 'text/html', value: newsletter.compiled_html }
      ],
      categories: options?.categories || ['newsletter', newsletter.id || 'draft'],
      tracking_settings: {
        click_tracking: {
          enable: options?.trackingSettings?.clickTracking?.enable ?? true,
          enable_text: options?.trackingSettings?.clickTracking?.enableText ?? false
        },
        open_tracking: {
          enable: options?.trackingSettings?.openTracking?.enable ?? true,
          substitution_tag: options?.trackingSettings?.openTracking?.substitutionTag ?? '%open_tracking_pixel%'
        },
        subscription_tracking: {
          enable: options?.trackingSettings?.subscriptionTracking?.enable ?? true
        }
      }
    }

    if (options?.replyTo) {
      message.reply_to = { email: options.replyTo }
    }

    if (options?.sendAt) {
      message.send_at = Math.floor(options.sendAt.getTime() / 1000)
    }

    if (options?.batchId) {
      message.batch_id = options.batchId
    }

    if (options?.asmGroupId) {
      message.asm = { group_id: options.asmGroupId }
    }

    try {
      const response = await $fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: message
      })

      return {
        success: true,
        messageId: (response as any).headers?.['x-message-id'],
        response
      }
    } catch (error) {
      console.error('SendGrid send error:', error)
      throw error
    }
  }

  // Test SendGrid connection (always uses API route for security)
  const testConnection = async () => {
    try {
      const response = await $fetch('/api/newsletter/test-connection', {
        method: 'POST'
      })
      return response
    } catch (error) {
      console.error('SendGrid test error:', error)
      throw error
    }
  }

  // Send test email (uses API route)
  const sendTestEmail = async (testEmail: string) => {
    try {
      const response = await $fetch('/api/newsletter/send-test', {
        method: 'POST',
        body: { email: testEmail }
      })
      return response
    } catch (error) {
      console.error('Test email error:', error)
      throw error
    }
  }

  return {
    sendNewsletter,
    testConnection,
    sendTestEmail,
    isConfigured,
    isServer
  }
}