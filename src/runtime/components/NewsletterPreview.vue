<template>
  <div class="newsletter-preview-container">
    <!-- Enhanced header with proper controls -->
    <div class="preview-header">
      <div class="preview-title">
        <Icon name="lucide:mail" class="w-5 h-5 text-slate-600" />
        <span>Newsletter Preview</span>
      </div>
      <div class="preview-controls">
        <button
          @click="refreshPreview"
          :disabled="isCompiling"
          class="control-button"
          title="Refresh preview"
        >
          <Icon name="lucide:refresh-cw" :class="{ 'animate-spin': isCompiling }" class="w-4 h-4" />
        </button>
        <button
          @click="showMjmlSource = true"
          class="control-button"
          title="View MJML source"
        >
          <Icon name="lucide:code" class="w-4 h-4" />
        </button>
        <div class="device-selector">
          <button
            v-for="deviceOption in deviceOptions"
            :key="deviceOption.value"
            @click="currentDevice = deviceOption.value"
            class="device-button"
            :class="{ 'active': currentDevice === deviceOption.value }"
            :title="deviceOption.label"
          >
            <Icon :name="deviceOption.icon" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Enhanced preview content -->
    <div class="preview-content" :class="deviceClasses">
      <div class="email-client-frame">
        <!-- Email client header -->
        <template v-if="currentDevice === 'desktop'">
          <div class="email-header">
            <div class="email-sender">
              <div class="sender-avatar">
                <Icon name="lucide:user" class="w-4 h-4 text-slate-600" />
              </div>
              <div class="sender-info">
                <div class="sender-name">{{ safeGetValue(newsletter, 'from_name', 'Your Company') }}</div>
                <div class="sender-email">&lt;{{ safeGetValue(newsletter, 'from_email', 'newsletter@company.com') }}&gt;</div>
              </div>
            </div>
            <div class="email-meta">
              <span class="email-time">{{ formatTime() }}</span>
              <div class="email-actions">
                <Icon name="lucide:reply" class="w-4 h-4 text-slate-400" />
                <Icon name="lucide:forward" class="w-4 h-4 text-slate-400" />
                <Icon name="lucide:more-vertical" class="w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>
          <div class="email-subject">
            <h3>{{ safeGetValue(newsletter, 'subject_line', 'Newsletter Subject Line') }}</h3>
            <div class="subject-meta">
              <span class="to-line">to me</span>
              <Icon name="lucide:chevron-down" class="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </template>

        <!-- Email content area -->
        <div class="email-content" :style="contentStyles">
          <!-- Compilation error -->
          <div v-if="compilationError" class="compilation-error">
            <Icon name="lucide:alert-triangle" class="w-5 h-5 text-amber-500" />
            <div>
              <h4>Compilation Error</h4>
              <p>{{ compilationError }}</p>
              <button @click="refreshPreview" class="retry-button">
                <Icon name="lucide:refresh-cw" class="w-4 h-4" />
                Try Again
              </button>
            </div>
          </div>

          <!-- Loading state -->
          <div v-else-if="isCompiling" class="loading-state">
            <Icon name="lucide:loader-2" class="w-8 h-8 animate-spin text-blue-500" />
            <p>Compiling newsletter...</p>
          </div>

          <!-- Empty state -->
          <div v-else-if="!compiledHtml" class="empty-content">
            <Icon name="lucide:mail" class="w-12 h-12 text-slate-300" />
            <h4>No Content Yet</h4>
            <p>Add some blocks to see your newsletter preview</p>
          </div>

          <!-- Compiled newsletter -->
          <iframe
            v-else
            ref="previewFrame"
            :srcdoc="iframeContent"
            class="newsletter-iframe"
            @load="handleIframeLoad"
          ></iframe>
        </div>
      </div>
    </div>

    <!-- MJML Source Modal -->
    <Transition name="modal">
      <div v-if="showMjmlSource" class="modal-overlay" @click="showMjmlSource = false">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>MJML Source</h3>
            <button @click="showMjmlSource = false" class="modal-close">
              <Icon name="lucide:x" class="w-5 h-5" />
            </button>
          </div>
          <div class="modal-body">
            <div class="source-tabs">
              <button
                @click="sourceTab = 'mjml'"
                class="source-tab"
                :class="{ 'active': sourceTab === 'mjml' }"
              >
                MJML
              </button>
              <button
                @click="sourceTab = 'html'"
                class="source-tab"
                :class="{ 'active': sourceTab === 'html' }"
              >
                HTML
              </button>
            </div>
            <div class="source-container">
              <pre><code>{{ sourceTab === 'mjml' ? compiledMjml : compiledHtml }}</code></pre>
            </div>
            <div class="source-actions">
              <button @click="copySource" class="copy-button">
                <Icon :name="copied ? 'lucide:check' : 'lucide:copy'" class="w-4 h-4" />
                {{ copied ? 'Copied!' : 'Copy' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';

interface Props {
  newsletter: any
  blockTypes: any[]
  device?: 'desktop' | 'mobile' | 'tablet'
}

const props = withDefaults(defineProps<Props>(), {
  device: 'desktop'
})

const emit = defineEmits<{
  'update:compiled': [value: { mjml: string; html: string }]
}>()

// Core state
const compiledMjml = ref('')
const compiledHtml = ref('')
const currentDevice = ref(props.device)
const showMjmlSource = ref(false)
const sourceTab = ref('mjml')
const copied = ref(false)

// Preview frame reference
const previewFrame = ref<HTMLIFrameElement | null>(null)

// Device options with proper lucide icons
const deviceOptions = [
  { value: 'desktop', label: 'Desktop', icon: 'lucide:monitor' },
  { value: 'tablet', label: 'Tablet', icon: 'lucide:tablet' },
  { value: 'mobile', label: 'Mobile', icon: 'lucide:smartphone' }
]

// Composables
const { debouncedCompile, isCompiling, compilationError } = useMjmlCompiler()

// Safe value getter to prevent [object Object] display
const safeGetValue = (obj: any, key: string, fallback: string = '') => {
  if (!obj || typeof obj !== 'object') return fallback
  const value = obj[key]
  if (value === null || value === undefined) return fallback
  if (typeof value === 'string') return value
  if (typeof value === 'number') return value.toString()
  return fallback
}

// Computed properties
const deviceClasses = computed(() => ({
  'device-desktop': currentDevice.value === 'desktop',
  'device-tablet': currentDevice.value === 'tablet',
  'device-mobile': currentDevice.value === 'mobile'
}))

const contentStyles = computed(() => ({
  '--device-width': currentDevice.value === 'desktop' ? '600px' : 
                   currentDevice.value === 'tablet' ? '768px' : '375px'
}))

const iframeContent = computed(() => {
  if (!compiledHtml.value) return ''
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Newsletter Preview</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f8fafc;
          }
          .newsletter-container {
            max-width: var(--device-width, 600px);
            margin: 0 auto;
            background: white;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
        </style>
      </head>
      <body>
        <div class="newsletter-container">
          ${compiledHtml.value}
        </div>
      </body>
    </html>
  `
})

// Methods
const formatTime = () => {
  return new Date().toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  })
}

const refreshPreview = async () => {
  if (!props.newsletter || !Array.isArray(props.newsletter.blocks)) {
    compiledMjml.value = ''
    compiledHtml.value = ''
    return
  }

  const result = await debouncedCompile(props.newsletter, props.blockTypes)
  
  if (result) {
    compiledMjml.value = result.mjml
    compiledHtml.value = result.html
    
    // Emit compiled content
    emit('update:compiled', { mjml: result.mjml, html: result.html })
    
    // Log any compilation errors/warnings
    if (result.errors && result.errors.length > 0) {
      console.warn('MJML compilation warnings:', result.errors)
    }
  }
}

const compileBlockToMjml = (block: any, blockType: any) => {
  if (!blockType.mjml_template) return ''
  
  let mjml = blockType.mjml_template
  const content = block.content || {}

  // Replace handlebars-style placeholders
  Object.keys(content).forEach(key => {
    const value = content[key]
    if (value !== null && value !== undefined) {
      // Handle both {{key}} and {{{key}}} patterns
      mjml = mjml.replace(new RegExp(`\\{\\{\\{${key}\\}\\}\\}`, 'g'), String(value))
      mjml = mjml.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value))
    }
  })

  // Handle conditional blocks {{#if key}}...{{/if}}
  mjml = mjml.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, key, content) => {
    const value = block.content?.[key]
    return (value && value !== '' && value !== null && value !== undefined) ? content : ''
  })

  return mjml
}

const handleIframeLoad = () => {
  if (!previewFrame.value) return
  
  try {
    // Apply device-specific styles to iframe content
    const iframeDoc = previewFrame.value.contentDocument
    if (iframeDoc) {
      const style = iframeDoc.createElement('style')
      style.textContent = `
        body { 
          transform-origin: top left;
          ${currentDevice.value === 'mobile' ? 'transform: scale(0.8);' : ''}
        }
      `
      iframeDoc.head.appendChild(style)
    }
  } catch (error) {
    console.warn('Could not apply iframe styles:', error)
  }
}

const copySource = async () => {
  const content = sourceTab.value === 'mjml' ? compiledMjml.value : compiledHtml.value
  
  try {
    await navigator.clipboard.writeText(content)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (error) {
    console.error('Failed to copy:', error)
  }
}

// Watchers
watch(() => props.newsletter, refreshPreview, { deep: true })
watch(() => props.blockTypes, refreshPreview)
watch(currentDevice, () => {
  nextTick(() => {
    if (previewFrame.value) {
      handleIframeLoad()
    }
  })
})

// Lifecycle
onMounted(() => {
  refreshPreview()
})

// Cleanup
onUnmounted(() => {
  // Clean up any timers or listeners if needed
})
</script>

<style scoped>
@reference 'tailwindcss';
.newsletter-preview-container {
  @apply h-full flex flex-col bg-white border-l border-slate-200;
}

.preview-header {
  @apply flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50;
}

.preview-title {
  @apply flex items-center gap-2 text-sm font-medium text-slate-900;
}

.preview-controls {
  @apply flex items-center gap-2;
}

.control-button {
  @apply p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors;
}

.device-selector {
  @apply flex items-center gap-1 bg-white rounded-lg p-1 border border-slate-200;
}

.device-button {
  @apply p-2 text-slate-600 hover:text-slate-900 rounded-md transition-colors;
}

.device-button.active {
  @apply bg-blue-100 text-blue-700;
}

.preview-content {
  @apply flex-1 overflow-hidden;
}

.email-client-frame {
  @apply h-full flex flex-col;
}

.email-header {
  @apply flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50;
}

.email-sender {
  @apply flex items-center gap-3;
}

.sender-avatar {
  @apply w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center;
}

.sender-info {
  @apply text-sm;
}

.sender-name {
  @apply font-medium text-slate-900;
}

.sender-email {
  @apply text-slate-600;
}

.email-meta {
  @apply flex items-center gap-4 text-sm text-slate-600;
}

.email-actions {
  @apply flex items-center gap-2;
}

.email-subject {
  @apply p-4 border-b border-slate-200;
}

.email-subject h3 {
  @apply text-lg font-medium text-slate-900 mb-1;
}

.subject-meta {
  @apply flex items-center gap-2 text-sm text-slate-600;
}

.email-content {
  @apply flex-1 overflow-auto;
}

.compilation-error {
  @apply flex items-start gap-3 p-6 text-red-700 bg-red-50 border border-red-200 rounded-lg m-4;
}

.compilation-error h4 {
  @apply font-medium mb-1;
}

.compilation-error p {
  @apply text-sm mb-3;
}

.retry-button {
  @apply flex items-center gap-2 px-3 py-1 text-sm bg-red-100 hover:bg-red-200 rounded-md transition-colors;
}

.loading-state {
  @apply flex flex-col items-center justify-center p-8 text-slate-600;
}

.loading-state p {
  @apply mt-3 text-sm;
}

.empty-content {
  @apply flex flex-col items-center justify-center p-8 text-slate-500;
}

.empty-content h4 {
  @apply text-lg font-medium mt-4 mb-2;
}

.empty-content p {
  @apply text-sm text-center;
}

.newsletter-iframe {
  @apply w-full h-full border-0;
}

/* Device-specific styles */
.device-desktop .newsletter-iframe {
  @apply w-full;
}

.device-tablet .newsletter-iframe {
  @apply max-w-3xl mx-auto;
}

.device-mobile .newsletter-iframe {
  @apply max-w-sm mx-auto;
}

/* Modal styles */
.modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
}

.modal-content {
  @apply bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col;
}

.modal-header {
  @apply flex items-center justify-between p-6 border-b border-slate-200;
}

.modal-header h3 {
  @apply text-lg font-medium text-slate-900;
}

.modal-close {
  @apply p-2 text-slate-400 hover:text-slate-600 rounded-md transition-colors;
}

.modal-body {
  @apply flex-1 overflow-hidden flex flex-col;
}

.source-tabs {
  @apply flex border-b border-slate-200;
}

.source-tab {
  @apply px-6 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 border-b-2 border-transparent transition-colors;
}

.source-tab.active {
  @apply text-blue-600 border-blue-600;
}

.source-container {
  @apply flex-1 overflow-auto p-6 bg-slate-50;
}

.source-container pre {
  @apply text-sm bg-white rounded-lg p-4 overflow-auto;
}

.source-actions {
  @apply flex items-center justify-end gap-3 p-6 border-t border-slate-200;
}

.copy-button {
  @apply flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors;
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  @apply transition-all duration-200;
}

.modal-enter-from,
.modal-leave-to {
  @apply opacity-0 transform scale-95;
}
</style>