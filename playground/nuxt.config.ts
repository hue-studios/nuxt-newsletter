// playground/nuxt.config.ts
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  typescript: {
    typeCheck: true,
  },
  modules: [
    ["shadcn-nuxt", 
      {
        prefix: "",
        componentDir: "./components/ui",
      },
    ], 
    "@nuxtjs/color-mode", 
    ["../src/module", 
      {
        directusUrl: process.env.DIRECTUS_URL || "http://localhost:8055",
        sendgridApiKey: process.env.SENDGRID_API_KEY || "test-key",
        defaultFromEmail: "test@example.com",
        defaultFromName: "Test Newsletter",
        enableAnalytics: true,
        enableWebhooks: false,
      },
    ],
  ],
  devtools: { enabled: true },
 
  compatibilityDate: "2024-11-01",


  vite: {
    plugins: [tailwindcss()],
  },

  build: {
    transpile: ["@sendgrid/mail", "gsap", "swiper"],
  },
});
