# Complete Setup Guide for Nuxt Newsletter Module

## Prerequisites

- Nuxt 3.0+
- Node.js 18+
- Directus 11+ instance
- SendGrid account with API key

## Installation

```bash
# Install the module
npm install @hue-studios/nuxt-newsletter

# Install peer dependencies
npm install @vueuse/nuxt @directus/sdk

# For server-side MJML compilation (optional but recommended)
npm install mjml
```

## Configuration

### 1. Environment Variables

Create `.env` file:

```bash
# Directus Configuration
DIRECTUS_URL=https://your-directus.com
DIRECTUS_TOKEN=your-static-token        # For static auth
DIRECTUS_ADMIN_TOKEN=admin-token        # For webhooks & system operations

# SendGrid Configuration
SENDGRID_API_KEY=SG.your-api-key-here
SENDGRID_WEBHOOK_SECRET=your-webhook-secret

# Optional
NUXT_PUBLIC_SITE_URL=https://your-site.com
SESSION_SECRET=your-session-secret       # If using session auth
```

### 2. Nuxt Configuration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@hue-studios/nuxt-newsletter'],
  
  newsletter: {
    // Directus configuration
    directus: {
      url: process.env.DIRECTUS_URL!,
      auth: {
        // Option 1: Static token (simple)
        type: 'static',
        token: process.env.DIRECTUS_TOKEN
        
        // Option 2: Middleware-based (secure)
        // type: 'middleware',
        // middleware: 'auth' // Your auth middleware name
      }
    },
    
    // SendGrid configuration
    sendgrid: {
      apiKey: process.env.SENDGRID_API_KEY,
      webhookSecret: process.env.SENDGRID_WEBHOOK_SECRET,
      defaultFromEmail: 'newsletter@example.com',
      defaultFromName: 'Your Company Newsletter'
    },
    
    // MJML compilation mode
    mjmlMode: 'server', // 'server' or 'client'
    
    // Component prefix
    prefix: 'Newsletter' // Components will be <NewsletterEditor>, etc.
  }
})
```

### 3. TypeScript Configuration

Add to `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "#newsletter/*": ["./node_modules/@hue-studios/nuxt-newsletter/dist/runtime/*"]
    }
  }
}
```

## Directus Setup

### 1. Run Setup Scripts

```bash
# Install core collections
node node_modules/@hue-studios/nuxt-newsletter/scripts/install-directus-collections.js \
  https://your-directus.com admin@example.com your-password

# Install advanced block types (optional)
node node_modules/@hue-studios/nuxt-newsletter/scripts/create-advanced-blocks.js \
  https://your-directus.com admin@example.com your-password
```

### 2. Manual Collection Setup (if scripts fail)

Create these collections in Directus:

1. **newsletter_templates** - Reusable templates
2. **block_types** - MJML block definitions
3. **newsletters** - Main newsletter content
4. **newsletter_blocks** - Newsletter content blocks
5. **subscribers** - Email subscribers
6. **mailing_lists** - Subscriber lists
7. **mailing_lists_subscribers** - Junction table
8. **newsletter_sends** - Send history
9. **newsletter_analytics** - Event tracking

### 3. Permissions Setup

Grant appropriate permissions for your users:

```javascript
// Example permissions for 'Editor' role
{
  newsletters: { create: true, read: true, update: true, delete: true },
  newsletter_blocks: { create: true, read: true, update: true, delete: true },
  block_types: { read: true },
  newsletter_templates: { read: true },
  subscribers: { read: true },
  mailing_lists: { read: true },
  newsletter_analytics: { read: true }
}
```

## SendGrid Configuration

### 1. Create API Key

1. Go to SendGrid Settings → API Keys
2. Create a new key with permissions:
   - Mail Send: Full Access
   - Suppressions: Full Access
   - Stats: Read Access
   - Webhook: Full Access

### 2. Configure Event Webhook

1. Go to Settings → Mail Settings → Event Webhook
2. HTTP Post URL: `https://your-app.com/api/newsletter/sendgrid-webhook`
3. Events to track:
   - Delivered
   - Opened
   - Clicked
   - Bounced
   - Spam Reports
   - Unsubscribe
   - Dropped

### 3. Set Webhook Verification

1. Enable "Webhook Verification"
2. Copy the verification key to `SENDGRID_WEBHOOK_SECRET`

## Authentication Options

### Option 1: Static Token (Simple)

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

### Option 2: Middleware-based (Secure)

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
export default defineNuxtRouteMiddleware(async (to, from) => {
  const { setAuthToken } = useDirectusNewsletter()
  
  // Get token from your auth system
  const token = await getAuthToken()
  
  if (token) {
    setAuthToken(token)
  } else {
    return navigateTo('/login')
  }
})

// pages/admin/newsletter.vue
<template>
  <div>
    <NewsletterEditor v-model="newsletter" />
  </div>
</template>

<script setup>
definePageMeta({
  middleware: 'auth'
})
</script>
```

## Usage Examples

### 1. Basic Newsletter Page

```vue
<template>
  <div>
    <h1>Create Newsletter</h1>
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
    { email: 'test@example.com', name: 'Test User' }
  ]
  await sendNewsletter(newsletter.value, recipients)
}
</script>
```

### 2. With Templates

```vue
<script setup>
const { fetchTemplates } = useDirectusNewsletter()
const { loadFromTemplate } = useNewsletterEditor()

const templates = await fetchTemplates()

const applyTemplate = (templateId) => {
  const template = templates.find(t => t.id === templateId)
  loadFromTemplate(template)
}
</script>
```

### 3. Custom Block Type

Create in Directus `block_types` collection:

```javascript
{
  name: "Custom CTA",
  slug: "custom-cta",
  category: "interactive",
  icon: "ads_click",
  mjml_template: `
<mj-section background-color="{{background_color}}" padding="{{padding}}">
  <mj-column>
    <mj-text font-size="24px" color="{{text_color}}" align="center">
      {{title}}
    </mj-text>
    <mj-button 
      background-color="{{button_color}}" 
      color="{{button_text_color}}"
      href="{{button_url}}"
      font-size="18px"
      padding="20px"
    >
      {{button_text}}
    </mj-button>
  </mj-column>
</mj-section>`,
  field_visibility_config: [
    "title",
    "button_text",
    "button_url",
    "button_color",
    "button_text_color",
    "background_color",
    "text_color",
    "padding"
  ]
}
```

## Troubleshooting

### Verify Setup

```bash
node node_modules/@hue-studios/nuxt-newsletter/scripts/verify-setup.js
```

### Common Issues

1. **MJML not compiling**
   - Install mjml: `npm install mjml`
   - Or use client mode: `mjmlMode: 'client'`

2. **Auth errors**
   - Check DIRECTUS_TOKEN is set
   - Verify token has correct permissions

3. **SendGrid webhooks not working**
   - Check webhook URL is accessible
   - Verify webhook secret matches

4. **Blocks not showing**
   - Run block types setup script
   - Check block_types collection has entries

## Performance Tips

1. **Use server-side MJML compilation** for better performance
2. **Cache compiled templates** in Directus
3. **Batch large sends** using SendGrid batch API
4. **Implement pagination** for subscriber lists
5. **Use webhook queues** for high-volume analytics

## Security Best Practices

1. **Never expose API keys** in client-side code
2. **Use middleware auth** for public apps
3. **Validate webhook signatures** from SendGrid
4. **Implement rate limiting** on send endpoints
5. **Sanitize HTML content** in newsletters
6. **Use CSP headers** to prevent XSS

## Support

- Issues: https://github.com/hue-studios/nuxt-newsletter/issues
- Docs: https://github.com/hue-studios/nuxt-newsletter/wiki
- Examples: https://github.com/hue-studios/nuxt-newsletter/tree/main/examples