// playground/nuxt.config.ts
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  css: ["~/assets/css/tailwind.css"],
  modules: ['../src/module'],
  
  // Tailwind CSS 4 Vite plugin
  
  icon: {
    provider: 'iconify',
    // iconifyApiOptions: {
    //   url: 'https://api.iconify.design'
    // }
  },
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
    },
    mjmlMode: 'server',
    prefix: 'Newsletter',
    ui: {
      icons: 'lucide',
      enableDragDrop: true,
      dragDrop: {
        hapticFeedback: true,
        autoScroll: true,
        smoothAnimations: true,
        longPressDelay: 300,
        minimumDistance: 8,
        accessibilityMode: true
      },
      autoInstallTailwind: false, // We're configuring manually
      theme: {
        primaryColor: 'blue',
        darkMode: true
      }
    }
  },

  // Properly configure runtime config for environment variables
  runtimeConfig: {
    // Private keys (server-side only) - these will NOT be accessible on client
    sendgridApiKey: process.env.SENDGRID_API_KEY || '',
    sendgridWebhookSecret: process.env.SENDGRID_WEBHOOK_SECRET || '',
    directusAdminToken: process.env.DIRECTUS_ADMIN_TOKEN || '',
    
    // Public config (client-side accessible)
    public: {
      newsletter: {
        dev: true,
        siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        directusUrl: process.env.DIRECTUS_URL || 'http://localhost:8055',
        // Add flags for feature availability on client-side
        features: {
          sendgridEnabled: !!(process.env.SENDGRID_API_KEY),
          directusEnabled: !!(process.env.DIRECTUS_URL),
        },
        // Default email settings that can be accessed client-side
        defaultFromEmail: 'newsletter@example.com',
        defaultFromName: 'Test Newsletter'
      }
    }
  },
  vite: {
    plugins: [tailwindcss()],
  },

  devtools: { enabled: true }
})