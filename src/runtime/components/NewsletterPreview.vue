<template>
  <div class="newsletter-preview-container" :class="deviceClass">
    <!-- Preview Header -->
    <div class="preview-header">
      <div class="preview-title">
        <Icon name="lucide:mail" class="w-4 h-4" />
        <span>Newsletter Preview</span>
      </div>
      
      <!-- Device Controls -->
      <div class="preview-controls">
        <div class="device-controls">
          <!-- <button
            @click="setDevice('desktop')"
            :class="{ active: currentDevice === 'desktop' }"
            class="device-button"
            title="Desktop preview"
          >
            <Icon name="lucide:monitor" class="w-4 h-4" />
          </button> -->
          <button
            @click="setDevice('tablet')"
            :class="{ active: currentDevice === 'tablet' }"
            class="device-button"
            title="Tablet preview"
          >
            <Icon name="lucide:monitor" class="w-4 h-4" />
          </button>
          <button
            @click="setDevice('mobile')"
            :class="{ active: currentDevice === 'mobile' }"
            class="device-button"
            title="Mobile preview"
          >
            <Icon name="lucide:smartphone" class="w-4 h-4" />
          </button>
        </div>
        
        <div class="action-controls">
          <button @click="refreshPreview" class="control-button" title="Refresh preview">
            <Icon name="lucide:refresh-cw" class="w-4 h-4" />
          </button>
          <button @click="showSourceModal = true" class="control-button" title="View source">
            <Icon name="lucide:code" class="w-4 h-4" />
          </button>
          <button @click="toggleDebugMode" class="control-button" title="Toggle debug">
            <Icon name="lucide:bug" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Debug Information (when enabled) -->
    <div v-if="showDebug" class="debug-info">
      <h4>Debug Information</h4>
      <div class="debug-details">
        <div class="debug-item">
          <strong>Status:</strong>
          <span :class="compilationStatusClass">{{ compilationStatus }}</span>
        </div>
        <div class="debug-item">
          <strong>Device:</strong>
          <span>{{ currentDevice }}</span>
        </div>
        <div class="debug-item">
          <strong>Blocks:</strong>
          <span>{{ newsletter?.blocks?.length || 0 }}</span>
        </div>
        <div class="debug-item">
          <strong>Replacements:</strong>
          <span>{{ replacedPlaceholders }}</span>
        </div>
      </div>
    </div>

    <!-- Source Code Modal -->
    <Transition name="modal">
      <div v-if="showSourceModal" class="modal-overlay" @click="showSourceModal = false">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>Newsletter Source Code</h3>
            <button @click="showSourceModal = false" class="modal-close">
              <Icon name="lucide:x" class="w-5 h-5" />
            </button>
          </div>
          
          <div class="modal-body">
            <!-- Source Tabs -->
            <div class="source-tabs">
              <button
                @click="activeSourceTab = 'mjml'"
                :class="{ active: activeSourceTab === 'mjml' }"
                class="tab-button"
              >
                <Icon name="lucide:code" class="w-4 h-4" />
                MJML
              </button>
              <button
                @click="activeSourceTab = 'html'"
                :class="{ active: activeSourceTab === 'html' }"
                class="tab-button"
              >
                <Icon name="lucide:globe" class="w-4 h-4" />
                HTML
              </button>
            </div>
            
            <!-- Source Content -->
            <div class="source-content">
              <div v-if="activeSourceTab === 'mjml'" class="source-panel">
                <div class="source-header">
                  <span class="source-title">Generated MJML</span>
                  <button @click="copyToClipboard(compiledMjml)" class="copy-button">
                    <Icon name="lucide:copy" class="w-4 h-4" />
                    Copy MJML
                  </button>
                </div>
                <pre class="source-code"><code>{{ compiledMjml || 'No MJML generated yet. Compiling...' }}</code></pre>
              </div>
              
              <div v-else-if="activeSourceTab === 'html'" class="source-panel">
                <div class="source-header">
                  <span class="source-title">Generated HTML</span>
                  <button @click="copyToClipboard(compiledHtml)" class="copy-button">
                    <Icon name="lucide:copy" class="w-4 h-4" />
                    Copy HTML
                  </button>
                </div>
                <pre class="source-code"><code>{{ compiledHtml || 'No HTML generated yet. Compiling...' }}</code></pre>
              </div>
            </div>
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
  'device-changed': [device: string]
}>()

// State
const compiledMjml = ref('')
const compiledHtml = ref('')
const isCompiling = ref(false)
const compilationError = ref<string | null>(null)
const showSourceModal = ref(false)
const activeSourceTab = ref('mjml') // Fixed: Define the sourceTab properly
const showDebug = ref(false)
const compilationStatus = ref('Ready')
const replacedPlaceholders = ref(0)
const debugInfo = ref('')
const currentStep = ref('')
const previewFrame = ref<HTMLIFrameElement | null>(null)

// Device management
const currentDevice = ref(props.device)

// Initialize content mapping
const { mapBlockContent } = useNewsletterContentMapping()

// Computed properties
const deviceClass = computed(() => `preview-device-${currentDevice.value}`)
const deviceIframeClass = computed(() => `iframe-${currentDevice.value}`)

const compilationStatusClass = computed(() => {
  switch (compilationStatus.value) {
    case 'Success': return 'status-success'
    case 'Failed': return 'status-error'
    case 'Compiling': return 'status-progress'
    default: return 'status-default'
  }
})

// Device switching
const setDevice = (device: 'desktop' | 'mobile' | 'tablet') => {
  currentDevice.value = device
  emit('device-changed', device)
  nextTick(() => {
    adjustIframeSize()
  })
}

// Toggle debug mode
const toggleDebugMode = () => {
  showDebug.value = !showDebug.value
}

// Refresh preview
const refreshPreview = () => {
  compileNewsletter()
}

// Adjust iframe size based on device
const adjustIframeSize = () => {
  if (!previewFrame.value) return
  
  const iframe = previewFrame.value
  switch (currentDevice.value) {
    case 'mobile':
      iframe.style.width = '375px'
      iframe.style.maxWidth = '100%'
      iframe.style.margin = '0 auto'
      break
    case 'tablet':
      iframe.style.width = '768px'
      iframe.style.maxWidth = '100%'
      iframe.style.margin = '0 auto'
      break
    case 'desktop':
    default:
      iframe.style.width = '100%'
      iframe.style.maxWidth = 'none'
      iframe.style.margin = '0'
      break
  }
}

// Enhanced compilation with better error handling
const compileNewsletter = async () => {
  if (!props.newsletter?.blocks || !props.blockTypes) {
    compilationError.value = 'No newsletter content or block types available'
    return
  }

  isCompiling.value = true
  compilationError.value = null
  compilationStatus.value = 'Compiling'
  currentStep.value = 'Initializing...'
  replacedPlaceholders.value = 0

  try {
    currentStep.value = 'Processing blocks...'
    
    // Generate MJML
    let mjmlBody = ''
    let totalReplacements = 0

    props.newsletter.blocks.forEach((block: any, index: number) => {
      currentStep.value = `Processing block ${index + 1}/${props.newsletter.blocks.length}...`
      
      // Find block type
      const blockType = props.blockTypes.find(bt => 
        bt.slug === block.type || 
        bt.id === block.block_type ||
        bt.id === block.type ||
        bt.slug === block.block_type
      )

      if (!blockType) {
        console.warn(`Block type not found for block ${index + 1}:`, block)
        return
      }

      if (!blockType.mjml_template) {
        console.warn(`No MJML template for block type: ${blockType.name}`)
        return
      }

      // Map content using the enhanced mapping system
      const mappedContent = mapBlockContent(block, blockType)
      console.log(`Mapped content for ${blockType.slug}:`, mappedContent)

      // Replace placeholders in MJML template
      let blockMjml = blockType.mjml_template
      let blockReplacements = 0

      // Handle simple placeholders
      blockMjml = blockMjml.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        const value = mappedContent[key]
        if (value !== undefined) {
          blockReplacements++
          return String(value)
        }
        return match
      })

      // Handle triple braces for HTML content
      blockMjml = blockMjml.replace(/\{\{\{(\w+)\}\}\}/g, (match, key) => {
        const value = mappedContent[key]
        if (value !== undefined) {
          blockReplacements++
          return String(value)
        }
        return match
      })

      // Handle conditional blocks
      blockMjml = blockMjml.replace(/\{\{#if (\w+)\}\}(.*?)\{\{\/if\}\}/gs, (match, key, content) => {
        const value = mappedContent[key]
        const shouldShow = value && value !== '' && value !== null && value !== undefined
        return shouldShow ? content : ''
      })

      mjmlBody += blockMjml
      totalReplacements += blockReplacements
      console.log(`Block ${blockType.slug}: ${blockReplacements} replacements made`)
    })

    currentStep.value = 'Generating MJML...'
    
    // Wrap in complete MJML structure
    const completeMjml = `
      <mjml>
        <mj-head>
          <mj-title>${props.newsletter.title || 'Newsletter'}</mj-title>
          <mj-preview>${props.newsletter.preview_text || ''}</mj-preview>
          <mj-attributes>
            <mj-all font-family="Arial, sans-serif" />
            <mj-text font-size="14px" color="#000000" line-height="20px" />
          </mj-attributes>
        </mj-head>
        <mj-body>
          ${mjmlBody}
        </mj-body>
      </mjml>
    `

    compiledMjml.value = completeMjml
    replacedPlaceholders.value = totalReplacements

    currentStep.value = 'Compiling to HTML...'

    // Compile MJML to HTML
    const response = await $fetch('/api/newsletter/compile-mjml', {
      method: 'POST',
      body: { mjml: completeMjml }
    })

    if (response.errors && response.errors.length > 0) {
      throw new Error(`MJML compilation errors: ${response.errors.join(', ')}`)
    }

    compiledHtml.value = response.html || ''
    compilationStatus.value = 'Success'
    
    // Emit the compiled content
    emit('update:compiled', {
      mjml: completeMjml,
      html: response.html || ''
    })

    console.log(`MJML compilation complete: ${totalReplacements} placeholders replaced`)

    // Adjust iframe size after content loads
    nextTick(() => {
      adjustIframeSize()
    })

  } catch (error: any) {
    console.error('Compilation failed:', error)
    compilationError.value = error.message || 'Unknown error'
    compilationStatus.value = 'Failed'
    debugInfo.value = JSON.stringify({
      error: error.message,
      stack: error.stack,
      newsletter: props.newsletter,
      blockTypes: props.blockTypes?.map(bt => ({ id: bt.id, slug: bt.slug, name: bt.name }))
    }, null, 2)
  } finally {
    isCompiling.value = false
    currentStep.value = ''
  }
}

// Utility functions
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

// Watch for prop changes
watch(() => props.newsletter, () => {
  if (props.newsletter?.blocks?.length) {
    compileNewsletter()
  }
}, { deep: true })

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
  @apply flex items-center gap-1;
}

.control-button {
  @apply p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50;
}

/* Debug Information */
.debug-info {
  @apply p-4 bg-blue-50 border-b border-blue-200;
}

.debug-info h4 {
  @apply text-lg font-semibold mb-3 text-blue-800;
}

.debug-details {
  @apply grid grid-cols-2 lg:grid-cols-4 gap-4;
}

.debug-item {
  @apply bg-white p-3 rounded border;
}

.debug-item strong {
  @apply block text-sm font-medium mb-1;
}

.debug-item span {
  @apply text-sm;
}

/* Status indicators */
.status-success {
  @apply bg-green-100 text-green-800 px-2 py-1 rounded;
}

.status-error {
  @apply bg-red-100 text-red-800 px-2 py-1 rounded;
}

.status-progress {
  @apply bg-yellow-100 text-yellow-800 px-2 py-1 rounded;
}

.status-default {
  @apply bg-gray-100 text-gray-800 px-2 py-1 rounded;
}

/* Modal Styles */
.modal-overlay {
  @apply fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4;
}

.modal-content {
  @apply bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden;
}

.modal-header {
  @apply flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50;
}

.modal-header h3 {
  @apply text-lg font-semibold text-gray-900;
}

.modal-close {
  @apply p-1 hover:bg-gray-200 rounded transition-colors;
}

.modal-body {
  @apply flex flex-col h-[70vh];
}

/* Source Tabs */
.source-tabs {
  @apply flex border-b border-gray-200 bg-gray-50;
}

.tab-button {
  @apply flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent transition-colors;
}

.tab-button.active {
  @apply text-blue-600 border-blue-600 bg-white;
}

/* Source Content */
.source-content {
  @apply flex-1 overflow-hidden;
}

.source-panel {
  @apply h-full flex flex-col;
}

.source-header {
  @apply flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200;
}

.source-title {
  @apply text-sm font-medium text-gray-700;
}

.copy-button {
  @apply flex items-center gap-1 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors;
}

.source-code {
  @apply flex-1 overflow-auto p-4 text-xs font-mono bg-gray-900 text-green-400 whitespace-pre-wrap;
}

/* Preview Content */
.preview-content {
  @apply flex-1 overflow-auto;
}

.email-preview-frame {
  @apply h-full;
}

.preview-iframe-container {
  @apply h-full p-4 bg-gray-50;
}

.preview-iframe {
  @apply w-full h-full border border-gray-300 rounded-lg bg-white shadow-sm;
  min-height: 600px;
}

/* Device-specific iframe styles */
.iframe-mobile {
  @apply mx-auto;
  width: 375px;
  max-width: 100%;
}

.iframe-tablet {
  @apply mx-auto;
  width: 768px;
  max-width: 100%;
}

.iframe-desktop {
  @apply w-full;
}

/* Loading State */
.loading-state {
  @apply flex flex-col items-center justify-center p-8 text-gray-600 min-h-[400px];
}

.loading-state p {
  @apply mt-3 text-sm;
}

.loading-state small {
  @apply text-xs text-gray-500;
}

/* Error State */
.compilation-error {
  @apply p-6 text-red-700 bg-red-50 border border-red-200 rounded-lg m-4;
}

.compilation-error h4 {
  @apply font-medium mb-2;
}

.error-retry-button {
  @apply flex items-center gap-2 mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors;
}

.error-details {
  @apply mt-4;
}

.error-details summary {
  @apply cursor-pointer font-medium;
}

.error-details pre {
  @apply mt-2 text-xs bg-red-100 p-2 rounded overflow-auto max-h-48;
}

/* Empty State */
.empty-content {
  @apply flex flex-col items-center justify-center p-8 text-gray-500 min-h-[400px];
}

.empty-content h4 {
  @apply text-lg font-medium mt-4 mb-2;
}

.empty-content p {
  @apply text-sm text-center mb-4;
}

.empty-refresh-button {
  @apply flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors;
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 0.3s ease;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.9);
}
</style>