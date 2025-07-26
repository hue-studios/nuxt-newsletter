<template>
  <div class="newsletter-preview-container" :class="`preview-device-${device}`">
    <div class="preview-header">
      <div class="preview-title">
        <Icon name="lucide:eye" class="w-4 h-4" />
        <span>Preview</span>
      </div>
      <div class="preview-controls">
        <button 
          v-for="deviceOption in deviceOptions" 
          :key="deviceOption.value"
          @click="setDevice(deviceOption.value)"
          :class="['device-button', { active: device === deviceOption.value }]"
          :title="`Preview on ${deviceOption.label}`"
        >
          <Icon :name="deviceOption.icon" class="w-4 h-4" />
        </button>
        <div class="divider" />
        <button @click="refreshPreview" class="control-button" title="Refresh preview">
          <Icon name="lucide:refresh-cw" class="w-4 h-4" />
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
  </div>
</template>

<script setup lang="ts">
import { $fetch } from 'ofetch'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useNewsletterContentMapping } from '../composables/useNewsletterContentMapping'

interface Props {
  newsletter?: any
  blockTypes?: any[]
  device?: 'mobile' | 'tablet'
  previewMode?: 'edit' | 'test'
}

interface Emits {
  (e: 'update:compiled', value: { mjml: string; html: string }): void
  (e: 'error', value: Error): void
  (e: 'preview-loaded'): void
}

const props = withDefaults(defineProps<Props>(), {
  device: 'mobile',
  previewMode: 'edit'
})

const emit = defineEmits<Emits>()

// State
const device = ref(props.device)
const isCompiling = ref(false)
const compiledHtml = ref('')
const compiledMjml = ref('')
const compilationError = ref<string | null>(null)
const currentStep = ref('')
const previewFrame = ref<HTMLIFrameElement>()
const blockTypeMap = ref(new Map())

// Track compilation state to prevent loops
const lastCompilationHash = ref('')
const compilationTimeout = ref<any>(null)

// Device options
const deviceOptions = [
  { value: 'mobile', label: 'Mobile', icon: 'lucide:smartphone' },
  { value: 'tablet', label: 'Tablet', icon: 'lucide:tablet' }
]

// Computed
const deviceIframeClass = computed(() => {
  switch (device.value) {
    case 'mobile':
      return 'device-mobile'
    case 'tablet':
      return 'device-tablet'
    default:
      return 'device-mobile'
  }
})

// Create a hash of the newsletter content to detect real changes
const getNewsletterHash = () => {
  if (!props.newsletter) return ''
  return JSON.stringify({
    subject: props.newsletter.subject_line || props.newsletter.subject,
    preheader: props.newsletter.preview_text || props.newsletter.preheader,
    blocks: props.newsletter.blocks?.map((b: any) => ({
      id: b.id,
      type: b.type,
      content: b.content
    }))
  })
}

// Replace handlebars variables with actual values
const replaceHandlebarsVariables = (template: string, data: Record<string, any>) => {
  let result = template
  
  // Replace all handlebars variables with data
  Object.entries(data).forEach(([key, value]) => {
    // Handle different value types
    const replacement = value === null || value === undefined ? '' : String(value)
    
    // Replace {{key}} patterns
    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g')
    result = result.replace(regex, replacement)
  })
  
  // Handle common newsletter variables if not in data
  const commonVars: Record<string, string> = {
    month_year: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    current_year: new Date().getFullYear().toString(),
    current_month: new Date().toLocaleDateString('en-US', { month: 'long' }),
    current_date: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  }
  
  Object.entries(commonVars).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g')
    result = result.replace(regex, value)
  })
  
  // Handle conditional blocks
  result = result.replace(/\{\{if\s+(\w+)\}\}(.*?)\{\{\/if\}\}/gs, (match, key, content) => {
    const value = data[key]
    const shouldShow = value && value !== '' && value !== null && value !== undefined
    return shouldShow ? content : ''
  })
  
  // Remove any remaining handlebars that couldn't be replaced
  result = result.replace(/\{\{[^}]+\}\}/g, '')
  
  return result
}

// Methods
const setDevice = (newDevice: string) => {
  device.value = newDevice as any
}

const generateMjml = () => {
  const { mapBlockContent } = useNewsletterContentMapping()
  
  if (!props.newsletter?.blocks?.length) {
    return createEmptyMjml()
  }

  // Update block type map
  if (props.blockTypes?.length) {
    blockTypeMap.value = new Map(props.blockTypes.map(bt => [bt.slug, bt]))
  }

  let bodyContent = ''
  
  props.newsletter.blocks.forEach((block: any) => {
    const blockType = blockTypeMap.value.get(block.type)
    
    if (!blockType) {
      console.warn(`Block type not found: ${block.type}`)
      return
    }

    // Get the actual content from the block
    const blockContent = block.content || {}
    
    // Map the content using the composable
    const mappedContent = mapBlockContent(block.type, blockContent)
    
    // Merge mapped content with block content to ensure all values are available
    const finalContent = {
      ...blockContent,
      ...mappedContent,
      // Add any additional fields that might be in settings
      ...block.settings
    }
    
    console.log(`Block ${block.type} final content:`, finalContent)
    
    // Get the MJML template
    let mjml = blockType.mjml_template || ''
    
    if (!mjml) {
      console.warn(`No MJML template for block type: ${block.type}`)
      return
    }
    
    // Replace variables in the template with actual content
    mjml = replaceHandlebarsVariables(mjml, finalContent)
    
    bodyContent += mjml + '\n'
  })

  // Build the complete MJML document
  const newsletterData = {
    subject_line: props.newsletter.subject_line || props.newsletter.subject || 'Newsletter',
    preview_text: props.newsletter.preview_text || props.newsletter.preheader || '',
    ...props.newsletter
  }
  
  const mjmlDocument = `
    <mjml>
      <mj-head>
        <mj-title>${replaceHandlebarsVariables(newsletterData.subject_line, newsletterData)}</mj-title>
        <mj-preview>${replaceHandlebarsVariables(newsletterData.preview_text, newsletterData)}</mj-preview>
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

const updatePreview = (html: string) => {
  if (previewFrame.value && html) {
    try {
      previewFrame.value.srcdoc = html
    } catch (error) {
      console.error('Error updating preview iframe:', error)
    }
  }
}

const generateFallbackHtml = () => {
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Newsletter Preview</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .error { color: #dc3545; padding: 20px; text-align: center; }
        .block { border: 1px solid #e0e0e0; margin: 10px; padding: 15px; }
        .block-title { font-weight: bold; color: #666; margin-bottom: 10px; }
      </style>
    </head>
    <body>
      <div class="container">`

  if (compilationError.value) {
    html += `<div class="error">Preview Error: ${compilationError.value}</div>`
  }

  if (props.newsletter?.blocks?.length) {
    props.newsletter.blocks.forEach((block: any, index: number) => {
      html += `
        <div class="block">
          <div class="block-title">Block ${index + 1}: ${block.type}</div>
          <pre>${JSON.stringify(block.content, null, 2)}</pre>
        </div>`
    })
  } else {
    html += '<p style="text-align: center; color: #666; padding: 40px;">Add blocks to see the preview.</p>'
  }

  html += '</body></html>'
  
  return html
}

// Main compilation function
const compileNewsletter = async () => {
  // Check if we're already compiling or if content hasn't changed
  const currentHash = getNewsletterHash()
  if (isCompiling.value || currentHash === lastCompilationHash.value) {
    return
  }

  if (!props.newsletter || !props.blockTypes?.length) {
    console.log('Missing required data for compilation')
    return
  }

  console.log('Starting MJML compilation...')
  isCompiling.value = true
  compilationError.value = null
  currentStep.value = 'Generating MJML...'
  lastCompilationHash.value = currentHash

  try {
    // Generate MJML
    const mjml = generateMjml()
    
    if (!mjml) {
      throw new Error('Failed to generate MJML')
    }

    currentStep.value = 'Compiling to HTML...'

    // Compile MJML to HTML
    const response = await $fetch('/api/newsletter/compile-mjml', {
      method: 'POST',
      body: { mjml },
      timeout: 8000
    })

    if (response.html) {
      console.log('Compilation successful')
      compiledHtml.value = response.html
      updatePreview(response.html)
      compilationError.value = null
      
      // Only emit if this is the initial compilation or manual refresh
      // Don't emit during reactive updates to prevent loops
      if (!compiledMjml.value) {
        emit('update:compiled', { mjml: compiledMjml.value, html: response.html })
      }
    } else if (response.errors && response.errors.length > 0) {
      console.error('MJML compilation errors:', response.errors)
      compilationError.value = `MJML errors: ${response.errors.join(', ')}`
      
      // Show fallback preview
      const fallbackHtml = generateFallbackHtml()
      compiledHtml.value = fallbackHtml
      updatePreview(fallbackHtml)
    }
  } catch (error: any) {
    console.error('Compilation error:', error)
    compilationError.value = error.message || 'Failed to compile newsletter'
    
    // Show fallback preview
    const fallbackHtml = generateFallbackHtml()
    compiledHtml.value = fallbackHtml
    updatePreview(fallbackHtml)
    
    emit('error', error)
  } finally {
    isCompiling.value = false
    currentStep.value = ''
  }
}

const refreshPreview = () => {
  // Clear the hash to force recompilation
  lastCompilationHash.value = ''
  compileNewsletter()
}

const handleIframeLoad = () => {
  console.log('Newsletter preview loaded successfully')
  emit('preview-loaded')
}

const handleIframeError = (error: Event) => {
  console.error('Preview iframe error:', error)
  compilationError.value = 'Failed to load preview'
}

// Watch for changes with proper debouncing
watch(
  () => props.newsletter,
  (newVal) => {
    if (newVal && props.blockTypes?.length) {
      // Clear existing timeout
      if (compilationTimeout.value) {
        clearTimeout(compilationTimeout.value)
      }
      
      // Debounce compilation
      compilationTimeout.value = setTimeout(() => {
        compileNewsletter()
      }, 800) // Increased debounce time
    }
  },
  { deep: true }
)

// Watch for block types changes
watch(
  () => props.blockTypes,
  (newVal) => {
    if (newVal?.length && props.newsletter?.blocks?.length) {
      // Only compile if we haven't compiled yet
      if (!compiledHtml.value) {
        compileNewsletter()
      }
    }
  }
)

// Watch device changes
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

// Cleanup
onUnmounted(() => {
  if (compilationTimeout.value) {
    clearTimeout(compilationTimeout.value)
  }
})

// Expose methods and state for parent components
defineExpose({
  refreshPreview,
  compiledMjml,
  compiledHtml
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
  max-width: 600px; /* Standard email width */
}

/* Preview Header */
.preview-header {
  @apply flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50;
}

.preview-title {
  @apply flex items-center gap-2 text-sm font-medium text-gray-900;
}

.preview-controls {
  @apply flex items-center gap-2;
}

.device-button {
  @apply p-2 rounded transition-colors;
  @apply hover:bg-gray-100;
}

.device-button.active {
  @apply bg-blue-100 text-blue-600;
}

.control-button {
  @apply p-2 rounded transition-colors;
  @apply hover:bg-gray-100;
}

.divider {
  @apply w-px h-6 bg-gray-300;
}

/* Preview Content */
.preview-content {
  @apply flex-1 overflow-auto bg-gray-100 p-4;
}

.email-preview-frame {
  @apply bg-white rounded shadow-sm min-h-full;
}

/* States */
.loading-state {
  @apply flex flex-col items-center justify-center p-12 text-gray-500;
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
  width: 600px;
  min-height: 800px;
}
</style>