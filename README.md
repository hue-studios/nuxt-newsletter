# Nuxt Newsletter Module

A flexible and lightweight newsletter module for Nuxt 3 with Directus 11 integration. Build beautiful newsletters with drag-and-drop functionality, customizable styling, and seamless authentication.

## Design Philosophy

This module follows a **"pay for what you use"** approach:

- **Minimal Core**: Only essential features in the base module
- **Optional Everything**: Rich text, drag-drop, and styling are all optional
- **Email-First**: Optimized for email client compatibility, not web complexity
- **Your Dependencies**: You control versions of major libraries

## Features

- 📧 **Directus 11 Integration** - Store and manage newsletters in your Directus instance
- 🎨 **Flexible Styling** - Choose between Tailwind CSS, unstyled, or custom styles
- 🔒 **Flexible Authentication** - Static tokens, middleware-based, or custom auth handlers
- 🖱️ **Optional Drag & Drop** - Support for multiple drag-and-drop libraries
- 📱 **Responsive Preview** - Real-time newsletter preview
- 🧩 **Modular Components** - Use only what you need
- 🌲 **Tree-shakeable** - Optimized bundle size
- 💪 **TypeScript Support** - Full type safety

## Quick Setup

1. Add `@your-org/nuxt-newsletter` dependency to your project:

```bash
# npm
npm install @your-org/nuxt-newsletter

# yarn
yarn add @your-org/nuxt-newsletter

# pnpm
pnpm add @your-org/nuxt-newsletter
```

2. Add module to your `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['@your-org/nuxt-newsletter'],
  
  newsletter: {
    directus: {
      url: 'https://your-directus-instance.com',
      auth: {
        type: 'static',
        token: process.env.DIRECTUS_TOKEN
      }
    }
  }
})
```

## Configuration

### Full Configuration Options

```ts
export default defineNuxtConfig({
  newsletter: {
    // Directus configuration (required)
    directus: {
      url: 'https://your-directus-instance.com',
      auth: {
        // Authentication type
        type: 'static' | 'middleware' | 'custom',
        
        // For static auth
        token: 'your-static-token',
        
        // For middleware auth
        middleware: 'auth', // Name of your auth middleware
        
        // For custom auth
        handler: async () => {
          // Return token
          return await getTokenSomehow()
        }
      }
    },
    
    // Component prefix (optional)
    prefix: 'Newsletter', // Default: 'Newsletter'
    
    // Feature flags (optional)
    features: {
      dragDrop: true,      // Enable drag and drop
      styling: 'tailwind', // 'tailwind' | 'unstyled' | 'custom'
      preview: true,       // Enable preview panel
      templates: true      // Enable newsletter templates
    },
    
    // Drag provider (optional)
    dragProvider: 'auto', // 'sortablejs' | 'draggable-plus' | 'custom' | 'auto'
    
    // Custom styles path (optional, only for styling: 'custom')
    customStyles: '~/assets/newsletter.css'
  }
})
```

## Usage

### Basic Newsletter Editor

```vue
<template>
  <div>
    <NewsletterEditor v-model="newsletter" />
    <button @click="save">Save Newsletter</button>
  </div>
</template>

<script setup>
const newsletter = ref({
  subject: '',
  blocks: []
})

const { createNewsletter } = useDirectusNewsletter()

const save = async () => {
  await createNewsletter(newsletter.value)
}
</script>
```

### With Authentication Middleware

```ts
// middleware/newsletter-auth.ts
export default defineNuxtRouteMiddleware(async (to, from) => {
  const { setAuthToken } = useDirectusNewsletter()
  
  // Get token from your auth system
  const token = await $fetch('/api/auth/directus-token')
  setAuthToken(token)
})
```

```vue
<template>
  <div>
    <NewsletterEditor v-model="newsletter" />
  </div>
</template>

<script setup>
definePageMeta({
  middleware: 'newsletter-auth'
})
</script>
```

### Custom Block Types

```vue
<script setup>
const { addBlock } = useNewsletterEditor()

// Add custom block type
addBlock('custom', {
  id: 'custom_1',
  type: 'custom',
  content: {
    // Your custom content
  }
})
</script>
```

## Bundle Size Impact

| Feature | Size | When to Use |
|---------|------|-------------|
| Core Module | ~50KB | Always included |
| Directus SDK | ~80KB | Required |
| Simple Text Editor | 0KB | Default, built-in |
| Tiptap Rich Text | ~200KB | Complex formatting needs |
| SortableJS | ~30KB | Lightweight drag-drop |
| Vue Draggable Plus | ~25KB | Vue 3 optimized drag-drop |
| GSAP Draggable | ~100KB+ | Advanced animations |

## Optional Features

### Rich Text Editing with Tiptap

By default, the module uses a simple markdown-based text editor. For rich text editing, you can enable Tiptap:

1. Install Tiptap dependencies:
```bash
npm install @tiptap/vue-3 @tiptap/starter-kit @tiptap/extension-link
```

2. Enable in configuration:
```ts
export default defineNuxtConfig({
  newsletter: {
    features: {
      richTextEditor: true
    }
  }
})
```

3. The text blocks will automatically upgrade to use Tiptap when available.

**Note:** Tiptap adds ~200KB to your bundle. Only enable if you need rich text editing.

### Simple vs Rich Text Comparison

| Feature | Simple Editor | Tiptap |
|---------|--------------|---------|
| Bundle Size | 0KB | ~200KB |
| Bold/Italic | ✅ Markdown | ✅ WYSIWYG |
| Links | ✅ Markdown | ✅ WYSIWYG |
| Headings | ❌ | ✅ |
| Lists | ❌ | ✅ |
| Tables | ❌ | ✅ (with extension) |
| Email Compatibility | Excellent | Good |
| Learning Curve | Minimal | Moderate |

## Styling Options

### 1. Tailwind CSS (Recommended)

Install Tailwind CSS:

```bash
npm install -D @nuxtjs/tailwindcss
```

Configure in `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/tailwindcss', '@your-org/nuxt-newsletter'],
  newsletter: {
    features: {
      styling: 'tailwind'
    }
  }
})
```

### 2. Unstyled (Default)

The module provides minimal base styles. Perfect for custom styling:

```ts
newsletter: {
  features: {
    styling: 'unstyled'
  }
}
```

### 3. Custom Styles

Provide your own stylesheet:

```ts
newsletter: {
  features: {
    styling: 'custom'
  },
  customStyles: '~/assets/css/newsletter.css'
}
```

## Drag and Drop Setup

### Option 1: SortableJS (Lightweight)

```bash
npm install sortablejs @types/sortablejs
```

### Option 2: Vue Draggable Plus (Vue 3 optimized)

```bash
npm install vue-draggable-plus
```

### Option 3: Custom Implementation

```ts
newsletter: {
  dragProvider: 'custom'
}
```

Then implement your own drag logic using the provided methods:

```ts
const { moveBlock } = useNewsletterEditor()
// Move block from index 0 to index 2
moveBlock(0, 2)
```

## Composables

### `useNewsletter()`

Access module configuration and features:

```ts
const { 
  config,           // Module configuration
  features,         // Enabled features
  isDragDropEnabled,// Check if drag-drop is enabled
  stylingMode      // Current styling mode
} = useNewsletter()
```

### `useNewsletterEditor()`

Manage newsletter content:

```ts
const {
  newsletter,      // Reactive newsletter data
  blocks,          // Newsletter blocks
  addBlock,        // Add new block
  removeBlock,     // Remove block by ID
  updateBlock,     // Update block content
  moveBlock,       // Move block position
  duplicateBlock,  // Duplicate existing block
  clearBlocks      // Clear all blocks
} = useNewsletterEditor()
```

### `useDirectusNewsletter()`

Interact with Directus:

```ts
const {
  setAuthToken,      // Set authentication token
  fetchNewsletters,  // Get newsletter list
  fetchNewsletter,   // Get single newsletter
  createNewsletter,  // Create new newsletter
  updateNewsletter,  // Update existing newsletter
  deleteNewsletter,  // Delete newsletter
  sendTestEmail      // Send test email
} = useDirectusNewsletter()
```

## Directus Schema

Create these collections in your Directus instance:

### `newsletters` Collection

```json
{
  "collection": "newsletters",
  "fields": [
    {
      "field": "id",
      "type": "uuid",
      "meta": {
        "hidden": true,
        "readonly": true,
        "interface": "input",
        "special": ["uuid"]
      }
    },
    {
      "field": "subject",
      "type": "string",
      "meta": {
        "interface": "input",
        "required": true
      }
    },
    {
      "field": "preheader",
      "type": "string",
      "meta": {
        "interface": "input"
      }
    },
    {
      "field": "blocks",
      "type": "json",
      "meta": {
        "interface": "code",
        "options": {
          "language": "json"
        }
      }
    },
    {
      "field": "settings",
      "type": "json",
      "meta": {
        "interface": "code",
        "options": {
          "language": "json"
        }
      }
    },
    {
      "field": "status",
      "type": "string",
      "meta": {
        "interface": "select-dropdown",
        "options": {
          "choices": [
            { "text": "Draft", "value": "draft" },
            { "text": "Scheduled", "value": "scheduled" },
            { "text": "Sent", "value": "sent" }
          ]
        },
        "default_value": "draft"
      }
    }
  ]
}
```

## Development

```bash
# Install dependencies
npm install

# Generate type stubs
npm run dev:prepare

# Develop with the playground
npm run dev

# Build the playground
npm run dev:build

# Run ESLint
npm run lint

# Run Vitest
npm run test
npm run test:watch

# Release new version
npm run release
```

## License

MIT License

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.