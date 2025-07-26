<!-- NewsletterPreview.vue - Complete component with manual refresh only -->
<template>
  <div class="newsletter-preview-container" :class="`preview-device-${device}`">
    <div class="preview-header">
      <div class="preview-title">
        <Icon name="lucide:eye" class="w-4 h-4" />
        <span>Preview</span>
        <span v-if="lastRefreshTime" class="last-refresh">
          Last updated: {{ formatTime(lastRefreshTime) }}
        </span>
      </div>
      
      <div class="preview-controls">
        <!-- Device Toggle Controls -->
        <div class="device-switcher">
          <button 
            v-for="deviceOption in deviceOptions" 
            :key="deviceOption.value"
            @click="setDevice(deviceOption.value)"
            :class="['device-button', { active: device === deviceOption.value }]"
            :title="`Preview on ${deviceOption.label}`"
          >
            <Icon :name="deviceOption.icon" class="w-4 h-4" />
            <span class="device-label">{{ deviceOption.label }}</span>
          </button>
        </div>
        
        <div class="divider" />
        
        <!-- Action Controls -->
        <button 
          @click="refreshPreview" 
          :disabled="isCompiling"
          :class="['control-button', 'refresh-button', { 'loading': isCompiling }]" 
          title="Refresh preview (Ctrl+R)"
        >
          <Icon :name="isCompiling ? 'lucide:loader-2' : 'lucide:refresh-cw'" 
                :class="['w-4 h-4', { 'animate-spin': isCompiling }]" />
          <span class="button-text">{{ isCompiling ? 'Updating...' : 'Refresh' }}</span>
        </button>
        
        <button @click="toggleFullscreen" class="control-button" title="Toggle fullscreen">
          <Icon name="lucide:expand" class="w-4 h-4" />
        </button>
      </div>
    </div>

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
          <Icon name="lucide:alert-triangle" class="w-8 h-8 text-red-500" />
          <h4>Compilation Error</h4>
          <p>{{ compilationError }}</p>
          <button @click="refreshPreview" class="error-retry-button">
            <Icon name="lucide:refresh-cw" class="w-4 h-4" />
            Retry
          </button>
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
          <Icon name="lucide:mail-plus" class="w-12 h-12 text-gray-400" />
          <h4>No Preview Available</h4>
          <p>Click "Refresh" to generate preview from your current blocks.</p>
          <button @click="refreshPreview" class="empty-refresh-button">
            <Icon name="lucide:refresh-cw" class="w-4 h-4" />
            Generate Preview
          </button>
        </div>
      </div>
    </div>

    <!-- Fullscreen Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="isFullscreen" class="fullscreen-modal" @click="toggleFullscreen">
          <div class="fullscreen-content" @click.stop>
            <div class="fullscreen-header">
              <h3>Newsletter Preview - {{ deviceOptions.find(d => d.value === device)?.label }}</h3>
              <button @click="toggleFullscreen" class="close-button">
                <Icon name="lucide:x" class="w-5 h-5" />
              </button>
            </div>
            
            <div class="fullscreen-preview">
              <iframe 
                v-if="compiledHtml"
                :srcdoc="compiledHtml"
                :class="['fullscreen-iframe', deviceIframeClass]"
              />
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { $fetch } from 'ofetch'
import { computed, onMounted, onUnmounted, ref } from 'vue'

interface Props {
  newsletter?: any
  blockTypes?: any[]
  device?: 'mobile' | 'tablet'
  previewMode?: 'iframe' | 'html'
}

const props = withDefaults(defineProps<Props>(), {
  device: 'mobile',
  previewMode: 'iframe'
})

const emit = defineEmits<{
  'update:device': [device: 'mobile' | 'tablet']
  'error': [error: any]
}>()

// State
const device = ref(props.device)
const isCompiling = ref(false)
const compilationError = ref<string | null>(null)
const compiledHtml = ref<string | null>(null)
const currentStep = ref<string | null>(null)
const isFullscreen = ref(false)
const previewFrame = ref<HTMLIFrameElement>()
const lastRefreshTime = ref<Date | null>(null)

// Device options
const deviceOptions = [
  {
    value: 'mobile',
    label: 'Mobile',
    icon: 'lucide:smartphone'
  },
  {
    value: 'tablet',
    label: 'Desktop',
    icon: 'lucide:monitor'
  }
]

// Computed
const deviceIframeClass = computed(() => {
  return `device-${device.value}`
})

// Methods
const setDevice = (newDevice: 'mobile' | 'tablet') => {
  device.value = newDevice
  emit('update:device', newDevice)
}

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
}

const refreshPreview = async () => {
  if (isCompiling.value) return
  
  await compileNewsletter()
}

const compileNewsletter = async () => {
  if (!props.newsletter || !props.blockTypes) {
    compiledHtml.value = null
    compilationError.value = 'No newsletter data or block types available'
    return
  }

  isCompiling.value = true
  compilationError.value = null
  currentStep.value = 'Preparing compilation...'

  try {
    currentStep.value = 'Processing blocks...'
    
    // Generate MJML content inline
    const mjmlContent = generateMjml()
    
    currentStep.value = 'Compiling MJML to HTML...'
    
    // Compile MJML to HTML
    const response = await $fetch('/api/newsletter/compile-mjml', {
      method: 'POST',
      body: {
        mjml: mjmlContent,
        options: {
          validationLevel: 'strict',
          beautify: true
        }
      }
    })

    if (response.success || response.html) {
      compiledHtml.value = response.html
      lastRefreshTime.value = new Date()
      currentStep.value = null
      compilationError.value = null
    } else {
      throw new Error(response.error || 'Compilation failed')
    }
  } catch (error) {
    console.error('Newsletter compilation failed:', error)
    compilationError.value = error instanceof Error ? 
      error.message : 'Unknown compilation error'
    emit('error', error)
  } finally {
    isCompiling.value = false
    currentStep.value = null
  }
}

const generateMjml = (): string => {
  if (!props.newsletter?.blocks?.length) {
    return createEmptyMjml()
  }

  let bodyContent = ''
  
  props.newsletter.blocks.forEach((block: any) => {
    const blockType = props.blockTypes?.find(bt => 
      bt.id === block.block_type || bt.slug === block.type
    )
    
    if (!blockType?.mjml_template) {
      console.warn(`No MJML template for block type: ${block.type}`)
      return
    }

    // Replace placeholders with actual content
    let mjml = blockType.mjml_template
    if (block.content) {
      Object.entries(block.content).forEach(([key, value]) => {
        const placeholder = new RegExp(`{{${key}}}`, 'g')
        mjml = mjml.replace(placeholder, String(value || ''))
      })
    }
    
    bodyContent += mjml + '\n'
  })

  // Build complete MJML document
  return `
    <mjml>
      <mj-head>
        <mj-title>${props.newsletter.subject || 'Newsletter'}</mj-title>
        <mj-preview>${props.newsletter.preheader || ''}</mj-preview>
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
}

const createEmptyMjml = (): string => {
  return `
    <mjml>
      <mj-body>
        <mj-section>
          <mj-column>
            <mj-text align="center" color="#666666">
              Add blocks to your newsletter to see the preview here.
            </mj-text>
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>
  `
}

const handleIframeLoad = () => {
  // Optional: Handle iframe load events
}

const handleIframeError = (error: Event) => {
  console.error('Iframe error:', error)
  emit('error', new Error('Preview iframe failed to load'))
}

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  })
}

// Keyboard shortcuts
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && isFullscreen.value) {
    toggleFullscreen()
  }
  
  if (e.key === 'r' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault()
    refreshPreview()
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  // NO automatic initial compilation - user must click refresh
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

// Expose methods
defineExpose({
  refreshPreview,
  compileNewsletter
})
</script>

<style scoped>
@reference 'tailwindcss';
/* Container */
.newsletter-preview-container {
  @apply h-full flex flex-col;
}

.preview-device-mobile .email-preview-frame {
  @apply mx-auto;
  max-width: 375px;
}

.preview-device-tablet .email-preview-frame {
  @apply mx-auto;
  max-width: 600px;
}

/* Preview Header */
.preview-header {
  @apply flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50;
}

.preview-title {
  @apply flex items-center gap-2 text-sm font-medium text-gray-900;
}

.last-refresh {
  @apply text-xs text-gray-500 ml-2;
}

.preview-controls {
  @apply flex items-center gap-2;
}

.device-switcher {
  @apply flex bg-white border border-gray-300 rounded-lg overflow-hidden;
}

.device-button {
  @apply flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors;
}

.device-button.active {
  @apply bg-blue-50 text-blue-700;
}

.device-label {
  @apply hidden sm:inline;
}

.divider {
  @apply w-px h-6 bg-gray-300;
}

.control-button {
  @apply flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
}

.refresh-button {
  @apply bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100;
}

.refresh-button.loading {
  @apply opacity-75 cursor-not-allowed;
}

.button-text {
  @apply hidden sm:inline;
}

/* Preview Content */
.preview-content {
  @apply flex-1 bg-gray-100 overflow-auto;
}

.email-preview-frame {
  @apply h-full p-4;
}

.preview-iframe-container {
  @apply h-full;
}

.preview-iframe {
  @apply w-full h-full border-0 bg-white rounded-lg shadow-sm;
}

/* States */
.loading-state {
  @apply flex flex-col items-center justify-center h-full text-gray-600;
}

.loading-state p {
  @apply mt-4 text-lg font-medium;
}

.loading-state small {
  @apply mt-2 text-sm text-gray-500;
}

.compilation-error {
  @apply flex flex-col items-center justify-center h-full text-center p-8;
}

.compilation-error h4 {
  @apply text-lg font-semibold text-red-700 mt-4;
}

.compilation-error p {
  @apply text-red-600 mt-2 max-w-md;
}

.error-retry-button {
  @apply flex items-center gap-2 mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors;
}

.empty-content {
  @apply flex flex-col items-center justify-center h-full text-center p-8;
}

.empty-content h4 {
  @apply text-lg font-semibold text-gray-700 mt-4;
}

.empty-content p {
  @apply text-gray-600 mt-2 max-w-md;
}

.empty-refresh-button {
  @apply flex items-center gap-2 mt-4 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors;
}

/* Fullscreen Modal */
.fullscreen-modal {
  @apply fixed inset-0 bg-black/75 flex items-center justify-center z-50;
}

.fullscreen-content {
  @apply bg-white rounded-lg shadow-xl w-full h-full max-w-6xl max-h-full overflow-hidden;
}

.fullscreen-header {
  @apply flex items-center justify-between p-4 border-b border-gray-200;
}

.fullscreen-header h3 {
  @apply text-lg font-semibold;
}

.close-button {
  @apply p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100;
}

.fullscreen-preview {
  @apply h-full p-4 bg-gray-100;
}

.fullscreen-iframe {
  @apply w-full h-full border-0 bg-white rounded-lg shadow-sm;
}

/* Transitions */
.modal-enter-active, .modal-leave-active {
  transition: opacity 0.3s;
}

.modal-enter-from, .modal-leave-to {
  opacity: 0;
}
</style>