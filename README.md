# 📧 @hue-studios/nuxt-newsletter

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Nuxt](https://img.shields.io/badge/Nuxt-3-00DC82?logo=nuxt.js)](https://nuxt.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-38bdf8?logo=tailwind-css)](https://tailwindcss.com)

A comprehensive newsletter management system for Nuxt 3 with Tailwind CSS 4, Directus 11 backend, and modern tooling. Create beautiful email newsletters with drag-and-drop blocks, MJML compilation, and advanced analytics.

![Newsletter Editor Preview](https://your-cdn.com/newsletter-preview.gif)

## ✨ Features

### 🎨 **Modern Tech Stack**
- **Tailwind CSS 4** - Latest version with improved performance and features
- **Nuxt 3** - The intuitive Vue framework
- **Directus 11** - Powerful headless CMS backend
- **TypeScript** - Full type safety throughout
- **Shadcn/ui** - Beautiful, accessible components

### 🎯 **Editor Experience**
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

## 📋 Prerequisites

This module requires the following dependencies in your Nuxt 3 project:

- **Node.js 18+**
- **Nuxt 3.8+**
- **Tailwind CSS 4+** 
- **@tailwindcss/vite** - Vite plugin for Tailwind CSS 4
- **shadcn-nuxt** - For UI components  
- **@nuxtjs/color-mode** - For theme support

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Install the newsletter module
pnpm install git+https://github.com/hue-studios/nuxt-newsletter.git

# Install required dependencies
pnpm install tailwindcss @tailwindcss/vite shadcn-nuxt @nuxtjs/color-mode

# Initialize Shadcn components
npx shadcn-vue@latest init
```

### 2. Configure Nuxt

Add the required modules to your `nuxt.config.ts`:

```typescript
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  modules: [
    'shadcn-nuxt',
    '@nuxtjs/color-mode',
    '@hue-studios/nuxt-newsletter'
  ],
  
  // Tailwind CSS 4 configuration
  vite: {
    plugins: [tailwindcss()],
  },
  
  // Shadcn configuration
  shadcn: {
    prefix: '',
    componentDir: './components/ui'
  },
  
  // Color mode configuration
  colorMode: {
    classSuffix: ''
  },
  
  // Newsletter module configuration
  newsletter: {
    directusUrl: process.env.DIRECTUS_URL,
    sendgridApiKey: process.env.SENDGRID_API_KEY,
    defaultFromEmail: 'newsletter@yoursite.com',
    defaultFromName: 'Your Newsletter',
    enableAnalytics: true,
    enableWebhooks: true
  }
})
```

### 3. Tailwind Configuration

Create or update your `tailwind.config.js`:

```javascript
module.exports = {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './nuxt.config.{js,ts}',
    './app.vue',
    // Include the newsletter module's components
    './node_modules/@hue-studios/nuxt-newsletter/dist/**/*.{js,vue,ts}'
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### 4. Install Required Shadcn Components

```bash
# Install all required components at once
npx shadcn-vue@latest add button input label textarea dialog badge card tabs dropdown-menu select switch slider toast alert separator progress sonner
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

### 6. Setup Toaster

Add the Toaster component to your `app.vue`:

```vue
<template>
  <div>
    <NuxtPage />
    <Toaster />
  </div>
</template>

<script setup>
import { Toaster } from '@/components/ui/sonner'
</script>
```

### 7. Verify Setup

Run the verification script to ensure everything is configured correctly:

```bash
node node_modules/@hue-studios/nuxt-newsletter/scripts/verify-setup.js
```

### 8. Setup Directus Collections

Install the required collections in your Directus instance:

```bash
# Download and run the setup script
node node_modules/@hue-studios/nuxt-newsletter/scripts/install-directus-collections.js https://your-directus.com admin@example.com your-password
```

### 9. Start Development

```bash
pnpm dev
```

Visit `/newsletters` to access the newsletter dashboard.

## 📦 What's Included

### Components
- `NewsletterDashboard` - Main dashboard with stats and overview
- `NewsletterEditor` - Drag-and-drop newsletter editor
- `NewsletterBlock` - Individual newsletter content blocks
- `BlockEditor` - Block property editor with live preview
- `TemplateBrowser` - Template selection interface
- `NewsletterAnalytics` - Performance analytics dashboard
- `NewsletterPreview` - Live preview component with device switching
- `SubscriberManager` - Subscriber list management
- `CampaignScheduler` - Campaign scheduling interface

### Composables
- `useNewsletter()` - Newsletter management and CRUD operations
- `useNewsletterBlocks()` - Block operations and drag-and-drop
- `useNewsletterTemplates()` - Template management
- `useDirectus()` - Directus integration and API calls
- `useNewsletterAnalytics()` - Analytics data fetching
- `useSubscribers()` - Subscriber management
- `useEmailSender()` - Email sending and testing

### Pages
- `/newsletters` - Newsletter dashboard
- `/newsletters/create` - Create new newsletter
- `/newsletters/[id]/edit` - Newsletter editor
- `/newsletters/[id]/analytics` - Analytics view
- `/newsletters/[id]/preview` - Preview newsletter
- `/subscribers` - Subscriber management
- `/templates` - Template library

### API Endpoints
- `POST /api/newsletter/compile-mjml` - MJML compilation
- `POST /api/newsletter/send-test` - Send test emails
- `POST /api/newsletter/send` - Send newsletters to subscribers
- `POST /api/newsletter/upload-image` - Image upload handling
- `GET /api/newsletter/analytics/[id]` - Analytics data retrieval
- `POST /api/newsletter/webhook/sendgrid` - SendGrid webhook handler
- `GET /api/subscribers` - Subscriber list API
- `POST /api/subscribers/import` - Bulk subscriber import

## 🎯 Usage Examples

### Create a Newsletter

```vue
<template>
  <div>
    <NewsletterEditor 
      :newsletter="newsletter" 
      @update="handleUpdate"
      @save="handleSave"
      @back="navigateTo('/newsletters')"
    />
  </div>
</template>

<script setup>
const { createNewsletter, updateNewsletter } = useNewsletter()

// Create a new newsletter
const newsletter = await createNewsletter({
  title: 'My First Newsletter',
  subject_line: 'Welcome to our newsletter!',
  status: 'draft'
})

const handleUpdate = (updatedNewsletter) => {
  console.log('Newsletter updated:', updatedNewsletter)
}

const handleSave = async (newsletterData) => {
  await updateNewsletter(newsletterData)
  console.log('Newsletter saved!')
}
</script>
```

### Use Newsletter Composables

```vue
<script setup>
// Newsletter management
const { 
  newsletters, 
  currentNewsletter, 
  createNewsletter, 
  updateNewsletter,
  deleteNewsletter,
  sendNewsletter 
} = useNewsletter()

// Block operations
const { 
  availableBlocks, 
  addBlock, 
  updateBlock, 
  deleteBlock,
  reorderBlocks 
} = useNewsletterBlocks()

// Analytics
const { 
  getAnalytics, 
  getEngagementMetrics,
  getClickHeatmap 
} = useNewsletterAnalytics()

// Subscriber management
const { 
  subscribers, 
  addSubscriber, 
  importSubscribers,
  getSubscriberLists 
} = useSubscribers()
</script>
```

### Custom Block Creation

```vue
<template>
  <div class="newsletter-block">
    <div class="block-header">
      <h3>{{ block.title }}</h3>
      <button @click="editBlock">Edit</button>
    </div>
    <div class="block-content" v-html="block.content"></div>
  </div>
</template>

<script setup>
const props = defineProps({
  block: {
    type: Object,
    required: true
  }
})

const { updateBlock } = useNewsletterBlocks()

const editBlock = () => {
  // Open block editor
  updateBlock(props.block.id, {
    ...props.block,
    isEditing: true
  })
}
</script>
```

## 🎨 Block Types

### Built-in Blocks
- **Hero Block** - Eye-catching header with image and call-to-action
- **Text Block** - Rich text content with formatting options
- **Image Block** - Responsive images with captions
- **Button Block** - Customizable call-to-action buttons
- **Divider Block** - Visual separators and spacers
- **Social Block** - Social media links and sharing buttons
- **Footer Block** - Newsletter footer with unsubscribe links

### Custom Block Development
Create your own blocks by extending the base block interface:

```typescript
interface CustomBlock extends NewsletterBlock {
  type: 'custom-block'
  properties: {
    customProperty: string
    anotherProperty: number
  }
}
```

## 📊 Analytics Features

### Tracking Metrics
- **Open Rate** - Email open tracking
- **Click Rate** - Link click tracking
- **Engagement Time** - Time spent reading
- **Device Analytics** - Desktop vs mobile engagement
- **Geographic Data** - Subscriber location insights
- **Unsubscribe Rate** - Churn tracking

### A/B Testing
- **Subject Lines** - Test different subject lines
- **Content Variations** - Test different content blocks
- **Send Time** - Optimize send timing
- **From Name** - Test sender variations

## 🔧 Configuration Options

### Newsletter Module Options

```typescript
interface NewsletterModuleOptions {
  directusUrl: string
  sendgridApiKey?: string
  defaultFromEmail?: string
  defaultFromName?: string
  webhookSecret?: string
  enableAnalytics?: boolean
  enableWebhooks?: boolean
  enableA11y?: boolean
  maxImageSize?: number
  allowedImageTypes?: string[]
  templatePath?: string
  blocksPath?: string
}
```

### Advanced Configuration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  newsletter: {
    directusUrl: process.env.DIRECTUS_URL,
    sendgridApiKey: process.env.SENDGRID_API_KEY,
    defaultFromEmail: 'newsletter@yoursite.com',
    defaultFromName: 'Your Newsletter',
    enableAnalytics: true,
    enableWebhooks: true,
    enableA11y: true,
    maxImageSize: 2048000, // 2MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif'],
    templatePath: './newsletter-templates',
    blocksPath: './newsletter-blocks'
  }
})
```

## 🐛 Troubleshooting

### Common Issues

**1. Vite Plugin Not Configured**
```bash
Error: Tailwind CSS 4 Vite plugin not detected

# Solution: Add to nuxt.config.ts
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  vite: {
    plugins: [tailwindcss()],
  }
})
```

**2. Missing Shadcn Components**
```bash
Error: [Vue warn]: Failed to resolve component: Button

# Solution: Install missing components
npx shadcn-vue@latest add button input label textarea dialog
```

**3. Tailwind Classes Not Applied**
```bash
# Solution: Update tailwind.config.js content array
content: [
  // ... your existing paths
  './node_modules/@hue-studios/nuxt-newsletter/dist/**/*.{js,vue,ts}'
]
```

**4. MJML Compilation Fails**
```bash
# Check MJML template syntax
# Verify Handlebars variables are properly escaped
# Ensure all required email fields are present
```

**5. Directus Connection Problems**
```bash
# Verify Directus URL and credentials in .env
# Check network connectivity
# Ensure required collections exist in Directus
```

**6. SendGrid Integration Issues**
```bash
# Verify SendGrid API key is valid
# Check SendGrid domain authentication
# Ensure sender email is verified
```

### Debug Mode

Enable debug logging for troubleshooting:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  newsletter: {
    debug: true,
    logLevel: 'verbose'
  }
})
```

## 🛠️ Development

### Local Development

```bash
# Clone repository
git clone https://github.com/hue-studios/nuxt-newsletter.git
cd nuxt-newsletter

# Install dependencies
pnpm install

# Set up development environment
cp .env.example .env
pnpm dev:prepare

# Start development server
pnpm dev
```

### Testing

```bash
# Run unit tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run E2E tests
pnpm test:e2e

# Watch mode
pnpm test:watch
```

### Build

```bash
# Build the module
pnpm build

# Type checking
pnpm typecheck

# Lint code
pnpm lint
```

## 📚 Documentation

- [Tailwind CSS 4 Documentation](https://tailwindcss.com/docs)
- [Nuxt 3 Documentation](https://nuxt.com/docs)
- [Shadcn/ui Documentation](https://ui.shadcn.com/)
- [Directus Documentation](https://docs.directus.io/)
- [SendGrid Documentation](https://docs.sendgrid.com/)
- [MJML Documentation](https://mjml.io/documentation/)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

### Code Style

- Use TypeScript for all new code
- Follow the existing code style
- Add JSDoc comments for public APIs
- Write tests for new features

## 📄 License

MIT License - see LICENSE file for details.

## 🔗 Links

- [GitHub Repository](https://github.com/hue-studios/nuxt-newsletter)
- [Documentation](https://newsletter-docs.huestudios.com)
- [Issues](https://github.com/hue-studios/nuxt-newsletter/issues)
- [Discussions](https://github.com/hue-studios/nuxt-newsletter/discussions)

## 🙏 Credits

Built with ❤️ by [Hue Studios](https://huestudios.com)

- [Nuxt Team](https://nuxt.com/team) - For the amazing framework
- [Tailwind CSS Team](https://tailwindcss.com/team) - For the utility-first CSS framework
- [Shadcn](https://ui.shadcn.com/) - For the beautiful component library
- [Directus Team](https://directus.io/team) - For the powerful headless CMS