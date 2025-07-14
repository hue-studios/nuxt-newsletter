# @hue-studios/nuxt-newsletter

A modern, feature-rich newsletter module for Nuxt 3 with Directus CMS integration, SendGrid email delivery, drag-and-drop editing, and Tailwind CSS 4 support.

## ✨ Features

- 🎨 **Modern Drag-Drop Editor** - Intuitive block-based newsletter creation
- 📱 **Responsive Preview** - Real-time preview with device frames
- 🎯 **MJML-based** - Industry-standard responsive email framework
- 🗄️ **Directus CMS** - Complete newsletter management system
- 📧 **SendGrid Integration** - Professional email delivery with analytics
- 🎨 **Tailwind CSS 4** - Modern styling with automatic setup
- 🔄 **Flexible Auth** - Static tokens or middleware-based authentication
- 🌙 **Dark Mode** - Built-in dark mode support
- 🚀 **Performance** - Server-side MJML compilation option
- 🧩 **Extensible** - Easy to add custom block types
- 🎯 **User-Friendly** - Designed for the best possible user experience

## 📦 Installation

```bash
npm install @hue-studios/nuxt-newsletter

# Optional: Install MJML for server-side compilation (recommended)
npm install mjml
```

## 🚀 Quick Start

### 1. Configure the Module

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@hue-studios/nuxt-newsletter'],
  
  newsletter: {
    // Directus configuration (required)
    directus: {
      url: process.env.DIRECTUS_URL!,
      auth: {
        type: 'static', // or 'middleware'
        token: process.env.DIRECTUS_TOKEN // for static auth
      }
    },
    
    // SendGrid configuration (optional but recommended)
    sendgrid: {
      apiKey: process.env.SENDGRID_API_KEY,
      webhookSecret: process.env.SENDGRID_WEBHOOK_SECRET,
      defaultFromEmail: 'newsletter@example.com',
      defaultFromName: 'Your Company Newsletter'
    },
    
    // MJML compilation mode
    mjmlMode: 'server', // 'server' or 'client'
    
    // Component prefix
    prefix: 'Newsletter', // Creates <NewsletterEditor>, etc.
    
    // Modern UI configuration
    ui: {
      icons: 'lucide', // 'lucide', 'heroicons', or 'tabler'
      enableDragDrop: true, // Enable drag and drop functionality
      autoInstallTailwind: true, // Auto-install Tailwind CSS 4
      theme: {
        primaryColor: 'blue', // Primary color for the interface
        darkMode: false // Enable dark mode support
      }
    },
    
    // Development mode
    dev: false // Enable enhanced error messages and helpers
  }
})
```

### 2. Set Up Environment Variables

```bash
# .env
DIRECTUS_URL=https://your-directus.com
DIRECTUS_TOKEN=your-static-token
SENDGRID_API_KEY=SG.your-api-key-here
SENDGRID_WEBHOOK_SECRET=your-webhook-secret

# Optional
DIRECTUS_ADMIN_TOKEN=admin-token
```

### 3. Run Setup Wizard (Recommended)

```bash
# Interactive setup wizard
npm run newsletter:setup-wizard

# Or manual setup
npm run newsletter:setup [directus-url] [email] [password]
npm run newsletter:advanced-blocks [directus-url] [email] [password]
```

### 4. Use in Your Pages

```vue
<template>
  <div>
    <NewsletterEditor 
      v-model="newsletter" 
      :show-preview="true"
    />
    <button @click="save">Save</button>
    <button @click="send">Send</button>
  </div>
</template>

<script setup>
const newsletter = ref({
  subject: 'Your Newsletter Subject',
  preheader: 'Preview text',
  blocks: []
})

const { createNewsletter } = useDirectusNewsletter()
const { sendNewsletter } = useSendGrid()

const save = async () => {
  await createNewsletter(newsletter.value)
}

const send = async () => {
  const recipients = [
    { email: 'subscriber@example.com', name: 'Subscriber' }
  ]
  await sendNewsletter(newsletter.value, recipients)
}
</script>
```

## 🔧 Configuration Options

### Core Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `directus.url` | `string` | **required** | Your Directus instance URL |
| `directus.auth.type` | `'static' \| 'middleware'` | `'static'` | Authentication method |
| `directus.auth.token` | `string` | - | Static auth token (when type is 'static') |
| `directus.auth.middleware` | `string` | `'auth'` | Middleware name (when type is 'middleware') |
| `sendgrid.apiKey` | `string` | - | SendGrid API key for email delivery |
| `sendgrid.webhookSecret` | `string` | - | Webhook verification secret |
| `sendgrid.defaultFromEmail` | `string` | `'newsletter@example.com'` | Default sender email |
| `sendgrid.defaultFromName` | `string` | `'Newsletter'` | Default sender name |
| `mjmlMode` | `'client' \| 'server'` | `'client'` | MJML compilation mode |
| `prefix` | `string` | `'Newsletter'` | Component prefix |
| `dev` | `boolean` | `false` | Enable development helpers |

### UI Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `ui.icons` | `'lucide' \| 'heroicons' \| 'tabler'` | `'lucide'` | Icon library to use |
| `ui.enableDragDrop` | `boolean` | `true` | Enable drag and drop functionality |
| `ui.autoInstallTailwind` | `boolean` | `true` | Auto-install TailwindCSS 4 if not present |
| `ui.theme.primaryColor` | `string` | `'blue'` | Primary color for the interface |
| `ui.theme.darkMode` | `boolean` | `false` | Enable dark mode support |

## 🎨 UI Customization

### Icon Libraries

Choose your preferred icon library:

```typescript
newsletter: {
  ui: {
    icons: 'heroicons' // Options: 'lucide', 'heroicons', 'tabler'
  }
}
```

### Dark Mode

Enable dark mode support:

```typescript
newsletter: {
  ui: {
    theme: {
      darkMode: true // Automatically installs @nuxtjs/color-mode
    }
  }
}
```

### Tailwind CSS 4

The module automatically sets up Tailwind CSS 4 by default. To disable:

```typescript
newsletter: {
  ui: {
    autoInstallTailwind: false // Manage Tailwind CSS manually
  }
}
```

### Custom Theme Colors

```typescript
newsletter: {
  ui: {
    theme: {
      primaryColor: 'indigo' // Any Tailwind color
    }
  }
}
```

## 🔐 Authentication Options

### Static Token (Simple)

Best for internal tools or trusted environments:

```typescript
newsletter: {
  directus: {
    auth: {
      type: 'static',
      token: process.env.DIRECTUS_TOKEN
    }
  }
}
```

### Middleware-based (Secure)

For public-facing apps with user authentication:

```typescript
// nuxt.config.ts
newsletter: {
  directus: {
    auth: {
      type: 'middleware',
      middleware: 'auth' // Your middleware name
    }
  }
}

// middleware/auth.ts
export default defineNuxtRouteMiddleware(async () => {
  const { setAuthToken } = useDirectusNewsletter()
  const token = await getAuthToken() // Your auth logic
  
  if (token) {
    setAuthToken(token)
  } else {
    return navigateTo('/login')
  }
})
```

## 🧩 Available Composables

### `useNewsletter()`
Access module configuration and state:
```typescript
const { 
  isInitialized,    // Module initialization status
  config,           // Full module configuration
  directusUrl,      // Directus URL
  authType,         // Authentication type
  mjmlMode,         // MJML compilation mode
  defaultFromEmail, // Default sender email
  defaultFromName   // Default sender name
} = useNewsletter()
```

### `useNewsletterEditor()`
Newsletter editor state management:
```typescript
const { 
  newsletter,       // Reactive newsletter data
  blocks,          // Newsletter blocks array
  addBlock,        // Add new block
  removeBlock,     // Remove block by ID
  updateBlock,     // Update block content
  moveBlock,       // Move block position
  duplicateBlock,  // Duplicate a block
  loadFromTemplate // Load from template
} = useNewsletterEditor(initialData)
```

### `useDirectusNewsletter()`
Directus operations:
```typescript
const { 
  setAuthToken,              // Set auth token (middleware mode)
  fetchNewsletters,          // Get newsletters list
  fetchNewsletter,           // Get single newsletter
  createNewsletter,          // Create new newsletter
  updateNewsletter,          // Update existing newsletter
  deleteNewsletter,          // Delete newsletter
  fetchBlockTypes,           // Get available block types
  fetchTemplates,            // Get newsletter templates
  fetchSubscribers,          // Get subscribers
  fetchMailingLists,         // Get mailing lists
  fetchMailingListSubscribers // Get list subscribers
} = useDirectusNewsletter()
```

### `useSendGrid()`
Email operations:
```typescript
const { 
  sendNewsletter,          // Send newsletter to recipients
  sendTestEmail,           // Send test email
  createBatch,             // Create batch for large sends
  getBatchStatus,          // Check batch status
  cancelScheduledSend,     // Cancel scheduled send
  getSuppressions,         // Get suppression lists
  addToSuppressionList,    // Add to suppression
  removeFromSuppressionList // Remove from suppression
} = useSendGrid()
```

### `useMjmlCompiler()`
MJML compilation utilities:
```typescript
const { 
  isCompiling,            // Compilation status
  compilationError,       // Compilation errors
  compileHandlebars,      // Compile Handlebars template
  compileBlockToMjml,     // Compile single block
  compileNewsletterToMjml,// Compile full newsletter
  compileMjmlToHtml,      // Convert MJML to HTML
  loadBlockTypes          // Load block types from Directus
} = useMjmlCompiler()
```

### `useNewsletterErrors()`
User-friendly error handling:
```typescript
const { 
  currentError,          // Current error state
  errorHistory,          // Error history
  handleError,           // Handle error with context
  clearError,            // Clear current error
  parseError,            // Parse error to user-friendly message
  isCritical,            // Check if error is critical
  getSetupSuggestions    // Get setup suggestions for error
} = useNewsletterErrors()
```

### `useDragAndDrop()` (when enabled)
Drag and drop functionality:
```typescript
const { 
  draggedIndex,         // Currently dragged item index
  dragOverIndex,        // Current drop target index
  isDragging,           // Dragging state
  getDragAttributes,    // Get drag HTML attributes
  getDragClasses,       // Get drag CSS classes
  animateMove           // Animate element after drop
} = useDragAndDrop({
  onMove: (from, to) => moveBlock(from, to),
  disabled: false
})
```

## 📚 Components

### `<NewsletterEditor>`
Main editor component with drag-drop support:
```vue
<NewsletterEditor 
  v-model="newsletter"
  :show-preview="true"
  @update:compiled="handleCompiled"
/>
```

### `<NewsletterPreview>`
Live preview with device frames:
```vue
<NewsletterPreview 
  :newsletter="newsletter"
  :block-types="blockTypes"
/>
```

### `<NewsletterBlock>`
Individual block editor:
```vue
<NewsletterBlock 
  :block="block"
  :block-type="blockType"
  @update="updateBlock"
/>
```

## 🛠️ Development Mode

Enable development mode for enhanced debugging:

```typescript
newsletter: {
  dev: true // or use nuxt.options.dev
}
```

This enables:
- Enhanced error messages with solutions
- Detailed setup instructions in console
- Development middleware for route debugging
- Verbose logging for troubleshooting

## 🚨 Error Handling

The module includes user-friendly error handling:

```vue
<script setup>
const { handleError, currentError, getSetupSuggestions } = useNewsletterErrors()

try {
  await someNewsletterOperation()
} catch (error) {
  const friendlyError = handleError(error, 'Creating newsletter')
  
  // friendlyError includes:
  // - message: User-friendly error message
  // - solution: How to fix the issue
  // - severity: 'error' | 'warning' | 'info'
  // - docs: Link to relevant documentation
}
</script>

<template>
  <div v-if="currentError" class="error-alert">
    <h3>{{ currentError.message }}</h3>
    <p>{{ currentError.solution }}</p>
    <ul v-if="getSetupSuggestions(currentError).length">
      <li v-for="suggestion in getSetupSuggestions(currentError)">
        {{ suggestion }}
      </li>
    </ul>
  </div>
</template>
```

## 📋 Directus Collections

The module creates these collections:

1. **newsletter_templates** - Reusable templates
2. **block_types** - MJML block definitions
3. **newsletters** - Main newsletter content
4. **newsletter_blocks** - Newsletter content blocks
5. **subscribers** - Email subscribers
6. **mailing_lists** - Subscriber lists
7. **newsletter_sends** - Send history
8. **newsletter_analytics** - Event tracking

All collections are organized in a "Newsletter System" folder in Directus.

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Verify setup
npm run newsletter:verify
```

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🆘 Support

- 📚 [Documentation](https://github.com/hue-studios/nuxt-newsletter)
- 🐛 [Issue Tracker](https://github.com/hue-studios/nuxt-newsletter/issues)
- 💬 [Discussions](https://github.com/hue-studios/nuxt-newsletter/discussions)

---

Made with ❤️ by [Hue Studios](https://huestudios.com)