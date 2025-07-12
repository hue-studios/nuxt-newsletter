// src/runtime/composables/useSendGrid.ts
import { useRuntimeConfig } from '#app'
import { $fetch } from 'ofetch'
import type { NewsletterData } from './useNewsletterEditor'

interface SendGridRecipient {
  email: string
  name?: string
  substitutions?: Record<string, string>
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
  const apiKey = config.sendgridApiKey || process.env.SENDGRID_API_KEY

  // Send newsletter via SendGrid
  const sendNewsletter = async (
    newsletter: NewsletterData & { compiled_html: string },
    recipients: SendGridRecipient[],
    options?: {
      fromEmail?: string
      fromName?: string
      replyTo?: string
      categories?: string[]
      sendAt?: Date
      batchId?: string
      trackingSettings?: SendGridMessage['tracking_settings']
    }
  ) => {
    if (!apiKey) {
      throw new Error('SendGrid API key not configured')
    }

    if (!newsletter.compiled_html) {
      throw new Error('Newsletter must be compiled before sending')
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
        newsletter_slug: newsletter.slug || 'draft'
      },
      tracking_settings: options?.trackingSettings || {
        click_tracking: { enable: true },
        open_tracking: { enable: true },
        subscription_tracking: { enable: true }
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
            custom_args: message.custom_args
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
          send_at: message.send_at
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

  // Send test email
  const sendTestEmail = async (
    newsletter: NewsletterData & { compiled_html: string },
    testEmail: string
  ) => {
    return sendNewsletter(
      newsletter,
      [{ email: testEmail }],
      {
        categories: ['test', 'newsletter-test'],
        trackingSettings: {
          click_tracking: { enable: false },
          open_tracking: { enable: false },
          subscription_tracking: { enable: false }
        }
      }
    )
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
    sendTestEmail,
    createBatch,
    getBatchStatus,
    cancelScheduledSend,
    getSuppressions,
    addToSuppressionList,
    removeFromSuppressionList
  }
}