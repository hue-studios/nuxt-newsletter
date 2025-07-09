// src/runtime/types/index.ts
export interface Newsletter {
  id: number;
  title: string;
  subject_line: string;
  from_name: string;
  from_email: string;
  status: "draft" | "ready" | "sending" | "sent" | "failed";
  priority: "low" | "normal" | "high" | "urgent";
  is_ab_test: boolean;
  total_opens: number;
  approval_status: "pending" | "approved" | "rejected";
  test_emails: string[];
  tags: string[];
  slug: string;
  category: string;
  blocks?: NewsletterBlock[];
  template_id?: number;
  mailing_list_id?: number;
  compiled_html?: string;
  compiled_mjml?: string;
  created_at: string;
  updated_at: string;
}

export interface NewsletterBlock {
  id: number;
  newsletter_id: number;
  block_type_id: number;
  sort: number;
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
  content?: Record<string, any>;
  mjml_output?: string;
  block_type?: BlockType;
  created_at: string;
  updated_at: string;
}

export interface BlockType {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  category: string;
  mjml_template: string;
  field_visibility_config?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface NewsletterTemplate {
  id: number;
  name: string;
  description?: string;
  category: string;
  template_data: Record<string, any>;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface MailingList {
  id: number;
  name: string;
  description?: string;
  subscriber_count: number;
  created_at: string;
  updated_at: string;
}

export interface EditorState {
  selectedBlock: NewsletterBlock | null;
  draggedBlock: NewsletterBlock | null;
  isPreviewMode: boolean;
  showTemplateLibrary: boolean;
  showContentLibrary: boolean;
  isCompiling: boolean;
  isSaving: boolean;
}

export interface DirectusHelpers {
  read: (
    collection: string,
    id: string | number,
    query?: any
  ) => Promise<DirectusResponse>;
  create: (collection: string, data: any) => Promise<DirectusResponse>;
  update: (
    collection: string,
    id: string | number,
    data: any
  ) => Promise<DirectusResponse>;
  delete: (
    collection: string,
    id: string | number
  ) => Promise<DirectusResponse>;
  readItems: (collection: string, query?: any) => Promise<DirectusResponse>;
  batchCreate: (collection: string, items: any[]) => Promise<DirectusResponse>;
  batchUpdate: (collection: string, items: any[]) => Promise<DirectusResponse>;
  batchDelete: (
    collection: string,
    ids: (string | number)[]
  ) => Promise<DirectusResponse>;
  newsletters: {
    list: (query?: any) => Promise<DirectusResponse>;
    get: (id: string | number) => Promise<DirectusResponse>;
    create: (data: any) => Promise<DirectusResponse>;
    update: (id: string | number, data: any) => Promise<DirectusResponse>;
    delete: (id: string | number) => Promise<DirectusResponse>;
  };
  blocks: {
    list: (newsletterId: string | number) => Promise<DirectusResponse>;
    create: (data: any) => Promise<DirectusResponse>;
    update: (id: string | number, data: any) => Promise<DirectusResponse>;
    delete: (id: string | number) => Promise<DirectusResponse>;
    batchUpdate: (blocks: any[]) => Promise<DirectusResponse>;
  };
  login: (email: string, password: string) => Promise<DirectusResponse>;
  logout: () => Promise<DirectusResponse>;
  getCurrentUser: () => Promise<DirectusResponse>;
  testConnection: () => Promise<DirectusResponse>;
}

export interface DirectusResponse {
  success: boolean;
  item?: any;
  items?: any[];
  user?: any;
  error?: string;
}

export interface GSAPPlugins {
  gsap: any;
  Draggable: any;
  ScrollTrigger: any;
  ScrollSmoother: any;
  MorphSVGPlugin: any;
}

export interface NewsletterUtils {
  generateSlug: (title: string) => string;
  validateEmail: (email: string) => boolean;
}

// Module augmentation for Nuxt
declare module "#app" {
  interface NuxtApp {
    $directus: any;
    $directusHelpers: DirectusHelpers;
    $gsap: GSAPPlugins;
    $newsletter: NewsletterUtils;
  }
}

declare module "vue" {
  interface ComponentCustomProperties {
    $directus: any;
    $directusHelpers: DirectusHelpers;
    $gsap: GSAPPlugins;
    $newsletter: NewsletterUtils;
  }
}

declare module "@nuxt/schema" {
  interface NuxtConfig {
    newsletter?: {
      directusUrl: string;
      directusToken?: string;
      sendgridApiKey?: string;
      defaultFromEmail?: string;
      defaultFromName?: string;
      webhookSecret?: string;
      enableAnalytics?: boolean;
      enableWebhooks?: boolean;
    };
  }
  interface NuxtOptions {
    newsletter?: {
      directusUrl: string;
      directusToken?: string;
      sendgridApiKey?: string;
      defaultFromEmail?: string;
      defaultFromName?: string;
      webhookSecret?: string;
      enableAnalytics?: boolean;
      enableWebhooks?: boolean;
    };
  }
}

export {};
