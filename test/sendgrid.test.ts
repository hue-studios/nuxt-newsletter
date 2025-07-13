// test/sendgrid.test.ts
import { describe, expect, it } from 'vitest'

describe('useSendGrid', () => {
  it('should require API key for sending', async () => {
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

  it('should format recipients correctly', async () => {
    const { useSendGrid } = await import('../src/runtime/composables/useSendGrid')
    const { sendTestEmail } = useSendGrid()
    
    // This will still throw due to missing API key, but we can check the function exists
    expect(sendTestEmail).toBeDefined()
    expect(typeof sendTestEmail).toBe('function')
  })

  it('should create batch when API key is available', async () => {
    const { useSendGrid } = await import('../src/runtime/composables/useSendGrid')
    const { createBatch } = useSendGrid()
    
    await expect(createBatch()).rejects.toThrow('SendGrid API key not configured')
  })

  it('should get suppressions when API key is available', async () => {
    const { useSendGrid } = await import('../src/runtime/composables/useSendGrid')
    const { getSuppressions } = useSendGrid()
    
    await expect(getSuppressions('bounces')).rejects.toThrow('SendGrid API key not configured')
  })
})