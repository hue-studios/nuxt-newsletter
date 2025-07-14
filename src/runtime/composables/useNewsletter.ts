// src/runtime/composables/useNewsletter.ts
import { useNuxtApp, useRuntimeConfig } from '#imports'
import { computed } from 'vue'

export function useNewsletter() {
  const nuxtApp = useNuxtApp()
  const config = useRuntimeConfig()

  // Get the newsletter configuration from public runtime config
  const newsletterConfig = computed(() => config.public.newsletter || {})

  const isInitialized = computed(() => !!nuxtApp.$newsletter?.initialized)
  
  const directusUrl = computed(() => {
    return newsletterConfig.value?.directus?.url || 'http://localhost:8055'
  })
  
  const authType = computed(() => {
    return newsletterConfig.value?.directus?.auth?.type || 'static'
  })
  
  const mjmlMode = computed(() => {
    return newsletterConfig.value?.mjmlMode || 'client'
  })

  const defaultFromEmail = computed(() => {
    return newsletterConfig.value?.sendgrid?.defaultFromEmail || 'newsletter@example.com'
  })
  
  const defaultFromName = computed(() => {
    return newsletterConfig.value?.sendgrid?.defaultFromName || 'Newsletter'
  })

  // Development helpers
  const isDev = computed(() => {
    return newsletterConfig.value?.dev || false
  })

  // UI configuration
  const uiConfig = computed(() => {
    return newsletterConfig.value?.ui || {
      icons: 'lucide',
      enableDragDrop: true,
      theme: {
        primaryColor: 'blue',
        darkMode: false
      }
    }
  })

  // Status checks for better developer experience
  const connectionStatus = computed(() => {
    const status = {
      directus: {
        configured: !!directusUrl.value && directusUrl.value !== 'http://localhost:8055',
        url: directusUrl.value
      },
      sendgrid: {
        configured: !!config.sendgridApiKey,
        hasWebhook: !!config.sendgridWebhookSecret
      },
      mjml: {
        mode: mjmlMode.value,
        serverSide: mjmlMode.value === 'server'
      }
    }

    return status
  })

  // Helper for checking if setup is complete
  const isSetupComplete = computed(() => {
    const status = connectionStatus.value
    return status.directus.configured && status.directus.url !== 'http://localhost:8055'
  })

  // Get helpful setup information
  const setupInfo = computed(() => {
    const status = connectionStatus.value
    const info = {
      missingSteps: [] as string[],
      recommendations: [] as string[]
    }

    if (!status.directus.configured) {
      info.missingSteps.push('Configure Directus URL and token')
    }

    if (!status.sendgrid.configured) {
      info.recommendations.push('Add SendGrid API key for email sending')
    }

    if (!status.sendgrid.hasWebhook) {
      info.recommendations.push('Add SendGrid webhook secret for analytics')
    }

    if (status.mjml.mode === 'client') {
      info.recommendations.push('Consider server-side MJML compilation for better performance')
    }

    return info
  })

  return {
    // Core configuration
    isInitialized,
    config: newsletterConfig,
    directusUrl,
    authType,
    mjmlMode,
    defaultFromEmail,
    defaultFromName,
    isDev,
    uiConfig,

    // Status and setup helpers
    connectionStatus,
    isSetupComplete,
    setupInfo
  }
}