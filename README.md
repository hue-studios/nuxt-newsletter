# Nuxt Newsletter Module

> A powerful, feature-rich newsletter management system for Nuxt 3 with Directus backend integration.

## ✨ Features

- 📧 **Complete Newsletter Management** - Create, edit, and send newsletters with a visual block editor
- 🎨 **MJML Email Templates** - Professional email templates with responsive design
- 📊 **Advanced Analytics** - Track opens, clicks, bounces, and engagement metrics
- 👥 **Subscriber Management** - Import, segment, and manage subscriber lists
- 🔌 **SendGrid Integration** - Reliable email delivery with webhook support
- 🛡️ **Content Security** - Built-in sanitization and validation
- 🎯 **Directus CMS** - Leverage Directus for content management and authentication
- 🚀 **Modern Stack** - Built with Nuxt 3, TypeScript, Tailwind CSS 4, and Shadcn/ui

## 📋 Requirements

- Node.js 18+ 
- Nuxt 3.8+
- Directus 10+
- SendGrid Account (for email delivery)

## 🚀 Installation

### 1. Install the Module

```bash
# Install the newsletter module
pnpm install @hue-studios/nuxt-newsletter

# Install required dependencies
pnpm install tailwindcss @tailwindcss/vite shadcn-nuxt @nuxtjs/color-mode
```

### 2. Initialize Shadcn Components

```bash
# Initialize Shadcn
npx shadcn-vue@latest init

# Install required components
npx shadcn-vue@latest add button input label textarea dialog badge card tabs dropdown-menu select switch slider toast alert separator progress sonner
```

### 3. Configure Nuxt

```typescript
// nuxt.config.ts
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
    
    // Authentication Configuration (choose one)
    
    // Option 1: Static Token (simple, server-side only)
    directusToken: process.env.DIRECTUS_TOKEN,
    
    // Option 2: Dynamic Authentication (recommended)
    // Omit directusToken to require Authorization header
    
    // Optional settings
    enableAnalytics: true,
    enableWebhooks: true,
    webhookSecret: process.env.NEWSLETTER_WEBHOOK_SECRET,
  }
})
```

### 4. Tailwind Configuration

```javascript
// tailwind.config.js
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

### 5. Add Toaster Component

```vue
<!-- app.vue -->
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

## 🔐 Authentication Setup

The newsletter module uses **Directus for authentication** and requires valid Directus tokens. Choose the authentication approach that best fits your project:

### Option 1: Static Token (Simple Setup)

Use a static admin token for all newsletter operations:

```env
# .env
DIRECTUS_URL=https://your-directus.com
DIRECTUS_TOKEN=your-static-admin-token
SENDGRID_API_KEY=your-sendgrid-key
```

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  newsletter: {
    directusUrl: process.env.DIRECTUS_URL,
    directusToken: process.env.DIRECTUS_TOKEN, // Static token
    sendgridApiKey: process.env.SENDGRID_API_KEY,
  }
})
```

**Pros:** Simple setup, works immediately  
**Cons:** All operations use admin privileges, less secure for multi-user apps

### Option 2: Dynamic Authentication (Recommended)

Pass user-specific Directus tokens via Authorization headers:

```env
# .env
DIRECTUS_URL=https://your-directus.com
SENDGRID_API_KEY=your-sendgrid-key
# No static token - uses dynamic tokens
```

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  newsletter: {
    directusUrl: process.env.DIRECTUS_URL,
    // No directusToken - requires Authorization header
    sendgridApiKey: process.env.SENDGRID_API_KEY,
  }
})
```

#### Implementation Approaches:

**A. Server Middleware (Recommended)**
```typescript
// server/middleware/newsletter-auth.ts
export default defineEventHandler(async (event) => {
  // Skip if not newsletter route
  if (!event.node.req.url?.startsWith('/api/newsletter')) {
    return;
  }

  // Get user's Directus token from your auth system
  const userToken = await getUserDirectusToken(event);
  
  if (userToken) {
    setHeader(event, 'authorization', `Bearer ${userToken}`);
  }
});
```

**B. Client-Side with Composables**
```typescript
// composables/useNewsletter.ts
export const useNewsletter = () => {
  const { $directus } = useNuxtApp();
  
  const apiCall = async (endpoint: string, options: any = {}) => {
    return $fetch(`/api/newsletter${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${$directus.auth.token}`,
        ...options.headers
      }
    });
  };

  return {
    async getNewsletters() {
      return apiCall('/list');
    },
    async createNewsletter(data: any) {
      return apiCall('/create', {
        method: 'POST',
        body: data
      });
    }
  };
};
```

**C. Plugin Integration**
```typescript
// plugins/directus-newsletter.client.ts
export default defineNuxtPlugin(async () => {
  const { $directus } = useNuxtApp();
  
  // Automatically add auth headers to newsletter API calls
  $fetch.create({
    onRequest({ options }) {
      if (options.url?.startsWith('/api/newsletter')) {
        options.headers = {
          ...options.headers,
          'Authorization': `Bearer ${$directus.auth.token}`
        };
      }
    }
  });
});
```

### Creating Directus Tokens

**Static Token (Option 1):**
1. Go to Directus Admin → Settings → Roles & Permissions
2. Create a new role with newsletter permissions
3. Go to Users → Create a new user or edit existing
4. In User settings → Token → Generate a static token
5. Add the token to your environment variables

**User Tokens (Option 2):**
```typescript
// Example: Getting user token in your auth system
import { createDirectus, authentication, rest, login } from '@directus/sdk';

const client = createDirectus('your-directus-url')
  .with(authentication('json'))
  .with(rest());

// Login user and get token
const result = await client.login({ email, password });
const userToken = result.access_token;

// Store token for newsletter module use
```

## 📦 Directus Setup

### 1. Install Required Collections

```bash
# Run the installation script to create all required collections
node node_modules/@hue-studios/nuxt-newsletter/scripts/install-directus-collections.js https://your-directus.com admin@example.com your-password
```

This creates:
- `newsletters` - Newsletter content and metadata
- `newsletter_blocks` - Content blocks for newsletters
- `block_types` - Available block types and templates
- `subscribers` - Subscriber management
- `mailing_lists` - Subscriber segmentation
- `newsletter_sends` - Send history and tracking
- `newsletter_events` - Analytics and engagement tracking
- And more...

### 2. Configure Permissions

Set up appropriate permissions in Directus for newsletter collections based on your user roles:

```json
{
  "newsletters": {
    "create": "role:editor",
    "read": "role:editor", 
    "update": "role:editor",
    "delete": "role:admin"
  },
  "subscribers": {
    "create": "role:editor",
    "read": "role:editor",
    "update": "role:editor", 
    "delete": "role:admin"
  }
}
```

## 🎯 Usage

### Basic Newsletter Management

```vue
<!-- pages/newsletters.vue -->
<template>
  <div>
    <NewsletterList />
  </div>
</template>

<script setup>
// The component automatically handles authentication via Directus tokens
</script>
```

### Creating Newsletters Programmatically

```typescript
// Using the newsletter API
const newsletter = await $fetch('/api/newsletter/create', {
  method: 'POST',
  body: {
    title: 'My Newsletter',
    subject_line: 'Welcome to our newsletter!',
    from_email: 'newsletter@example.com',
    from_name: 'Example Company',
    template_id: 1
  },
  headers: {
    'Authorization': `Bearer ${directusToken}`
  }
});
```

### Analytics Dashboard

```vue
<!-- pages/newsletter/analytics/[id].vue -->
<template>
  <div>
    <NewsletterAnalytics :newsletter-id="$route.params.id" />
  </div>
</template>
```

## 🔧 API Endpoints

All API endpoints require valid Directus authentication.

### Newsletter Management
- `GET /api/newsletter/list` - Get all newsletters
- `POST /api/newsletter/create` - Create new newsletter
- `GET /api/newsletter/[id]` - Get newsletter by ID
- `PUT /api/newsletter/[id]` - Update newsletter
- `DELETE /api/newsletter/[id]` - Delete newsletter

### Sending & Testing
- `POST /api/newsletter/send-test` - Send test email
- `POST /api/newsletter/send` - Send newsletter to subscribers
- `POST /api/newsletter/schedule` - Schedule newsletter

### Analytics
- `GET /api/newsletter/analytics/[id]` - Get newsletter analytics
- `GET /api/newsletter/analytics/overview` - Get overall stats

### Subscribers
- `GET /api/newsletter/subscribers` - Get subscriber list
- `POST /api/newsletter/subscribers` - Add subscriber
- `PUT /api/newsletter/subscribers/[id]` - Update subscriber
- `POST /api/newsletter/import-subscribers` - Bulk import

### Public Endpoints (No Auth Required)
- `POST /api/newsletter/webhook/sendgrid` - SendGrid webhook
- `GET /api/newsletter/unsubscribe` - Unsubscribe link
- `POST /api/newsletter/preferences` - Update preferences

## 🛡️ Security

### Content Sanitization
All content is automatically sanitized to prevent XSS attacks:
- HTML content is filtered through allowlists
- User inputs are escaped and validated
- File uploads are restricted and validated

### Webhook Security
SendGrid webhooks are verified using signature validation:

```env
NEWSLETTER_WEBHOOK_SECRET=your-webhook-secret
```

### Rate Limiting
Email sending is rate-limited to prevent abuse:
- Test emails: 10 per 15 minutes
- Newsletter sends: 50 per hour
- API endpoints: 100 per 15 minutes

## 🔍 Troubleshooting

### Authentication Issues

**"Directus authentication token required"**
- Ensure your auth system is providing valid Directus tokens
- Check that the Authorization header is properly set
- Verify the token has necessary permissions in Directus

**"Invalid or expired Directus token"**
- Check token expiration in Directus
- Ensure the token has access to newsletter collections
- Verify Directus URL is correct

### Module Setup Issues

**"Module not found"**
```bash
# Ensure the module is properly installed
pnpm install @hue-studios/nuxt-newsletter

# Check that it's listed in nuxt.config.ts modules array
```

**"Tailwind classes not applied"**
```javascript
// Ensure the module path is in tailwind.config.js content array
content: [
  './node_modules/@hue-studios/nuxt-newsletter/dist/**/*.{js,vue,ts}'
]
```

**"Shadcn components not found"**
```bash
# Install required components
npx shadcn-vue@latest add button input label textarea dialog badge card tabs dropdown-menu select switch slider toast alert separator progress sonner
```

### SendGrid Issues

**"SendGrid API key invalid"**
- Verify API key is correct in environment variables
- Check API key permissions in SendGrid dashboard
- Ensure sender email is verified in SendGrid

**"Webhook events not received"**
- Verify webhook URL is accessible
- Check webhook secret configuration
- Enable webhook signature verification

## 📈 Performance

### Optimization Tips

1. **Use pagination** for large subscriber lists
2. **Enable caching** for newsletter templates
3. **Optimize images** before adding to newsletters
4. **Use CDN** for static assets
5. **Monitor rate limits** for email sending

### Database Considerations

- Index frequently queried fields (email, status, created_at)
- Regular cleanup of old analytics data
- Archive sent newsletters after 1 year
- Use database partitioning for large subscriber lists

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

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

## 📄 License

MIT License - see LICENSE file for details.

## 🔗 Links

- [GitHub Repository](https://github.com/hue-studios/nuxt-newsletter)
- [Documentation](https://newsletter-docs.huestudios.com)
- [Directus Documentation](https://docs.directus.io/)
- [SendGrid Documentation](https://docs.sendgrid.com/)
- [MJML Documentation](https://mjml.io/documentation/)

---

Built with ❤️ by [Hue Studios](https://huestudios.com)