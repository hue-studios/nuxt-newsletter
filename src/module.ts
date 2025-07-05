// src/module.ts
import { defineNuxtModule, addPlugin, addServerHandler, addComponent, addImports, addComponentsDir, createResolver } from '@nuxt/kit'

export interface ModuleOptions {
  directusUrl: string
  sendgridApiKey?: string
  defaultFromEmail?: string
  defaultFromName?: string
  webhookSecret?: string
  enableAnalytics?: boolean
  enableWebhooks?: boolean
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@your-org/nuxt-newsletter',
    configKey: 'newsletter',
    compatibility: {
      nuxt: '^3.0.0'
    }
  },
  defaults: {
    directusUrl: '',
    enableAnalytics: true,
    enableWebhooks: true
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // Validate required options
    if (!options.directusUrl) {
      throw new Error('Newsletter module requires directusUrl option')
    }

    // Add runtime config
    nuxt.options.runtimeConfig = nuxt.options.runtimeConfig || {}
    nuxt.options.runtimeConfig.newsletter = {
      sendgridApiKey: options.sendgridApiKey,
      defaultFromEmail: options.defaultFromEmail,
      defaultFromName: options.defaultFromName,
      webhookSecret: options.webhookSecret
    }

    nuxt.options.runtimeConfig.public = nuxt.options.runtimeConfig.public || {}
    nuxt.options.runtimeConfig.public.newsletter = {
      directusUrl: options.directusUrl,
      enableAnalytics: options.enableAnalytics,
      enableWebhooks: options.enableWebhooks
    }

    // Add required dependencies
    nuxt.options.build = nuxt.options.build || {}
    nuxt.options.build.transpile = nuxt.options.build.transpile || []
    nuxt.options.build.transpile.push(
      '@directus/sdk',
      'mjml',
      'handlebars',
      '@sendgrid/mail'
    )

    // Add components
    addComponentsDir({
      path: resolver.resolve('./runtime/components'),
      pathPrefix: false,
      prefix: '',
      global: true
    })

    // Add composables
    addImports([
      {
        name: 'useNewsletter',
        from: resolver.resolve('./runtime/composables/useNewsletter')
      },
      {
        name: 'useNewsletterBlocks',
        from: resolver.resolve('./runtime/composables/useNewsletterBlocks')
      },
      {
        name: 'useNewsletterTemplates',
        from: resolver.resolve('./runtime/composables/useNewsletterTemplates')
      },
      {
        name: 'useDirectus',
        from: resolver.resolve('./runtime/composables/useDirectus')
      }
    ])

    // Add server handlers
    addServerHandler({
      route: '/api/newsletter/compile-mjml',
      handler: resolver.resolve('./runtime/server/api/newsletter/compile-mjml.post')
    })

    addServerHandler({
      route: '/api/newsletter/send-test',
      handler: resolver.resolve('./runtime/server/api/newsletter/send-test.post')
    })

    addServerHandler({
      route: '/api/newsletter/send',
      handler: resolver.resolve('./runtime/server/api/newsletter/send.post')
    })

    addServerHandler({
      route: '/api/newsletter/upload-image',
      handler: resolver.resolve('./runtime/server/api/newsletter/upload-image.post')
    })

    addServerHandler({
      route: '/api/newsletter/analytics/**',
      handler: resolver.resolve('./runtime/server/api/newsletter/analytics/[id].get')
    })

    if (options.enableWebhooks) {
      addServerHandler({
        route: '/api/newsletter/webhook/sendgrid',
        handler: resolver.resolve('./runtime/server/api/newsletter/webhook/sendgrid.post')
      })
    }

    // Add plugins
    addPlugin(resolver.resolve('./runtime/plugins/newsletter.client'))

    // Add types
    nuxt.hook('prepare:types', (options) => {
      options.references.push({
        path: resolver.resolve('./runtime/types/newsletter.d.ts')
      })
    })

    // Add CSS if using built-in styles
    nuxt.options.css = nuxt.options.css || []
    nuxt.options.css.push(resolver.resolve('./runtime/assets/newsletter.css'))

    // Configure GSAP
    nuxt.options.build = nuxt.options.build || {}
    nuxt.options.build.transpile = nuxt.options.build.transpile || []
    nuxt.options.build.transpile.push('gsap')
  }
})

// src/runtime/assets/newsletter.css
.newsletter-editor {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.newsletter-block {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.newsletter-block:hover {
  transform: translateY(-1px);
}

.block-library-item {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.block-library-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.newsletter-canvas {
  position: relative;
  min-height: 500px;
}

.drop-zone {
  position: absolute;
  left: 0;
  right: 0;
  height: 4px;
  border-radius: 2px;
  transition: all 0.2s ease;
  z-index: 10;
}

.drop-zone.active {
  height: 8px;
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.template-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.template-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.newsletter-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.newsletter-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

/* Block transitions */
.block-enter-active,
.block-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.block-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

.block-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.block-move {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Rich text editor */
.tiptap-editor .ProseMirror {
  outline: none;
  padding: 12px;
  min-height: 100px;
}

.tiptap-editor .ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: #9ca3af;
  pointer-events: none;
  height: 0;
}

.tiptap-editor .ProseMirror h1,
.tiptap-editor .ProseMirror h2,
.tiptap-editor .ProseMirror h3 {
  margin-top: 0.5em;
  margin-bottom: 0.5em;
}

.tiptap-editor .ProseMirror p {
  margin-top: 0.5em;
  margin-bottom: 0.5em;
}

.tiptap-editor .ProseMirror ul,
.tiptap-editor .ProseMirror ol {
  padding-left: 1.5em;
  margin: 0.5em 0;
}

.tiptap-editor .ProseMirror a {
  color: #3b82f6;
  text-decoration: underline;
}

.tiptap-editor .ProseMirror a:hover {
  color: #1d4ed8;
}

/* Analytics charts */
.analytics-chart {
  font-family: inherit;
}

.analytics-chart .recharts-cartesian-axis-tick-value {
  font-size: 12px;
  fill: #6b7280;
}

.analytics-chart .recharts-legend-item-text {
  font-size: 12px;
  color: #374151 !important;
}

/* Loading states */
.newsletter-skeleton {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.newsletter-skeleton {
  background: linear-gradient(
    90deg,
    #f3f4f6 25%,
    #e5e7eb 50%,
    #f3f4f6 75%
  );
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Responsive design */
@media (max-width: 768px) {
  .newsletter-editor {
    flex-direction: column;
  }
  
  .newsletter-sidebar {
    width: 100%;
    max-height: 300px;
    order: 2;
  }
  
  .newsletter-content {
    order: 1;
  }
  
  .newsletter-canvas {
    padding: 1rem;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .newsletter-editor {
    background-color: #0f172a;
    color: #f1f5f9;
  }
  
  .newsletter-block {
    border-color: #334155;
  }
  
  .newsletter-block:hover {
    border-color: #475569;
  }
  
  .block-library-item {
    background-color: #1e293b;
    border-color: #334155;
  }
  
  .block-library-item:hover {
    background-color: #334155;
    border-color: #475569;
  }
}

/* Print styles */
@media print {
  .newsletter-sidebar,
  .newsletter-toolbar,
  .block-controls {
    display: none !important;
  }
  
  .newsletter-canvas {
    box-shadow: none !important;
    border: none !important;
    margin: 0 !important;
    padding: 0 !important;
  }
}

// src/runtime/components/NewsletterAnalytics.vue
<template>
  <div class="newsletter-analytics">
    <!-- Performance Chart -->
    <Card class="mb-6">
      <CardHeader>
        <CardTitle>Performance Overview</CardTitle>
        <CardDescription>
          Track your newsletter's open and click rates over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="h-64">
          <LineChart
            v-if="chartData.length > 0"
            :data="chartData"
            x-key="date"
            :y-keys="['openRate', 'clickRate']"
            :colors="['#3b82f6', '#8b5cf6']"
            class="analytics-chart"
          />
          <div v-else class="flex items-center justify-center h-full text-gray-500">
            <div class="text-center">
              <Icon name="lucide:bar-chart-3" class="w-12 h-12 mx-auto mb-4" />
              <p>No analytics data available</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Engagement Metrics -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <Card>
        <CardContent class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Avg. Open Rate</p>
              <p class="text-2xl font-bold text-green-600">{{ averageOpenRate }}%</p>
            </div>
            <div class="text-green-500">
              <Icon name="lucide:trending-up" class="w-8 h-8" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Avg. Click Rate</p>
              <p class="text-2xl font-bold text-blue-600">{{ averageClickRate }}%</p>
            </div>
            <div class="text-blue-500">
              <Icon name="lucide:mouse-pointer-click" class="w-8 h-8" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Total Sent</p>
              <p class="text-2xl font-bold text-purple-600">{{ totalSent.toLocaleString() }}</p>
            </div>
            <div class="text-purple-500">
              <Icon name="lucide:send" class="w-8 h-8" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Top Performing Newsletters -->
    <Card>
      <CardHeader>
        <CardTitle>Top Performing Newsletters</CardTitle>
        <CardDescription>
          Your best newsletters by engagement rate
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="space-y-4">
          <div
            v-for="newsletter in topNewsletters"
            :key="newsletter.id"
            class="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
          >
            <div class="flex-1">
              <h4 class="font-medium text-gray-900">{{ newsletter.title }}</h4>
              <p class="text-sm text-gray-600">{{ newsletter.subject_line }}</p>
            </div>
            <div class="text-right">
              <p class="text-sm font-medium text-green-600">{{ newsletter.open_rate?.toFixed(1) }}% open</p>
              <p class="text-sm text-gray-500">{{ newsletter.total_opens }} opens</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import type { Newsletter } from '~/types/newsletter'

interface Props {
  newsletters: Newsletter[]
}

const props = defineProps<Props>()

// Computed analytics
const chartData = computed(() => {
  return props.newsletters
    .filter(n => n.status === 'sent' && n.open_rate !== undefined)
    .slice(-10)
    .map(n => ({
      date: new Date(n.created_at!).toLocaleDateString(),
      openRate: n.open_rate || 0,
      clickRate: n.click_rate || 0
    }))
})

const averageOpenRate = computed(() => {
  const sentNewsletters = props.newsletters.filter(n => n.status === 'sent' && n.open_rate)
  if (sentNewsletters.length === 0) return '0.0'
  
  const avg = sentNewsletters.reduce((sum, n) => sum + (n.open_rate || 0), 0) / sentNewsletters.length
  return avg.toFixed(1)
})

const averageClickRate = computed(() => {
  const sentNewsletters = props.newsletters.filter(n => n.status === 'sent' && n.click_rate)
  if (sentNewsletters.length === 0) return '0.0'
  
  const avg = sentNewsletters.reduce((sum, n) => sum + (n.click_rate || 0), 0) / sentNewsletters.length
  return avg.toFixed(1)
})

const totalSent = computed(() => {
  return props.newsletters.filter(n => n.status === 'sent').length
})

const topNewsletters = computed(() => {
  return props.newsletters
    .filter(n => n.status === 'sent' && n.open_rate)
    .sort((a, b) => (b.open_rate || 0) - (a.open_rate || 0))
    .slice(0, 5)
})
</script>

// src/runtime/components/NewsletterPreview.vue
<template>
  <div class="newsletter-preview">
    <!-- Device Toggle -->
    <div class="flex items-center justify-between mb-4">
      <h3 class="font-medium text-gray-900">Preview</h3>
      <div class="flex border rounded-lg overflow-hidden">
        <Button
          variant="ghost"
          size="sm"
          :class="{ 'bg-gray-100': device === 'desktop' }"
          @click="device = 'desktop'"
        >
          <Icon name="lucide:monitor" class="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          :class="{ 'bg-gray-100': device === 'mobile' }"
          @click="device = 'mobile'"
        >
          <Icon name="lucide:smartphone" class="w-4 h-4" />
        </Button>
      </div>
    </div>

    <!-- Preview Container -->
    <div 
      class="newsletter-preview-container border border-gray-200 rounded-lg overflow-hidden bg-white"
      :class="{
        'max-w-sm mx-auto': device === 'mobile',
        'max-w-2xl': device === 'desktop'
      }"
    >
      <!-- Email Client Header -->
      <div class="bg-gray-50 border-b border-gray-200 p-4">
        <div class="flex items-center justify-between text-sm">
          <div class="flex items-center space-x-2">
            <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <Icon name="lucide:mail" class="w-4 h-4 text-white" />
            </div>
            <div>
              <div class="font-medium text-gray-900">{{ newsletter.from_name }}</div>
              <div class="text-gray-600">{{ newsletter.from_email }}</div>
            </div>
          </div>
          <div class="text-gray-500">
            {{ formatDate(new Date()) }}
          </div>
        </div>
        
        <div class="mt-3">
          <div class="font-medium text-gray-900">{{ newsletter.subject_line }}</div>
          <div v-if="newsletter.preview_text" class="text-sm text-gray-600 mt-1">
            {{ newsletter.preview_text }}
          </div>
        </div>
      </div>

      <!-- Newsletter Content -->
      <div class="newsletter-content">
        <iframe
          v-if="newsletter.compiled_html"
          :srcdoc="newsletter.compiled_html"
          class="w-full"
          :style="{ height: iframeHeight + 'px' }"
          @load="adjustIframeHeight"
          ref="previewIframe"
        ></iframe>
        
        <div v-else class="p-8 text-center text-gray-500">
          <Icon name="lucide:eye-off" class="w-12 h-12 mx-auto mb-4" />
          <p class="font-medium mb-2">Preview not available</p>
          <p class="text-sm">Compile your newsletter to see the preview</p>
        </div>
      </div>
    </div>

    <!-- Preview Actions -->
    <div class="flex items-center justify-center space-x-3 mt-4">
      <Button
        variant="outline"
        size="sm"
        @click="refreshPreview"
        :disabled="!newsletter.compiled_html"
      >
        <Icon name="lucide:refresh-cw" class="w-4 h-4 mr-1" />
        Refresh
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        @click="openInNewTab"
        :disabled="!newsletter.compiled_html"
      >
        <Icon name="lucide:external-link" class="w-4 h-4 mr-1" />
        Open in New Tab
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Newsletter } from '~/types/newsletter'

interface Props {
  newsletter: Newsletter
}

const props = defineProps<Props>()

// State
const device = ref<'desktop' | 'mobile'>('desktop')
const iframeHeight = ref(600)
const previewIframe = ref<HTMLIFrameElement>()

// Methods
const adjustIframeHeight = () => {
  if (previewIframe.value?.contentWindow?.document) {
    const content = previewIframe.value.contentWindow.document.body
    iframeHeight.value = Math.max(600, content.scrollHeight + 20)
  }
}

const refreshPreview = () => {
  if (previewIframe.value) {
    previewIframe.value.src = previewIframe.value.src
  }
}

const openInNewTab = () => {
  if (props.newsletter.compiled_html) {
    const newWindow = window.open()
    if (newWindow) {
      newWindow.document.write(props.newsletter.compiled_html)
      newWindow.document.close()
    }
  }
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString()
}

// Watch for newsletter changes
watch(() => props.newsletter.compiled_html, () => {
  nextTick(() => {
    adjustIframeHeight()
  })
})
</script>

<style scoped>
.newsletter-preview-container {
  transition: max-width 0.3s ease;
}

.newsletter-content iframe {
  border: none;
}
</style>

// README.md
# 📧 @your-org/nuxt-newsletter

A comprehensive newsletter management system for Nuxt 3 with Directus 11 backend. Create beautiful email newsletters with drag-and-drop blocks, MJML compilation, and advanced analytics.

## ✨ Features

- 🎨 **Drag-and-Drop Editor** - Intuitive block-based newsletter editor
- 📱 **Responsive Design** - Mobile-friendly newsletters and admin interface
- 🧩 **Modular Blocks** - Hero, text, image, button, and layout blocks
- 📊 **Analytics Dashboard** - Track opens, clicks, and engagement
- 📝 **Rich Text Editing** - Powered by Tiptap for content creation
- 🎯 **Template System** - Reusable newsletter templates
- 📋 **Content Library** - Reusable content blocks
- 👥 **Subscriber Management** - Enhanced subscriber segmentation
- 🔄 **A/B Testing** - Subject line and content testing
- 📈 **Performance Tracking** - Detailed analytics and reporting
- 🎨 **MJML Compilation** - Professional email rendering
- 📮 **SendGrid Integration** - Reliable email delivery
- 🔌 **Webhook Support** - Real-time event tracking

## 🚀 Quick Start

### Installation

```bash
npm install @your-org/nuxt-newsletter
```

### Basic Setup

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: [
    '@your-org/nuxt-newsletter'
  ],
  newsletter: {
    directusUrl: 'https://your-directus.com',
    sendgridApiKey: process.env.SENDGRID_API_KEY,
    defaultFromEmail: 'newsletter@yoursite.com',
    defaultFromName: 'Your Newsletter'
  }
})
```

### Environment Variables

```env
# Required
DIRECTUS_URL=https://your-directus.com
SENDGRID_API_KEY=your-sendgrid-key

# Optional
NEWSLETTER_WEBHOOK_SECRET=your-webhook-secret
NEWSLETTER_DEFAULT_FROM_EMAIL=newsletter@yoursite.com
NEWSLETTER_DEFAULT_FROM_NAME=Your Newsletter
```

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
const { createNewsletter } = useNewsletter()

const newsletter = await createNewsletter({
  title: 'My Newsletter',
  subject_line: 'Weekly Update',
  from_name: 'John Doe',
  from_email: 'john@example.com'
})

const handleUpdate = (updated) => {
  newsletter.value = updated
}
</script>
```

### Template Integration

```vue
<template>
  <TemplateBrowser
    :templates="templates"
    @select="createFromTemplate"
  />
</template>

<script setup>
const { templates, createFromTemplate } = useNewsletterTemplates()

await fetchTemplates()

const createFromTemplate = async (template) => {
  const newsletter = await createFromTemplate(template, {
    title: 'Custom Newsletter'
  })
  
  await navigateTo(`/newsletters/${newsletter.id}/edit`)
}
</script>
```

### Analytics Dashboard

```vue
<template>
  <NewsletterAnalytics :newsletters="newsletters" />
</template>

<script setup>
const { newsletters, fetchNewsletters } = useNewsletter()

await fetchNewsletters()
</script>
```

## 🔧 Configuration

### Module Options

```ts
interface ModuleOptions {
  directusUrl: string              // Directus instance URL
  sendgridApiKey?: string         // SendGrid API key
  defaultFromEmail?: string       // Default sender email
  defaultFromName?: string        // Default sender name
  webhookSecret?: string          // Webhook authentication
  enableAnalytics?: boolean       // Enable analytics (default: true)
  enableWebhooks?: boolean        // Enable webhooks (default: true)
}
```

### Runtime Configuration

```ts
// Access config in components/composables
const config = useRuntimeConfig()
console.log(config.public.newsletter.directusUrl)
```

## 🎨 Customization

### Custom Block Types

Create custom MJML block types in your Directus instance:

```js
// Custom block type configuration
{
  name: "Custom CTA",
  slug: "custom-cta",
  mjml_template: `
    <mj-section background-color="{{background_color}}">
      <mj-column>
        <mj-text>{{title}}</mj-text>
        <mj-button href="{{button_url}}">{{button_text}}</mj-button>
      </mj-column>
    </mj-section>
  `,
  field_visibility_config: ["title", "button_text", "button_url", "background_color"]
}
```

### Styling

Override default styles:

```css
/* Your custom CSS */
.newsletter-editor {
  --primary-color: #your-brand-color;
}

.newsletter-block {
  border-radius: 12px;
}
```

## 📊 Analytics & Tracking

### SendGrid Webhooks

Configure SendGrid to send events to your webhook endpoint:

```
Webhook URL: https://yoursite.com/api/newsletter/webhook/sendgrid
Events: delivered, open, click, bounce, unsubscribe
```

### Custom Analytics

```ts
// Fetch detailed analytics
const analytics = await $fetch(`/api/newsletter/analytics/${newsletterId}`)

console.log(analytics.statistics)
// {
//   total_sent: 1500,
//   total_opens: 450,
//   total_clicks: 89,
//   open_rate: 30.0,
//   click_rate: 5.9
// }
```

## 🔒 Security

- CSRF protection on all endpoints
- Webhook signature verification
- Input sanitization and validation
- Secure file upload handling
- Rate limiting on API endpoints

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🙋‍♂️ Support

- 📚 [Documentation](https://your-docs-site.com)
- 💬 [Discord Community](https://discord.gg/your-invite)
- 🐛 [Issue Tracker](https://github.com/your-org/nuxt-newsletter/issues)
- 📧 [Email Support](mailto:support@your-org.com)

---

Built with ❤️ for the Nuxt community