// test/sendgrid.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSendGrid } from '../src/runtime/composables/useSendGrid'

// Set up mocks properly
beforeEach(() => {
  vi.clearAllMocks()
})

describe('useSendGrid', () => {
  it('should require API key for sending', async () => {
    // Override config for this specific test
    vi.doMock('#app', () => ({
      useRuntimeConfig: () => ({
        sendgridApiKey: '', // No API key
        public: { newsletter: {} }
      })
    }))
    
    const { sendNewsletter } = useSendGrid()
    
    await expect(
      sendNewsletter(
        {
          subject: 'Test', compiled_html: '<html></html>',
          blocks: []
        },
        [{ email: 'test@example.com' }]
      )
    ).rejects.toThrow('SendGrid API key not configured')
  })

  it('should require compiled HTML', async () => {
    const { sendNewsletter } = useSendGrid()
    
    await expect(
      sendNewsletter(
        { subject: 'Test' } as any,
        [{ email: 'test@example.com' }]
      )
    ).rejects.toThrow('Newsletter must be compiled before sending')
  })

  it('should format recipients correctly', async () => {
    const { sendTestEmail } = useSendGrid()
    
    // Mock successful response
    const mockFetch = vi.fn().mockResolvedValue({ success: true })
    vi.doMock('ofetch', () => ({ $fetch: mockFetch }))
    
    const result = await sendTestEmail(
      {
        subject: 'Test', compiled_html: '<html>Test</html>',
        blocks: []
      },
      'test@example.com'
    )
    
    expect(result).toMatchObject({ success: true })
  })
})