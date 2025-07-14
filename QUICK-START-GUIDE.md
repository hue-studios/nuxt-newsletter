# Quick Start Guide - Newsletter Module

Get your newsletter system up and running in under 5 minutes! This guide covers the fastest path to a working newsletter editor.

## 🚀 2-Minute Setup (Recommended)

### Use the Interactive Setup Wizard

```bash
# Install the module
npm install @hue-studios/nuxt-newsletter

# Run the setup wizard
npx newsletter-setup-wizard
```

The wizard will:
- ✅ Configure your Directus connection
- ✅ Set up authentication (static or middleware)
- ✅ Create all required collections
- ✅ Install advanced block types
- ✅ Configure SendGrid (optional)
- ✅ Set up Tailwind CSS 4 automatically
- ✅ Generate your configuration files

## 📋 Manual Setup

### 1. Install the Module

```bash
npm install @hue-studios/nuxt-newsletter

# Optional but recommended for better performance
npm install mjml
```

### 2. Configure nuxt.config.ts

```typescript
export default defineNuxtConfig({
  modules: ['@hue-studios/nuxt-newsletter'],
  
  newsletter: {
    // REQUIRED: Directus connection
    directus: {
      url: process.env.DIRECTUS_URL!,
      auth: {
        type: 'static',
        token: process.env.DIRECTUS_TOKEN
      }
    },
    
    // OPTIONAL: SendGrid for email delivery
    sendgrid: {
      apiKey: process.env.SENDGRID_API_KEY,
      defaultFromEmail: 'newsletter@yourcompany.com',
      defaultFromName: 'Your Company'
    },
    
    // OPTIONAL: UI customization
    ui: {
      icons: 'lucide',          // Icon library
      enableDragDrop: true,     // Drag and drop blocks
      autoInstallTailwind: true,// Auto-setup Tailwind CSS 4
      theme: {
        primaryColor: 'blue',   // Primary theme color
        darkMode: false         // Dark mode support
      }
    },
    
    // OPTIONAL: Performance & development
    mjmlMode: 'server',  // Use 'server' for production
    prefix: 'Newsletter', // Component prefix
    dev: false           // Enable dev helpers
  }
})
```

### 3. Create .env File

```bash
# Required
DIRECTUS_URL=https://your-directus.com
DIRECTUS_TOKEN=your-static-token

# Optional but recommended
SENDGRID_API_KEY=SG.your-api-key
SENDGRID_WEBHOOK_SECRET=your-webhook-secret
DIRECTUS_ADMIN_TOKEN=admin-token-for-webhooks
```

### 4. Set Up Directus Collections

```bash
# Basic setup (required)
npm run newsletter:setup https://your-directus.com admin@example.com password

# Add advanced blocks (recommended)
npm run newsletter:advanced-blocks https://your-directus.com admin@example.com password

# Verify everything is working
npm run newsletter:verify
```

### 5. Create Your First Newsletter Page

```vue
<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto py-8">
      <h1 class="text-3xl font-bold mb-8">Create Newsletter</h1>
      
      <!-- Newsletter Editor with live preview -->
      <NewsletterEditor 
        v-model="newsletter" 
        :show-preview="true"
      />
      
      <!-- Action buttons -->
      <div class="mt-6 flex gap-4">
        <button 
          @click="saveNewsletter" 
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Save Draft
        </button>
        
        <button 
          @click="sendTestEmail" 
          class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Send Test
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const newsletter = ref({
  subject: '',
  preheader: '',
  blocks: []
})

const { createNewsletter, updateNewsletter } = useDirectusNewsletter()
const { sendTestEmail: sendTest } = useSendGrid()

const saveNewsletter = async () => {
  try {
    if (newsletter.value.id) {
      await updateNewsletter(newsletter.value.id, newsletter.value)
    } else {
      const created = await createNewsletter(newsletter.value)
      newsletter.value.id = created.id
    }
    alert('Newsletter saved!')
  } catch (error) {
    console.error('Save failed:', error)
  }
}

const sendTestEmail = async () => {
  const email = prompt('Enter test email address:')
  if (email) {
    await sendTest(newsletter.value, email)
    alert('Test email sent!')
  }
}
</script>
```

## 🎨 UI Configuration Examples

### Dark Mode Support

```typescript
// nuxt.config.ts
newsletter: {
  ui: {
    theme: {
      darkMode: true // Enables dark mode toggle
    }
  }
}
```

### Custom Icon Library

```typescript
// Choose your preferred icon set
newsletter: {
  ui: {
    icons: 'heroicons' // Options: 'lucide', 'heroicons', 'tabler'
  }
}
```

### Disable Auto Features

```typescript
// Full manual control
newsletter: {
  ui: {
    enableDragDrop: false,    // Disable drag and drop
    autoInstallTailwind: false // Manage Tailwind manually
  }
}
```

## 🔐 Authentication Examples

### Static Token (Simple)

```typescript
// nuxt.config.ts
newsletter: {
  directus: {
    auth: {
      type: 'static',
      token: process.env.DIRECTUS_TOKEN
    }
  }
}
```

### Middleware Auth (Advanced)

```typescript
// nuxt.config.ts
newsletter: {
  directus: {
    auth: {
      type: 'middleware',
      middleware: 'newsletter-auth'
    }
  }
}

// middleware/newsletter-auth.ts
export default defineNuxtRouteMiddleware(async (to, from) => {
  const { setAuthToken } = useDirectusNewsletter()
  const { $auth } = useNuxtApp() // Your auth system
  
  if ($auth.user?.directusToken) {
    setAuthToken($auth.user.directusToken)
  } else {
    return navigateTo('/login')
  }
})

// pages/admin/newsletter.vue
<template>
  <NewsletterEditor v-model="newsletter" />
</template>

<script setup>
definePageMeta({
  middleware: 'newsletter-auth'
})
</script>
```

## ⚡ Performance Optimization

### Server-Side MJML Compilation

```bash
# Install MJML for server-side compilation
npm install mjml
```

```typescript
// nuxt.config.ts
newsletter: {
  mjmlMode: 'server' // Compile on server for better performance
}
```

### Production Optimizations

```typescript
// nuxt.config.ts
newsletter: {
  dev: false,           // Disable dev helpers in production
  mjmlMode: 'server',   // Server compilation
  ui: {
    autoInstallTailwind: false // Skip auto-install in production
  }
}
```

## 🎯 Common Use Cases

### Newsletter with Templates

```vue
<script setup>
const { fetchTemplates, fetchTemplate } = useDirectusNewsletter()
const { loadFromTemplate } = useNewsletterEditor()

const templates = await fetchTemplates()

const applyTemplate = async (templateId) => {
  const template = await fetchTemplate(templateId)
  loadFromTemplate(template)
}
</script>

<template>
  <select @change="applyTemplate($event.target.value)">
    <option value="">Choose template...</option>
    <option v-for="t in templates" :key="t.id" :value="t.id">
      {{ t.name }}
    </option>
  </select>
  
  <NewsletterEditor v-model="newsletter" />
</template>
```

### Send to Mailing List

```vue
<script setup>
const { fetchMailingLists, fetchMailingListSubscribers } = useDirectusNewsletter()
const { sendNewsletter } = useSendGrid()

const lists = await fetchMailingLists()
const selectedListId = ref('')

const sendToList = async () => {
  const subscribers = await fetchMailingListSubscribers(selectedListId.value)
  const recipients = subscribers.map(sub => ({
    email: sub.email,
    name: sub.name
  }))
  
  await sendNewsletter(newsletter.value, recipients, {
    categories: ['newsletter', 'campaign']
  })
}
</script>
```

### Error Handling with User-Friendly Messages

```vue
<script setup>
const { handleError, currentError, clearError } = useNewsletterErrors()

const saveNewsletter = async () => {
  try {
    await createNewsletter(newsletter.value)
  } catch (error) {
    handleError(error, 'Saving newsletter')
  }
}
</script>

<template>
  <!-- Error display -->
  <div v-if="currentError" class="bg-red-50 p-4 rounded-lg mb-4">
    <h4 class="text-red-800 font-bold">{{ currentError.message }}</h4>
    <p class="text-red-600">{{ currentError.solution }}</p>
    <button @click="clearError" class="text-red-500 underline">
      Dismiss
    </button>
  </div>
  
  <!-- Editor -->
  <NewsletterEditor v-model="newsletter" />
</template>
```

## 🧪 Testing Your Setup

### 1. Verify Installation

```bash
npm run newsletter:verify
```

This checks:
- ✅ All dependencies installed
- ✅ Tailwind CSS 4 configured
- ✅ Directus connection
- ✅ Environment variables
- ✅ Module configuration

### 2. Test in Browser

1. Start dev server: `npm run dev`
2. Navigate to your newsletter page
3. Try adding blocks from the toolbar
4. Check the live preview updates
5. Save a draft newsletter
6. Send a test email

### 3. Common Issues

**Styles not loading?**
```bash
# The module auto-installs Tailwind CSS 4
# If issues persist, install manually:
npm install tailwindcss@^4.0.0 @tailwindcss/vite
```

**Directus connection failed?**
```bash
# Check your .env file has:
DIRECTUS_URL=https://your-actual-directus-url.com
DIRECTUS_TOKEN=your-actual-token
```

**MJML compilation errors?**
```bash
# For server-side compilation:
npm install mjml

# Or use client-side (slower but no deps):
newsletter: { mjmlMode: 'client' }
```

## 📚 Next Steps

1. **Explore Components**: Check out all available [components](./README.md#-components)
2. **Add Custom Blocks**: Create your own [block types](./docs/custom-blocks.md)
3. **Set Up Analytics**: Configure [SendGrid webhooks](./docs/sendgrid-webhooks.md)
4. **Production Deploy**: See [deployment guide](./docs/deployment.md)

## 🆘 Need Help?

- 📖 [Full Documentation](./README.md)
- 🐛 [Report Issues](https://github.com/hue-studios/nuxt-newsletter/issues)
- 💬 [Ask Questions](https://github.com/hue-studios/nuxt-newsletter/discussions)
- 🏃 [Run Setup Wizard](./README.md#3-run-setup-wizard-recommended)

---

**Pro Tip**: Use the setup wizard for the smoothest experience! 🚀

```bash
npx newsletter-setup-wizard
```