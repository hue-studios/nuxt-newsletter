import { defineNuxtPlugin } from '#app'
import type { NewsletterModuleOptions } from '../module'

export default defineNuxtPlugin({
  name: 'newsletter',
  enforce: 'pre',
  async setup(nuxtApp) {
    const config = nuxtApp.$config.public.newsletter as NewsletterModuleOptions

    // Initialize newsletter system
    nuxtApp.provide('newsletter', {
      config,
      initialized: true
    })

    // Set up global error handler for newsletter operations
    nuxtApp.hook('vue:error', (error, instance, info) => {
      if (info?.includes('newsletter')) {
        console.error('[Newsletter Error]', error)
      }
    })

    // Log initialization in development
    if (import.meta.dev) {
      console.log('[Newsletter] Plugin initialized with config:', {
        directusUrl: config.directus?.url,
        authType: config.directus?.auth?.type,
        features: config.features
      })
    }
  }
})