// src/runtime/plugin.ts
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
      initialized: true,
      version: '1.0.0'
    })

    // Set up global error handler for newsletter operations
    nuxtApp.hook('vue:error', (error, instance, info) => {
      if (info?.includes('newsletter')) {
        console.error('[Newsletter Error]', error)
      }
    })

    // Log initialization in development
    if (import.meta.dev) {
      console.log('[Newsletter] Module initialized v1.0.0', {
        directusUrl: config.directus?.url,
        authType: config.directus?.auth?.type,
        mjmlMode: config.mjmlMode || 'client',
        sendgridConfigured: !!nuxtApp.$config.sendgridApiKey
      })
    }
  }
})