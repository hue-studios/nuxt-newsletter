// src/runtime/types/module.d.ts
declare module "@nuxt/schema" {
  interface NuxtConfig {
    newsletter?: ModuleOptions;
  }
  interface NuxtOptions {
    newsletter?: ModuleOptions;
  }
}

declare module "nuxt/dist/app" {
  interface NuxtApp {
    $newsletter: {
      generateSlug: (title: string) => string;
      validateEmail: (email: string) => boolean;
      // ... other utilities
    };
  }
}
