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

## 🚀 Quick Start

### Installation

```bash
npm install @your-org/nuxt-newsletter
```

### 1. Setup Directus Collections

First, install the required collections in your Directus instance:

```bash
# Clone the repository
git clone https://github.com/your-org/nuxt-newsletter.git
cd nuxt-newsletter

# Install dependencies
npm install

# Run the Directus setup script
node scripts/install-directus-collections.js https://your-directus.com admin@example.com your-password
```

### 2. Configure Nuxt

Add the module to your `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  modules: [
    '@your-org/nuxt-newsletter'
  ],
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

### 3. Environment Variables

Create a `.env` file:

```env
# Required
DIRECTUS_URL=https://your-directus.com
SENDGRID_API_KEY=SG.your-sendgrid-api-key

# Optional
NEWSLETTER_WEBHOOK_SECRET=your-webhook-secret
NEWSLETTER_DEFAULT_FROM_EMAIL=newsletter@yoursite.com
NEWSLETTER_DEFAULT_FROM_NAME=Your Newsletter
```

### 4. Add Newsletter Pages

Create newsletter pages in your Nuxt app:

```vue
<!-- pages/newsletters/index.vue -->
<template>
  <NewsletterDashboard />
</template>

<!-- pages/newsletters/[id]/edit.vue -->
<template>
  <NewsletterEditor
    v-if="newsletter"
    :newsletter="newsletter"
    @back="navigateTo('/newsletters')"
  />
</template>

<script setup>
const route = useRoute()
const { fetchNewsletter } = useNewsletter()

const { data: newsletter } = await useLazyAsyncData(
  `newsletter-${route.params.id}`,
  () => fetchNewsletter(parseInt(route.params.id))
)
</script>
```

## 📖 Usage Guide

### Creating Your First Newsletter

1. **Navigate to the dashboard**: `/newsletters`
2. **Click "New Newsletter"** or choose a template
3. **Add content blocks** by dragging from the sidebar
4. **Customize** each block with the property editor
5. **Preview** your newsletter in different devices
6. **Compile** the MJML to generate HTML
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

### Analytics Integration

```vue
<template>
  <div>
    <NewsletterAnalytics :newsletters="newsletters" />
  </div>
</template>

<script setup>
const { newsletters } = useNewsletter()

// Fetch analytics data
const analytics = await $fetch(`/api/newsletter/analytics/${newsletterId}`)
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
  enableAnalytics?: boolean      // default: true
  enableWebhooks?: boolean       // default: true
  enableTemplates?: boolean      // default: true
  enableSegmentation?: boolean   // default: true

  // Security
  webhookSecret?: string

  // UI Customization
  primaryColor?: string
  brandName?: string
}
```

### Runtime Configuration

```typescript
// Access configuration in components
const config = useRuntimeConfig()

// Public config (client + server)
console.log(config.public.newsletter.directusUrl)

// Private config (server only)
console.log(config.newsletter.sendgridApiKey)
```

## 📡 API Endpoints

All API endpoints are automatically added by the module:

### Newsletter Operations
- `POST /api/newsletter/compile-mjml` - Compile newsletter to HTML
- `POST /api/newsletter/send-test` - Send test emails
- `POST /api/newsletter/send` - Send newsletter to list
- `POST /api/newsletter/upload-image` - Upload images

### Analytics
- `GET /api/newsletter/analytics/[id]` - Get newsletter analytics
- `POST /api/newsletter/webhook/sendgrid` - SendGrid webhook handler

### Example API Usage

```typescript
// Compile MJML
const result = await $fetch('/api/newsletter/compile-mjml', {
  method: 'POST',
  body: { newsletter_id: 1 }
})

// Send test email
const testResult = await $fetch('/api/newsletter/send-test', {
  method: 'POST',
  body: {
    newsletter_id: 1,
    test_emails: ['test@example.com']
  }
})

// Get analytics
const analytics = await $fetch('/api/newsletter/analytics/1')
```

## 🎨 Block Types

### Built-in Block Types

| Block Type | Description | Use Case |
|------------|-------------|----------|
| **Hero** | Large header with title, subtitle, CTA | Newsletter headers |
| **Text** | Rich text content | Articles, descriptions |
| **Image** | Images with captions and links | Photos, graphics |
| **Button** | Call-to-action buttons | Links, CTAs |
| **Two Column** | Side-by-side content | Comparisons, features |
| **Divider** | Horizontal separators | Section breaks |

### Advanced Block Types

| Block Type | Description | Use Case |
|------------|-------------|----------|
| **Product Showcase** | Product with image, price, CTA | E-commerce |
| **Team Member** | Profile with photo and bio | Team introductions |
| **Statistics** | Number displays with labels | Metrics, achievements |
| **Social Links** | Social media icon links | Footer, contact |
| **Event Card** | Event with date, time, location | Event promotion |

### Creating Custom Block Types

Add custom blocks in your Directus admin:

```json
{
  "name": "Custom CTA",
  "slug": "custom-cta",
  "description": "Custom call-to-action block",
  "category": "interactive",
  "icon": "call_to_action",
  "mjml_template": "<mj-section background-color=\"{{background_color}}\"><mj-column><mj-text>{{title}}</mj-text><mj-button href=\"{{button_url}}\">{{button_text}}</mj-button></mj-column></mj-section>",
  "field_visibility_config": ["title", "button_text", "button_url", "background_color"],
  "status": "published"
}
```

## 📊 Analytics & Tracking

### SendGrid Webhook Setup

Configure SendGrid to send events to your webhook:

1. **Webhook URL**: `https://yoursite.com/api/newsletter/webhook/sendgrid`
2. **Events**: `delivered`, `open`, `click`, `bounce`, `unsubscribe`
3. **HTTP Method**: `POST`
4. **Signature Verification**: Enabled (recommended)

### Custom Analytics

```typescript
// Track custom events
await $fetch('/api/newsletter/track-event', {
  method: 'POST',
  body: {
    newsletter_id: 1,
    event_type: 'custom_click',
    subscriber_id: 123,
    metadata: { section: 'header' }
  }
})

// Get detailed analytics
const analytics = await $fetch('/api/newsletter/analytics/1')
console.log(analytics.statistics.open_rate) // 24.5
```

## 🔒 Security Features

### Input Validation
- XSS protection with HTML sanitization
- CSRF token validation
- File upload restrictions
- Email address validation

### Webhook Security
- Signature verification for SendGrid webhooks
- Rate limiting on all endpoints
- Secure token authentication

### Data Protection
- Subscriber data encryption
- Secure unsubscribe tokens
- GDPR compliance features

## 🎨 Customization

### Styling

Override default styles:

```css
/* Custom newsletter styles */
:root {
  --newsletter-primary: #your-brand-color;
  --newsletter-secondary: #your-secondary-color;
}

.newsletter-editor {
  font-family: 'Your Font', sans-serif;
}

.newsletter-block {
  border-radius: 12px;
  transition: all 0.3s ease;
}
```

### Custom Validation

```typescript
// utils/custom-validation.ts
export function customNewsletterValidation(newsletter: Newsletter): ValidationError[] {
  const errors: ValidationError[] = []
  
  // Custom business rules
  if (newsletter.subject_line && newsletter.subject_line.length < 10) {
    errors.push({
      field: 'subject_line',
      message: 'Subject line should be at least 10 characters',
      severity: 'warning'
    })
  }
  
  return errors
}
```

### Theme Customization

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  newsletter: {
    theme: {
      primaryColor: '#your-brand-color',
      fontFamily: 'Your Font Family',
      borderRadius: '8px',
      shadows: true
    }
  }
})
```

## 🧪 Testing

### Running Tests

```bash
# Install test dependencies
npm install --dev

# Run unit tests
npm run test

# Run component tests
npm run test:components

# Run E2E tests
npm run test:e2e

# Generate coverage report
npm run test:coverage
```

### Example Tests

```typescript
// tests/components/NewsletterEditor.test.ts
import { mount } from '@vue/test-utils'
import NewsletterEditor from '~/components/NewsletterEditor.vue'

describe('NewsletterEditor', () => {
  it('renders newsletter editor', () => {
    const wrapper = mount(NewsletterEditor, {
      props: {
        newsletter: mockNewsletter
      }
    })
    
    expect(wrapper.find('.newsletter-editor').exists()).toBe(true)
  })
})
```

## 📦 Deployment

### Production Checklist

- [ ] Configure environment variables
- [ ] Set up SendGrid account and API key
- [ ] Configure Directus instance
- [ ] Set up webhook endpoints
- [ ] Configure image optimization
- [ ] Enable SSL/HTTPS
- [ ] Set up monitoring and logging

### Environment Variables

```env
# Production Environment
NODE_ENV=production
DIRECTUS_URL=https://your-directus.com
SENDGRID_API_KEY=SG.your-production-key
NEWSLETTER_WEBHOOK_SECRET=secure-webhook-secret

# Optional Production Settings
NEWSLETTER_RATE_LIMIT=100
NEWSLETTER_MAX_FILE_SIZE=10MB
NEWSLETTER_CACHE_TTL=3600
```

## 🔧 Troubleshooting

### Common Issues

**1. MJML Compilation Fails**
```bash
# Check MJML template syntax
# Verify Handlebars variables
# Ensure all required fields are present
```

**2. SendGrid Integration Issues**
```bash
# Verify API key permissions
# Check webhook URL accessibility
# Validate sender authentication
```

**3. Directus Connection Problems**
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

## 🙏 Acknowledgments

- [Nuxt.js](https://nuxt.com) - The Intuitive Web Framework
- [Directus](https://directus.io) - Open Data Platform
- [MJML](https://mjml.io) - Responsive Email Framework
- [SendGrid](https://sendgrid.com) - Email Delivery Platform
- [Tiptap](https://tiptap.dev) - Rich Text Editor
- [GSAP](https://greensock.com/gsap/) - Animation Library
- [Tailwind CSS](https://tailwindcss.com) - Utility-First CSS

## 📈 Roadmap

### Upcoming Features

- [ ] **Visual Template Designer** - Drag-and-drop template creation
- [ ] **Advanced A/B Testing** - Multi-variant testing
- [ ] **AI Content Suggestions** - Smart content recommendations
- [ ] **Advanced Automation** - Drip campaigns and triggers
- [ ] **Multi-language Support** - Internationalization
- [ ] **Custom Integrations** - Webhooks and API extensions
- [ ] **Mobile App** - iOS and Android companion apps

### Version History

- **v1.0.0** - Initial release with core features
- **v1.1.0** - Added A/B testing and advanced analytics
- **v1.2.0** - Introduced template system and content library
- **v1.3.0** - Enhanced editor with drag-and-drop improvements

---

**Built with ❤️ for the Nuxt community**

[⭐ Star us on GitHub](https://github.com/your-org/nuxt-newsletter) | [📚 View Documentation](https://newsletter-docs.yoursite.com) | [💬 Join Discord](https://discord.gg/your-invite)