import { defineEventHandler, createError, readBody } from 'h3'
import { useRuntimeConfig } from '#imports'
import { readItem, updateItem } from '@directus/sdk'
import mjml from 'mjml'
import Handlebars from 'handlebars'
import { getDirectusClient } from '../../../middleware/directus-auth'

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    const body = await readBody(event)

    // Validate input
    if (!body.newsletter_id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Newsletter ID is required',
      })
    }

    // Initialize Directus client
    const directus = getDirectusClient(event)

    // Fetch newsletter with blocks
    const newsletter = await directus.request(
      (readItem as any)('newsletters', body.newsletter_id, {
        fields: [
          '*',
          'blocks.id',
          'blocks.sort',
          'blocks.field_data',
          'blocks.block_type.id',
          'blocks.block_type.name',
          'blocks.block_type.slug',
          'blocks.block_type.mjml_template',
          'blocks.block_type.default_values',
          'template_id.mjml_template',
          'template_id.default_values',
        ],
      }),
    )

    if (!newsletter) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Newsletter not found',
      })
    }

    // Sort blocks by sort order
    const sortedBlocks = (newsletter.blocks || []).sort(
      (a: any, b: any) => (a.sort || 0) - (b.sort || 0),
    )

    // Register Handlebars helpers
    registerHandlebarsHelpers()

    // Build MJML content
    let mjmlContent = `
      <mjml>
        <mj-head>
          <mj-title>${escapeHtml(
            newsletter.subject_line || newsletter.title,
          )}</mj-title>
          <mj-preview>${escapeHtml(
            newsletter.preview_text || newsletter.title,
          )}</mj-preview>
          <mj-attributes>
            <mj-all font-family="Arial, sans-serif" />
            <mj-text font-size="14px" color="#333333" line-height="1.6" />
            <mj-section padding="0px" />
          </mj-attributes>
          <mj-style>
            .newsletter-wrapper { max-width: 600px; margin: 0 auto; }
            .unsubscribe-link { color: #999999; font-size: 12px; }
          </mj-style>
        </mj-head>
        <mj-body>
    `

    // Process each block
    const warnings: string[] = []
    for (const block of sortedBlocks) {
      try {
        const blockHtml = await processBlock(block, newsletter, warnings)
        mjmlContent += blockHtml
      }
      catch (error: any) {
        console.error(`Error processing block ${block.id}:`, error)
        warnings.push(
          `Block ${block.id} (${block.block_type?.name}): ${error.message}`,
        )
      }
    }

    // Add unsubscribe footer
    mjmlContent += `
          <mj-section background-color="#f8f9fa" padding="20px">
            <mj-column>
              <mj-text align="center" font-size="12px" color="#6c757d">
                <p>
                  You received this email because you're subscribed to our newsletter.
                  <br />
                  <a href="{{unsubscribe_url}}" class="unsubscribe-link">Unsubscribe</a> | 
                  <a href="{{preferences_url}}" class="unsubscribe-link">Update preferences</a>
                </p>
                <p>
                  ${escapeHtml(newsletter.from_name || 'Newsletter')} <br />
                  ${escapeHtml(newsletter.from_email || '')}
                </p>
              </mj-text>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `

    // Compile MJML to HTML
    const mjmlResult = mjml(mjmlContent, {
      validationLevel: 'soft',
      fonts: {
        Arial:
          'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap',
      },
    })

    if (mjmlResult.errors.length > 0) {
      mjmlResult.errors.forEach((error) => {
        warnings.push(`MJML Error: ${error.message} (Line ${error.line})`)
      })
    }

    // Update newsletter with compiled HTML
    await directus.request(
      (updateItem as any)('newsletters', body.newsletter_id, {
        compiled_html: mjmlResult.html,
        compiled_at: new Date().toISOString(),
        compilation_warnings: warnings.length > 0 ? warnings : null,
      }),
    )

    return {
      success: true,
      html: mjmlResult.html,
      warnings,
      stats: {
        blocks_processed: sortedBlocks.length,
        compilation_time: new Date().toISOString(),
        html_size: mjmlResult.html.length,
      },
    }
  }
  catch (error: any) {
    console.error('MJML compilation error:', error)

    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to compile newsletter',
      data: {
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
    })
  }
})

// Process individual block
async function processBlock(
  block: any,
  newsletter: any,
  warnings: string[],
): Promise<string> {
  const blockType = block.block_type

  if (!blockType?.mjml_template) {
    warnings.push(`Block ${block.id}: No MJML template found`)
    return `<!-- Block ${block.id}: No template -->\n`
  }

  // Merge default values with block data
  const defaultValues = blockType.default_values || {}
  const fieldData = block.field_data || {}
  const mergedData = { ...defaultValues, ...fieldData }

  // Add newsletter context
  const templateData = {
    ...mergedData,
    newsletter: {
      title: newsletter.title,
      subject_line: newsletter.subject_line,
      from_name: newsletter.from_name,
      from_email: newsletter.from_email,
    },
    block: {
      id: block.id,
      sort: block.sort,
      type: blockType.slug,
    },
  }

  try {
    // Compile Handlebars template
    const template = Handlebars.compile(blockType.mjml_template)
    const compiledMjml = template(templateData)

    return compiledMjml + '\n'
  }
  catch (error: any) {
    throw new Error(`Template compilation failed: ${error.message}`)
  }
}

const createAbsoluteUrl = (
  baseUrl:
    | string
    | { replace?: (pattern: RegExp, replacement: string) => string },
  path: string,
): string => {
  if (typeof baseUrl === 'string') {
    return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
  }
  if (baseUrl && typeof baseUrl.replace === 'function') {
    return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
  }
  return path // Fallback
}

// Register custom Handlebars helpers
function registerHandlebarsHelpers() {
  // Safe string helper
  Handlebars.registerHelper('safe', function (value: any) {
    return new Handlebars.SafeString(value || '')
  })

  // URL helper
  Handlebars.registerHelper('url', function (path: string, base?: string) {
    const config = useRuntimeConfig()
    const baseUrl = base || config.public.siteUrl || 'http://localhost:3000'

    if (path.startsWith('http')) {
      return path
    }

    return createAbsoluteUrl(baseUrl, path)
  })

  // Image helper with Directus asset URL
  Handlebars.registerHelper(
    'image',
    function (fileId: string, transform?: any) {
      if (!fileId) return ''

      const config = useRuntimeConfig()
      let url = `${config.public.newsletter.directusUrl}/assets/${fileId}`

      if (transform) {
        const params = new URLSearchParams()
        Object.entries(transform).forEach(([key, value]) => {
          params.set(key, String(value))
        })
        url += `?${params.toString()}`
      }

      return url
    },
  )

  // Date formatting helper
  Handlebars.registerHelper(
    'date',
    function (date: string | Date, format?: string) {
      const d = typeof date === 'string' ? new Date(date) : date

      if (!d || isNaN(d.getTime())) {
        return ''
      }

      switch (format) {
        case 'short':
          return d.toLocaleDateString()
        case 'long':
          return d.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        case 'time':
          return d.toLocaleTimeString()
        default:
          return d.toISOString().split('T')[0]
      }
    },
  )
  // Conditional helper
  Handlebars.registerHelper('if_eq', (a: any, b: any, options: any) => {
    // The context is available in options.data.root or as the last parameter
    const context = options.data?.root || {}
    return a === b ? options.fn(context) : options.inverse(context)
  })

  //   Handlebars.registerHelper("if_eq", function(a: any, b: any, options: any) {
  //   return a === b ? options.fn(this) : options.inverse(this);
  // });

  // Loop helper with index
  Handlebars.registerHelper(
    'each_with_index',
    function (array: any[], options: any) {
      let result = ''

      for (let i = 0; i < array.length; i++) {
        result += options.fn({
          ...array[i],
          index: i,
          first: i === 0,
          last: i === array.length - 1,
        })
      }

      return result
    },
  )
}

// HTML escape utility
function escapeHtml(unsafe: string): string {
  if (typeof unsafe !== 'string') {
    return ''
  }

  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
