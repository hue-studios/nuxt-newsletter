import { defineEventHandler, createError, readBody, setHeader } from 'h3'
import { useRuntimeConfig } from '#imports'
import { readItems, readItem } from '@directus/sdk'
import { z } from 'zod'
import { getDirectusClient } from '../../../middleware/directus-auth'

const ExportSchema = z.object({
  newsletter_ids: z
    .array(z.number().positive())
    .min(1, 'At least one newsletter ID required')
    .max(100),
  format: z.enum(['csv', 'json', 'xlsx']).default('csv'),
  date_range: z
    .object({
      start: z.string().datetime().optional(),
      end: z.string().datetime().optional(),
    })
    .optional(),
  include: z
    .object({
      summary: z.boolean().default(true),
      events: z.boolean().default(false),
      subscribers: z.boolean().default(false),
      links: z.boolean().default(false),
      devices: z.boolean().default(false),
      locations: z.boolean().default(false),
    })
    .default({}),
  filters: z
    .object({
      event_types: z.array(z.string()).optional(),
      min_opens: z.number().min(0).optional(),
      min_clicks: z.number().min(0).optional(),
    })
    .optional(),
})

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    const body = await readBody(event)

    // Validate input
    const { newsletter_ids, format, date_range, include, filters }
      = ExportSchema.parse(body)

    // Check permissions (if user context exists)
    if (event.context.user) {
      // Add permission checking logic here
      // e.g., check if user can access these newsletters
    }

    const directus = getDirectusClient(event)

    // Build time filter
    const timeFilter: any = {}
    if (date_range?.start) {
      timeFilter.date_created = { _gte: date_range.start }
    }
    if (date_range?.end) {
      timeFilter.date_created = {
        ...timeFilter.date_created,
        _lte: date_range.end,
      }
    }

    // Prepare export data
    const exportData: any = {
      metadata: {
        generated_at: new Date().toISOString(),
        generated_by: event.context.user?.email || 'system',
        newsletter_count: newsletter_ids.length,
        date_range,
        format,
        filters,
      },
      newsletters: [],
    }

    // Fetch newsletter data
    for (const newsletterId of newsletter_ids) {
      try {
        const newsletterData = await fetchNewsletterAnalytics(
          directus,
          newsletterId,
          timeFilter,
          include,
          filters,
        )
        exportData.newsletters.push(newsletterData)
      }
      catch (error: any) {
        console.error(
          `Error fetching data for newsletter ${newsletterId}:`,
          error,
        )
        exportData.newsletters.push({
          id: newsletterId,
          error: error.message,
        })
      }
    }

    // Generate export based on format
    let responseData: any
    let contentType: string
    let filename: string

    switch (format) {
      case 'json':
        responseData = JSON.stringify(exportData, null, 2)
        contentType = 'application/json'
        filename = `newsletter-analytics-${Date.now()}.json`
        break

      case 'csv':
        responseData = generateCSV(exportData)
        contentType = 'text/csv'
        filename = `newsletter-analytics-${Date.now()}.csv`
        break

      case 'xlsx':
        responseData = await generateExcel(exportData)
        contentType
          = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        filename = `newsletter-analytics-${Date.now()}.xlsx`
        break

      default:
        throw new Error('Unsupported export format')
    }

    // Set response headers
    setHeader(event, 'Content-Type', contentType)
    setHeader(
      event,
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    )
    setHeader(event, 'Cache-Control', 'no-cache')

    return responseData
  }
  catch (error: any) {
    console.error('Analytics export error:', error)

    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 422,
        statusMessage: 'Validation failed',
        data: { errors: error.errors },
      })
    }

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Export failed',
      data: { error: error.message },
    })
  }
})

// Fetch comprehensive analytics for a newsletter
async function fetchNewsletterAnalytics(
  directus: any,
  newsletterId: number,
  timeFilter: any,
  include: any,
  filters: any,
) {
  // Fetch newsletter basic info
  const newsletter = await directus.request(
    (readItem as any)('newsletters', newsletterId, {
      fields: [
        'id',
        'title',
        'subject_line',
        'status',
        'date_created',
        'last_sent_at',
        'total_sent',
        'total_opens',
        'total_clicks',
        'total_bounces',
        'total_unsubscribes',
      ],
    }),
  )

  if (!newsletter) {
    throw new Error(`Newsletter ${newsletterId} not found`)
  }

  const result: any = {
    newsletter: newsletter,
  }

  // Build event filter
  const eventFilter: any = {
    newsletter_id: { _eq: newsletterId },
    ...timeFilter,
  }

  if (filters?.event_types?.length) {
    eventFilter.event_type = { _in: filters.event_types }
  }

  // Fetch summary statistics
  if (include.summary) {
    result.summary = await fetchSummaryStats(
      directus,
      newsletterId,
      eventFilter,
    )
  }

  // Fetch detailed events
  if (include.events) {
    result.events = await fetchDetailedEvents(directus, eventFilter)
  }

  // Fetch subscriber data
  if (include.subscribers) {
    result.subscribers = await fetchSubscriberStats(
      directus,
      newsletterId,
      timeFilter,
    )
  }

  // Fetch top links
  if (include.links) {
    result.links = await fetchTopLinks(directus, eventFilter)
  }

  // Fetch device statistics
  if (include.devices) {
    result.devices = await fetchDeviceStats(directus, eventFilter)
  }

  // Fetch location statistics
  if (include.locations) {
    result.locations = await fetchLocationStats(directus, eventFilter)
  }

  return result
}

// Fetch summary statistics
async function fetchSummaryStats(
  directus: any,
  newsletterId: number,
  eventFilter: any,
) {
  const eventStats = await directus.request(
    (readItems as any)('newsletter_events', {
      aggregate: {
        count: '*',
      },
      groupBy: ['event_type'],
      filter: eventFilter,
    }),
  )

  const stats: any = {
    total_events: 0,
    opens: 0,
    clicks: 0,
    bounces: 0,
    unsubscribes: 0,
    complaints: 0,
    delivered: 0,
  }

  eventStats.forEach((stat: any) => {
    const count = stat.count || 0
    stats.total_events += count
    stats[stat.event_type] = count
  })

  return stats
}

// Fetch detailed events
async function fetchDetailedEvents(directus: any, eventFilter: any) {
  return await directus.request(
    (readItems as any)('newsletter_events', {
      fields: [
        'id',
        'event_type',
        'email',
        'timestamp',
        'url',
        'user_agent',
        'ip_address',
        'ip_location',
        'date_created',
      ],
      filter: eventFilter,
      sort: ['-date_created'],
      limit: 10000, // Limit for performance
    }),
  )
}

// Fetch subscriber statistics
async function fetchSubscriberStats(
  directus: any,
  newsletterId: number,
  timeFilter: any,
) {
  // This would depend on your specific subscriber tracking implementation
  return {
    active_subscribers: 0,
    new_subscribers: 0,
    unsubscribed: 0,
    // Add more subscriber metrics as needed
  }
}

// Fetch top clicked links
async function fetchTopLinks(directus: any, eventFilter: any) {
  return await directus.request(
    (readItems as any)('newsletter_events', {
      fields: ['url', 'count(*)'],
      filter: {
        ...eventFilter,
        event_type: { _eq: 'click' },
        url: { _nnull: true },
      },
      groupBy: ['url'],
      sort: ['-count'],
      limit: 50,
    }),
  )
}

// Fetch device statistics
async function fetchDeviceStats(directus: any, eventFilter: any) {
  return await directus.request(
    (readItems as any)('newsletter_events', {
      fields: ['user_agent', 'count(*)'],
      filter: {
        ...eventFilter,
        event_type: { _eq: 'open' },
        user_agent: { _nnull: true },
      },
      groupBy: ['user_agent'],
      sort: ['-count'],
      limit: 20,
    }),
  )
}

// Fetch location statistics
async function fetchLocationStats(directus: any, eventFilter: any) {
  return await directus.request(
    (readItems as any)('newsletter_events', {
      fields: ['ip_location', 'count(*)'],
      filter: {
        ...eventFilter,
        event_type: { _eq: 'open' },
        ip_location: { _nnull: true },
      },
      groupBy: ['ip_location'],
      sort: ['-count'],
      limit: 20,
    }),
  )
}

// Generate CSV format
function generateCSV(exportData: any): string {
  const lines: string[] = []

  // Add metadata header
  lines.push('Newsletter Analytics Export')
  lines.push(`Generated: ${exportData.metadata.generated_at}`)
  lines.push('Format: CSV')
  lines.push('')

  // Newsletter summary
  lines.push(
    'Newsletter,Title,Subject Line,Status,Total Sent,Opens,Clicks,Bounces,Unsubscribes',
  )

  exportData.newsletters.forEach((newsletter: any) => {
    if (newsletter.error) {
      lines.push(`${newsletter.id},ERROR,${newsletter.error},,,,,,`)
      return
    }

    const n = newsletter.newsletter
    const s = newsletter.summary || {}

    lines.push(
      [
        n.id,
        `"${n.title || ''}"`,
        `"${n.subject_line || ''}"`,
        n.status,
        n.total_sent || 0,
        s.opens || 0,
        s.clicks || 0,
        s.bounces || 0,
        s.unsubscribes || 0,
      ].join(','),
    )
  })

  // Add detailed events if included
  const hasEvents = exportData.newsletters.some(
    (n: any) => n.events?.length > 0,
  )
  if (hasEvents) {
    lines.push('')
    lines.push('Detailed Events')
    lines.push(
      'Newsletter ID,Event Type,Email,Timestamp,URL,User Agent,IP Location',
    )

    exportData.newsletters.forEach((newsletter: any) => {
      if (newsletter.events) {
        newsletter.events.forEach((event: any) => {
          lines.push(
            [
              newsletter.newsletter.id,
              event.event_type,
              event.email,
              event.timestamp,
              `"${event.url || ''}"`,
              `"${event.user_agent || ''}"`,
              `"${event.ip_location || ''}"`,
            ].join(','),
          )
        })
      }
    })
  }

  return lines.join('\n')
}

// Generate Excel format (requires xlsx library)
async function generateExcel(exportData: any): Promise<Buffer> {
  try {
    // This is a placeholder - you would need to install and use xlsx library
    // const XLSX = require('xlsx');

    // For now, return CSV as fallback
    const csvData = generateCSV(exportData)
    return Buffer.from(csvData, 'utf8')

    // Example XLSX implementation:
    /*
    const workbook = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = exportData.newsletters.map((n: any) => ({
      'Newsletter ID': n.newsletter.id,
      'Title': n.newsletter.title,
      'Subject Line': n.newsletter.subject_line,
      'Status': n.newsletter.status,
      'Total Sent': n.newsletter.total_sent || 0,
      'Opens': n.summary?.opens || 0,
      'Clicks': n.summary?.clicks || 0,
      'Bounces': n.summary?.bounces || 0,
      'Unsubscribes': n.summary?.unsubscribes || 0,
    }));

    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Events sheet (if included)
    const allEvents = exportData.newsletters.flatMap((n: any) =>
      (n.events || []).map((e: any) => ({
        'Newsletter ID': n.newsletter.id,
        'Event Type': e.event_type,
        'Email': e.email,
        'Timestamp': e.timestamp,
        'URL': e.url,
        'User Agent': e.user_agent,
        'IP Location': e.ip_location,
      }))
    );

    if (allEvents.length > 0) {
      const eventsSheet = XLSX.utils.json_to_sheet(allEvents);
      XLSX.utils.book_append_sheet(workbook, eventsSheet, 'Events');
    }

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    */
  }
  catch (error) {
    console.error('Excel generation error:', error)
    // Fallback to CSV
    const csvData = generateCSV(exportData)
    return Buffer.from(csvData, 'utf8')
  }
}
