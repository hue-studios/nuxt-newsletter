// src/types.ts

// This is a .ts file (not .d.ts) because:
// 1. It's a source file that gets built
// 2. We can export both types AND constants/enums
// 3. The build process will generate dist/types.d.ts

// Exported constants that can be used throughout the app
export const NEWSLETTER_STATUS = {
  DRAFT: 'draft',
  READY: 'ready',
  SCHEDULED: 'scheduled',
  SENDING: 'sending',
  SENT: 'sent',
  PAUSED: 'paused'
} as const

export const BLOCK_CATEGORIES = {
  CONTENT: 'content',
  LAYOUT: 'layout',
  MEDIA: 'media',
  INTERACTIVE: 'interactive'
} as const

// Type derived from constant
export type NewsletterStatus = typeof NEWSLETTER_STATUS[keyof typeof NEWSLETTER_STATUS]
export type BlockCategory = typeof BLOCK_CATEGORIES[keyof typeof BLOCK_CATEGORIES]

// Block type stored in Directus
export interface BlockType {
  id: string
  name: string
  slug: string
  description?: string
  mjml_template: string
  status: 'published' | 'draft'
  field_visibility_config: string[]
  icon?: string
  category: BlockCategory
  date_created?: string
  date_updated?: string
}

// Newsletter template
export interface NewsletterTemplate {
  id: string
  name: string
  description?: string
  category: 'company' | 'product' | 'weekly' | 'monthly' | 'event'
  thumbnail_url?: string
  blocks_config: any[] | string
  default_subject_pattern?: string
  default_from_name?: string
  default_from_email?: string
  status: 'published' | 'draft'
  usage_count: number
  tags?: string[]
  date_created?: string
  date_updated?: string
}

// Newsletter block instance
export interface NewsletterBlock {
  id: string
  newsletter_id?: string
  block_type: BlockType | string
  sort: number
  title?: string
  subtitle?: string
  text_content?: string
  image_url?: string
  image_alt_text?: string
  image_caption?: string
  button_text?: string
  button_url?: string
  background_color?: string
  text_color?: string
  text_align?: 'left' | 'center' | 'right'
  padding?: string
  font_size?: string
  content?: Record<string, any>
  mjml_output?: string
  date_created?: string
  date_updated?: string
}

// Main newsletter
export interface Newsletter {
  id: string
  title: string
  slug: string
  subject_line: string
  preview_text?: string
  from_name?: string
  from_email?: string
  reply_to?: string
  status: NewsletterStatus
  category: 'company' | 'product' | 'weekly' | 'monthly' | 'event' | 'offer' | 'story'
  tags?: string[]
  priority: 'low' | 'normal' | 'high' | 'urgent'
  scheduled_send_date?: string
  is_ab_test: boolean
  ab_test_percentage?: number
  ab_test_subject_b?: string
  open_rate?: number
  click_rate?: number
  total_opens?: number
  approval_status: 'pending' | 'approved' | 'rejected' | 'changes_requested'
  approval_notes?: string
  mailing_list_id?: string
  test_emails?: string[]
  blocks: NewsletterBlock[]
  template_id?: string
  compiled_mjml?: string
  compiled_html?: string
  date_created?: string
  date_updated?: string
  user_created?: string
  user_updated?: string
}

// Subscriber
export interface Subscriber {
  id: string
  email: string
  name?: string
  first_name?: string
  last_name?: string
  company?: string
  job_title?: string
  status: 'active' | 'unsubscribed' | 'bounced' | 'pending' | 'suppressed'
  subscription_source: 'website' | 'import' | 'manual' | 'event' | 'api' | 'referral'
  subscription_preferences?: string[]
  custom_fields?: Record<string, any>
  engagement_score: number
  subscribed_at?: string
  last_email_opened?: string
  last_email_clicked?: string
  unsubscribed_at?: string
  bounce_count: number
  date_created?: string
  date_updated?: string
}

// Mailing list
export interface MailingList {
  id: string
  name: string
  description?: string
  subscriber_count: number
  active_count: number
  status: 'active' | 'archived'
  tags?: string[]
  subscribers?: Subscriber[]
  date_created?: string
  date_updated?: string
}

// Newsletter send record
export interface NewsletterSend {
  id: string
  newsletter_id: string
  newsletter?: Newsletter
  mailing_list_id: string
  mailing_list?: MailingList
  status: 'scheduled' | 'sending' | 'sent' | 'failed' | 'paused' | 'cancelled'
  scheduled_at?: string
  sent_at?: string
  total_recipients: number
  total_sent: number
  total_delivered: number
  total_bounced: number
  total_opened: number
  total_clicked: number
  open_rate?: number
  click_rate?: number
  sendgrid_batch_id?: string
  error_message?: string
  date_created?: string
  date_updated?: string
}

// Analytics event
export interface NewsletterAnalytics {
  id: string
  newsletter_id?: string
  newsletter?: Newsletter
  subscriber_id?: string
  subscriber?: Subscriber
  send_record_id?: string
  send_record?: NewsletterSend
  event_type: 'delivered' | 'open' | 'click' | 'bounce' | 'unsubscribe' | 'spamreport' | 'dropped'
  email: string
  timestamp: string
  user_agent?: string
  ip_address?: string
  location?: {
    city?: string
    country?: string
    region?: string
  }
  url_clicked?: string
  sg_message_id?: string
  sg_event_id?: string
  bounce_reason?: string
  metadata?: Record<string, any>
  date_created?: string
}

// Type guards (implementation code - this is why we use .ts!)
export function isNewsletterSent(newsletter: Newsletter): boolean {
  return newsletter.status === NEWSLETTER_STATUS.SENT
}

export function isNewsletterEditable(newsletter: Newsletter): boolean {
  return [NEWSLETTER_STATUS.DRAFT, NEWSLETTER_STATUS.READY].includes(newsletter.status)
}

export function isSubscriberActive(subscriber: Subscriber): boolean {
  return subscriber.status === 'active'
}

// Helper to get block type icon
export function getBlockTypeIcon(category: BlockCategory): string {
  const icons: Record<BlockCategory, string> = {
    [BLOCK_CATEGORIES.CONTENT]: '📝',
    [BLOCK_CATEGORIES.LAYOUT]: '🏗️',
    [BLOCK_CATEGORIES.MEDIA]: '🖼️',
    [BLOCK_CATEGORIES.INTERACTIVE]: '🔘'
  }
  return icons[category] || '📄'
}

// SendGrid types
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

// Editor types
export interface NewsletterData {
  id?: string
  subject: string
  preheader?: string
  from_name?: string
  from_email?: string
  reply_to?: string
  blocks: NewsletterBlock[]
  settings?: {
    backgroundColor?: string
    textColor?: string
    fontFamily?: string
  }
  status?: NewsletterStatus
  scheduled_send_date?: string
  mailing_list_id?: string
  template_id?: string
  compiled_mjml?: string
  compiled_html?: string
}

// Content library
export interface ContentLibraryItem {
  id: string
  title: string
  content_type: 'text' | 'hero' | 'button' | 'image' | 'html' | 'social' | 'footer'
  content_data: Record<string, any>
  preview_text?: string
  tags?: string[]
  category?: string
  usage_count: number
  is_global: boolean
  date_created?: string
  date_updated?: string
}

// When built, this file will generate:
// - dist/types.d.ts (type declarations only)
// - dist/types.mjs (runtime code like constants and functions)
// - dist/types.cjs (CommonJS version)
// This allows the module to work in both TypeScript and JavaScript projects