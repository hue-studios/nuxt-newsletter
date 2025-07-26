<template>
  <div :class="['newsletter-preview-container', `preview-device-${device}`]">
    <!-- Preview Header -->
    <div class="preview-header">
      <div class="preview-title">
        <Icon name="lucide:eye" class="w-5 h-5" />
        <span>Newsletter Preview</span>
      </div>
      
      <div class="preview-controls">
        <!-- Device Controls -->
        <div class="device-controls">
          <button
            @click="setDevice('desktop')"
            :class="['device-button', { active: device === 'desktop' }]"
            title="Desktop Preview"
          >
            <Icon name="lucide:monitor" class="w-4 h-4" />
          </button>
          <button
            @click="setDevice('tablet')"
            :class="['device-button', { active: device === 'tablet' }]"
            title="Tablet Preview"
          >
            <Icon name="lucide:tablet" class="w-4 h-4" />
          </button>
          <button
            @click="setDevice('mobile')"
            :class="['device-button', { active: device === 'mobile' }]"
            title="Mobile Preview"
          >
            <Icon name="lucide:smartphone" class="w-4 h-4" />
          </button>
        </div>

        <!-- Action Controls -->
        <div class="action-controls">
          <button @click="refreshPreview" class="refresh-button" :disabled="isCompiling">
            <Icon name="lucide:refresh-cw" :class="['w-4 h-4', { 'animate-spin': isCompiling }]" />
          </button>
          <button @click="toggleSource" class="source-button">
            <Icon name="lucide:code" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Source View -->
    <Transition name="collapse">
      <div v-if="showSource" class="source-container">
        <div class="source-tabs">
          <button
            @click="activeSourceTab = 'mjml'"
            :class="['source-tab', { active: activeSourceTab === 'mjml' }]"
          >
            MJML
          </button>
          <button
            @click="activeSourceTab = 'html'"
            :class="['source-tab', { active: activeSourceTab === 'html' }]"
          >
            HTML
          </button>
        </div>
        
        <div class="source-content">
          <div v-if="activeSourceTab === 'mjml'" class="source-panel">
            <div class="source-header">
              <span class="source-title">Generated MJML</span>
              <button @click="copyToClipboard(compiledMjml)" class="copy-button">
                <Icon name="lucide:copy" class="w-4 h-4" />
                Copy MJML
              </button>
            </div>
            <pre class="source-code"><code>{{ compiledMjml || 'No MJML generated yet' }}</code></pre>
          </div>
          
          <div v-else-if="activeSourceTab === 'html'" class="source-panel">
            <div class="source-header">
              <span class="source-title">Generated HTML</span>
              <button @click="copyToClipboard(compiledHtml)" class="copy-button">
                <Icon name="lucide:copy" class="w-4 h-4" />
                Copy HTML
              </button>
            </div>
            <pre class="source-code"><code>{{ compiledHtml || 'No HTML generated yet' }}</code></pre>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Preview Content -->
    <div class="preview-content">
      <div class="email-preview-frame">
        
        <!-- Loading State -->
        <div v-if="isCompiling" class="loading-state">
          <Icon name="lucide:loader-2" class="w-6 h-6 animate-spin" />
          <p>Compiling newsletter...</p>
          <small v-if="currentStep">{{ currentStep }}</small>
        </div>

        <!-- Error State -->
        <div v-else-if="compilationError" class="compilation-error">
          <h4>Compilation Error</h4>
          <p>{{ compilationError }}</p>
          <button @click="refreshPreview" class="error-retry-button">
            <Icon name="lucide:refresh-cw" class="w-4 h-4" />
            Retry
          </button>
          <details v-if="debugInfo" class="error-details">
            <summary>Debug Information</summary>
            <pre>{{ debugInfo }}</pre>
          </details>
        </div>

        <!-- Success State -->
        <div v-else-if="compiledHtml" class="preview-iframe-container">
          <iframe 
            ref="previewFrame"
            :srcdoc="compiledHtml"
            :class="['preview-iframe', deviceIframeClass]"
            @load="handleIframeLoad"
            @error="handleIframeError"
          />
        </div>

        <!-- Empty State -->
        <div v-else class="empty-content">
          <Icon name="lucide:mail-plus" class="w-12 h-12" />
          <h4>No Content Yet</h4>
          <p>Add some blocks to your newsletter to see the preview here.</p>
          <button @click="refreshPreview" class="empty-refresh-button">
            <Icon name="lucide:refresh-cw" class="w-4 h-4" />
            Generate Preview
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { $fetch } from 'ofetch'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useNewsletterContentMapping } from '../composables/useNewsletterContentMapping'

interface Props {
  newsletter?: any
  blockTypes?: any[]
  device?: 'desktop' | 'mobile' | 'tablet'
}

const props = withDefaults(defineProps<Props>(), {
  device: 'desktop'
})

const emit = defineEmits<{
  'update:compiled': [value: { mjml: string; html: string }]
}>()

// State
const device = ref(props.device)
const compiledMjml = ref('')
const compiledHtml = ref('')
const isCompiling = ref(false)
const compilationError = ref<string | null>(null)
const showSource = ref(false)
const activeSourceTab = ref<'mjml' | 'html'>('mjml')
const previewFrame = ref<HTMLIFrameElement | null>(null)
const currentStep = ref('')
const debugInfo = ref('')

// Composables
const { mapBlockContent } = useNewsletterContentMapping()

// Computed properties
const deviceIframeClass = computed(() => {
  switch (device.value) {
    case 'mobile': return 'device-mobile'
    case 'tablet': return 'device-tablet'
    default: return 'device-desktop'
  }
})

// Compilation timeout reference
let compilationTimeout: any = null

// Methods
const setDevice = (newDevice: 'desktop' | 'mobile' | 'tablet') => {
  device.value = newDevice
  adjustIframeSize()
}

const toggleSource = () => {
  showSource.value = !showSource.value
}

const refreshPreview = () => {
  console.log('Refreshing preview...')
  compileNewsletter()
}

const adjustIframeSize = () => {
  nextTick(() => {
    if (previewFrame.value) {
      switch (device.value) {
        case 'mobile':
          previewFrame.value.style.maxWidth = '375px'
          break
        case 'tablet':
          previewFrame.value.style.maxWidth = '768px'
          break
        default:
          previewFrame.value.style.maxWidth = '100%'
      }
    }
  })
}

// Generate MJML from newsletter
const generateMjml = () => {
  if (!props.newsletter) {
    return createEmptyMjml()
  }

  let bodyContent = ''
  
  if (props.newsletter.blocks && props.newsletter.blocks.length > 0) {
    props.newsletter.blocks.forEach((block: any) => {
      const blockType = props.blockTypes?.find(bt => 
        bt.slug === block.type || bt.id === block.block_type
      )
      
      if (!blockType || !blockType.mjml_template) {
        console.warn(`Block type not found or missing template: ${block.type}`)
        return
      }

      let mjml = blockType.mjml_template
      
      // Map and replace content
      const mappedContent = mapBlockContent(blockType.slug, block.content || {})
      console.log(`Mapped content for ${blockType.slug}:`, mappedContent)
      
      // Replace placeholders
      mjml = mjml.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return mappedContent[key] !== undefined ? String(mappedContent[key]) : match
      })
      
      // Handle conditional content
      mjml = mjml.replace(/\{\{if (\w+)\}\}(.*?)\{\{\/if\}\}/gs, (match, key, content) => {
        return mappedContent[key] ? content : ''
      })
      
      bodyContent += mjml
    })
  }

  const mjmlDocument = `
    <mjml>
      <mj-head>
        <mj-title>${props.newsletter.subject_line || 'Newsletter'}</mj-title>
        <mj-preview>${props.newsletter.preview_text || ''}</mj-preview>
        <mj-attributes>
          <mj-all font-family="Arial, sans-serif" />
          <mj-text font-size="14px" line-height="1.6" />
        </mj-attributes>
      </mj-head>
      <mj-body>
        ${bodyContent || '<mj-section><mj-column><mj-text>No content blocks added yet.</mj-text></mj-column></mj-section>'}
      </mj-body>
    </mjml>
  `

  compiledMjml.value = mjmlDocument
  return mjmlDocument
}

const createEmptyMjml = () => {
  return `
    <mjml>
      <mj-body>
        <mj-section>
          <mj-column>
            <mj-text align="center" color="#666666">
              Add blocks to your newsletter to see the preview.
            </mj-text>
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>
  `
}

// Generate fallback HTML when MJML compilation fails
const generateFallbackHtml = () => {
  const newsletter = props.newsletter
  
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${newsletter?.subject_line || 'Newsletter Preview'}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .block { margin-bottom: 30px; padding: 20px; border: 1px solid #eee; border-radius: 8px; }
        .block-type { font-size: 12px; color: #666; margin-bottom: 10px; text-transform: uppercase; }
        h1, h2, h3 { color: #2c3e50; }
        .preview-notice { background: #fffacd; padding: 10px; border-radius: 4px; margin-bottom: 20px; font-size: 14px; }
        .button { display: inline-block; padding: 10px 20px; background: #3b82f6; color: white; text-decoration: none; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="preview-notice">
        ⚠️ Simplified preview mode - MJML compilation unavailable
      </div>
  `

  if (newsletter?.blocks && newsletter.blocks.length > 0) {
    newsletter.blocks.forEach((block: any, index: number) => {
      const blockType = props.blockTypes?.find(bt => 
        bt.slug === block.type || bt.id === block.block_type
      )
      
      html += `
        <div class="block">
          <div class="block-type">${blockType?.name || block.type || 'Unknown Block'}</div>
      `

      // Render block content based on type
      const content = block.content || {}
      
      if (content.title) {
        html += `<h2>${content.title}</h2>`
      }
      
      if (content.subtitle) {
        html += `<h3>${content.subtitle}</h3>`
      }
      
      if (content.text_content) {
        html += `<div>${content.text_content}</div>`
      }
      
      if (content.button_text && content.button_url) {
        html += `<p><a href="${content.button_url}" class="button">${content.button_text}</a></p>`
      }

      // Show other fields as key-value pairs
      const shownFields = ['title', 'subtitle', 'text_content', 'button_text', 'button_url']
      const otherFields = Object.entries(content).filter(([key]) => !shownFields.includes(key))
      
      if (otherFields.length > 0) {
        html += '<div style="font-size: 14px; color: #666; margin-top: 10px;">'
        otherFields.forEach(([key, value]) => {
          if (value && typeof value !== 'object') {
            html += `<div><strong>${key}:</strong> ${value}</div>`
          }
        })
        html += '</div>'
      }

      html += '</div>'
    })
  } else {
    html += '<p>No blocks added yet. Add blocks to see the preview.</p>'
  }

  html += '</body></html>'
  
  return html
}

// Main compilation function with timeout and error handling
const compileNewsletter = async () => {
  if (!props.newsletter || isCompiling.value) {
    console.log('Skipping compilation:', { 
      hasNewsletter: !!props.newsletter, 
      isCompiling: isCompiling.value 
    })
    return
  }

  console.log('Starting MJML compilation...')
  isCompiling.value = true
  compilationError.value = null
  currentStep.value = 'Generating MJML...'

  // Add a timeout to prevent hanging
  const timeoutId = setTimeout(() => {
    console.error('MJML compilation timeout after 10 seconds')
    compilationError.value = 'Compilation timeout - showing fallback preview'
    isCompiling.value = false
    currentStep.value = ''
    
    // Generate a simple fallback preview
    const fallbackHtml = generateFallbackHtml()
    compiledHtml.value = fallbackHtml
    updatePreview(fallbackHtml)
  }, 10000)

  try {
    // Generate MJML
    const mjml = generateMjml()
    
    if (!mjml) {
      throw new Error('Failed to generate MJML')
    }

    console.log('Generated MJML length:', mjml.length)
    console.log('First 500 chars:', mjml.substring(0, 500))
    
    currentStep.value = 'Compiling to HTML...'

    // Try server compilation with better error handling
    try {
      const response = await $fetch('/api/newsletter/compile-mjml', {
        method: 'POST',
        body: { mjml },
        timeout: 8000 // 8 second timeout for API call
      })

      clearTimeout(timeoutId)

      if (response.html) {
        console.log('Compilation successful, HTML length:', response.html.length)
        compiledHtml.value = response.html
        updatePreview(response.html)
        compilationError.value = null
        
        // Emit compiled result
        emit('update:compiled', { mjml: compiledMjml.value, html: response.html })
      } else if (response.errors && response.errors.length > 0) {
        console.error('MJML compilation errors:', response.errors)
        compilationError.value = `MJML errors: ${response.errors.join(', ')}`
        debugInfo.value = JSON.stringify(response.errors, null, 2)
        
        // Use fallback HTML on MJML errors
        const fallbackHtml = generateFallbackHtml()
        compiledHtml.value = fallbackHtml
        updatePreview(fallbackHtml)
      }
    } catch (serverError: any) {
      clearTimeout(timeoutId)
      console.error('Server compilation failed:', serverError)
      
      // Check if it's a network error or server not available
      if (serverError.statusCode === 404 || serverError.message?.includes('fetch')) {
        compilationError.value = 'MJML server not available - showing simplified preview'
      } else {
        compilationError.value = `Server error: ${serverError.message || 'Unknown error'}`
      }
      
      // Use fallback HTML
      console.log('Using fallback HTML preview')
      const fallbackHtml = generateFallbackHtml()
      compiledHtml.value = fallbackHtml
      updatePreview(fallbackHtml)
    }

  } catch (error: any) {
    clearTimeout(timeoutId)
    console.error('Compilation error:', error)
    compilationError.value = error.message || 'Compilation failed'
    debugInfo.value = error.stack || ''
    
    // Always show something
    const fallbackHtml = generateFallbackHtml()
    compiledHtml.value = fallbackHtml
    updatePreview(fallbackHtml)
  } finally {
    isCompiling.value = false
    currentStep.value = ''
  }
}

// Update preview iframe
const updatePreview = (html: string) => {
  if (!html) return
  
  nextTick(() => {
    if (previewFrame.value) {
      // Force iframe to update by setting srcdoc
      previewFrame.value.srcdoc = html
    }
  })
}

// Event handlers
const handleIframeLoad = () => {
  console.log('Newsletter preview loaded successfully')
  adjustIframeSize()
}

const handleIframeError = (error: any) => {
  console.error('Preview iframe error:', error)
  compilationError.value = 'Failed to load preview'
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    console.log('Copied to clipboard')
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
  }
}

// Watch for prop changes with debouncing
watch(
  () => props.newsletter,
  async (newVal) => {
    if (newVal) {
      // Clear existing timeout
      if (compilationTimeout) {
        clearTimeout(compilationTimeout)
      }
      
      // Debounce compilation to avoid too many requests
      compilationTimeout = setTimeout(() => {
        compileNewsletter()
      }, 500)
    }
  },
  { deep: true }
)

watch(() => props.blockTypes, () => {
  if (props.newsletter?.blocks?.length && props.blockTypes?.length) {
    compileNewsletter()
  }
}, { deep: true })

watch(() => props.device, (newDevice) => {
  setDevice(newDevice)
})

// Lifecycle
onMounted(() => {
  console.log('Newsletter preview mounted')
  if (props.newsletter?.blocks?.length && props.blockTypes?.length) {
    compileNewsletter()
  }
})
</script>

<style scoped>
@reference 'tailwindcss';
.newsletter-preview-container {
  @apply h-full flex flex-col bg-white border border-gray-200 rounded-lg overflow-hidden;
}

/* Device-specific container styles */
.preview-device-mobile .email-preview-frame {
  @apply mx-auto;
  max-width: 375px;
}

.preview-device-tablet .email-preview-frame {
  @apply mx-auto;
  max-width: 768px;
}

.preview-device-desktop .email-preview-frame {
  @apply w-full;
}

/* Preview Header */
.preview-header {
  @apply flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50;
}

.preview-title {
  @apply flex items-center gap-2 text-sm font-medium text-gray-900;
}

.preview-controls {
  @apply flex items-center gap-4;
}

/* Device Controls */
.device-controls {
  @apply flex items-center gap-1 bg-gray-100 rounded-lg p-1;
}

.device-button {
  @apply p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-md transition-all duration-200;
}

.device-button.active {
  @apply text-blue-600 bg-white shadow-sm;
}

/* Action Controls */
.action-controls {
  @apply flex items-center gap-2;
}

.refresh-button,
.source-button {
  @apply p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors;
}

.refresh-button:disabled {
  @apply opacity-50 cursor-not-allowed;
}

/* Source View */
.source-container {
  @apply border-b border-gray-200 bg-gray-50;
  max-height: 400px;
  overflow: hidden;
}

.source-tabs {
  @apply flex border-b border-gray-200;
}

.source-tab {
  @apply px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent transition-colors;
}

.source-tab.active {
  @apply text-blue-600 border-blue-600;
}

.source-content {
  @apply overflow-hidden;
  height: 350px;
}

.source-panel {
  @apply h-full flex flex-col;
}

.source-header {
  @apply flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200;
}

.source-title {
  @apply text-sm font-medium text-gray-700;
}

.copy-button {
  @apply flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors;
}

.source-code {
  @apply flex-1 overflow-auto p-4 m-0 text-xs bg-gray-900 text-gray-100;
}

.source-code code {
  @apply font-mono;
  white-space: pre;
}

/* Preview Content */
.preview-content {
  @apply flex-1 overflow-auto bg-gray-100 p-4;
}

.email-preview-frame {
  @apply bg-white rounded-lg shadow-sm overflow-hidden mx-auto h-full;
}

/* Loading State */
.loading-state {
  @apply flex flex-col items-center justify-center h-full py-20 text-gray-500;
}

.loading-state p {
  @apply mt-3 text-base font-medium;
}

.loading-state small {
  @apply mt-1 text-sm text-gray-400;
}

/* Error State */
.compilation-error {
  @apply flex flex-col items-center justify-center h-full py-20 px-4 text-center;
}

.compilation-error h4 {
  @apply text-lg font-semibold text-red-600 mb-2;
}

.compilation-error p {
  @apply text-gray-600 mb-4;
}

.error-retry-button {
  @apply inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors;
}

.error-details {
  @apply mt-4 text-left max-w-lg;
}

.error-details summary {
  @apply cursor-pointer text-sm text-gray-500 hover:text-gray-700;
}

.error-details pre {
  @apply mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto;
}

/* Empty State */
.empty-content {
  @apply flex flex-col items-center justify-center h-full py-20 text-gray-400;
}

.empty-content h4 {
  @apply mt-4 text-lg font-medium text-gray-600;
}

.empty-content p {
  @apply mt-2 text-sm text-gray-500;
}

.empty-refresh-button {
  @apply mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors;
}

/* Preview Iframe */
.preview-iframe-container {
  @apply h-full;
}

.preview-iframe {
  @apply w-full h-full border-0;
  min-height: 600px;
}

/* Device-specific iframe styles */
.device-mobile {
  @apply mx-auto;
  max-width: 375px;
}

.device-tablet {
  @apply mx-auto;
  max-width: 768px;
}

.device-desktop {
  @apply w-full;
}

/* Transitions */
.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.collapse-enter-from,
.collapse-leave-to {
  max-height: 0;
  opacity: 0;
}

.collapse-enter-to,
.collapse-leave-from {
  max-height: 400px;
  opacity: 1;
}
</style>