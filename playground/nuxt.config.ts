export default defineNuxtConfig({
  modules: ["shadcn-nuxt", "@nuxtjs/color-mode", "../src/module"],

  // Shadcn configuration
  shadcn: {
    prefix: "",
    componentDir: "./components/ui",
  },

  // Color mode configuration
  colorMode: {
    classSuffix: "",
  },

  newsletter: {
    directusUrl: process.env.DIRECTUS_URL || "http://localhost:8055",
    sendgridApiKey: process.env.SENDGRID_API_KEY || "test-key",
    defaultFromEmail: "test@example.com",
    defaultFromName: "Test Newsletter",
    enableAnalytics: true,
    enableWebhooks: false,
  },
  devtools: { enabled: true },
  compatibilityDate: "2024-11-01",
});
