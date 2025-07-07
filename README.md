# 📧 @your-org/nuxt-newsletter

[![npm version](https://badge.fury.io/js/%40your-org%2Fnuxt-newsletter.svg)](https://badge.fury.io/js/%40your-org%2Fnuxt-newsletter)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Nuxt](https://img.shields.io/badge/Nuxt-3-00DC82?logo=nuxt.js)](https://nuxt.com)

A comprehensive newsletter management system for Nuxt 3 with Directus 11 backend. Create beautiful email newsletters with drag-and-drop blocks, MJML compilation, and advanced analytics.

![Newsletter Editor Preview](https://your-cdn.com/newsletter-preview.gif)

## ✨ Features

### 🎨 **Editor Experience**
- **Drag-and-Drop Editor** - Intuitive block-based newsletter creation
- **Rich Text Editing** - Powered by Tiptap with formatting tools
- **Live Preview** - Real-time email preview with device switching
- **Template System** - Pre-built templates for faster creation
- **Content Library** - Reusable content blocks and snippets
- **Auto-save** - Never lose your work with automatic saving

### 📊 **Analytics & Performance**
- **Advanced Analytics** - Track opens, clicks, and engagement
- **A/B Testing** - Subject line and content optimization
- **Performance Metrics** - Detailed reporting and insights
- **Real-time Tracking** - Live engagement monitoring
- **Export Reports** - Download analytics data

### 👥 **Subscriber Management**
- **Smart Segmentation** - Rule-based audience targeting
- **Preference Management** - Subscriber preference centers
- **List Management** - Organize subscribers into targeted lists
- **Import/Export** - Bulk subscriber management
- **Engagement Scoring** - Track subscriber engagement levels

### 🚀 **Technical Features**
- **MJML Compilation** - Professional responsive email rendering
- **SendGrid Integration** - Reliable email delivery
- **Webhook Support** - Real-time event tracking
- **Image Optimization** - Automatic image processing
- **Accessibility** - WCAG compliant email creation
- **TypeScript** - Full type safety and IntelliSense

## 📋 Prerequisites

This module requires the following dependencies to be installed and configured in your Nuxt 3 project:

- **Nuxt 3.8+**
- **@nuxtjs/tailwindcss** - For styling
- **shadcn-nuxt** - For UI components
- **@nuxtjs/color-mode** - For theme support

## 🚀 Quick Start

### 1. Install Dependencies

First, install the required dependencies:

```bash
# Install the newsletter module
npm install @your-org/nuxt-newsletter

# Install required UI dependencies
npm install @nuxtjs/tailwindcss shadcn-nuxt @nuxtjs/color-mode

# Install Shadcn components
npx shadcn-vue@latest init
```

### 2. Configure Nuxt

Add the required modules to your `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/tailwindcss',
    'shadcn-nuxt',
    '@nuxtjs/color-mode',
    '@your-org/nuxt-newsletter'
  ],
  
  // Shadcn configuration
  shadcn: {
    /**
     * Prefix for all the imported component
     */
    prefix: '',
    /**
     * Directory that the component lives in.
     * @default "./components/ui"
     */
    componentDir: './components/ui'
  },
  
  // Color mode configuration
  colorMode: {
    classSuffix: ''
  },
  
  // Newsletter module configuration
  newsletter: {
    directusUrl: 'https://your-directus.com',
    sendgridApiKey: process.env.SENDGRID_API_KEY,
    defaultFromEmail: 'newsletter@yoursite.com',
    defaultFromName: 'Your Newsletter',
    enableAnalytics: true,
    enableWebhooks: true
  }
})
```

### 3. Install Required Shadcn Components

The newsletter module uses several Shadcn components. Install them with:

```bash
# Core components required by the module
npx shadcn-vue@latest add button
npx shadcn-vue@latest add input
npx shadcn-vue@latest add label
npx shadcn-vue@latest add textarea
npx shadcn-vue@latest add dialog
npx shadcn-vue@latest add badge
npx shadcn-vue@latest add card
npx shadcn-vue@latest add tabs
npx shadcn-vue@latest add dropdown-menu
npx shadcn-vue@latest add select
npx shadcn-vue@latest add switch
npx shadcn-vue@latest add slider
npx shadcn-vue@latest add toast
npx shadcn-vue@latest add alert
npx shadcn-vue@latest add separator
npx shadcn-vue@latest add progress
npx shadcn-vue@latest add sonner
```

Or install all at once:

```bash
npx shadcn-vue@latest add button input label textarea dialog badge card tabs dropdown-menu select switch slider toast alert separator progress sonner
```

### 4. Setup Sonner Toaster

Add the Toaster component to your `app.vue` or main layout:

```vue
<!-- app.vue -->
<template>
  <div>
    <NuxtPage />
    <!-- Add Toaster for notifications -->
    <Toaster />
  </div>
</template>

<script setup>
import { Toaster } from '@/components/ui/sonner'
</script>
```

### 5. Setup Directus Collections

Install the required collections in your Directus instance:

```bash
# Clone the repository (if needed)
git clone https://github.com/your-org/nuxt-newsletter.git
cd nuxt-newsletter

# Install dependencies
npm install

# Run the Directus setup script
node scripts/install-directus-collections.js https://your-directus.com admin@example.com your-password
```

### 5. Environment Variables

Create a `.env` file in your project root:

```env
# Required
DIRECTUS_URL=https://your-directus.com
SENDGRID_API_KEY=your-sendgrid-key

# Optional
NEWSLETTER_WEBHOOK_SECRET=your-webhook-secret
NEWSLETTER_DEFAULT_FROM_EMAIL=newsletter@yoursite.com
NEWSLETTER_DEFAULT_FROM_NAME=Your Newsletter
```

### 7. Start Development

```bash
npm run dev
```

Visit `/newsletters` to access the newsletter dashboard.

## 📦 What's Included

### Components
- `NewsletterDashboard` - Main dashboard with stats
- `NewsletterEditor` - Drag-and-drop newsletter editor
- `NewsletterBlock` - Individual newsletter blocks
- `BlockEditor` - Block property editor
- `TemplateBrowser` - Template selection interface
- `NewsletterAnalytics` - Performance analytics
- `NewsletterPreview` - Live preview component

### Composables
- `useNewsletter()` - Newsletter management
- `useNewsletterBlocks()` - Block operations
- `useNewsletterTemplates()` - Template management
- `useDirectus()` - Directus integration

### Pages
- `/newsletters` - Newsletter dashboard
- `/newsletters/[id]/edit` - Newsletter editor
- `/newsletters/[id]/analytics` - Analytics view

### API Endpoints
- `POST /api/newsletter/compile-mjml` - MJML compilation
- `POST /api/newsletter/send-test` - Send test emails
- `POST /api/newsletter/send` - Send newsletters
- `POST /api/newsletter/upload-image` - Image upload
- `GET /api/newsletter/analytics/[id]` - Analytics data
- `POST /api/newsletter/webhook/sendgrid` - SendGrid webhooks

## 🎯 Usage Examples

### Create a Newsletter

```vue
<template>
  <div>
    <NewsletterEditor 
      :newsletter="newsletter" 
      @update="handleUpdate"
      @back="navigateTo('/newsletters')"
    />
  </div>
</template>

<script setup>
const { currentNewsletter, createNewsletter } = useNewsletter()

// Create a new newsletter
const newsletter = await createNewsletter({
  title: 'My First Newsletter',
  subject_line: 'Welcome to our newsletter!',
  status: 'draft'
})

const handleUpdate = (updatedNewsletter) => {
  console.log('Newsletter updated:', updatedNewsletter)
}
</script>
```

### Newsletter Creation Workflow

1. **Create a new newsletter** from the dashboard
2. **Choose a template** or start from scratch
3. **Add content blocks** using the drag-and-drop editor
4. **Customize styling** with the block editor
5. **Preview** across different devices
6. **Select your audience** from mailing lists
7. **Send test emails** to verify appearance
8. **Schedule or send** to your audience

### Working with Templates

```vue
<template>
  <div>
    <TemplateBrowser
      :templates="templates"
      @select="createFromTemplate"
    />
  </div>
</template>

<script setup>
const { templates, createFromTemplate } = useNewsletterTemplates()

await fetchTemplates()

const handleTemplateSelect = async (template) => {
  if (template) {
    const newsletter = await createFromTemplate(template, {
      title: 'My Custom Newsletter',
      subject_line: 'Check out our latest updates!'
    })
    await navigateTo(`/newsletters/${newsletter.id}/edit`)
  }
}
</script>
```

### Managing Subscribers

```vue
<template>
  <div>
    <NewsletterSegmentBuilder
      @save="createSegment"
      @cancel="showSegmentBuilder = false"
    />
  </div>
</template>

<script setup>
const createSegment = (rules) => {
  // Create targeted audience based on rules
  console.log('Segment rules:', rules)
}
</script>
```

## 🧩 Available Components

### Core Components

| Component | Description | Props |
|-----------|-------------|-------|
| `NewsletterDashboard` | Main dashboard with newsletter list | - |
| `NewsletterEditor` | Drag-and-drop newsletter editor | `newsletter` |
| `NewsletterBlock` | Individual content block | `block`, `isSelected` |
| `BlockEditor` | Block property editor | `block` |
| `TemplateBrowser` | Template selection interface | `templates` |
| `NewsletterPreview` | Live email preview | `newsletter` |
| `NewsletterScheduler` | Scheduling interface | `newsletter`, `mailingLists` |

### Analytics Components

| Component | Description | Props |
|-----------|-------------|-------|
| `NewsletterAnalytics` | Performance overview | `newsletters` |
| `NewsletterABTestResults` | A/B test results | `abTest` |
| `NewsletterValidation` | Validation feedback | `errors` |

### Advanced Components

| Component | Description | Props |
|-----------|-------------|-------|
| `NewsletterSegmentBuilder` | Audience segmentation | - |
| `BlockPicker` | Block type selector | `blockTypes` |
| `TiptapEditor` | Rich text editor | `modelValue` |

## 🎯 Available Composables

### useNewsletter()

```typescript
const {
  // State
  currentNewsletter,
  newsletters,
  isLoading,
  error,
  editorState,
  
  // Methods
  fetchNewsletters,
  fetchNewsletter,
  createNewsletter,
  updateNewsletter,
  deleteNewsletter,
  duplicateNewsletter,
  compileMJML,
  sendTestEmail,
  autoSave,
  
  // Editor methods
  selectBlock,
  togglePreview,
  toggleTemplateLibrary
} = useNewsletter()
```

### useNewsletterBlocks()

```typescript
const {
  // State
  blocks,
  blockTypes,
  isLoading,
  error,
  
  // Methods
  fetchBlockTypes,
  createBlock,
  updateBlock,
  deleteBlock,
  reorderBlocks,
  duplicateBlock,
  getBlockFieldConfig
} = useNewsletterBlocks()
```

### useNewsletterTemplates()

```typescript
const {
  // State
  templates,
  isLoading,
  error,
  
  // Methods
  fetchTemplates,
  createFromTemplate
} = useNewsletterTemplates()
```

## 🔧 Configuration

### Module Options

```typescript
interface ModuleOptions {
  // Required
  directusUrl: string

  // Email Provider
  sendgridApiKey?: string
  defaultFromEmail?: string
  defaultFromName?: string

  // Features
  enableAnalytics?: boolean
  enableWebhooks?: boolean
  webhookSecret?: string
}
```

### Tailwind Configuration

The module works with your existing Tailwind setup. Make sure your `tailwind.config.js` includes:

```javascript
module.exports = {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './nuxt.config.{js,ts}',
    './app.vue',
    // Include the module's components
    './node_modules/@your-org/nuxt-newsletter/dist/**/*.{js,vue,ts}'
  ],
  // ... your existing config
}
```

## 🛠️ Development

### Local Development

```bash
# Clone repository
git clone https://github.com/your-org/nuxt-newsletter.git
cd nuxt-newsletter

# Install dependencies
npm install

# Set up development environment
cp .env.example .env
npm run dev:prepare

# Start development server
npm run dev
```

### Testing

```bash
# Run unit tests
npm run test

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Watch mode
npm run test:watch
```

### Build

```bash
# Build the module
npm run build

# Type checking
npm run typecheck
```

## 🐛 Troubleshooting

### Common Issues

**1. Shadcn Components Not Found**
```bash
Error: [Vue warn]: Failed to resolve component: Button

# Solution: Install missing Shadcn components
npx shadcn-vue@latest add button input label textarea dialog
```

**2. Tailwind Classes Not Applied**
```bash
# Solution: Update your tailwind.config.js to include module paths
content: [
  // ... your existing paths
  './node_modules/@your-org/nuxt-newsletter/dist/**/*.{js,vue,ts}'
]
```

**3. Module Dependencies Error**
```bash
Error: Newsletter module requires the following dependencies...

# Solution: Install and configure required modules
npm install @nuxtjs/tailwindcss shadcn-nuxt @nuxtjs/color-mode

# Add to nuxt.config.ts modules array
modules: [
  '@nuxtjs/tailwindcss',
  'shadcn-nuxt', 
  '@nuxtjs/color-mode',
  '@your-org/nuxt-newsletter'
]
```

**4. MJML Compilation Fails**
```bash
# Check MJML template syntax
# Verify Handlebars variables
# Ensure all required fields are present
```

**5. Directus Connection Problems**
```bash
# Verify Directus URL and credentials
# Check network connectivity
# Ensure required collections exist
```

### Debug Mode

Enable debug logging:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  newsletter: {
    debug: true,
    logLevel: 'verbose'
  }
})
```

### Support Channels

- 📚 [Documentation](https://newsletter-docs.yoursite.com)
- 💬 [Discord Community](https://discord.gg/your-invite)
- 🐛 [GitHub Issues](https://github.com/your-org/nuxt-newsletter/issues)
- 📧 [Email Support](mailto:support@yoursite.com)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/your-org/nuxt-newsletter.git
cd nuxt-newsletter

# Install dependencies
npm install

# Set up development environment
cp .env.example .env
npm run dev:prepare

# Start development server
npm run dev
```

### Submitting Changes

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass (`npm run test`)
6. Commit changes (`git commit -m 'Add amazing feature'`)
7. Push to branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.