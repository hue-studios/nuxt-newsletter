export * from "./newsletter";

// Ensure no duplicate declarations
declare module "@nuxt/schema" {
  interface RuntimeConfig {
    newsletter?: {
      sendgridApiKey?: string;
      webhookSecret?: string;
    };
  }

  interface PublicRuntimeConfig {
    newsletter?: {
      directusUrl: string;
      enableAnalytics?: boolean;
      enableWebhooks?: boolean;
    };
  }
}

// Global type augmentation for Nuxt
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DIRECTUS_URL?: string;
      SENDGRID_API_KEY?: string;
      NEWSLETTER_WEBHOOK_SECRET?: string;
    }
  }
}
