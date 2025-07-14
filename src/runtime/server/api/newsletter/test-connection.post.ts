// src/runtime/server/api/newsletter/test-connection.post.ts
import { createDirectus, readMe, rest, staticToken } from '@directus/sdk'
import { defineEventHandler } from 'h3'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  
  const results = {
    directus: { status: 'unchecked', message: '', details: null },
    sendgrid: { status: 'unchecked', message: '', details: null },
    overall: { success: false, warnings: [] }
  }

  // Test Directus connection
  try {
    const directusUrl = config.public.newsletter?.directus?.url
    const directusToken = config.directusToken || process.env.DIRECTUS_TOKEN

    if (!directusUrl) {
      results.directus = {
        status: 'error',
        message: 'Directus URL not configured',
        details: 'Add DIRECTUS_URL to your environment variables'
      }
    } else if (!directusToken) {
      results.directus = {
        status: 'error',
        message: 'Directus token not configured',
        details: 'Add DIRECTUS_TOKEN to your environment variables'
      }
    } else {
      // Test actual connection
      const directus = createDirectus(directusUrl)
        .with(rest())
        .with(staticToken(directusToken))

      try {
        const user = await directus.request(readMe({
          fields: ['id', 'email', 'role']
        }))

        results.directus = {
          status: 'success',
          message: 'Connected successfully',
          details: {
            url: directusUrl,
            user: user.email,
            role: user.role
          }
        }
      } catch (directusError) {
        results.directus = {
          status: 'error',
          message: 'Failed to connect to Directus',
          details: directusError instanceof Error ? directusError.message : 'Unknown error'
        }
      }
    }
  } catch (error) {
    results.directus = {
      status: 'error',
      message: 'Directus configuration error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }
  }

  // Test SendGrid configuration
  try {
    const sendgridApiKey = config.sendgridApiKey
    const sendgridWebhookSecret = config.sendgridWebhookSecret

    if (!sendgridApiKey) {
      results.sendgrid = {
        status: 'warning',
        message: 'SendGrid API key not configured',
        details: 'Email sending is disabled. Add SENDGRID_API_KEY to enable.'
      }
    } else {
      // Test SendGrid API key validity (simple check)
      try {
        const response = await $fetch('https://api.sendgrid.com/v3/user/account', {
          headers: {
            'Authorization': `Bearer ${sendgridApiKey}`
          }
        })

        results.sendgrid = {
          status: 'success',
          message: 'SendGrid API key is valid',
          details: {
            hasWebhookSecret: !!sendgridWebhookSecret,
            account: response
          }
        }

        if (!sendgridWebhookSecret) {
          results.overall.warnings.push('SendGrid webhook secret not configured - email analytics will be limited')
        }
      } catch (sendgridError) {
        results.sendgrid = {
          status: 'error',
          message: 'SendGrid API key is invalid',
          details: sendgridError instanceof Error ? sendgridError.message : 'Invalid API key'
        }
      }
    }
  } catch (error) {
    results.sendgrid = {
      status: 'error',
      message: 'SendGrid configuration error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }
  }

  // Determine overall success
  const hasErrors = results.directus.status === 'error' || results.sendgrid.status === 'error'
  
  results.overall = {
    success: !hasErrors,
    warnings: results.overall.warnings
  }

  // Add helpful recommendations
  const recommendations = []

  if (results.directus.status === 'error') {
    recommendations.push({
      type: 'error',
      title: 'Fix Directus Connection',
      steps: [
        'Verify DIRECTUS_URL is correct and accessible',
        'Ensure DIRECTUS_TOKEN has proper permissions',
        'Check if Directus instance is running',
        'Run: npm run newsletter:setup-directus'
      ]
    })
  }

  if (results.sendgrid.status === 'error') {
    recommendations.push({
      type: 'error',
      title: 'Fix SendGrid Configuration',
      steps: [
        'Get API key from https://app.sendgrid.com/settings/api_keys',
        'Ensure API key has "Mail Send" permission',
        'Add SENDGRID_API_KEY to your .env file'
      ]
    })
  }

  if (results.sendgrid.status === 'warning') {
    recommendations.push({
      type: 'info',
      title: 'Optional: Enable Email Sending',
      steps: [
        'Add SENDGRID_API_KEY to your .env file',
        'Optionally add SENDGRID_WEBHOOK_SECRET for analytics'
      ]
    })
  }

  return {
    ...results,
    recommendations
  }
})