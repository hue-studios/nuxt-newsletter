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

## 🎯 Usage Guide

### Built-in Components

The module provides several pre-built Vue components that you can use directly in your pages and components:

#### Newsletter Management Components

```vue
<!-- pages/admin/newsletters.vue -->
<template>
  <div class="container mx-auto p-6">
    <h1 class="text-3xl font-bold mb-6">Newsletter Management</h1>
    
    <!-- Newsletter List Component -->
    <NewsletterList 
      :show-filters="true"
      :show-stats="true"
      @newsletter-selected="handleNewsletterSelect"
    />
  </div>
</template>

<script setup>
// Optional: Handle newsletter selection
const handleNewsletterSelect = (newsletter) => {
  navigateTo(`/admin/newsletters/${newsletter.id}`)
}
</script>
```

#### Newsletter Editor

```vue
<!-- pages/admin/newsletters/[id].vue -->
<template>
  <div class="h-screen flex flex-col">
    <!-- Editor Header -->
    <NewsletterEditorHeader 
      :newsletter="newsletter"
      :is-saving="isSaving"
      @save="handleSave"
      @send-test="handleSendTest"
      @publish="handlePublish"
    />
    
    <!-- Main Editor Interface -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Block Library Sidebar -->
      <NewsletterBlockLibrary 
        class="w-80 border-r"
        @block-add="handleBlockAdd"
      />
      
      <!-- Main Editor Canvas -->
      <NewsletterEditor 
        v-model="newsletter"
        class="flex-1"
        :preview-mode="false"
        @content-change="handleContentChange"
      />
      
      <!-- Properties Panel -->
      <NewsletterPropertiesPanel 
        class="w-80 border-l"
        :selected-block="selectedBlock"
        @properties-change="handlePropertiesChange"
      />
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const { newsletter, selectedBlock, isSaving } = useNewsletterEditor()

// Load newsletter data
await refresh()

const handleSave = async () => {
  await saveNewsletter()
}

const handleSendTest = async (email) => {
  await sendTestEmail(email)
}

const handlePublish = async () => {
  await publishNewsletter()
}
</script>
```

#### Analytics Dashboard

```vue
<!-- pages/admin/analytics/[id].vue -->
<template>
  <div class="container mx-auto p-6">
    <NewsletterAnalyticsDashboard 
      :newsletter-id="route.params.id"
      :time-range="timeRange"
      @time-range-change="handleTimeRangeChange"
    />
  </div>
</template>

<script setup>
const route = useRoute()
const timeRange = ref('30d')

const handleTimeRangeChange = (range) => {
  timeRange.value = range
}
</script>
```

#### Subscriber Management

```vue
<!-- pages/admin/subscribers.vue -->
<template>
  <div class="container mx-auto p-6">
    <div class="mb-6">
      <h1 class="text-3xl font-bold mb-2">Subscribers</h1>
      <p class="text-gray-600">Manage your newsletter subscribers and mailing lists</p>
    </div>
    
    <!-- Subscriber List with Import/Export -->
    <SubscriberList 
      :show-import="true"
      :show-export="true"
      :show-segments="true"
      @subscriber-import="handleImport"
      @subscriber-export="handleExport"
    />
  </div>
</template>

<script setup>
const handleImport = async (file) => {
  // Handle CSV import
  await importSubscribers(file)
}

const handleExport = async () => {
  // Handle subscriber export
  await exportSubscribers()
}
</script>
```

### Custom Page Layouts

#### Newsletter Admin Dashboard

```vue
<!-- pages/admin/dashboard.vue -->
<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Navigation -->
    <nav class="bg-white shadow-sm border-b">
      <div class="container mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <h1 class="text-xl font-semibold">Newsletter Dashboard</h1>
          <div class="flex space-x-4">
            <NuxtLink to="/admin/newsletters/new" class="btn btn-primary">
              Create Newsletter
            </NuxtLink>
          </div>
        </div>
      </div>
    </nav>
    
    <!-- Main Content -->
    <div class="container mx-auto px-6 py-8">
      <!-- Stats Overview -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <NewsletterStatsCard 
          title="Total Subscribers"
          :value="stats.totalSubscribers"
          :change="stats.subscriberGrowth"
          icon="users"
        />
        <NewsletterStatsCard 
          title="Open Rate"
          :value="`${stats.averageOpenRate}%`"
          :change="stats.openRateChange"
          icon="mail-open"
        />
        <NewsletterStatsCard 
          title="Click Rate"
          :value="`${stats.averageClickRate}%`"
          :change="stats.clickRateChange"
          icon="mouse-pointer"
        />
      </div>
      
      <!-- Recent Newsletters -->
      <div class="bg-white rounded-lg shadow-sm border p-6">
        <h2 class="text-lg font-semibold mb-4">Recent Newsletters</h2>
        <NewsletterList 
          :limit="5"
          :show-filters="false"
          compact
        />
      </div>
    </div>
  </div>
</template>

<script setup>
// Fetch dashboard stats
const { data: stats } = await $fetch('/api/newsletter/stats')
</script>
```

#### Public Newsletter Archive

```vue
<!-- pages/newsletters/index.vue -->
<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm">
      <div class="container mx-auto px-6 py-8">
        <h1 class="text-4xl font-bold text-center mb-4">Newsletter Archive</h1>
        <p class="text-gray-600 text-center max-w-2xl mx-auto">
          Browse our past newsletters and stay up to date with our latest content.
        </p>
      </div>
    </header>
    
    <!-- Newsletter Grid -->
    <div class="container mx-auto px-6 py-8">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <NewsletterPreviewCard 
          v-for="newsletter in newsletters"
          :key="newsletter.id"
          :newsletter="newsletter"
          @view="handleView"
        />
      </div>
      
      <!-- Load More -->
      <div class="text-center mt-8" v-if="hasMore">
        <button 
          @click="loadMore"
          class="btn btn-outline"
          :disabled="loading"
        >
          Load More
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
// Fetch public newsletters
const { newsletters, hasMore, loading, loadMore } = await usePublicNewsletters()

const handleView = (newsletter) => {
  navigateTo(`/newsletters/${newsletter.slug}`)
}
</script>
```

### Programmatic Usage with Composables

#### Using the Core Newsletter Composable

```vue
<!-- components/MyNewsletterManager.vue -->
<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">My Newsletters</h2>
      <button @click="createNewsletter" class="btn btn-primary">
        Create New
      </button>
    </div>
    
    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-8">
      <div class="spinner"></div>
      <p>Loading newsletters...</p>
    </div>
    
    <!-- Newsletter List -->
    <div v-else class="space-y-4">
      <div 
        v-for="newsletter in newsletters"
        :key="newsletter.id"
        class="border rounded-lg p-4 hover:shadow-md transition-shadow"
      >
        <h3 class="font-semibold">{{ newsletter.title }}</h3>
        <p class="text-gray-600 text-sm mb-2">{{ newsletter.subject_line }}</p>
        <div class="flex space-x-2">
          <button 
            @click="editNewsletter(newsletter)"
            class="btn btn-sm btn-outline"
          >
            Edit
          </button>
          <button 
            @click="duplicateNewsletter(newsletter)"
            class="btn btn-sm btn-outline"
          >
            Duplicate
          </button>
          <button 
            @click="deleteNewsletter(newsletter.id)"
            class="btn btn-sm btn-danger"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Use the newsletter composable
const {
  newsletters,
  isLoading,
  fetchNewsletters,
  createNewsletter: createNewsletterApi,
  updateNewsletter,
  deleteNewsletter: deleteNewsletterApi
} = useNewsletter()

// Load newsletters on mount
await fetchNewsletters()

const createNewsletter = async () => {
  const newsletter = await createNewsletterApi({
    title: 'New Newsletter',
    subject_line: 'Welcome to our newsletter',
    from_email: 'newsletter@example.com',
    from_name: 'Your Company',
    category: 'general'
  })
  
  // Navigate to editor
  navigateTo(`/admin/newsletters/${newsletter.id}`)
}

const editNewsletter = (newsletter) => {
  navigateTo(`/admin/newsletters/${newsletter.id}`)
}

const duplicateNewsletter = async (newsletter) => {
  const duplicated = await createNewsletterApi({
    title: `${newsletter.title} (Copy)`,
    subject_line: newsletter.subject_line,
    from_email: newsletter.from_email,
    from_name: newsletter.from_name,
    category: newsletter.category,
    blocks: newsletter.blocks // Copy the content
  })
  
  navigateTo(`/admin/newsletters/${duplicated.id}`)
}

const deleteNewsletter = async (id) => {
  if (confirm('Are you sure you want to delete this newsletter?')) {
    await deleteNewsletterApi(id)
    await fetchNewsletters() // Refresh list
  }
}
</script>
```

#### Advanced Analytics Usage

```vue
<!-- components/NewsletterAnalytics.vue -->
<template>
  <div class="space-y-6">
    <!-- Overview Stats -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-white p-4 rounded-lg border">
        <div class="text-2xl font-bold">{{ analytics.totalSent }}</div>
        <div class="text-gray-600 text-sm">Total Sent</div>
      </div>
      <div class="bg-white p-4 rounded-lg border">
        <div class="text-2xl font-bold text-green-600">{{ analytics.openRate }}%</div>
        <div class="text-gray-600 text-sm">Open Rate</div>
      </div>
      <div class="bg-white p-4 rounded-lg border">
        <div class="text-2xl font-bold text-blue-600">{{ analytics.clickRate }}%</div>
        <div class="text-gray-600 text-sm">Click Rate</div>
      </div>
      <div class="bg-white p-4 rounded-lg border">
        <div class="text-2xl font-bold text-red-600">{{ analytics.bounceRate }}%</div>
        <div class="text-gray-600 text-sm">Bounce Rate</div>
      </div>
    </div>
    
    <!-- Engagement Timeline -->
    <div class="bg-white p-6 rounded-lg border">
      <h3 class="text-lg font-semibold mb-4">Engagement Timeline</h3>
      <NewsletterEngagementChart :data="engagementData" />
    </div>
    
    <!-- Top Links -->
    <div class="bg-white p-6 rounded-lg border">
      <h3 class="text-lg font-semibold mb-4">Top Clicked Links</h3>
      <div class="space-y-2">
        <div 
          v-for="link in topLinks"
          :key="link.url"
          class="flex justify-between items-center p-2 hover:bg-gray-50 rounded"
        >
          <div class="truncate">{{ link.url }}</div>
          <div class="text-sm text-gray-600">{{ link.clicks }} clicks</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
interface Props {
  newsletterId: string
  timeRange?: string
}

const props = withDefaults(defineProps<Props>(), {
  timeRange: '30d'
})

// Use analytics composable
const { 
  analytics, 
  engagementData, 
  topLinks,
  fetchAnalytics 
} = useNewsletterAnalytics()

// Fetch analytics data
await fetchAnalytics(props.newsletterId, props.timeRange)

// Watch for time range changes
watch(() => props.timeRange, async (newRange) => {
  await fetchAnalytics(props.newsletterId, newRange)
})
</script>
```

### Custom Template Creation

```vue
<!-- components/TemplateCreator.vue -->
<template>
  <div class="max-w-4xl mx-auto p-6">
    <h2 class="text-2xl font-bold mb-6">Create Newsletter Template</h2>
    
    <form @submit.prevent="saveTemplate" class="space-y-6">
      <!-- Template Info -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium mb-2">Template Name</label>
          <input 
            v-model="template.name"
            type="text"
            class="w-full p-2 border rounded-md"
            required
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Category</label>
          <select 
            v-model="template.category"
            class="w-full p-2 border rounded-md"
            required
          >
            <option value="marketing">Marketing</option>
            <option value="newsletter">Newsletter</option>
            <option value="announcement">Announcement</option>
            <option value="product">Product</option>
          </select>
        </div>
      </div>
      
      <!-- Template Description -->
      <div>
        <label class="block text-sm font-medium mb-2">Description</label>
        <textarea 
          v-model="template.description"
          class="w-full p-2 border rounded-md h-24"
          placeholder="Describe this template..."
        ></textarea>
      </div>
      
      <!-- Template Builder -->
      <div class="border rounded-lg p-4">
        <h3 class="font-semibold mb-4">Template Layout</h3>
        <NewsletterTemplateBuilder 
          v-model="template.blocks"
          @preview="showPreview = true"
        />
      </div>
      
      <!-- Actions -->
      <div class="flex justify-end space-x-4">
        <button 
          type="button"
          @click="showPreview = true"
          class="btn btn-outline"
        >
          Preview
        </button>
        <button 
          type="submit"
          class="btn btn-primary"
          :disabled="isSaving"
        >
          {{ isSaving ? 'Saving...' : 'Save Template' }}
        </button>
      </div>
    </form>
    
    <!-- Preview Modal -->
    <NewsletterPreviewModal 
      v-if="showPreview"
      :template="template"
      @close="showPreview = false"
    />
  </div>
</template>

<script setup>
const { createTemplate, isSaving } = useNewsletterTemplates()

const template = ref({
  name: '',
  category: 'newsletter',
  description: '',
  blocks: []
})

const showPreview = ref(false)

const saveTemplate = async () => {
  try {
    const saved = await createTemplate(template.value)
    navigateTo(`/admin/templates/${saved.id}`)
  } catch (error) {
    console.error('Failed to save template:', error)
  }
}
</script>
```

### Webhook Integration

```typescript
// server/api/webhook/newsletter.post.ts
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const signature = getHeader(event, 'x-webhook-signature')
    
    // Verify webhook signature
    const { verifyWebhookSignature } = useNewsletterWebhooks()
    if (!verifyWebhookSignature(body, signature)) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid webhook signature'
      })
    }
    
    // Process webhook events
    for (const eventData of body.events) {
      await processNewsletterEvent(eventData)
    }
    
    return { success: true }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Webhook processing failed'
    })
  }
})

async function processNewsletterEvent(eventData: any) {
  const { trackNewsletterEvent } = useNewsletterAnalytics()
  
  switch (eventData.event) {
    case 'delivered':
      await trackNewsletterEvent(eventData.sg_message_id, 'delivered', {
        timestamp: eventData.timestamp,
        email: eventData.email
      })
      break
      
    case 'open':
      await trackNewsletterEvent(eventData.sg_message_id, 'opened', {
        timestamp: eventData.timestamp,
        email: eventData.email,
        user_agent: eventData.useragent
      })
      break
      
    case 'click':
      await trackNewsletterEvent(eventData.sg_message_id, 'clicked', {
        timestamp: eventData.timestamp,
        email: eventData.email,
        url: eventData.url
      })
      break
      
    case 'bounce':
      await trackNewsletterEvent(eventData.sg_message_id, 'bounced', {
        timestamp: eventData.timestamp,
        email: eventData.email,
        reason: eventData.reason
      })
      break
  }
}
```

### Public Subscription Form

```vue
<!-- components/NewsletterSubscriptionForm.vue -->
<template>
  <div class="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
    <h3 class="text-xl font-semibold mb-4">Subscribe to Our Newsletter</h3>
    <p class="text-gray-600 mb-6">
      Get the latest updates and insights delivered to your inbox.
    </p>
    
    <form @submit.prevent="handleSubscribe" class="space-y-4">
      <div>
        <label class="block text-sm font-medium mb-2">Email Address</label>
        <input 
          v-model="email"
          type="email"
          class="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="your@email.com"
          required
        />
      </div>
      
      <div>
        <label class="block text-sm font-medium mb-2">First Name</label>
        <input 
          v-model="firstName"
          type="text"
          class="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="John"
        />
      </div>
      
      <!-- Mailing List Selection -->
      <div v-if="mailingLists.length > 1">
        <label class="block text-sm font-medium mb-2">Interests</label>
        <div class="space-y-2">
          <label 
            v-for="list in mailingLists"
            :key="list.id"
            class="flex items-center"
          >
            <input 
              v-model="selectedLists"
              :value="list.id"
              type="checkbox"
              class="mr-2"
            />
            <span class="text-sm">{{ list.name }}</span>
          </label>
        </div>
      </div>
      
      <!-- GDPR Consent -->
      <div class="flex items-start space-x-2">
        <input 
          v-model="hasConsent"
          type="checkbox"
          class="mt-1"
          required
        />
        <label class="text-sm text-gray-600">
          I agree to receive marketing emails and understand I can 
          unsubscribe at any time.
        </label>
      </div>
      
      <button 
        type="submit"
        class="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 disabled:opacity-50"
        :disabled="isSubmitting"
      >
        {{ isSubmitting ? 'Subscribing...' : 'Subscribe' }}
      </button>
    </form>
    
    <!-- Success Message -->
    <div v-if="isSubscribed" class="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
      <p class="text-green-800 text-sm">
        Thanks for subscribing! Please check your email to confirm your subscription.
      </p>
    </div>
  </div>
</template>

<script setup>
const { subscribeToNewsletter, fetchMailingLists } = useNewsletterSubscription()

const email = ref('')
const firstName = ref('')
const selectedLists = ref([])
const hasConsent = ref(false)
const isSubmitting = ref(false)
const isSubscribed = ref(false)

// Fetch available mailing lists
const { data: mailingLists } = await fetchMailingLists()

const handleSubscribe = async () => {
  isSubmitting.value = true
  
  try {
    await subscribeToNewsletter({
      email: email.value,
      first_name: firstName.value,
      mailing_lists: selectedLists.value.length ? selectedLists.value : [mailingLists[0].id],
      source: 'website_signup',
      consent_given: hasConsent.value,
      consent_timestamp: new Date().toISOString()
    })
    
    isSubscribed.value = true
    
    // Reset form
    email.value = ''
    firstName.value = ''
    selectedLists.value = []
    hasConsent.value = false
    
  } catch (error) {
    console.error('Subscription failed:', error)
    // Handle error (show toast, etc.)
  } finally {
    isSubmitting.value = false
  }
}
</script>
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

**"Component not found"**
```typescript
// Ensure the module is properly registered in nuxt.config.ts
modules: [
  '@hue-studios/nuxt-newsletter'
]
```

### Common Issues

**Email delivery problems**
- Verify SendGrid API key is correct
- Check SendGrid sender verification
- Ensure webhook URL is accessible
- Review SendGrid logs for delivery status

**Performance issues**
- Enable caching for newsletter lists
- Optimize image sizes in templates
- Use pagination for large subscriber lists
- Consider using Redis for session storage

## 📈 Best Practices

### Performance Optimization

1. **Use pagination** for large datasets:
```vue
<NewsletterList :limit="20" :offset="currentPage * 20" />
```

2. **Implement caching** for frequently accessed data:
```typescript
// Cache newsletter templates
const { data: templates } = await $fetch('/api/newsletter/templates', {
  server: true,
  key: 'newsletter-templates',
  default: () => []
})
```

3. **Optimize images** in newsletters:
```typescript
// Use responsive images in email templates
const optimizedImageUrl = useOptimizedImage(originalUrl, {
  width: 600,
  quality: 80,
  format: 'webp'
})
```

### SEO & Accessibility

1. **Use semantic HTML** in newsletter templates
2. **Provide alt text** for all images
3. **Ensure proper color contrast** in designs
4. **Test with screen readers** for accessibility

### Security Best Practices

1. **Always validate input** on both client and server
2. **Use HTTPS** for all newsletter-related endpoints
3. **Implement rate limiting** for public endpoints
4. **Regularly rotate** API keys and tokens
5. **Monitor webhook endpoints** for suspicious activity

## 📚 Additional Resources

- [Directus Documentation](https://docs.directus.io/)
- [SendGrid API Documentation](https://docs.sendgrid.com/)
- [MJML Documentation](https://mjml.io/documentation/)
- [Nuxt 3 Documentation](https://nuxt.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.