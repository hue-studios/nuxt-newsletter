export default defineNuxtConfig({
  typescript: {
    typeCheck: true,
  },
  modules: ["shadcn-nuxt", "@nuxtjs/color-mode", "../src/module"],
  devtools: { enabled: true },

  // Color mode configuration
  colorMode: {
    classSuffix: "",
  },
  compatibilityDate: "2024-11-01",

  newsletter: {
    directusUrl: process.env.DIRECTUS_URL || "http://localhost:8055",
    sendgridApiKey: process.env.SENDGRID_API_KEY || "test-key",
    defaultFromEmail: "test@example.com",
    defaultFromName: "Test Newsletter",
    enableAnalytics: true,
    enableWebhooks: false,
  },

  // Shadcn configuration
  shadcn: {
    prefix: "",
    componentDir: "./components/ui",
  },
});
