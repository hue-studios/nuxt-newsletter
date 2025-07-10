// Add these functions to your src/runtime/utils/core/newsletter.ts file

import type { Newsletter, NewsletterBlock } from '../../types/newsletter'

// Existing functions...
export function processNewsletterBlocks(newsletter: Newsletter) {
  if (!newsletter.blocks) return []

  return newsletter.blocks.map((block: NewsletterBlock) => ({
    block_type_slug: block.block_type?.slug || '',
    sort: block.sort || 0,
    title: block.title || '',
    subtitle: block.subtitle || '',
    text_content: block.text_content || '',
    image_url: block.image_url || '',
    image_alt_text: block.image_alt_text || '',
    image_caption: block.image_caption || '',
    button_text: block.button_text || '',
    button_url: block.button_url || '',
    background_color: block.background_color || '',
    text_color: block.text_color || '',
    text_align: block.text_align || 'left',
    padding: block.padding || '',
    font_size: block.font_size || '',
  }))
}

export function validateNewsletterStructure(newsletter: Newsletter): boolean {
  if (!newsletter.title || !newsletter.subject_line) return false
  if (!newsletter.from_email || !newsletter.from_name) return false
  return true
}

export function generateNewsletterPreview(newsletter: Newsletter): string {
  // Generate a text preview of the newsletter
  let preview = `${newsletter.title}\n${newsletter.subject_line}\n\n`

  if (newsletter.blocks) {
    newsletter.blocks.forEach((block) => {
      if (block.title) preview += `${block.title}\n`
      if (block.text_content) preview += `${block.text_content}\n\n`
    })
  }

  return preview.substring(0, 500) + (preview.length > 500 ? '...' : '')
}

// ADD THESE MISSING FUNCTIONS:

/**
 * Estimate the size of an email in KB and determine if it might be clipped
 * Gmail clips emails larger than 102KB
 */
export function estimateEmailSize(html: string): {
  kb: number
  isLarge: boolean
} {
  if (!html) return { kb: 0, isLarge: false }

  // Calculate size in bytes (UTF-8 encoding)
  const sizeInBytes = new Blob([html]).size
  const sizeInKB = Math.round(sizeInBytes / 1024)

  // Gmail clips emails over 102KB
  const isLarge = sizeInKB > 102

  return {
    kb: sizeInKB,
    isLarge,
  }
}

/**
 * Calculate estimated reading time based on newsletter blocks
 * Assumes average reading speed of 200 words per minute
 */
export function calculateReadingTime(blocks: NewsletterBlock[]): number {
  if (!blocks || blocks.length === 0) return 0

  let totalWords = 0
  const WORDS_PER_MINUTE = 200

  blocks.forEach((block) => {
    // Count words in text content
    if (block.text_content) {
      // Strip HTML tags and count words
      const plainText = block.text_content.replace(/<[^>]*>/g, ' ')
      const words = plainText
        .trim()
        .split(/\s+/)
        .filter(word => word.length > 0)
      totalWords += words.length
    }

    // Count words in title and subtitle
    if (block.title) {
      const titleWords = block.title
        .trim()
        .split(/\s+/)
        .filter(word => word.length > 0)
      totalWords += titleWords.length
    }

    if (block.subtitle) {
      const subtitleWords = block.subtitle
        .trim()
        .split(/\s+/)
        .filter(word => word.length > 0)
      totalWords += subtitleWords.length
    }

    // Add small time allowance for images (people pause to look at images)
    if (block.image_url) {
      totalWords += 10 // Equivalent to 10 words of reading time
    }

    // Add time for buttons (people read button text and consider clicking)
    if (block.button_text) {
      const buttonWords = block.button_text
        .trim()
        .split(/\s+/)
        .filter(word => word.length > 0)
      totalWords += buttonWords.length + 5 // Extra 5 words for consideration time
    }
  })

  // Calculate reading time in minutes, minimum 1 minute
  const readingTimeMinutes = Math.max(
    1,
    Math.ceil(totalWords / WORDS_PER_MINUTE),
  )

  return readingTimeMinutes
}

/**
 * Extract plain text from HTML content for analysis
 */
export function extractPlainText(html: string): string {
  if (!html) return ''

  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Remove style tags
    .replace(/<[^>]*>/g, ' ') // Remove all HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
}

/**
 * Count words in a text string
 */
export function countWords(text: string): number {
  if (!text) return 0

  const words = text
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0)
  return words.length
}

/**
 * Estimate email deliverability score based on content analysis
 */
export function analyzeEmailDeliverability(newsletter: Newsletter): {
  score: number
  issues: string[]
  recommendations: string[]
} {
  const issues: string[] = []
  const recommendations: string[] = []
  let score = 100

  // Check subject line
  if (newsletter.subject_line) {
    if (newsletter.subject_line.length > 50) {
      issues.push('Subject line is longer than 50 characters')
      recommendations.push(
        'Keep subject lines under 50 characters for better mobile display',
      )
      score -= 10
    }

    // Check for spam trigger words
    const spamWords = [
      'free',
      'urgent',
      'limited time',
      'act now',
      'click here',
      '!!!',
    ]
    const subjectLower = newsletter.subject_line.toLowerCase()
    const foundSpamWords = spamWords.filter(word =>
      subjectLower.includes(word),
    )

    if (foundSpamWords.length > 0) {
      issues.push(
        `Subject contains potential spam words: ${foundSpamWords.join(', ')}`,
      )
      recommendations.push('Avoid using spam trigger words in subject lines')
      score -= 15
    }
  }

  // Check email size
  if (newsletter.compiled_html) {
    const { kb, isLarge } = estimateEmailSize(newsletter.compiled_html)
    if (isLarge) {
      issues.push(`Email size (${kb}KB) may be clipped by Gmail`)
      recommendations.push(
        'Reduce email size to under 102KB to avoid clipping',
      )
      score -= 20
    }
  }

  // Check for missing elements
  if (!newsletter.preview_text) {
    issues.push('Missing preview text')
    recommendations.push('Add preview text to improve open rates')
    score -= 5
  }

  return {
    score: Math.max(0, score),
    issues,
    recommendations,
  }
}
