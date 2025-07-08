// src/runtime/types/module.d.ts
import type { ModuleOptions } from "../../../module";

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
    };
  }
}

declare module "#app" {
  interface NuxtApp {
    $newsletter: {
      generateSlug: (title: string) => string;
      validateEmail: (email: string) => boolean;
    };
  }
}

export {};
