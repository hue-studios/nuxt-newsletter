// test/setup.ts
import { vi } from 'vitest'

// Mock all Nuxt-specific imports
vi.mock('#app', () => ({
  useRuntimeConfig: () => ({
    public: {
      newsletter: {
        directus: {
          url: 'http://test.directus.com',
          auth: { type: 'static', token: 'test-token' }
        },
        sendgrid: {
          defaultFromEmail: 'test@example.com',
          defaultFromName: 'Test Newsletter'
        },
        mjmlMode: 'client'
      }
    },
    sendgridApiKey: 'test-api-key',
    sendgridWebhookSecret: 'test-secret',
    directusAdminToken: 'test-admin-token'
  }),
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
  }),
  createError: (error: any) => new Error(error.statusMessage || error.message),
  defineEventHandler: vi.fn(),
  getHeader: vi.fn(),
  readBody: vi.fn(),
  readRawBody: vi.fn()
}))

// Mock ofetch
vi.mock('ofetch', () => ({
  $fetch: vi.fn().mockResolvedValue({})
}))

// Mock H3
vi.mock('h3', () => ({
  defineEventHandler: vi.fn(),
  getHeader: vi.fn(),
  getCookie: vi.fn(),
  getSession: vi.fn(),
  readBody: vi.fn(),
  readRawBody: vi.fn(),
  createError: (error: any) => new Error(error.statusMessage || error.message)
}))

// Mock Directus SDK
vi.mock('@directus/sdk', () => ({
  createDirectus: vi.fn(() => ({
    with: vi.fn().mockReturnThis(),
    request: vi.fn()
  })),
  rest: vi.fn(),
  authentication: vi.fn(),
  staticToken: vi.fn(),
  createItem: vi.fn(),
  readItem: vi.fn(),
  readItems: vi.fn(),
  updateItem: vi.fn(),
  deleteItem: vi.fn(),
  createCollection: vi.fn(),
  createField: vi.fn(),
  createRelation: vi.fn(),
  readCollections: vi.fn()
}))

// Global test utilities
global.window = {
  mjml2html: undefined
} as any