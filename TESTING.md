# Testing Guide

## Overview

This module includes comprehensive tests for all major functionality:
- Newsletter editor operations
- MJML compilation
- Directus integration
- SendGrid integration
- Module setup and configuration

## Running Tests

### Quick Start
```bash
# Run all tests with automatic setup
npm run test:ci

# Or manually:
npm install
npm run dev:prepare
npm test
```

### Development Mode
```bash
# Watch mode for TDD
npm run test:watch

# Run with coverage
npm run test:coverage
```

### Specific Test Files
```bash
# Run a specific test file
npx vitest run test/mjml-compiler.test.ts

# Run tests matching a pattern
npx vitest run -t "newsletter editor"
```

## Test Structure

```
test/
├── setup.ts                 # Global test setup and mocks
├── mjml-compiler.test.ts    # Newsletter editor & MJML tests
├── directus.test.ts         # Directus integration tests
├── sendgrid.test.ts         # SendGrid integration tests
├── newsletter.test.ts       # Main composable tests
├── module.test.ts          # Module setup tests
└── fixtures/               # Test fixtures
    └── basic/              # Basic Nuxt app for testing
```

## Writing Tests

### Testing Composables
```typescript
import { describe, it, expect } from 'vitest'
import { useYourComposable } from '../src/runtime/composables/useYourComposable'

describe('useYourComposable', () => {
  it('should do something', () => {
    const { someMethod } = useYourComposable()
    const result = someMethod('input')
    expect(result).toBe('expected output')
  })
})
```

### Testing with Mocked Dependencies
```typescript
import { vi } from 'vitest'

// Mock external dependencies
vi.mock('@directus/sdk', () => ({
  createDirectus: vi.fn(() => ({
    with: vi.fn().mockReturnThis(),
    request: vi.fn().mockResolvedValue({ data: 'mocked' })
  }))
}))
```

### Testing Components
```typescript
import { mount } from '@vue/test-utils'
import NewsletterBlock from '../src/runtime/components/NewsletterBlock.vue'

describe('NewsletterBlock', () => {
  it('renders correctly', () => {
    const wrapper = mount(NewsletterBlock, {
      props: {
        block: { id: '1', type: 'text', content: {} }
      }
    })
    expect(wrapper.exists()).toBe(true)
  })
})
```

## Mocking Strategy

### Nuxt Runtime
All Nuxt-specific imports (`#app`, `#imports`) are mocked in `test/setup.ts`:
- `useRuntimeConfig`
- `useState`
- `useNuxtApp`
- Server utilities

### External Dependencies
- **Directus SDK**: Mocked to avoid API calls
- **SendGrid**: Mocked using `ofetch` mock
- **MJML**: Tested with actual implementation

## Common Issues

### Import Errors
If you see import errors for `#app` or `#imports`:
1. Ensure `test/setup.ts` is loaded (check `vitest.config.ts`)
2. Run `npm run dev:prepare` to rebuild

### Type Errors
```bash
# Check types without running tests
npm run test:types
```

### Module Not Found
```bash
# Clean and rebuild
rm -rf node_modules/.cache dist
npm run dev:prepare
```

## CI/CD

Tests run automatically on:
- Push to `main` branch
- Pull requests
- Node.js versions: 18.x, 20.x

See `.github/workflows/ci.yml` for details.

## Coverage

Generate coverage report:
```bash
npm run test:coverage
```

Coverage reports are generated in `coverage/` directory.

## Debugging Tests

### VS Code
Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Tests",
  "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
  "args": ["run", "${file}"],
  "console": "integratedTerminal"
}
```

### Console Debugging
```typescript
it('should debug', () => {
  console.log('Debug info:', someValue)
  debugger // Breakpoint when running with --inspect
})
```

Run with debugging:
```bash
node --inspect-brk ./node_modules/.bin/vitest run
```