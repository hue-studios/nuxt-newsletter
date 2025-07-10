<!-- src/runtime/components/ui/NewsletterPreview.vue -->
<template>
  <div class="newsletter-preview">
    <!-- Preview Controls -->
    <div class="flex items-center justify-between mb-4">
      <h3 class="font-medium text-gray-900">
        Live Preview
      </h3>

      <div class="flex items-center space-x-2">
        <!-- Device Toggle -->
        <div class="flex border rounded-lg overflow-hidden">
          <Button
            variant="ghost"
            size="sm"
            :class="{ 'bg-blue-50 text-blue-600': device === 'desktop' }"
            @click="device = 'desktop'"
          >
            <Icon
              name="lucide:monitor"
              class="w-4 h-4"
            />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            :class="{ 'bg-blue-50 text-blue-600': device === 'tablet' }"
            @click="device = 'tablet'"
          >
            <Icon
              name="lucide:tablet"
              class="w-4 h-4"
            />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            :class="{ 'bg-blue-50 text-blue-600': device === 'mobile' }"
            @click="device = 'mobile'"
          >
            <Icon
              name="lucide:smartphone"
              class="w-4 h-4"
            />
          </Button>
        </div>

        <!-- Email Client Selector -->
        <Select v-model="emailClient">
          <SelectTrigger class="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="generic">
              Generic
            </SelectItem>
            <SelectItem value="gmail">
              Gmail
            </SelectItem>
            <SelectItem value="outlook">
              Outlook
            </SelectItem>
            <SelectItem value="apple">
              Apple Mail
            </SelectItem>
          </SelectContent>
        </Select>

        <!-- Actions -->
        <Button
          variant="outline"
          size="sm"
          :disabled="!newsletter.compiled_html"
          @click="refreshPreview"
        >
          <Icon
            name="lucide:refresh-cw"
            class="w-4 h-4"
            :class="{ 'animate-spin': isRefreshing }"
          />
        </Button>
      </div>
    </div>

    <!-- Preview Container -->
    <div
      class="newsletter-preview-container border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm"
      :class="getDeviceClass()"
    >
      <!-- Email Client Header -->
      <div
        class="email-header bg-gray-50 border-b border-gray-200 p-4"
        :class="getClientHeaderClass()"
      >
        <div class="flex items-center justify-between text-sm">
          <div class="flex items-center space-x-2">
            <div
              class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center"
            >
              <Icon
                name="lucide:mail"
                class="w-4 h-4 text-white"
              />
            </div>
            <div>
              <div class="font-medium text-gray-900">
                {{ newsletter.from_name || "Sender Name" }}
              </div>
              <div class="text-gray-600">
                {{ newsletter.from_email || "sender@example.com" }}
              </div>
            </div>
          </div>
          <div class="text-gray-500">
            {{ formatDate(new Date()) }}
          </div>
        </div>

        <div class="mt-3">
          <div class="font-medium text-gray-900">
            {{ newsletter.subject_line || "Newsletter Subject Line" }}
          </div>
          <div
            v-if="newsletter.preview_text"
            class="text-sm text-gray-600 mt-1"
          >
            {{ newsletter.preview_text }}
          </div>
        </div>

        <!-- Gmail-style actions -->
        <div
          v-if="emailClient === 'gmail'"
          class="flex items-center space-x-4 mt-3 text-xs text-gray-500"
        >
          <button class="hover:text-gray-700">
            Reply
          </button>
          <button class="hover:text-gray-700">
            Forward
          </button>
          <button class="hover:text-gray-700">
            Archive
          </button>
          <button class="hover:text-gray-700">
            Delete
          </button>
        </div>
      </div>

      <!-- Newsletter Content -->
      <div class="newsletter-content">
        <iframe
          v-if="newsletter.compiled_html"
          ref="previewIframe"
          :srcdoc="processedHtml"
          class="w-full transition-all duration-300"
          :style="{ height: iframeHeight + 'px' }"
          @load="adjustIframeHeight"
        />

        <div
          v-else
          class="p-8 text-center text-gray-500"
        >
          <Icon
            name="lucide:eye-off"
            class="w-12 h-12 mx-auto mb-4 text-gray-400"
          />
          <h4 class="font-medium mb-2">
            Preview not available
          </h4>
          <p class="text-sm">
            Compile your newsletter to see the preview
          </p>
          <Button
            variant="outline"
            class="mt-4"
            @click="$emit('compile')"
          >
            <Icon
              name="lucide:play"
              class="w-4 h-4 mr-2"
            />
            Compile Newsletter
          </Button>
        </div>
      </div>
    </div>

    <!-- Preview Stats -->
    <div
      v-if="newsletter.compiled_html"
      class="mt-4 p-4 bg-gray-50 rounded-lg"
    >
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div>
          <div class="text-lg font-bold text-gray-900">
            {{ emailSize.kb }}KB
          </div>
          <div class="text-xs text-gray-600">
            Email Size
          </div>
          <div
            v-if="emailSize.isLarge"
            class="text-xs text-red-600 mt-1"
          >
            <Icon
              name="lucide:alert-triangle"
              class="w-3 h-3 inline mr-1"
            />
            May be clipped
          </div>
        </div>

        <div>
          <div class="text-lg font-bold text-gray-900">
            {{ readingTime }}min
          </div>
          <div class="text-xs text-gray-600">
            Reading Time
          </div>
        </div>

        <div>
          <div class="text-lg font-bold text-gray-900">
            {{ newsletter.blocks?.length || 0 }}
          </div>
          <div class="text-xs text-gray-600">
            Content Blocks
          </div>
        </div>

        <div>
          <div class="text-lg font-bold text-gray-900">
            {{ imageCount }}
          </div>
          <div class="text-xs text-gray-600">
            Images
          </div>
        </div>
      </div>
    </div>

    <!-- Preview Actions -->
    <div class="flex items-center justify-center space-x-3 mt-4">
      <Button
        variant="outline"
        size="sm"
        :disabled="!newsletter.compiled_html"
        @click="openInNewTab"
      >
        <Icon
          name="lucide:external-link"
          class="w-4 h-4 mr-1"
        />
        Open in New Tab
      </Button>

      <Button
        variant="outline"
        size="sm"
        :disabled="!newsletter.compiled_html"
        @click="copyShareLink"
      >
        <Icon
          name="lucide:share-2"
          class="w-4 h-4 mr-1"
        />
        Share Preview
      </Button>

      <Button
        variant="outline"
        size="sm"
        :disabled="!newsletter.compiled_html"
        @click="downloadHtml"
      >
        <Icon
          name="lucide:download"
          class="w-4 h-4 mr-1"
        />
        Download HTML
      </Button>
    </div>

    <!-- Accessibility Check -->
    <div
      v-if="accessibilityIssues.length > 0"
      class="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
    >
      <div class="flex items-start space-x-2">
        <Icon
          name="lucide:alert-triangle"
          class="w-5 h-5 text-yellow-600 mt-0.5"
        />
        <div>
          <h4 class="font-medium text-yellow-800">
            Accessibility Issues Found
          </h4>
          <ul class="mt-2 text-sm text-yellow-700 space-y-1">
            <li
              v-for="issue in accessibilityIssues"
              :key="issue"
            >
              • {{ issue }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import type { Newsletter } from '../../types/newsletter'
import {
  estimateEmailSize,
  calculateReadingTime,
} from '../../utils/core/newsletter'

interface Props {
  newsletter: Newsletter
}

interface Emits {
  (e: 'compile'): void
  (e: 'refresh'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// State
const device = ref<'desktop' | 'tablet' | 'mobile'>('desktop')
const emailClient = ref('generic')
const iframeHeight = ref(600)
const isRefreshing = ref(false)
const previewIframe = ref<HTMLIFrameElement>()

// Computed
const processedHtml = computed(() => {
  if (!props.newsletter.compiled_html) return ''

  let html = props.newsletter.compiled_html

  // Apply client-specific styles
  if (emailClient.value === 'gmail') {
    html = html.replace(
      '<head>',
      '<head><style>.gmail-hide { display: none !important; }</style>',
    )
  }

  return html
})

const emailSize = computed(() => {
  if (!props.newsletter.compiled_html) return { kb: 0, isLarge: false }
  return estimateEmailSize(props.newsletter.compiled_html)
})

const readingTime = computed(() => {
  if (!props.newsletter.blocks) return 0
  return calculateReadingTime(props.newsletter.blocks)
})

const imageCount = computed(() => {
  if (!props.newsletter.blocks) return 0
  return props.newsletter.blocks.filter(
    block => block.block_type?.slug === 'image' && block.image_url,
  ).length
})

const accessibilityIssues = computed(() => {
  const issues: string[] = []

  if (!props.newsletter.blocks) return issues

  props.newsletter.blocks.forEach((block) => {
    // Check for images without alt text
    if (
      block.block_type?.slug === 'image'
      && block.image_url
      && !block.image_alt_text
    ) {
      issues.push('Image block missing alt text')
    }

    // Check for buttons without proper text
    if (
      block.block_type?.slug === 'button'
      && (!block.button_text || block.button_text.length < 3)
    ) {
      issues.push('Button with insufficient descriptive text')
    }

    // Check color contrast (simplified)
    if (block.background_color && block.text_color) {
      const bgColor = block.background_color
      const textColor = block.text_color

      // Very basic contrast check - in reality you'd use proper contrast calculation
      if (
        (bgColor === '#ffffff' || bgColor === '#fff')
        && (textColor === '#ffffff' || textColor === '#fff')
      ) {
        issues.push('Poor color contrast detected')
      }
    }
  })

  return issues
})

// Methods
const getDeviceClass = () => {
  switch (device.value) {
    case 'mobile':
      return 'max-w-sm mx-auto'
    case 'tablet':
      return 'max-w-md mx-auto'
    case 'desktop':
    default:
      return 'max-w-2xl mx-auto'
  }
}

const getClientHeaderClass = () => {
  switch (emailClient.value) {
    case 'gmail':
      return 'bg-red-50 border-red-100'
    case 'outlook':
      return 'bg-blue-50 border-blue-100'
    case 'apple':
      return 'bg-gray-100 border-gray-200'
    default:
      return 'bg-gray-50 border-gray-200'
  }
}

const adjustIframeHeight = () => {
  nextTick(() => {
    if (previewIframe.value?.contentWindow?.document) {
      try {
        const content = previewIframe.value.contentWindow.document.body
        const height = Math.max(400, content.scrollHeight + 40)
        iframeHeight.value = height
      }
      catch (error) {
        // Cross-origin restrictions - use default height
        iframeHeight.value = 600
      }
    }
  })
}

const refreshPreview = async () => {
  isRefreshing.value = true

  try {
    await new Promise(resolve => setTimeout(resolve, 500))

    if (previewIframe.value) {
      previewIframe.value.src = previewIframe.value.src
    }

    emit('refresh')
  }
  finally {
    isRefreshing.value = false
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

const copyShareLink = async () => {
  // Generate a shareable preview link (would need backend implementation)
  const shareUrl = `${window.location.origin}/newsletter/${props.newsletter.id}/preview`

  try {
    await navigator.clipboard.writeText(shareUrl)
    // TODO: Show success message
    console.log('Preview link copied to clipboard')
  }
  catch (error) {
    console.error('Failed to copy link:', error)
  }
}

const downloadHtml = () => {
  if (!props.newsletter.compiled_html) return

  const blob = new Blob([props.newsletter.compiled_html], {
    type: 'text/html',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${props.newsletter.title || 'newsletter'}.html`
  a.click()
  URL.revokeObjectURL(url)
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

// Watch for newsletter changes
watch(
  () => props.newsletter.compiled_html,
  () => {
    nextTick(() => {
      adjustIframeHeight()
    })
  },
  { immediate: true },
)

// Watch device changes
watch(device, () => {
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

.email-header {
  transition: background-color 0.2s ease;
}

@media (max-width: 768px) {
  .newsletter-preview-container {
    margin: 0 -1rem;
  }
}
</style>
