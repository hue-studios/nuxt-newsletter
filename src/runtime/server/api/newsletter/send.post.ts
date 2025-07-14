// server/api/newsletter/send.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import { $fetch } from 'ofetch'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  
  const { newsletter, recipients, options } = body
  
  if (!config.sendgridApiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'SendGrid API key not configured'
    })
  }

  if (!newsletter?.compiled_html) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Newsletter must be compiled before sending'
    })
  }

  const message = {
    personalizations: [{
      to: recipients.map((r: any) => ({ email: r.email, name: r.name })),
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
    message.send_at = Math.floor(new Date(options.sendAt).getTime() / 1000)
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
        'Authorization': `Bearer ${config.sendgridApiKey}`,
        'Content-Type': 'application/json'
      },
      body: message
    })

    return {
      success: true,
      messageId: (response as any).headers?.['x-message-id'],
      response
    }
  } catch (error: any) {
    console.error('SendGrid send error:', error)
    throw createError({
      statusCode: error.status || 500,
      statusMessage: error.message || 'Failed to send newsletter'
    })
  }
})