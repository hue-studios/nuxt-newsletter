// server/api/newsletter/test-connection.post.ts
import { createError, defineEventHandler } from 'h3'
import { $fetch } from 'ofetch'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  
  if (!config.sendgridApiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'SendGrid API key not configured'
    })
  }

  try {
    // Test the API key by making a simple request to SendGrid
    const response = await $fetch('https://api.sendgrid.com/v3/user/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.sendgridApiKey}`,
        'Content-Type': 'application/json'
      }
    })

    return {
      success: true,
      message: 'SendGrid connection successful',
      profile: response
    }
  } catch (error: any) {
    console.error('SendGrid connection test failed:', error)
    throw createError({
      statusCode: error.status || 500,
      statusMessage: error.message || 'SendGrid connection failed'
    })
  }
})