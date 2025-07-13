// test/newsletter.test.ts
import { describe, expect, it } from 'vitest'
import { useNewsletter } from '../src/runtime/composables/useNewsletter'

describe('useNewsletter', () => {
  it('should return module configuration', () => {
    const {
      isInitialized,
      config,
      directusUrl,
      authType,
      mjmlMode,
      defaultFromEmail,
      defaultFromName
    } = useNewsletter()

    expect(isInitialized.value).toBe(true)
    expect(config).toBeDefined()
    expect(directusUrl.value).toBe('http://test.directus.com')
    expect(authType.value).toBe('static')
    expect(mjmlMode.value).toBe('client')
    expect(defaultFromEmail.value).toBe('test@example.com')
    expect(defaultFromName.value).toBe('Test Newsletter')
  })

  it('should handle missing config gracefully', () => {
    const { authType, mjmlMode } = useNewsletter()
    
    // Should return defaults
    expect(authType.value).toBe('static')
    expect(mjmlMode.value).toBe('client')
  })
})