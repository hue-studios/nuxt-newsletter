// src/runtime/types.ts

// Directus Core Types (simplified for demonstration)
export interface DirectusFile {
  id: string;
  filename_disk: string;
  filename_download: string;
  filesize: number;
  type: string;
  width?: number;
  height?: number;
  uploaded_on: string;
  uploaded_by: string;
}

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

// Block Type Interface (from Directus 'block_types' collection)
export interface BlockType {
  id: string;
  name: string;
  slug: string;
  mjml_template: string; // MJML template for the block
  field_visibility_config: string[]; // JSON array of field names to show in editor
  category: BlockCategory; // Category for grouping blocks in editor
  icon: string; // Icon name (e.g., 'lucide:layout-template')
  description?: string;
  status?: 'published' | 'draft' | 'archived';
}

// Newsletter Block Interface (for editor's internal representation)
// This uses 'type' as slug, which will be mapped to block_type ID for Directus
export interface NewsletterBlock {
  id: string;
  type: string; // This is the slug of the block_type (e.g., 'hero', 'text')
  content: Record<string, any>; // Flexible JSON content
  sort?: number;
}

// Main Newsletter Interface (aligned with Directus 'newsletters' collection)
export interface NewsletterData { // Renamed from 'Newsletter' to 'NewsletterData' for consistency
  id?: string;
  title: string; // Maps to Directus 'title'
  subject_line: string; // Maps to Directus 'subject_line'
  preview_text?: string; // Maps to Directus 'preview_text'
  from_name?: string;
  from_email?: string;
  reply_to?: string;
  blocks: NewsletterBlock[]; // Array of newsletter blocks
  status?: NewsletterStatus; // Use the derived type
  scheduled_send_date?: string; // ISO date string for scheduled send
  mailing_list_id?: string; // UUID of the associated mailing list
  template_id?: string; // UUID of the associated template
  compiled_mjml?: string; // Compiled MJML content
  compiled_html?: string; // Compiled HTML content
  category?: string; // Category for the newsletter (e.g., 'company', 'product')
  // Analytics fields (assuming they exist in Directus)
  total_opens?: number;
  total_clicks?: number;
  open_rate?: number;
  click_rate?: number;
  // Audit fields (assuming they exist in Directus)
  date_created?: string;
  date_updated?: string;
  user_created?: string; // Assuming these exist in Directus
  user_updated?: string; // Assuming these exist in Directus
  // Additional fields from your original Newsletter interface:
  slug?: string;
  tags?: string[];
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  is_ab_test?: boolean;
  ab_test_percentage?: number;
  ab_test_subject_b?: string;
  approval_status?: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  approval_notes?: string;
  test_emails?: string[];
}

// Newsletter Template Interface (from Directus 'newsletter_templates' collection)
export interface NewsletterTemplate {
  id: string;
  name: string;
  description?: string;
  blocks_config: NewsletterBlock[] | string; // JSON array of blocks or JSON string
  default_subject_pattern?: string;
  default_from_name?: string;
  default_from_email?: string;
  default_reply_to?: string;
  default_category?: string;
  default_settings?: Record<string, any> | string; // JSON object or JSON string
  usage_count?: number;
  status?: 'published' | 'draft' | 'archived'; // Use derived status type if needed
  thumbnail_url?: string; // Added from your original template interface
  tags?: string[]; // Added from your original template interface
  date_created?: string; // Added from your original template interface
  date_updated?: string; // Added from your original template interface
}

// Subscriber Interface (from Directus 'subscribers' collection)
export interface Subscriber {
  id: string;
  email: string;
  name?: string;
  first_name?: string; // Added from your original subscriber interface
  last_name?: string; // Added from your original subscriber interface
  company?: string; // Added from your original subscriber interface
  job_title?: string; // Added from your original subscriber interface
  status: 'active' | 'unsubscribed' | 'bounced' | 'pending' | 'suppressed'; // More comprehensive status
  subscription_source?: 'website' | 'import' | 'manual' | 'event' | 'api' | 'referral'; // Added
  subscription_preferences?: string[]; // Added
  custom_fields?: Record<string, any>; // Added
  engagement_score?: number; // Added
  subscribed_at?: string;
  last_email_opened?: string; // Added
  last_email_clicked?: string; // Added
  unsubscribed_at?: string;
  bounce_count?: number; // Added
  date_created?: string;
  date_updated?: string;
}

// Mailing List Interface (from Directus 'mailing_lists' collection)
export interface MailingList {
  id: string;
  name: string;
  description?: string;
  subscriber_count?: number; // Count of subscribers in this list
  active_count?: number; // Added from your original mailing list interface
  status: 'active' | 'archived';
  tags?: string[]; // Added from your original mailing list interface
  subscribers?: Subscriber[]; // Added from your original mailing list interface
  date_created?: string; // Added from your original mailing list interface
  date_updated?: string; // Added from your original mailing list interface
}

// Newsletter send record
export interface NewsletterSend {
  id: string
  newsletter_id: string
  newsletter?: NewsletterData // Use NewsletterData
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
  newsletter?: NewsletterData // Use NewsletterData
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
export function isNewsletterSent(newsletter: NewsletterData): boolean {
  return newsletter.status === NEWSLETTER_STATUS.SENT
}

export function isNewsletterEditable(newsletter: NewsletterData): boolean {
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
  email: string;
  name?: string;
  substitutions?: Record<string, string>;
  custom_args?: Record<string, any>;
}

export interface SendGridSendOptions {
  fromEmail?: string;
  fromName?: string;
  replyTo?: string;
  categories?: string[];
  sendAt?: Date;
  batchId?: string;
  asmGroupId?: number;
  trackingSettings?: {
    clickTracking?: { enable: boolean; enableText?: boolean };
    openTracking?: { enable: boolean; substitutionTag?: string };
    subscriptionTracking?: { enable: boolean };
  };
  customArgs?: Record<string, string>;
}
