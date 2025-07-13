import { resolve } from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts']
  },
  resolve: {
    alias: {
      '#app': resolve(__dirname, './test/setup.ts'),
      '#imports': resolve(__dirname, './test/setup.ts'),
      '#newsletter': resolve(__dirname, './src/runtime'),
      '~': resolve(__dirname, './src'),
      '@': resolve(__dirname, './src')
    }
  }
})