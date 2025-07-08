// src/runtime/plugins/newsletter.client.ts
import { defineNuxtPlugin } from "nuxt/app";

export default defineNuxtPlugin(() => {
  // Client-side initialization
  return {
    provide: {
      newsletter: {
        generateSlug: (title: string) => {
          return title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .trim();
        },
        validateEmail: (email: string) => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(email);
        },
      },
    },
  };
});
