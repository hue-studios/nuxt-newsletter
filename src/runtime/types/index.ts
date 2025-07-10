export * from "./newsletter";

// NuxtApp augmentation for newsletter helpers
declare module "@nuxt/schema" {
  interface RuntimeConfig {
    newsletter: {
      sendgridApiKey: string;
      webhookSecret: string;
      defaultFromEmail?: string;
      defaultFromName?: string;
      directusToken?: string;
    };
    public: {
      newsletter: {
        directusUrl: string;
      };
    };
  }
}

// Optional: Better DX for environment variables
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DIRECTUS_URL?: string;
      SENDGRID_API_KEY?: string;
      NEWSLETTER_WEBHOOK_SECRET?: string;
    }
  }
}

export {};
