// playground/nuxt.config.ts
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  css: ["~/assets/css/tailwind.css"],
  modules: ['../src/module'],
  
  // Tailwind CSS 4 Vite plugin
  
  
  newsletter: {
    directus: {
      url: process.env.DIRECTUS_URL || 'http://localhost:8055',
      auth: {
        type: 'static',
        token: process.env.DIRECTUS_TOKEN || 'dev-token'
      }
    },
    sendgrid: {
      // API key will be read from runtimeConfig
      defaultFromEmail: 'newsletter@example.com',
      defaultFromName: 'Test Newsletter',
      apiKey: process.env.SENDGRID_API_KEY || '',
    },
    mjmlMode: 'server',
    prefix: 'Newsletter',
    ui: {
      icons: 'lucide',
      enableDragDrop: true,
      autoInstallTailwind: false, // We're configuring manually
      theme: {
        primaryColor: 'blue',
        darkMode: true
      }
    }
  },

  // Properly configure runtime config for environment variables
  runtimeConfig: {
    // Private keys (server-side only)
    sendgridApiKey: process.env.SENDGRID_API_KEY || '',
    sendgridWebhookSecret: process.env.SENDGRID_WEBHOOK_SECRET || '',
    directusAdminToken: process.env.DIRECTUS_ADMIN_TOKEN || '',
    
    // Public config (client-side accessible)
    public: {
      newsletter: {
        dev: true,
        siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      }
    }
  },
  vite: {
    plugins: [tailwindcss()],
  },

  devtools: { enabled: true }
})