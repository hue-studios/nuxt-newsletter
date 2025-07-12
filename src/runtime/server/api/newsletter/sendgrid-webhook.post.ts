// server/api/newsletter/sendgrid-webhook.post.ts
import { createError, useRuntimeConfig } from '#app'
import { createDirectus, createItem, readItem, readItems, rest, staticToken, updateItem } from '@directus/sdk'
import crypto from 'crypto'
import { defineEventHandler, getHeader, readBody, readRawBody } from 'h3'

interface SendGridEvent {
  email: string
  timestamp: number
  'smtp-id': string
  event: 'processed' | 'dropped' | 'delivered' | 'bounce' | 'open' | 'click' | 'spamreport' | 'unsubscribe' | 'group_unsubscribe' | 'group_resubscribe'
  category?: string[]
  sg_event_id: string
  sg_message_id: string
  reason?: string
  status?: string
  type?: string
  url?: string
  url_offset?: { index: number; type: string }
  ip?: string
  useragent?: string
  newsletter_id?: string
  newsletter_slug?: string
  send_record_id?: string
  subscriber_id?: string
  asm_group_id?: number
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  
  // Verify webhook signature
  const signature = getHeader(event, 'x-twilio-email-event-webhook-signature')
  const timestamp = getHeader(event, 'x-twilio-email-event-webhook-timestamp')
  const webhookSecret = config.sendgridWebhookSecret || process.env.SENDGRID_WEBHOOK_SECRET

  if (webhookSecret && signature && timestamp) {
    const payload = await readRawBody(event)
    const timestampPayload = timestamp + payload
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(timestampPayload)
      .digest('base64')

    if (signature !== expectedSignature) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid webhook signature'
      })
    }
  }

  // Parse events
  const events = await readBody<SendGridEvent[]>(event)
  
  if (!Array.isArray(events)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid webhook payload'
    })
  }

  // Initialize Directus client
  const directusUrl = config.public.newsletter?.directus?.url || process.env.DIRECTUS_URL
  const directusToken = config.directusAdminToken || process.env.DIRECTUS_ADMIN_TOKEN

  if (!directusUrl || !directusToken) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Directus configuration missing'
    })
  }

  const directus = createDirectus(directusUrl)
    .with(rest())
    .with(staticToken(directusToken as string))

  // Process each event
  const results = []
  
  for (const sgEvent of events) {
    try {
      // Extract custom args
      const newsletterId = sgEvent.newsletter_id
      const sendRecordId = sgEvent.send_record_id

      // Create analytics record
      const analyticsData = {
        newsletter_id: newsletterId,
        send_record_id: sendRecordId,
        event_type: mapEventType(sgEvent.event),
        email: sgEvent.email,
        timestamp: new Date(sgEvent.timestamp * 1000).toISOString(),
        user_agent: sgEvent.useragent,
        ip_address: sgEvent.ip,
        url_clicked: sgEvent.url,
        sg_message_id: sgEvent.sg_message_id,
        sg_event_id: sgEvent.sg_event_id,
        bounce_reason: sgEvent.reason || sgEvent.type,
        metadata: {
          categories: sgEvent.category,
          status: sgEvent.status,
          asm_group_id: sgEvent.asm_group_id
        }
      }

      // Try to find subscriber by email
      try {
        const subscribers = await directus.request(
          readItems('subscribers', {
            filter: {
              email: { _eq: sgEvent.email }
            },
            limit: 1
          })
        )
        
        if (subscribers.length > 0) {
          analyticsData.subscriber_id = subscribers[0].id
        }
      } catch (error) {
        console.log('Subscriber not found for email:', sgEvent.email)
      }

      // Create analytics record
      await directus.request(
        createItem('newsletter_analytics', analyticsData)
      )

      // Update send record statistics if we have a send_record_id
      if (sendRecordId) {
        await updateSendStatistics(directus, sendRecordId, sgEvent.event)
      }

      // Update subscriber status for certain events
      if (analyticsData.subscriber_id) {
        await updateSubscriberStatus(directus, analyticsData.subscriber_id, sgEvent.event, sgEvent.timestamp)
      }

      results.push({ success: true, event_id: sgEvent.sg_event_id })
    } catch (error) {
      console.error('Error processing SendGrid event:', error)
      results.push({ 
        success: false, 
        event_id: sgEvent.sg_event_id,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  return {
    processed: results.length,
    results
  }
})

// Map SendGrid event types to our schema
function mapEventType(sgEventType: string): string {
  const mapping: Record<string, string> = {
    'processed': 'processed',
    'dropped': 'dropped',
    'delivered': 'delivered',
    'bounce': 'bounce',
    'open': 'open',
    'click': 'click',
    'spamreport': 'spamreport',
    'unsubscribe': 'unsubscribe',
    'group_unsubscribe': 'unsubscribe',
    'group_resubscribe': 'resubscribe'
  }
  
  return mapping[sgEventType] || sgEventType
}

// Update send record statistics
async function updateSendStatistics(directus: any, sendRecordId: string, eventType: string) {
  try {
    // Get current statistics
    const sendRecord = await directus.request(
      readItem('newsletter_sends', sendRecordId)
    )

    if (!sendRecord) return

    const updates: any = {}

    switch (eventType) {
      case 'delivered':
        updates.total_delivered = (sendRecord.total_delivered || 0) + 1
        break
      case 'bounce':
        updates.total_bounced = (sendRecord.total_bounced || 0) + 1
        break
      case 'open':
        updates.total_opened = (sendRecord.total_opened || 0) + 1
        break
      case 'click':
        updates.total_clicked = (sendRecord.total_clicked || 0) + 1
        break
    }

    // Calculate rates
    if (updates.total_opened !== undefined && sendRecord.total_delivered > 0) {
      updates.open_rate = (updates.total_opened / sendRecord.total_delivered) * 100
    }
    
    if (updates.total_clicked !== undefined && sendRecord.total_delivered > 0) {
      updates.click_rate = (updates.total_clicked / sendRecord.total_delivered) * 100
    }

    if (Object.keys(updates).length > 0) {
      await directus.request(
        updateItem('newsletter_sends', sendRecordId, updates)
      )
    }
  } catch (error) {
    console.error('Error updating send statistics:', error)
  }
}

// Update subscriber status based on events
async function updateSubscriberStatus(directus: any, subscriberId: string, eventType: string, timestamp: number) {
  try {
    const updates: any = {}

    switch (eventType) {
      case 'bounce':
        const subscriber = await directus.request(
          readItem('subscribers', subscriberId)
        )
        updates.bounce_count = (subscriber.bounce_count || 0) + 1
        if (updates.bounce_count >= 3) {
          updates.status = 'bounced'
        }
        break
      
      case 'unsubscribe':
      case 'group_unsubscribe':
        updates.status = 'unsubscribed'
        updates.unsubscribed_at = new Date(timestamp * 1000).toISOString()
        break
      
      case 'spamreport':
        updates.status = 'suppressed'
        break
      
      case 'open':
        updates.last_email_opened = new Date(timestamp * 1000).toISOString()
        updates.engagement_score = Math.min((subscriber.engagement_score || 0) + 1, 100)
        break
      
      case 'click':
        updates.last_email_clicked = new Date(timestamp * 1000).toISOString()
        updates.engagement_score = Math.min((subscriber.engagement_score || 0) + 2, 100)
        break
    }

    if (Object.keys(updates).length > 0) {
      await directus.request(
        updateItem('subscribers', subscriberId, updates)
      )
    }
  } catch (error) {
    console.error('Error updating subscriber status:', error)
  }
}