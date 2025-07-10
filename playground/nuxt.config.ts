// playground/nuxt.config.ts
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  typescript: {
    typeCheck: true,
  },
  devtools: { enabled: true },
  css: ["~/assets/css/app.css"],
  modules: [
    ["shadcn-nuxt", 
      {
        prefix: "",
        componentDir: "./components/ui",
      },
    ], 
    "@nuxtjs/color-mode", 
    "../src/module", 
  ],
  newsletter: {
    sendgridApiKey: process.env.SENDGRID_API_KEY || "test-key",
    public: {
        directusUrl: process.env.DIRECTUS_URL || "http://localhost:8055",
        defaultFromEmail: "test@example.com",
        defaultFromName: "Test Newsletter",
        enableAnalytics: true,
        enableWebhooks: false,
  }
      },
 
  compatibilityDate: "2024-11-01",


  vite: {
    plugins: [tailwindcss()],
  },

  build: {
    transpile: ["@sendgrid/mail", "gsap", "gsap/Draggable", "gsap/ScrollTrigger"],
  },
});
