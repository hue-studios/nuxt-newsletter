export * from "./newsletter";

declare module "@nuxt/schema" {
  interface RuntimeConfig {
    newsletter: {
      sendgridApiKey: string;
      webhookSecret: string;
      defaultFromEmail?: string;
      defaultFromName?: string;
      directusToken?: string;
      directusUrl?: string;
      enableAnalytics?: boolean;
      enableWebhooks?: boolean;
    };
  }

  interface PublicRuntimeConfig {
    newsletter: {
      directusUrl: string;
    };
  }
}

export {};
