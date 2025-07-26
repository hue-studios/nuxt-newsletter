<!-- NewsletterPreview.vue - Device controls only in preview component -->
<template>
  <div class="newsletter-preview-container" :class="`preview-device-${device}`">
    <div class="preview-header">
      <div class="preview-title">
        <Icon name="lucide:eye" class="w-4 h-4" />
        <span>Preview</span>
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
        <button @click="refreshPreview" class="control-button" title="Refresh preview">
          <Icon name="lucide:refresh-cw" class="w-4 h-4" />
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
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

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
      currentStep.value = null
    } else {
      throw new Error(response.error || 'Compilation failed')
    }
  } catch (error) {
    console.error('Newsletter compilation failed:', error)
    compilationError.value = error instanceof Error ? error.message : 'Unknown compilation error'
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
              Add blocks to your newsletter to see the preview.
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

// Watchers
watch(() => props.newsletter, () => {
  // Auto-refresh when newsletter changes
  refreshPreview()
}, { deep: true })

watch(() => props.blockTypes, () => {
  // Auto-refresh when block types change
  refreshPreview()
}, { deep: true })

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
  // Initial compilation
  if (props.newsletter?.blocks?.length > 0) {
    refreshPreview()
  }
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

.dark-mode .preview-header {
  @apply border-gray-700 bg-gray-800;
}

.preview-title {
  @apply flex items-center gap-2 text-sm font-medium text-gray-900;
}

.dark-mode .preview-title {
  @apply text-white;
}

.preview-controls {
  @apply flex items-center gap-3;
}

/* Device Switcher */
.device-switcher {
  @apply flex items-center gap-1 bg-white rounded-lg p-1 border border-gray-200;
}

.dark-mode .device-switcher {
  @apply bg-gray-700 border-gray-600;
}

.device-button {
  @apply flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm font-medium;
}

.device-button:hover {
  @apply bg-gray-100;
}

.device-button.active {
  @apply bg-blue-100 text-blue-600 shadow-sm;
}

.dark-mode .device-button:hover {
  @apply bg-gray-600;
}

.dark-mode .device-button.active {
  @apply bg-blue-900 text-blue-400;
}

.device-label {
  @apply hidden sm:inline;
}

.control-button {
  @apply p-2 rounded transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-100;
}

.dark-mode .control-button {
  @apply text-gray-400 hover:text-white hover:bg-gray-700;
}

.divider {
  @apply w-px h-6 bg-gray-300;
}

.dark-mode .divider {
  @apply bg-gray-600;
}

/* Preview Content */
.preview-content {
  @apply flex-1 overflow-auto bg-gray-100 p-4;
}

.dark-mode .preview-content {
  @apply bg-gray-900;
}

.email-preview-frame {
  @apply bg-white rounded shadow-sm min-h-full;
}

.dark-mode .email-preview-frame {
  @apply bg-gray-800;
}

/* States */
.loading-state {
  @apply flex flex-col items-center justify-center p-12 text-gray-500;
}

.loading-state p {
  @apply mt-3 text-sm;
}

.loading-state small {
  @apply text-xs text-gray-400 mt-1;
}

.compilation-error {
  @apply p-8 text-center;
}

.compilation-error h4 {
  @apply text-red-600 font-semibold mb-2;
}

.compilation-error p {
  @apply text-gray-600 mb-4;
}

.error-retry-button {
  @apply inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors;
}

.empty-content {
  @apply flex flex-col items-center justify-center p-12 text-gray-400;
}

.empty-content h4 {
  @apply text-lg font-medium mt-4 mb-2;
}

.empty-refresh-button {
  @apply inline-flex items-center gap-2 px-4 py-2 mt-4 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors;
}

/* Iframe styles */
.preview-iframe-container {
  @apply h-full;
}

.preview-iframe {
  @apply w-full h-full border-0;
  min-height: 600px;
}

/* Responsive iframe sizes */
.device-mobile {
  width: 375px;
  min-height: 667px;
}

.device-tablet {
  width: 100%;
  min-height: 800px;
}

/* Fullscreen Modal */
.fullscreen-modal {
  @apply fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4;
}

.fullscreen-content {
  @apply bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-full flex flex-col;
}

.dark-mode .fullscreen-content {
  @apply bg-gray-800;
}

.fullscreen-header {
  @apply flex items-center justify-between p-4 border-b border-gray-200;
}

.dark-mode .fullscreen-header {
  @apply border-gray-700;
}

.fullscreen-header h3 {
  @apply text-lg font-semibold text-gray-900;
}

.dark-mode .fullscreen-header h3 {
  @apply text-white;
}

.close-button {
  @apply p-2 rounded hover:bg-gray-100 transition-colors;
}

.dark-mode .close-button {
  @apply hover:bg-gray-700;
}

.fullscreen-preview {
  @apply flex-1 overflow-auto p-4 bg-gray-100;
}

.dark-mode .fullscreen-preview {
  @apply bg-gray-900;
}

.fullscreen-iframe {
  @apply w-full h-full border-0 bg-white rounded shadow-sm;
  min-height: 800px;
}

.dark-mode .fullscreen-iframe {
  @apply bg-gray-800;
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  @apply transition-all duration-300;
}

.modal-enter-from,
.modal-leave-to {
  @apply opacity-0 scale-95;
}
</style>