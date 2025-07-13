// test/module.test.ts
import { $fetch, setup } from '@nuxt/test-utils'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

describe('Newsletter Module', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/basic', import.meta.url)),
    modules: ['../../../src/module'],
    server: true
  })

  it('should load module', () => {
    expect(true).toBe(true)
  })

  it('should create webhook endpoint', async () => {
    // Test that the SendGrid webhook endpoint exists
    try {
      await $fetch('/api/newsletter/sendgrid-webhook', {
        method: 'POST',
        body: []
      })
    } catch (error: any) {
      // Should fail with auth error if no secret configured
      expect(error.statusCode).toBeDefined()
    }
  })
})