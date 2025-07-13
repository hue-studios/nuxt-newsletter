// test/sendgrid.test.ts
import { describe, expect, it, vi } from 'vitest'
import { useSendGrid } from '../src/runtime/composables/useSendGrid'

// Mock $fetch
vi.mock('ofetch', () => ({
  $fetch: vi.fn().mockResolvedValue({ success: true })
}))

describe('useSendGrid', () => {
  it('should require API key for sending', async () => {
    // Mock config without API key
    vi.mock('#app', () => ({
      useRuntimeConfig: () => ({
        sendgridApiKey: '',
        public: {
          newsletter: {}
        }
      })
    }), { virtual: true })

    const { sendNewsletter } = useSendGrid()
    
    await expect(
      sendNewsletter(
        { subject: 'Test', compiled_html: '<html></html>' },
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
    
    // This should not throw
    await expect(
      sendTestEmail(
        { subject: 'Test', compiled_html: '<html>Test</html>' },
        'test@example.com'
      )
    ).resolves.toMatchObject({ success: true })
  })
})