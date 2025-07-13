export default defineNuxtConfig({
  modules: ['../../../src/module'],
  newsletter: {
    directus: {
      url: 'http://test.directus.com',
      auth: {
        type: 'static',
        token: 'test-token'
      }
    },
    sendgrid: {
      apiKey: 'test-api-key',
      defaultFromEmail: 'test@example.com',
      defaultFromName: 'Test Newsletter'
    }
  }
})