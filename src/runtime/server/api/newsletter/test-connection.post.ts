// src/runtime/server/api/newsletter/test-connection.post.ts
import { createDirectus, readMe, rest, staticToken } from '@directus/sdk';
import { defineEventHandler } from 'h3';
import { $fetch } from 'ofetch'; // Import $fetch for making HTTP requests

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

    if (!directusUrl || directusUrl === 'http://localhost:8055') { // Added check for default URL
      results.directus = {
        status: 'error',
        message: 'Directus URL not configured or is default.',
        details: 'Add DIRECTUS_URL to your environment variables or nuxt.config.ts'
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
        status: 'error', // Changed to error, as email sending won't work without it
        message: 'SendGrid API key not configured',
        details: 'Email sending is disabled. Add SENDGRID_API_KEY to enable.'
      }
    } else {
      // Test SendGrid API key validity by fetching account details
      try {
        const response = await $fetch('https://api.sendgrid.com/v3/user/account', {
          headers: {
            'Authorization': `Bearer ${sendgridApiKey}`,
            'Content-Type': 'application/json'
          }
        })

        results.sendgrid = {
          status: 'success',
          message: 'SendGrid API key is valid',
          details: {
            hasWebhookSecret: !!sendgridWebhookSecret,
            account: response // Can include account details for debugging if needed
          }
        }

        if (!sendgridWebhookSecret) {
          results.overall.warnings.push('SendGrid webhook secret not configured - email analytics will be limited')
        }
      } catch (sendgridError: any) { // Explicitly type sendgridError as any to access .response
        let errorMessage = 'SendGrid API key is invalid or has insufficient permissions.';
        if (sendgridError.response?.status === 401 || sendgridError.response?.status === 403) {
          errorMessage = 'SendGrid API key is invalid or unauthorized.';
        } else if (sendgridError.message.includes('getaddrinfo ENOTFOUND')) {
          errorMessage = 'Could not reach SendGrid API. Check network or SendGrid status.';
        } else if (sendgridError.message) {
          errorMessage = `SendGrid API test failed: ${sendgridError.message}`;
        }

        results.sendgrid = {
          status: 'error',
          message: errorMessage,
          details: sendgridError instanceof Error ? sendgridError.message : 'Unknown error during SendGrid test'
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
        'Ensure API key has "Mail Send" permission (and "Account" if testing /v3/user/account)',
        'Add SENDGRID_API_KEY to your .env file'
      ]
    })
  }

  if (results.sendgrid.status === 'warning') { // This block will only run if sendgridApiKey is present but webhook is missing
    recommendations.push({
      type: 'info',
      title: 'Optional: Enable Email Analytics',
      steps: [
        'Add SENDGRID_WEBHOOK_SECRET to your .env file',
        'Configure SendGrid Inbound Parse Webhook for analytics'
      ]
    })
  }

  return {
    ...results,
    recommendations
  }
})
