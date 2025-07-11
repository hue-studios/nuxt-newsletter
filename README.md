# Nuxt Newsletter Module

Professional MJML-based newsletter module for Nuxt 3 with Directus CMS and SendGrid integration.

## Features

- 📧 **MJML Email Templates** - Industry-standard responsive email design
- 💾 **Directus CMS Integration** - Store newsletters, templates, and analytics
- 📤 **SendGrid API** - Reliable email delivery and tracking
- 📊 **Analytics & Webhooks** - Track opens, clicks, bounces automatically
- 🎨 **Visual Block Editor** - No coding required for content creation
- 👥 **Subscriber Management** - Lists, segmentation, and preferences
- 🔒 **Flexible Authentication** - Static tokens or middleware-based auth

## Quick Start

### 1. Install

```bash
npm install @hue-studios/nuxt-newsletter
```

### 2. Configure

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@hue-studios/nuxt-newsletter'],
  
  newsletter: {
    directus: {
      url: process.env.DIRECTUS_URL,
      auth: {
        type: 'static',
        token: process.env.DIRECTUS_TOKEN
      }
    },
    sendgrid: {
      apiKey: process.env.SENDGRID_API_KEY,
      webhookSecret: process.env.SENDGRID_WEBHOOK_SECRET,
      defaultFromEmail: 'newsletter@example.com',
      defaultFromName: 'Your Company'
    },
    mjmlMode: 'client' // or 'server' for better performance
  }
})
```

### 3. Environment Variables

```bash
# .env
DIRECTUS_URL=https://your-directus-instance.com
DIRECTUS_TOKEN=your-static-token
DIRECTUS_ADMIN_TOKEN=admin-token-for-webhooks
SENDGRID_API_KEY=SG.your-sendgrid-api-key
SENDGRID_WEBHOOK_SECRET=your-webhook-verification-secret
```

### 4. Set Up Directus

Run the setup script to create all required collections:

```bash
# Basic setup with core block types
node scripts/install-directus-collections.js https://your-directus.com admin@example.com password

# Optional: Add advanced block types
node scripts/create-advanced-blocks.js https://your-directus.com admin@example.com password
```

### 5. Configure SendGrid Webhooks

In your SendGrid account, set up event webhooks to:
```
https://your-app.com/api/newsletter/sendgrid-webhook
```

Enable events: Delivered, Open, Click, Bounce, Spam Report, Unsubscribe

## Usage

### Basic Newsletter Editor

```vue
<template>
  <div>
    <NewsletterEditor 
      v-model="newsletter" 
      :show-preview="true"
    />
    
    <button @click="save">Save Draft</button>
    <button @click="send">Send Newsletter</button>
  </div>
</template>

<script setup>
const newsletter = ref({
  subject: 'Monthly Newsletter',
  preheader: 'Check out our latest updates',
  blocks: []
})

const { createNewsletter } = useDirectusNewsletter()
const { sendNewsletter } = useSendGrid()

const save = async () => {
  const saved = await createNewsletter(newsletter.value)
  console.log('Saved:', saved)
}

const send = async () => {
  // Fetch recipients from your mailing list
  const recipients = [
    { email: 'subscriber@example.com', name: 'John Doe' }
  ]
  
  const result = await sendNewsletter(
    newsletter.value,
    recipients,
    {
      categories: ['monthly', 'newsletter']
    }
  )
  console.log('Sent:', result)
}
</script>
```

### Send Test Email

```vue
<script setup>
const { sendTestEmail } = useSendGrid()

const testEmail = async () => {
  await sendTestEmail(
    newsletter.value,
    'test@example.com'
  )
}
</script>
```

### Load Newsletter Template

```vue
<script setup>
const { fetchTemplates } = useDirectusNewsletter()
const { loadFromTemplate } = useNewsletterEditor()

const templates = await fetchTemplates()

const useTemplate = (templateId) => {
  const template = templates.find(t => t.id === templateId)
  loadFromTemplate(template)
}
</script>
```

## Composables

### `useNewsletterEditor()`

Manages newsletter content and blocks:

```typescript
const {
  newsletter,      // Reactive newsletter data
  blocks,          // Newsletter blocks array
  addBlock,        // Add new block by type
  removeBlock,     // Remove block by ID
  updateBlock,     // Update block content
  moveBlock,       // Reorder blocks
  duplicateBlock,  // Duplicate existing block
  clearBlocks,     // Clear all blocks
  loadFromTemplate // Load from template
} = useNewsletterEditor()
```

### `useSendGrid()`

SendGrid email operations:

```typescript
const {
  sendNewsletter,          // Send to recipients
  sendTestEmail,           // Send test email
  createBatch,             // Create batch for large sends
  getBatchStatus,          // Check batch status
  cancelScheduledSend,     // Cancel scheduled email
  getSuppressions,         // Get suppression lists
  addToSuppressionList,    // Add emails to suppression
  removeFromSuppressionList // Remove from suppression
} = useSendGrid()
```

### `useDirectusNewsletter()`

Directus data operations:

```typescript
const {
  fetchNewsletters,  // Get newsletter list
  fetchNewsletter,   // Get single newsletter
  createNewsletter,  // Create new newsletter
  updateNewsletter,  // Update existing
  deleteNewsletter,  // Delete newsletter
  fetchBlockTypes,   // Get available blocks
  fetchTemplates,    // Get templates
  fetchTemplate      // Get single template
} = useDirectusNewsletter()
```

### `useMjmlCompiler()`

MJML compilation:

```typescript
const {
  compileNewsletterToMjml,  // Generate MJML
  compileMjmlToHtml,        // Convert to HTML
  isCompiling,              // Loading state
  compilationError          // Error state
} = useMjmlCompiler()
```

## Block Types

The module uses MJML block types stored in Directus. Each block type includes:

- **MJML Template** - The MJML markup with Handlebars placeholders
- **Field Configuration** - Which fields are editable
- **Category** - Organization (content, layout, media, interactive)

### Example Block Type

```javascript
{
  name: "Hero Section",
  slug: "hero",
  category: "content",
  icon: "title",
  mjml_template: `
    <mj-section background-color="{{background_color}}" padding="{{padding}}">
      <mj-column>
        <mj-text align="{{text_align}}" font-size="32px" color="{{text_color}}">
          {{title}}
        </mj-text>
        {{#if subtitle}}
        <mj-text align="{{text_align}}" font-size="18px" color="{{text_color}}">
          {{subtitle}}
        </mj-text>
        {{/if}}
      </mj-column>
    </mj-section>
  `,
  field_visibility_config: [
    "title",
    "subtitle", 
    "background_color",
    "text_color",
    "text_align",
    "padding"
  ]
}
```

## Server-Side MJML Compilation

For better performance, use server-side compilation:

1. Install MJML:
```bash
npm install mjml
```

2. Update config:
```typescript
newsletter: {
  mjmlMode: 'server'
}
```

## Analytics & Tracking

SendGrid webhooks automatically update:

- **Subscriber Status** - Active, bounced, unsubscribed
- **Engagement Scores** - Based on opens and clicks
- **Send Statistics** - Delivery rates, open rates, click rates
- **Individual Events** - Stored in newsletter_analytics

## Authentication Options

### Static Token (Simple)
```typescript
directus: {
  auth: {
    type: 'static',
    token: 'your-static-token'
  }
}
```

### Middleware-based (Secure)
```typescript
directus: {
  auth: {
    type: 'middleware',
    middleware: 'auth' // Your auth middleware name
  }
}
```

## Production Checklist

- [ ] Configure SendGrid webhooks
- [ ] Set up Directus collections
- [ ] Create block types
- [ ] Configure authentication
- [ ] Test email rendering
- [ ] Set up bounce handling
- [ ] Configure unsubscribe links
- [ ] Test analytics tracking

## File Structure

```
your-app/
├── server/
│   └── api/
│       └── newsletter/
│           ├── compile-mjml.post.ts  # Server MJML (optional)
│           └── sendgrid-webhook.post.ts  # Auto-created
├── components/
│   └── NewsletterEditor.vue  # Your implementation
└── pages/
    └── admin/
        └── newsletter.vue  # Editor page
```

## Support

- [GitHub Issues](https://github.com/hue-studios/nuxt-newsletter)
- [Documentation](https://github.com/hue-studios/nuxt-newsletter/wiki)

## License

MIT License

---

Built with ❤️ by Hue Studios