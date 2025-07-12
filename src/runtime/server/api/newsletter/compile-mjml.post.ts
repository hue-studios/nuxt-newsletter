// src/runtime/server/api/newsletter/compile-mjml.post.ts
import { createError, defineEventHandler, readBody } from 'h3'

// Type for MJML compilation result
interface MJMLParseResults {
  html: string
  json?: any
  errors: Array<{
    line: number
    message: string
    tagName: string
    formattedMessage: string
  }>
}

// Lazy load mjml to avoid build issues
let mjml2html: any

const loadMjml = async () => {
  if (!mjml2html) {
    try {
      const mjmlModule = await import('mjml')
      mjml2html = mjmlModule.default
    } catch (error) {
      console.error('Failed to load MJML:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'MJML not installed. Run: npm install mjml'
      })
    }
  }
  return mjml2html
}

export default defineEventHandler(async (event) => {
  // Only allow POST
  if (event.node.req.method !== 'POST') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method not allowed'
    })
  }

  try {
    const body = await readBody(event)
    
    if (!body?.mjml) {
      throw createError({
        statusCode: 400,
        statusMessage: 'MJML content is required'
      })
    }

    // Load MJML compiler
    const mjml2htmlCompiler = await loadMjml()

    // Compile MJML to HTML
    const result: MJMLParseResults = mjml2htmlCompiler(body.mjml, {
      keepComments: false,
      minify: body.minify !== false, // Default to true
      validationLevel: body.validationLevel || 'soft',
      filePath: body.filePath,
      preprocessors: body.preprocessors,
      juicePreserveTags: {
        'mj-style': { inline: false },
        style: { inline: false }
      },
      juiceOptions: {
        removeStyleTags: false,
        insertPreservedExtraCss: false,
        applyWidthAttributes: true,
        applyHeightAttributes: true,
        applyAttributesTableElements: true,
        ...body.juiceOptions
      },
      minifyOptions: {
        collapseWhitespace: true,
        minifyCSS: true,
        removeEmptyAttributes: true,
        ...body.minifyOptions
      },
      fonts: body.fonts
    })

    // Log warnings if any
    if (result.errors && result.errors.length > 0) {
      console.warn('[MJML Compiler] Warnings:', result.errors)
    }

    return {
      html: result.html,
      errors: result.errors || []
    }
  } catch (error) {
    console.error('[MJML Compiler] Error:', error)
    
    // Check if it's an MJML syntax error
    if (error instanceof Error && error.message.includes('mjml')) {
      throw createError({
        statusCode: 400,
        statusMessage: `MJML compilation error: ${error.message}`
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Failed to compile MJML'
    })
  }
})