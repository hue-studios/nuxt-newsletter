# Changelog

## v1.0.0 (2024-01-XX)

### 🎉 Initial Release

**Focus**: MJML-based newsletter creation with Directus CMS and SendGrid integration.

### ✨ Features

- **MJML Email Templates** - Industry-standard responsive email design
- **Directus CMS Integration** - Complete newsletter management system
- **SendGrid API** - Email delivery and webhook-based analytics
- **Visual Block Editor** - Dynamic field generation from block types
- **Real-time Preview** - MJML compilation with device preview
- **Subscriber Management** - Built-in tracking and engagement scoring
- **Flexible Authentication** - Static tokens or middleware-based auth

### 📦 Components

- `NewsletterEditor` - Main MJML editor with block management
- `NewsletterBlock` - Dynamic block editor based on field configuration
- `NewsletterPreview` - Real-time MJML preview with compilation

### 🔧 Composables

- `useNewsletterEditor()` - Newsletter state management
- `useDirectusNewsletter()` - Directus operations
- `useSendGrid()` - SendGrid email operations
- `useMjmlCompiler()` - MJML compilation utilities
- `useNewsletter()` - Module configuration access

### 🛠️ Setup Scripts

- `install-directus-collections.js` - Creates required Directus collections
- `create-advanced-blocks.js` - Installs additional block types
- `verify-setup.js` - Validates module configuration

### 📝 Requirements

- Nuxt 3.0+
- Node.js 18+
- Directus 11+
- SendGrid account with API key

### 🚀 Quick Start

```bash
npm install @hue-studios/nuxt-newsletter
```

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@hue-studios/nuxt-newsletter'],
  newsletter: {
    directus: {
      url: process.env.DIRECTUS_URL,
      auth: { type: 'static', token: process.env.DIRECTUS_TOKEN }
    },
    sendgrid: {
      apiKey: process.env.SENDGRID_API_KEY
    }
  }
})
```

---

Built with ❤️ by Hue