# Nuxt Newsletter Module

A powerful newsletter management system for Nuxt 3 with Directus 11 backend integration.

## Features

- 📧 **Visual Block Editor** with GSAP drag-and-drop functionality
- 🎨 **MJML Email Templates** for responsive design
- 📊 **Analytics & Tracking** via SendGrid webhooks
- 🔐 **Flexible Authentication** - static token or middleware-based
- 🎯 **Built with Modern Stack** - Tailwind CSS 4, shadcn-vue, VueUse, GSAP

## Requirements

- Node.js 18+
- Nuxt 3.8+
- Directus 11+
- SendGrid Account

## Installation

```bash
# Install the module
pnpm install @hue-studios/nuxt-newsletter

# Install required peer dependencies
pnpm install @tailwindcss/vite@^4.0.0 tailwindcss@^4.0.0 shadcn-nuxt @nuxtjs/color-mode @vueuse/nuxt gsap
```

## Configuration

### 1. Nuxt Config

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: [
    'shadcn-nuxt',
    '@nuxtjs/color-mode',
    '@vueuse/nuxt',
    '@hue-studios/nuxt-newsletter'
  ],
  
  // Tailwind CSS 4
  vite: {
    plugins: [tailwindcss()],
  },
  
  newsletter: {
    directusUrl: process.env.DIRECTUS_URL,
    sendgridApiKey: process.env.SENDGRID_API_KEY,
    
    // Authentication options:
    // Option 1: Static token
    directusToken: process.env.DIRECTUS_TOKEN,
    
    // Option 2: Dynamic (omit directusToken)
    // Requires Authorization header
  }
})
```

### 2. Initialize Shadcn Components

```bash
npx shadcn-vue@latest init

# Add required components
npx shadcn-vue@latest add button input dialog card tabs badge toast
```

### 3. Tailwind Config

```javascript
// tailwind.config.js
export default {
  content: [
    './node_modules/@hue-studios/nuxt-newsletter/dist/**/*.{js,vue,ts}'
  ]
}
```

### 4. Setup Directus Collections

```bash
# Run the installation script
node node_modules/@hue-studios/nuxt-newsletter/scripts/install-directus-collections.js \
  https://your-directus.com admin@example.com your-password
```

## Authentication

### Static Token (Simple)
```env
DIRECTUS_TOKEN=your-static-admin-token
```

### Dynamic Token (Recommended)
```typescript
// server/middleware/newsletter-auth.ts
export default defineEventHandler(async (event) => {
  if (!event.node.req.url?.startsWith('/api/newsletter')) return;
  
  const userToken = await getUserDirectusToken(event);
  if (userToken) {
    setHeader(event, 'authorization', `Bearer ${userToken}`);
  }
});
```

## Usage

### Newsletter Editor with GSAP Drag & Drop

```vue
<template>
  <NewsletterEditor
    :newsletter="newsletter"
    @update="handleUpdate"
  />
</template>

<script setup>
const newsletter = await $fetch('/api/newsletter/1')

const handleUpdate = async (updated) => {
  await $fetch('/api/newsletter/1', {
    method: 'PUT',
    body: updated
  })
}
</script>
```

### Newsletter List

```vue
<template>
  <NewsletterList 
    :show-filters="true"
    @newsletter-selected="navigateTo(`/newsletters/${$event.id}`)"
  />
</template>
```

### Send Test Email

```typescript
const { sendTestEmail } = useNewsletter()

await sendTestEmail(newsletterId, ['test@example.com'])
```

## API Endpoints

- `GET /api/newsletter/list` - List newsletters
- `POST /api/newsletter/create` - Create newsletter  
- `GET /api/newsletter/[id]` - Get newsletter
- `PUT /api/newsletter/[id]` - Update newsletter
- `POST /api/newsletter/send` - Send newsletter
- `POST /api/newsletter/send-test` - Send test

## Built-in Components

- `<NewsletterEditor>` - Visual block editor with GSAP drag & drop
- `<NewsletterList>` - Newsletter management dashboard
- `<NewsletterBlock>` - Individual content blocks
- `<BlockPicker>` - Block type selector
- `<NewsletterPreview>` - Email preview
- `<SubscriberManager>` - Subscriber management

## Key Features

### GSAP Draggable Integration
The editor uses GSAP's Draggable plugin for smooth drag-and-drop functionality:
- Drag blocks from the library
- Reorder blocks within the newsletter
- Visual drop zones with animations

### VueUse Composables
- `useNewsletter()` - Newsletter management
- `useNewsletterBlocks()` - Block operations  
- `useNewsletterAnalytics()` - Analytics data
- `useNewsletterTemplates()` - Template management

### SendGrid Integration
- Automatic webhook handling at `/api/newsletter/webhook/sendgrid`
- Real-time analytics tracking
- Bounce and unsubscribe management

## Security

- Content sanitization with DOMPurify
- Webhook signature validation
- Rate limiting on API endpoints
- Directus permissions respected

## License

MIT