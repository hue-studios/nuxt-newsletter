// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  modules: ['../src/module'],
  
  // Tailwind CSS 4 Vite plugin
  vite: {
    plugins: [tailwindcss()],
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
      // These will be overridden by env vars if set
      defaultFromEmail: 'newsletter@example.com',
      defaultFromName: 'Test Newsletter'
    },
    mjmlMode: 'server', // Use server-side compilation for better performance
    prefix: 'Newsletter',
    ui: {
      icons: 'lucide',
      enableDragDrop: true,
      autoInstallTailwind: false, // Disabled since we're configuring manually
      theme: {
        primaryColor: 'blue',
        darkMode: true
      }
    }
  },

  // For development
  runtimeConfig: {
    public: {
      newsletter: {
        dev: true
      }
    }
  },

  devtools: { enabled: true }
})