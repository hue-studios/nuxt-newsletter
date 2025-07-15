<!-- NewsletterPreview.vue - Fixed Version -->
<template>
  <div class="newsletter-preview-container">
    <!-- Simplified header without device controls -->
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
      </div>
    </div>

    <!-- Preview content with proper device responsive styles -->
    <div class="preview-content">
      <div 
        class="email-preview-frame" 
        :class="deviceClasses" 
        :style="contentStyles"
      >
        
        <!-- Loading state -->
        <div v-if="isCompiling" class="loading-state">
          <Icon name="lucide:loader-2" class="w-6 h-6 animate-spin text-slate-400" />
          <p>Compiling newsletter...</p>
        </div>

        <!-- Error state -->
        <div v-else-if="compilationError" class="compilation-error">
          <Icon name="lucide:alert-triangle" class="w-5 h-5 text-red-600" />
          <div>
            <h4>Compilation Error</h4>
            <p>{{ compilationError }}</p>
            <button @click="refreshPreview" class="retry-button">
              <Icon name="lucide:refresh-cw" class="w-4 h-4" />
              Retry
            </button>
          </div>
        </div>

        <!-- Empty state -->
        <div v-else-if="!newsletter?.blocks?.length" class="empty-content">
          <Icon name="lucide:file-text" class="w-12 h-12 text-slate-300" />
          <h4>No Content Yet</h4>
          <p>Add some blocks to your newsletter to see the preview here.</p>
        </div>

        <!-- Newsletter iframe -->
        <iframe
          v-else
          ref="previewFrame"
          :srcdoc="compiledHtml"
          class="newsletter-iframe"
          @load="handleIframeLoad"
          frameborder="0"
          scrolling="auto"
        />
      </div>
    </div>

    <!-- MJML Source Modal -->
    <Transition name="modal">
      <div v-if="showMjmlSource" class="modal-overlay" @click="showMjmlSource = false">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>Newsletter Source</h3>
            <button @click="showMjmlSource = false" class="modal-close">
              <Icon name="lucide:x" class="w-5 h-5" />
            </button>
          </div>
          <div class="modal-body">
            <div class="source-tabs">
              <button
                @click="sourceTab = 'mjml'"
                class="source-tab"
                :class="{ active: sourceTab === 'mjml' }"
              >
                MJML
              </button>
              <button
                @click="sourceTab = 'html'"
                class="source-tab"
                :class="{ active: sourceTab === 'html' }"
              >
                HTML
              </button>
            </div>
            <div class="source-container">
              <pre><code>{{ sourceTab === 'mjml' ? compiledMjml : compiledHtml }}</code></pre>
            </div>
          </div>
          <div class="source-actions">
            <button @click="copySource" class="copy-button">
              <Icon :name="copied ? 'lucide:check' : 'lucide:copy'" class="w-4 h-4" />
              {{ copied ? 'Copied!' : 'Copy' }}
            </button>
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
const showMjmlSource = ref(false)
const sourceTab = ref('mjml')
const copied = ref(false)

// Preview frame reference
const previewFrame = ref<HTMLIFrameElement | null>(null)

// Watch for device prop changes and update internal state
const currentDevice = ref(props.device)
watch(() => props.device, (newDevice) => {
  currentDevice.value = newDevice
}, { immediate: true })

// Composables - with fallback if useMjmlCompiler is not available
let debouncedCompile, isCompiling, compilationError

try {
  const mjmlComposer = useMjmlCompiler()
  debouncedCompile = mjmlComposer.debouncedCompile
  isCompiling = mjmlComposer.isCompiling
  compilationError = mjmlComposer.compilationError
} catch (error) {
  console.warn('useMjmlCompiler not available, using fallback')
  
  // Fallback compilation
  isCompiling = ref(false)
  compilationError = ref(null)
  
  debouncedCompile = async (mjmlContent) => {
    isCompiling.value = true
    compilationError.value = null
    
    try {
      // Simple HTML wrapper for preview when MJML compiler is not available
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              margin: 0; 
              padding: 20px; 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: #f8fafc;
            }
            .email-container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              border-radius: 8px;
              padding: 20px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .block {
              margin-bottom: 20px;
              padding: 15px;
              border: 1px solid #e5e7eb;
              border-radius: 4px;
            }
            .block h1, .block h2, .block h3 { margin-top: 0; }
            .block p { margin-bottom: 0; }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="block">
              <h2>Newsletter Preview</h2>
              <p>MJML compiler not available. Showing basic preview.</p>
            </div>
            ${mjmlContent ? `
              <div class="block">
                <h3>MJML Content:</h3>
                <pre style="background: #f3f4f6; padding: 10px; border-radius: 4px; overflow-x: auto; font-size: 12px;">${mjmlContent}</pre>
              </div>
            ` : ''}
          </div>
        </body>
        </html>
      `
      
      return { html, mjml: mjmlContent }
    } catch (error) {
      compilationError.value = error.message
      return { html: '<p>Compilation failed</p>', mjml: mjmlContent }
    } finally {
      isCompiling.value = false
    }
  }
}

// Safe value getter to prevent [object Object] display
const safeGetValue = (obj: any, key: string, fallback: string = '') => {
  if (!obj || typeof obj !== 'object') return fallback
  const value = obj[key]
  if (value === null || value === undefined) return fallback
  if (typeof value === 'string') return value
  if (typeof value === 'number') return value.toString()
  return fallback
}

// Computed properties for responsive design
const deviceClasses = computed(() => ({
  'device-desktop': currentDevice.value === 'desktop',
  'device-tablet': currentDevice.value === 'tablet',
  'device-mobile': currentDevice.value === 'mobile'
}))

const contentStyles = computed(() => {
  const styles: Record<string, string> = {}
  
  switch (currentDevice.value) {
    case 'desktop':
      styles['--device-width'] = '600px'
      styles['--device-height'] = 'auto'
      break
    case 'tablet':
      styles['--device-width'] = '480px'
      styles['--device-height'] = 'auto'
      break
    case 'mobile':
      styles['--device-width'] = '320px'
      styles['--device-height'] = 'auto'
      break
  }
  
  return styles
})

// Methods
const refreshPreview = async () => {
  if (!props.newsletter?.blocks?.length) {
    // Show empty state
    compiledHtml.value = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { 
            margin: 0; 
            padding: 40px; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f8fafc;
            text-align: center;
            color: #64748b;
          }
          .empty-state {
            max-width: 400px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          .empty-icon {
            font-size: 48px;
            margin-bottom: 16px;
          }
          h3 { margin: 0 0 8px 0; color: #1e293b; }
          p { margin: 0; }
        </style>
      </head>
      <body>
        <div class="empty-state">
          <div class="empty-icon">📧</div>
          <h3>No Content Yet</h3>
          <p>Add some blocks to your newsletter to see the preview here.</p>
        </div>
      </body>
      </html>
    `
    compiledMjml.value = ''
    return
  }
  
  try {
    const mjmlContent = generateMjmlFromBlocks(props.newsletter.blocks)
    const result = await debouncedCompile(mjmlContent)
    
    if (result && result.html) {
      compiledMjml.value = mjmlContent
      compiledHtml.value = result.html
      
      emit('update:compiled', { mjml: mjmlContent, html: result.html })
    } else {
      console.error('Invalid compilation result:', result)
      compiledHtml.value = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              margin: 0; 
              padding: 40px; 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: #fef2f2;
              text-align: center;
              color: #dc2626;
            }
          </style>
        </head>
        <body>
          <h3>Compilation Error</h3>
          <p>Could not compile newsletter preview.</p>
        </body>
        </html>
      `
    }
  } catch (error) {
    console.error('Preview compilation error:', error)
    compiledHtml.value = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { 
            margin: 0; 
            padding: 40px; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #fef2f2;
            text-align: center;
            color: #dc2626;
          }
        </style>
      </head>
      <body>
        <h3>Preview Error</h3>
        <p>${error.message || 'Unknown error occurred'}</p>
      </body>
      </html>
    `
  }
}

const generateMjmlFromBlocks = (blocks: any[]) => {
  if (!blocks?.length) return ''
  
  const bodyContent = blocks.map(block => {
    if (!block) return ''
    
    const blockType = props.blockTypes.find(bt => bt.id === block.block_type)
    if (!blockType) {
      console.warn('Block type not found for:', block.block_type)
      return `<mj-section><mj-column><mj-text>Unknown block type: ${block.block_type}</mj-text></mj-column></mj-section>`
    }
    
    let mjml = blockType.mjml_template || '<mj-section><mj-column><mj-text>No template</mj-text></mj-column></mj-section>'
    
    // Replace placeholders with actual values
    if (block.content) {
      mjml = mjml.replace(/\{\{(\w+)\}\}/g, (match: string, key: string) => {
        const value = safeGetValue(block.content, key, '')
        return value
      })
      
      // Handle conditional content
      mjml = mjml.replace(/\{\{if (\w+)\}\}(.*?)\{\{\/if\}\}/g, (match: string, key: string, content: string) => {
        const value = block.content?.[key]
        const shouldShow = value && value !== '' && value !== null && value !== undefined
        return shouldShow ? content : ''
      })
    }
    
    return mjml
  }).join('\n')
  
  const fullMjml = `
<mjml>
  <mj-head>
    <mj-title>${props.newsletter?.subject || 'Newsletter'}</mj-title>
    <mj-font name="Inter" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" />
    <mj-attributes>
      <mj-all font-family="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" />
    </mj-attributes>
  </mj-head>
  <mj-body background-color="#f8fafc">
    <mj-container background-color="#ffffff" border-radius="8px" padding="20px">
      ${bodyContent || '<mj-section><mj-column><mj-text>No content blocks</mj-text></mj-column></mj-section>'}
    </mj-container>
  </mj-body>
</mjml>`.trim()
  
  return fullMjml
}

const handleIframeLoad = () => {
  if (!previewFrame.value) return
  
  try {
    const iframeDoc = previewFrame.value.contentDocument
    if (iframeDoc) {
      // Ensure iframe content is properly sized
      const style = iframeDoc.createElement('style')
      style.textContent = `
        html, body { 
          margin: 0; 
          padding: 0; 
          width: 100%; 
          height: auto;
          overflow-x: hidden;
        }
        body { 
          transform-origin: top left;
          ${currentDevice.value === 'mobile' ? 'transform: scale(0.9);' : ''}
        }
      `
      iframeDoc.head.appendChild(style)
      
      // Auto-resize iframe to content
      const resizeIframe = () => {
        if (previewFrame.value && iframeDoc.body) {
          const height = Math.max(
            iframeDoc.body.scrollHeight,
            iframeDoc.documentElement.scrollHeight,
            500 // minimum height
          )
          previewFrame.value.style.height = `${height}px`
        }
      }
      
      // Initial resize
      setTimeout(resizeIframe, 100)
      
      // Watch for content changes
      const observer = new MutationObserver(resizeIframe)
      observer.observe(iframeDoc.body, { childList: true, subtree: true })
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

onUnmounted(() => {
  // Cleanup if needed
})
</script>

<style scoped>
@reference 'tailwindcss';
.newsletter-preview-container {
  @apply h-full flex flex-col bg-white;
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

.preview-content {
  @apply flex-1 overflow-auto p-4 bg-slate-50;
}

.email-preview-frame {
  @apply mx-auto transition-all duration-300;
  width: var(--device-width, 100%);
  max-width: 100%;
}

/* Device specific widths */
.device-desktop {
  width: 600px !important;
  max-width: 100% !important;
}

.device-tablet {
  width: 480px !important;
  max-width: 100% !important;
}

.device-mobile {
  width: 320px !important;
  max-width: 100% !important;
}

.newsletter-iframe {
  @apply w-full border border-slate-200 rounded-lg bg-white;
  min-height: 500px;
}

.loading-state {
  @apply flex flex-col items-center justify-center p-8 text-slate-600 min-h-[400px];
}

.loading-state p {
  @apply mt-3 text-sm;
}

.compilation-error {
  @apply flex items-start gap-3 p-6 text-red-700 bg-red-50 border border-red-200 rounded-lg;
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

.empty-content {
  @apply flex flex-col items-center justify-center p-8 text-slate-500 min-h-[400px];
}

.empty-content h4 {
  @apply text-lg font-medium mt-4 mb-2;
}

.empty-content p {
  @apply text-sm text-center;
}

/* Modal styles */
.modal-overlay {
  @apply fixed inset-0 bg-black/50 flex items-center justify-center z-50;
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