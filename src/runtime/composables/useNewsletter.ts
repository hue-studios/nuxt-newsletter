// src/runtime/composables/useNewsletter.ts
import { useNuxtApp, useRuntimeConfig } from '#app'
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
  // This now directly uses the 'status' object exposed by the module.ts in public runtime config
  const connectionStatus = computed(() => {
    const statusFromModule = newsletterConfig.value?.status || {};
    return {
      directus: {
        configured: statusFromModule.directusConfigured || false,
        url: directusUrl.value, // Still use directusUrl computed for actual URL
        authConfigured: statusFromModule.directusAuthConfigured || false
      },
      sendgrid: {
        configured: statusFromModule.sendgridConfigured || false,
        hasWebhook: statusFromModule.sendgridWebhookConfigured || false
      },
      mjml: {
        mode: statusFromModule.mjmlMode || 'client',
        serverSide: statusFromModule.mjmlMode === 'server'
      },
      // Expose admin token status if module.ts passes it
      directusAdminTokenConfigured: statusFromModule.directusAdminTokenConfigured || false
    };
  });

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
