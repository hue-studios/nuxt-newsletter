// src/runtime/composables/useSendGrid.ts
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
  }
  customArgs?: Record<string, string>
}

interface SendGridMessage {
  to: SendGridRecipient[]
  from: {
    email: string
    name: string
  }
  reply_to?: {
    email: string
    name?: string
  }
  subject: string
  html: string
  text?: string
  categories?: string[]
  custom_args?: Record<string, string>
  send_at?: number
  batch_id?: string
  asm?: {
    group_id: number
    groups_to_display?: number[]
  }
  tracking_settings?: {
    click_tracking?: {
      enable: boolean
      enable_text?: boolean
    }
    open_tracking?: {
      enable: boolean
      substitution_tag?: string
    }
    subscription_tracking?: {
      enable: boolean
    }
  }
}

export function useSendGrid() {
  const config = useRuntimeConfig()
  // The apiKey is only available on the server-side runtimeConfig.
  // We'll rely on server routes to access it for actual sending.
  // For client-side checks, we rely on the 'configured' status from module.ts.
  const apiKey = config.sendgridApiKey; // This will be undefined on client, only available on server

  // Send newsletter via SendGrid
  // This function is primarily intended to be called from a server-side Nuxt API route
  // where the API key is accessible. If called client-side, it would need a proxy route.
  const sendNewsletter = async (
    newsletter: NewsletterData & { compiled_html: string },
    recipients: SendGridRecipient[],
    options?: SendGridSendOptions
  ) => {
    // This check is for server-side execution or if a proxy is not used.
    // For client-side calls, you'd typically have a server endpoint proxy this.
    if (!apiKey) {
      throw new Error('SendGrid API key not configured. This function should be called server-side or via a proxy.');
    }

    if (!newsletter.compiled_html) {
      throw new Error('Newsletter must be compiled before sending');
    }

    const message: SendGridMessage = {
      to: recipients,
      from: {
        email: options?.fromEmail || config.public.newsletter?.defaultFromEmail || 'newsletter@example.com',
        name: options?.fromName || config.public.newsletter?.defaultFromName || 'Newsletter'
      },
      subject: newsletter.subject,
      html: newsletter.compiled_html,
      categories: options?.categories || ['newsletter', newsletter.id || 'draft'],
      custom_args: {
        newsletter_id: newsletter.id || 'draft',
        newsletter_slug: newsletter.slug || 'draft', // Assuming newsletter can have a slug
        ...options?.customArgs
      },
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
        body: {
          personalizations: [{
            to: recipients.map(r => ({ email: r.email, name: r.name })),
            custom_args: message.custom_args,
            substitutions: recipients[0]?.substitutions || {} // Assuming first recipient's substitutions apply to all
          }],
          from: message.from,
          reply_to: message.reply_to,
          subject: message.subject,
          content: [
            { type: 'text/html', value: message.html }
          ],
          categories: message.categories,
          tracking_settings: message.tracking_settings,
          batch_id: message.batch_id,
          send_at: message.send_at,
          asm: message.asm
        }
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

  // Send test email - now calls the server-side /api/newsletter/test-connection route
  const sendTestEmail = async (
    newsletter: NewsletterData & { compiled_html: string }, // These parameters are not used by the server route for key validation
    testEmail: string // This parameter is not used by the server route for key validation
  ) => {
    try {
      // Call the server-side endpoint that performs the SendGrid API key validation
      const response = await $fetch('/api/newsletter/test-connection', {
        method: 'POST',
        // No body needed for a simple key validation, as the server route
        // accesses the API key directly from runtimeConfig.
      });
      // The server route returns a structured response with directus and sendgrid statuses
      return response.sendgrid; // Return only the sendgrid part of the response
    } catch (error: any) {
      console.error('Client-side SendGrid test email error:', error);
      // Re-throw to be caught by the settings page
      throw new Error(error.data?.message || 'Failed to test SendGrid API via server.');
    }
  }

  // Create batch for large sends
  const createBatch = async () => {
    if (!apiKey) {
      throw new Error('SendGrid API key not configured')
    }

    try {
      const response = await $fetch('https://api.sendgrid.com/v3/mail/batch', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      return (response as any).batch_id
    } catch (error) {
      console.error('SendGrid batch creation error:', error)
      throw error
    }
  }

  // Get batch status
  const getBatchStatus = async (batchId: string) => {
    if (!apiKey) {
      throw new Error('SendGrid API key not configured')
    }

    try {
      const response = await $fetch(`https://api.sendgrid.com/v3/mail/batch/${batchId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      })

      return response
    } catch (error) {
      console.error('SendGrid batch status error:', error)
      throw error
    }
  }

  // Cancel scheduled send
  const cancelScheduledSend = async (batchId: string) => {
    if (!apiKey) {
      throw new Error('SendGrid API key not configured')
    }

    try {
      await $fetch(`https://api.sendgrid.com/v3/user/scheduled_sends`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: {
          batch_id: batchId,
          status: 'cancel'
        }
      })

      return { success: true }
    } catch (error) {
      console.error('SendGrid cancel scheduled send error:', error)
      throw error
    }
  }

  // Get suppression lists
  const getSuppressions = async (type: 'bounces' | 'blocks' | 'invalid_emails' | 'spam_reports' | 'unsubscribes') => {
    if (!apiKey) {
      throw new Error('SendGrid API key not configured')
    }

    try {
      const response = await $fetch(`https://api.sendgrid.com/v3/suppression/${type}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      })

      return response
    } catch (error) {
      console.error(`SendGrid get ${type} error:`, error)
      throw error
    }
  }

  // Add to suppression list
  const addToSuppressionList = async (
    type: 'bounces' | 'blocks' | 'invalid_emails' | 'spam_reports' | 'unsubscribes',
    emails: string[]
  ) => {
    if (!apiKey) {
      throw new Error('SendGrid API key not configured')
    }

    try {
      const response = await $fetch(`https://api.sendgrid.com/v3/suppression/${type}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: {
          emails: emails.map(email => ({ email }))
        }
      })

      return response
    } catch (error) {
      console.error(`SendGrid add to ${type} error:`, error)
      throw error
    }
  }

  // Remove from suppression list
  const removeFromSuppressionList = async (
    type: 'bounces' | 'blocks' | 'invalid_emails' | 'spam_reports' | 'unsubscribes',
    emails: string[]
  ) => {
    if (!apiKey) {
      throw new Error('SendGrid API key not configured')
    }

    try {
      const response = await $fetch(`https://api.sendgrid.com/v3/suppression/${type}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: {
          emails
        }
      })

      return response
    } catch (error) {
      console.error(`SendGrid remove from ${type} error:`, error)
      throw error
    }
  }

  return {
    sendNewsletter,
    sendTestEmail, // This now calls the server route
    createBatch,
    getBatchStatus,
    cancelScheduledSend,
    getSuppressions,
    addToSuppressionList,
    removeFromSuppressionList
  }
}
