// test/sendgrid.test.ts
import { useRuntimeConfig } from '#app'
import { describe, expect, it, vi } from 'vitest'
import { useSendGrid } from '../src/runtime/composables/useSendGrid'

// Mock the config for specific tests
const mockRuntimeConfig = (config: any) => {
  vi.mocked(useRuntimeConfig).mockReturnValue(config)
}

describe('useSendGrid', () => {
  it('should require API key for sending', async () => {
    // Save original implementation
    const originalUseRuntimeConfig = vi.fn(() => ({
      sendgridApiKey: '',
      public: { newsletter: {} }
    }))
    
    // Mock just for this test
    vi.mock('#app', () => ({
      useRuntimeConfig: originalUseRuntimeConfig
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
    
    const result = await sendTestEmail(
      { subject: 'Test', compiled_html: '<html>Test</html>' },
      'test@example.com'
    )
    
    expect(result).toMatchObject({ success: true })
  })
})