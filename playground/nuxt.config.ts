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
    features: {
      styling: 'tailwind',
      dragDrop: true,
      preview: true,
      templates: true
    },
    dragProvider: 'auto'
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