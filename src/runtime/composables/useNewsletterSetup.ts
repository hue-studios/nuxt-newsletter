// src/runtime/composables/useNewsletterSetup.ts
import { useRuntimeConfig } from '#app'
import { computed, ref } from 'vue'

export interface SetupValidation {
  isValid: boolean
  severity: 'error' | 'warning' | 'info'
  message: string
  solution: string
  docs?: string
}

export function useNewsletterSetup() {
  const config = useRuntimeConfig()
  const isChecking = ref(false)

  // Validate Directus setup
  const directusValidation = computed((): SetupValidation => {
    const directusUrl = config.public.newsletter?.directus?.url
    const authType = config.public.newsletter?.directus?.auth?.type

    if (!directusUrl || directusUrl === 'http://localhost:8055') {
      return {
        isValid: false,
        severity: 'error',
        message: 'Directus URL not configured',
        solution: 'Add DIRECTUS_URL to your .env file or configure in nuxt.config.ts',
        docs: '#directus-setup'
      }
    }

    if (authType === 'static' && !process.client) {
      // On server side, we can't easily check the token
      // The actual token validation will happen when making API calls
      return {
        isValid: true,
        severity: 'info',
        message: 'Directus URL configured',
        solution: 'Ensure DIRECTUS_TOKEN is set in your environment'
      }
    }

    return {
      isValid: true,
      severity: 'info',
      message: 'Directus configuration looks good',
      solution: ''
    }
  })

  // Validate SendGrid setup
  const sendgridValidation = computed((): SetupValidation => {
    if (process.client) {
      // Can't check API key on client side for security
      return {
        isValid: true,
        severity: 'info',
        message: 'SendGrid configuration is server-side only',
        solution: 'Check server logs for SendGrid status'
      }
    }

    const hasApiKey = !!config.sendgridApiKey
    const hasWebhookSecret = !!config.sendgridWebhookSecret

    if (!hasApiKey) {
      return {
        isValid: false,
        severity: 'warning',
        message: 'SendGrid API key not configured',
        solution: 'Add SENDGRID_API_KEY to your .env file to enable email sending',
        docs: '#sendgrid-setup'
      }
    }

    if (!hasWebhookSecret) {
      return {
        isValid: true,
        severity: 'warning',
        message: 'SendGrid webhook secret not configured',
        solution: 'Add SENDGRID_WEBHOOK_SECRET for email analytics tracking',
        docs: '#sendgrid-webhooks'
      }
    }

    return {
      isValid: true,
      severity: 'info',
      message: 'SendGrid fully configured',
      solution: ''
    }
  })

  // Validate MJML setup
  const mjmlValidation = computed((): SetupValidation => {
    const mjmlMode = config.public.newsletter?.mjmlMode || 'client'

    if (mjmlMode === 'server') {
      return {
        isValid: true,
        severity: 'info',
        message: 'Server-side MJML compilation enabled',
        solution: 'Ensure mjml package is installed: npm install mjml'
      }
    }

    return {
      isValid: true,
      severity: 'warning',
      message: 'Using client-side MJML compilation',
      solution: 'Consider server-side compilation for better performance',
      docs: '#mjml-server-mode'
    }
  })

  // Overall validation
  const overallValidation = computed(() => {
    const validations = [directusValidation.value, sendgridValidation.value, mjmlValidation.value]
    
    const errors = validations.filter(v => v.severity === 'error')
    const warnings = validations.filter(v => v.severity === 'warning')
    
    return {
      isValid: errors.length === 0,
      hasWarnings: warnings.length > 0,
      errors,
      warnings,
      validations
    }
  })

  // Quick setup steps
  const getSetupSteps = () => {
    const steps = []
    const validation = overallValidation.value

    if (!directusValidation.value.isValid) {
      steps.push({
        title: 'Configure Directus',
        description: 'Set up your Directus instance connection',
        action: 'Add DIRECTUS_URL and DIRECTUS_TOKEN to your .env file',
        priority: 'high'
      })
    }

    if (sendgridValidation.value.severity === 'warning' && sendgridValidation.value.message.includes('API key')) {
      steps.push({
        title: 'Configure SendGrid',
        description: 'Enable email sending functionality',
        action: 'Add SENDGRID_API_KEY to your .env file',
        priority: 'medium'
      })
    }

    if (mjmlValidation.value.severity === 'warning') {
      steps.push({
        title: 'Optimize MJML',
        description: 'Enable server-side compilation for better performance',
        action: 'Install mjml package and set mjmlMode to "server"',
        priority: 'low'
      })
    }

    return steps
  }

  // Test connection (can be called from client)
  const testConnection = async () => {
    isChecking.value = true
    
    try {
      // Test Directus connection
      const response = await $fetch('/api/newsletter/test-connection', {
        method: 'POST'
      })
      
      return response
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      }
    } finally {
      isChecking.value = false
    }
  }

  // Generate setup wizard command
  const getSetupCommand = () => {
    return 'npm run newsletter:setup-wizard'
  }

  // Generate quick fix commands
  const getQuickFixes = () => {
    const fixes = []
    
    if (!directusValidation.value.isValid) {
      fixes.push({
        issue: 'Missing Directus configuration',
        command: 'echo "DIRECTUS_URL=https://your-directus.com" >> .env',
        description: 'Add Directus URL to environment'
      })
      fixes.push({
        issue: 'Missing Directus token',
        command: 'echo "DIRECTUS_TOKEN=your-token-here" >> .env',
        description: 'Add Directus authentication token'
      })
    }

    if (sendgridValidation.value.severity === 'warning') {
      fixes.push({
        issue: 'Missing SendGrid API key',
        command: 'echo "SENDGRID_API_KEY=SG.your-key-here" >> .env',
        description: 'Add SendGrid API key for email sending'
      })
    }

    return fixes
  }

  return {
    // Validation results
    directusValidation,
    sendgridValidation,
    mjmlValidation,
    overallValidation,
    
    // Setup helpers
    getSetupSteps,
    getSetupCommand,
    getQuickFixes,
    
    // Actions
    testConnection,
    isChecking
  }
}