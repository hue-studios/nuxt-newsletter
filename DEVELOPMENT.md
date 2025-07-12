# Development Setup

## Quick Start

1. **Install dependencies**
```bash
npm install
```

2. **Set up environment variables**
```bash
# Copy the example env file
cp playground/.env.example playground/.env

# Edit playground/.env with your Directus credentials
```

3. **Build and prepare the module**
```bash
# This builds the module stub and prepares types
npm run dev:prepare
```

4. **Start development server**
```bash
npm run dev
```

The playground will be available at http://localhost:3000

## Troubleshooting

### Import errors

If you see errors about imports not being found:

1. Clean the build:
```bash
rm -rf node_modules/.cache
rm -rf dist
rm -rf playground/.nuxt
rm -rf playground/dist
```

2. Reinstall and rebuild:
```bash
npm install
npm run dev:prepare
npm run dev
```

### TypeScript errors

If TypeScript complains about module options:

1. Make sure you've run `npm run dev:prepare`
2. Restart your IDE/TypeScript service
3. Check that the playground tsconfig extends `./.nuxt/tsconfig.json`

### Composables not auto-importing

The module automatically imports all composables. You should NOT need to import them manually:

```vue
<script setup>
// ❌ Don't do this
import { useDirectusNewsletter } from '#newsletter/composables/useDirectusNewsletter'

// ✅ Just use them directly
const { fetchNewsletters } = useDirectusNewsletter()
</script>
```

### Module not loading

Check that your playground `nuxt.config.ts` includes the module:

```typescript
export default defineNuxtConfig({
  modules: ['../src/module'], // Points to local module
  newsletter: {
    // Your config
  }
})
```

## Testing with Directus

1. Make sure you have a Directus instance running
2. Run the setup scripts to create collections:

```bash
# Basic collections
node scripts/install-directus-collections.js https://your-directus.com admin@example.com password

# Advanced block types (optional)
node scripts/create-advanced-blocks.js https://your-directus.com admin@example.com password
```

## Module Development

### File Structure

- `src/module.ts` - Main module entry point
- `src/runtime/` - Runtime code (composables, components, plugins)
- `playground/` - Development playground app
- `scripts/` - Setup and utility scripts

### Making Changes

1. Edit files in `src/`
2. The dev server will auto-reload
3. For type changes, you may need to run `npm run dev:prepare` again

### Testing Production Build

```bash
# Build the playground app
npm run dev:build

# Preview the production build
npm run preview
```