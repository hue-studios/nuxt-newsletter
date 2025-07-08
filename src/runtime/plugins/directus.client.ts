// src/runtime/plugins/directus.ts
import { defineNuxtPlugin, useRuntimeConfig } from "nuxt/app";
import { createDirectus, rest } from "@directus/sdk";

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();

  const directus = createDirectus(config.public.newsletter.directusUrl).with(
    rest()
  );

  return {
    provide: {
      directus,
    },
  };
});
