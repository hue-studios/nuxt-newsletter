// server/api/newsletter/send-test.post.ts
import { $fetch } from 'ofetch'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  
  const { email } = body
  
  if (!config.sendgridApiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'SendGrid API key not configured'
    })
  }

  if (!email) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email address is required'
    })
  }

  const testMessage = {
    personalizations: [{
      to: [{ email }]
    }],
    from: {
      email: config.public.newsletter?.defaultFromEmail || 'newsletter@example.com',
      name: config.public.newsletter?.defaultFromName || 'Newsletter Test'
    },
    subject: 'Newsletter Test Email',
    content: [{
      type: 'text/html',
      value: `
        <h1>Newsletter Module Test</h1>
        <p>This is a test email from your newsletter module.</p>
        <p>If you received this email, your SendGrid integration is working correctly!</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
      `
    }]
  }

  try {
    const response = await $fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.sendgridApiKey}`,
        'Content-Type': 'application/json'
      },
      body: testMessage
    })

    return {
      success: true,
      message: `Test email sent to ${email}`,
      messageId: (response as any).headers?.['x-message-id']
    }
  } catch (error: any) {
    console.error('Test email send error:', error)
    throw createError({
      statusCode: error.status || 500,
      statusMessage: error.message || 'Failed to send test email'
    })
  }
})