// test/sendgrid.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the runtime config at the module level
const mockRuntimeConfig = vi.fn()

vi.mock('#app', () => ({
  useRuntimeConfig: mockRuntimeConfig,
  useState: vi.fn((key: string, init?: () => any) => {
    const state = init ? init() : null
    return [state, vi.fn()]
  }),
  useNuxtApp: () => ({
    $newsletter: {
      config: {},
      initialized: true,
      version: '1.0.0'
    }
  })
}))

const mockFetch = vi.fn()
vi.mock('ofetch', () => ({
  $fetch: mockFetch
}))

describe('useSendGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default runtime config with API key
    mockRuntimeConfig.mockReturnValue({
      public: {
        newsletter: {
          defaultFromEmail: 'test@example.com',
          defaultFromName: 'Test Newsletter'
        }
      },
      sendgridApiKey: 'test-api-key',
      sendgridWebhookSecret: 'test-secret',
      directusAdminToken: 'test-admin-token'
    })
    mockFetch.mockResolvedValue({})
  })

  it('should require API key for sending', async () => {
    // Override runtime config to not have API key
    mockRuntimeConfig.mockReturnValue({
      public: {
        newsletter: {
          defaultFromEmail: 'test@example.com',
          defaultFromName: 'Test Newsletter'
        }
      },
      sendgridApiKey: '', // No API key
      sendgridWebhookSecret: '',
      directusAdminToken: ''
    })

    const { useSendGrid } = await import('../src/runtime/composables/useSendGrid')
    const { sendNewsletter } = useSendGrid()
    
    await expect(
      sendNewsletter(
        { subject: 'Test', compiled_html: '<html>Test</html>' } as any,
        [{ email: 'test@example.com' }]
      )
    ).rejects.toThrow('SendGrid API key not configured')
  })

  it('should require compiled HTML', async () => {
    const { useSendGrid } = await import('../src/runtime/composables/useSendGrid')
    const { sendNewsletter } = useSendGrid()
    
    await expect(
      sendNewsletter(
        { subject: 'Test' } as any,
        [{ email: 'test@example.com' }]
      )
    ).rejects.toThrow('Newsletter must be compiled before sending')
  })

  it('should send newsletter with valid data', async () => {
    mockFetch.mockResolvedValue({
      headers: { 'x-message-id': 'test-message-id' }
    })

    const { useSendGrid } = await import('../src/runtime/composables/useSendGrid')
    const { sendNewsletter } = useSendGrid()
    
    const result = await sendNewsletter(
      { 
        subject: 'Test Newsletter', 
        compiled_html: '<html><body>Test</body></html>',
        id: 'test-123'
      } as any,
      [{ email: 'test@example.com', name: 'Test User' }]
    )

    expect(result.success).toBe(true)
    expect(mockFetch).toHaveBeenCalledWith('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-api-key',
        'Content-Type': 'application/json'
      },
      body: expect.objectContaining({
        personalizations: expect.arrayContaining([
          expect.objectContaining({
            to: [{ email: 'test@example.com', name: 'Test User' }]
          })
        ]),
        subject: 'Test Newsletter'
      })
    })
  })

  it('should create batch when API key is available', async () => {
    mockFetch.mockResolvedValue({ batch_id: 'test-batch-123' })

    const { useSendGrid } = await import('../src/runtime/composables/useSendGrid')
    const { createBatch } = useSendGrid()
    
    const batchId = await createBatch()
    expect(batchId).toBe('test-batch-123')
    expect(mockFetch).toHaveBeenCalledWith('https://api.sendgrid.com/v3/mail/batch', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-api-key',
        'Content-Type': 'application/json'
      }
    })
  })

  it('should create batch without API key and fail', async () => {
    // Override runtime config to not have API key
    mockRuntimeConfig.mockReturnValue({
      public: {
        newsletter: {
          defaultFromEmail: 'test@example.com',
          defaultFromName: 'Test Newsletter'
        }
      },
      sendgridApiKey: '', // No API key
      sendgridWebhookSecret: '',
      directusAdminToken: ''
    })

    const { useSendGrid } = await import('../src/runtime/composables/useSendGrid')
    const { createBatch } = useSendGrid()
    
    await expect(createBatch()).rejects.toThrow('SendGrid API key not configured')
  })

  it('should get suppressions when API key is available', async () => {
    const mockSuppressions = [
      { email: 'bounced@example.com', reason: 'bounce' }
    ]
    mockFetch.mockResolvedValue(mockSuppressions)

    const { useSendGrid } = await import('../src/runtime/composables/useSendGrid')
    const { getSuppressions } = useSendGrid()
    
    const result = await getSuppressions('bounces')
    expect(result).toEqual(mockSuppressions)
    expect(mockFetch).toHaveBeenCalledWith('https://api.sendgrid.com/v3/suppression/bounces', {
      headers: {
        'Authorization': 'Bearer test-api-key'
      }
    })
  })

  it('should fail to get suppressions without API key', async () => {
    // Override runtime config to not have API key
    mockRuntimeConfig.mockReturnValue({
      public: {
        newsletter: {
          defaultFromEmail: 'test@example.com',
          defaultFromName: 'Test Newsletter'
        }
      },
      sendgridApiKey: '', // No API key
      sendgridWebhookSecret: '',
      directusAdminToken: ''
    })

    const { useSendGrid } = await import('../src/runtime/composables/useSendGrid')
    const { getSuppressions } = useSendGrid()
    
    await expect(getSuppressions('bounces')).rejects.toThrow('SendGrid API key not configured')
  })

  it('should send test email with disabled tracking', async () => {
    mockFetch.mockResolvedValue({})

    const { useSendGrid } = await import('../src/runtime/composables/useSendGrid')
    const { sendTestEmail } = useSendGrid()
    
    await sendTestEmail(
      { 
        subject: 'Test Email', 
        compiled_html: '<html>Test</html>' 
      } as any,
      'test@example.com'
    )

    expect(mockFetch).toHaveBeenCalledWith('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-api-key',
        'Content-Type': 'application/json'
      },
      body: expect.objectContaining({
        categories: ['test', 'newsletter-test'],
        tracking_settings: {
          click_tracking: { enable: false, enable_text: false },
          open_tracking: { enable: false, substitution_tag: '%open_tracking_pixel%' },
          subscription_tracking: { enable: false }
        }
      })
    })
  })
})