// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['../src/module'],
  
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
    mjmlMode: 'client', // Use client-side compilation for development
    prefix: 'Newsletter'
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