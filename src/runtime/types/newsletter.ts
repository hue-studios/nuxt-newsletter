// src/runtime/types/newsletter.ts
import type { Ref } from "vue";

// Base interfaces
export interface Newsletter {
  compiled_html: any;
  id?: number;
  title: string;
  subject_line: string;
  from_name: string;
  from_email: string;
  category?: string;
  status?: "draft" | "scheduled" | "sent" | "paused";
  html_content?: string;
  mjml_template?: string;
  sent_at?: string | Date;
  scheduled_at?: string | Date;
  open_rate?: number;
  click_rate?: number;
  blocks?: NewsletterBlock[];
  segments?: NewsletterSegment[];
  date_created?: string | Date;
  date_updated?: string | Date;
  created_by?: string | number;
  updated_by?: string | number;
}

export interface NewsletterTemplate {
  id?: number;
  name: string;
  description?: string;
  preview_image?: string;
  mjml_template: string;
  blocks?: NewsletterBlock[];
  tags?: string[];
  category?: string;
  status?: "active" | "inactive";
  date_created?: string | Date;
  date_updated?: string | Date;
}

export interface NewsletterBlock {
  id?: number;
  newsletter_id?: number;
  block_type_id?: number;
  block_type?: BlockType;
  sort?: number;
  title?: string;
  subtitle?: string;
  text_content?: string;
  image_url?: string;
  image_alt_text?: string;
  image_caption?: string;
  button_text?: string;
  button_url?: string;
  background_color?: string;
  text_color?: string;
  text_align?: "left" | "center" | "right";
  padding?: string;
  font_size?: string;
  custom_styles?: Record<string, any>;
  custom_data?: Record<string, any>;
  date_created?: string | Date;
  date_updated?: string | Date;
}

export interface BlockType {
  id: number;
  name: string;
  slug: string;
  description?: string;
  mjml_template: string;
  default_content?: string;
  status: "published" | "draft";
  icon?: string;
  category: "content" | "media" | "interactive" | "layout";
  custom_fields?: BlockField[];
  field_visibility_config?: string[]; // ADD THIS LINE
  date_created?: string | Date;
  date_updated?: string | Date;
}

export interface BlockField {
  name: string;
  type: "text" | "textarea" | "image" | "url" | "color" | "select";
  label: string;
  required?: boolean;
  default_value?: any;
  options?: string[];
}

export interface NewsletterSegment {
  id?: number;
  name: string;
  description?: string;
  rules: SegmentRule[];
  subscriber_count?: number;
  date_created?: string | Date;
  date_updated?: string | Date;
}

export interface SegmentRule {
  field: string;
  operator:
    | "equals"
    | "not_equals"
    | "contains"
    | "not_contains"
    | "greater_than"
    | "less_than";
  value: any;
  type: "text" | "number" | "date" | "select" | "multi-select";
}

export interface Subscriber {
  id?: number;
  email: string;
  first_name?: string;
  last_name?: string;
  status: "active" | "unsubscribed" | "bounced";
  subscribed_at?: string | Date;
  unsubscribed_at?: string | Date;
  tags?: string[];
  custom_fields?: Record<string, any>;
}

// Utility types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  filter?: Record<string, any>;
}

export interface SendResult {
  messageId: any;
  status: string;
  recipients: number;
  headers: any;
}

export interface UploadOptions {
  folder?: string;
  filename?: string;
  maxSize?: number;
  allowedTypes?: string[];
}

export interface UploadResult {
  success: boolean;
  file?: {
    id: string;
    filename: string;
    url: string;
    size: number;
    type: string;
  };
  error?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// Composable return types
export interface UseNewsletterReturn {
  newsletters: Ref<Newsletter[]>;
  currentNewsletter: Ref<Newsletter | null>;
  isLoading: Ref<boolean>;
  error: Ref<string | null>;
  fetchNewsletters: (params?: PaginationParams) => Promise<void>;
  fetchNewsletter: (id: number) => Promise<Newsletter | null>;
  createNewsletter: (data: Partial<Newsletter>) => Promise<Newsletter>;
  updateNewsletter: (
    id: number,
    data: Partial<Newsletter>
  ) => Promise<Newsletter>;
  deleteNewsletter: (id: number) => Promise<void>;
  duplicateNewsletter: (id: number) => Promise<Newsletter>;
  sendNewsletter: (id: number, options?: any) => Promise<SendResult>;
  addBlock: (
    newsletterId: number,
    blockData: Partial<NewsletterBlock>
  ) => Promise<NewsletterBlock>;
  updateBlock: (
    blockId: number,
    data: Partial<NewsletterBlock>
  ) => Promise<NewsletterBlock>;
  deleteBlock: (blockId: number) => Promise<void>;
  reorderBlocks: (blocks: NewsletterBlock[]) => Promise<void>;
}

export interface UseDirectusReturn {
  directus: any;
  directusHelpers: DirectusHelpers;
  isConnected: Readonly<Ref<boolean>>;
  isLoading: Readonly<Ref<boolean>>;
  error: Readonly<Ref<string | null>>;
  testConnection: () => Promise<boolean>;
}

export interface DirectusHelpers {
  // Collection operations
  readItems: (collection: string, params?: any) => Promise<ApiResponse>;
  createItem: (collection: string, data: any) => Promise<ApiResponse>;
  updateItem: (
    collection: string,
    id: string | number,
    data: any
  ) => Promise<ApiResponse>;
  deleteItem: (collection: string, id: string | number) => Promise<ApiResponse>;

  // Batch operations
  batchCreate: (collection: string, items: any[]) => Promise<ApiResponse>;
  batchUpdate: (collection: string, items: any[]) => Promise<ApiResponse>;
  batchDelete: (
    collection: string,
    ids: (string | number)[]
  ) => Promise<ApiResponse>;
  readItemsCached: (collection: string, params?: any) => Promise<ApiResponse>;

  // File operations
  uploadFile: (file: File, options?: UploadOptions) => Promise<UploadResult>;
  getFileUrl: (fileId: string) => string;

  // Authentication
  login: (email: string, password: string) => Promise<ApiResponse>;
  logout: () => Promise<void>;
  refresh: () => Promise<ApiResponse>;

  // Specific collections
  newsletters: {
    list: (params?: PaginationParams) => Promise<ApiResponse<Newsletter[]>>;
    get: (id: number) => Promise<ApiResponse<Newsletter>>;
    create: (data: Partial<Newsletter>) => Promise<ApiResponse<Newsletter>>;
    update: (
      id: number,
      data: Partial<Newsletter>
    ) => Promise<ApiResponse<Newsletter>>;
    delete: (id: number) => Promise<ApiResponse>;
  };

  blockTypes: {
    list: () => Promise<ApiResponse<BlockType[]>>;
    get: (id: number) => Promise<ApiResponse<BlockType>>;
  };

  templates: {
    list: () => Promise<ApiResponse<NewsletterTemplate[]>>;
    get: (id: number) => Promise<ApiResponse<NewsletterTemplate>>;
    create: (
      data: Partial<NewsletterTemplate>
    ) => Promise<ApiResponse<NewsletterTemplate>>;
    update: (
      id: number,
      data: Partial<NewsletterTemplate>
    ) => Promise<ApiResponse<NewsletterTemplate>>;
    delete: (id: number) => Promise<ApiResponse>;
  };
}

// Module configuration
export interface NewsletterModuleConfig {
  directusUrl: string;
  sendgridApiKey?: string;
  defaultFromEmail?: string;
  defaultFromName?: string;
  webhookSecret?: string;
  enableAnalytics?: boolean;
  enableWebhooks?: boolean;
}

// Runtime config augmentation
declare module "#app" {
  interface NuxtApp {
    $directus: any;
    $directusHelpers: DirectusHelpers;
    $gsap: {
      gsap: any;
      ScrollTrigger?: any;
      TextPlugin?: any;
      DrawSVGPlugin?: any;
    };
  }
}

declare module "@nuxt/schema" {
  interface RuntimeConfig {
    newsletter: NewsletterModuleConfig;
  }
  interface PublicRuntimeConfig {
    newsletter: NewsletterModuleConfig;
  }
}
