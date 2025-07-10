declare module "@nuxt/schema" {
  interface RuntimeConfig {
    newsletter: {
      sendgridApiKey: string;
      webhookSecret: any;
      defaultFromEmail?: string;
      defaultFromName?: string;
      directusToken?: string;
      directusUrl?: string;
      enableAnalytics?: boolean;
      enableWebhooks?: boolean;
    };
  }
}
