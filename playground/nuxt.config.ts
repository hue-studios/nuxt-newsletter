// playground/nuxt.config.ts
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  css: ["~/assets/css/tailwind.css"],
  modules: [
    '../src/module',
    '@nuxt/icon' // Add this for icon support
  ],
  
  icon: {
    provider: 'iconify'
  },

  newsletter: {
    // === DIRECTUS CONFIGURATION ===
    directus: {
      url: process.env.DIRECTUS_URL || 'http://localhost:8055',
      auth: {
        type: 'static', // or 'middleware' for user-facing apps
        token: process.env.DIRECTUS_TOKEN
      }
    },

    // === SENDGRID CONFIGURATION ===
    sendgrid: {
      apiKey: process.env.SENDGRID_API_KEY, // Will be read from runtimeConfig
      webhookSecret: process.env.SENDGRID_WEBHOOK_SECRET,
      defaultFromEmail: 'info@theagency-ny.com',
      defaultFromName: 'The Agency'
    },

    // === PERFORMANCE SETTINGS ===
    mjmlMode: 'server', // Use server-side compilation for better performance
    
    // === COMPONENT SETTINGS ===
    prefix: 'Newsletter', // Creates <NewsletterEditor>, <NewsletterPreview>, etc.

    // === DEVELOPMENT SETTINGS ===
    dev: true, // Enable enhanced error messages and helpers

    // === UI CONFIGURATION ===
    ui: {
      icons: 'lucide', // or 'auto' to auto-detect
      enableDragDrop: true, // Enable drag and drop functionality
      autoInstallTailwind: false, // We're configuring manually below
      theme: {
        primaryColor: 'blue',
        darkMode: true // Enable dark mode support
      }
    },

    // === PROGRESSIVE ENHANCEMENT (New feature) ===
    progressiveEnhancement: {
      enabled: true,
      editor: {
        adaptiveFeatures: true, // Auto-adapt features based on device capability
        autoSave: true // Enable auto-save if storage is available
      },
      performance: {
        lazyLoading: true, // Lazy load on slower connections
        adaptiveAnimations: true, // Reduce animations on low-performance devices
        smartPreview: true // Real-time preview only on fast connections
      }
    }
  },

  // === RUNTIME CONFIGURATION ===
  runtimeConfig: {
    // Private keys (server-side only)
    sendgridApiKey: process.env.SENDGRID_API_KEY || '',
    sendgridWebhookSecret: process.env.SENDGRID_WEBHOOK_SECRET || '',
    directusAdminToken: process.env.DIRECTUS_ADMIN_TOKEN || '',
    
    // Public config (client-side accessible)
    public: {
      // Note: The newsletter module will automatically populate
      // public.newsletter with the necessary client-side config
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    }
  },

  // === TAILWIND CSS 4 CONFIGURATION ===
  vite: {
    plugins: [tailwindcss()]
  },

  // === DEVELOPMENT TOOLS ===
  devtools: { enabled: true },

  // === TYPESCRIPT CONFIGURATION ===
  typescript: {
    strict: true,
    typeCheck: true
  },

  // === COMPATIBILITY ===
  compatibilityDate: '2024-01-01',

  // === EXPERIMENTAL FEATURES ===
  experimental: {
    // Enable if you want to use experimental features
    payloadExtraction: false
  }
})