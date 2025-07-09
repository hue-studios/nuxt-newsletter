export * from "./newsletter";

// NuxtApp augmentation for newsletter helpers
declare module "#app" {
  interface NuxtApp {
    $newsletter: {
      generateSlug: (title: string) => string;
      validateEmail: (email: string) => boolean;
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
