<!-- Enhanced Debug Preview with detailed logging -->
<template>
  <div class="newsletter-preview-container">
    <!-- Debug Info -->
    <div class="debug-info">
      <h4>🔍 Enhanced Debug Info</h4>
      <div class="debug-details">
        <div class="debug-item">
          <strong>Newsletter Props:</strong>
          <div class="newsletter-debug">
            <span>Subject: {{ newsletter?.subject || 'undefined' }}</span>
            <span>Preheader: {{ newsletter?.preheader || 'undefined' }}</span>
            <span>Blocks Count: {{ newsletter?.blocks?.length || 0 }}</span>
          </div>
        </div>
        
        <div class="debug-item">
          <strong>Compilation Status:</strong>
          <div class="compilation-status">
            <span :class="compilationStatusClass">{{ compilationStatus }}</span>
            <span>Method: {{ compilationMethod }}</span>
            <span>MJML: {{ compiledMjml?.length || 0 }} chars</span>
            <span>HTML: {{ compiledHtml?.length || 0 }} chars</span>
          </div>
        </div>
        
        <div class="debug-item">
          <strong>Manual Compilation Steps:</strong>
          <div class="compilation-steps">
            <div v-for="step in manualSteps" :key="step.id" class="step-item" :class="step.status">
              <span class="step-number">{{ step.id }}</span>
              <span class="step-description">{{ step.description }}</span>
              <span class="step-result">{{ step.result }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Header -->
    <div class="preview-header">
      <div class="preview-title">
        <Icon name="lucide:mail" class="w-5 h-5 text-slate-600" />
        <span>Enhanced Debug Preview</span>
      </div>
      <div class="preview-controls">
        <button @click="runDetailedCompilation" class="control-button">
          <Icon name="lucide:play" class="w-4 h-4" />
          Run Detailed Compilation
        </button>
        <button @click="showMjmlSource = true" class="control-button">
          <Icon name="lucide:code" class="w-4 h-4" />
          View Source
        </button>
      </div>
    </div>

    <!-- Preview Content -->
    <div class="preview-content">
      <div class="email-preview-frame">
        
        <!-- Loading State -->
        <div v-if="isCompiling" class="loading-state">
          <Icon name="lucide:loader-2" class="w-6 h-6 animate-spin text-slate-400" />
          <p>Running detailed compilation...</p>
          <small>{{ currentStep }}</small>
        </div>

        <!-- Error State -->
        <div v-else-if="compilationError" class="compilation-error">
          <Icon name="lucide:alert-triangle" class="w-5 h-5 text-red-600" />
          <div>
            <h4>Compilation Error</h4>
            <p>{{ compilationError }}</p>
            <div class="error-details">
              <strong>Failed at step:</strong> {{ failedStep }}<br>
              <strong>MJML generated:</strong> {{ compiledMjml?.length || 0 }} chars<br>
              <strong>HTML generated:</strong> {{ compiledHtml?.length || 0 }} chars
            </div>
          </div>
        </div>

        <!-- Debug HTML Display -->
        <div v-else-if="compiledHtml && showRawHtml" class="raw-html-display">
          <h4>Raw HTML Output:</h4>
          <pre class="html-code">{{ compiledHtml }}</pre>
          <button @click="showRawHtml = false" class="btn-toggle">Show in iframe</button>
        </div>

        <!-- Newsletter Preview -->
        <div v-else-if="compiledHtml" class="preview-iframe-container">
          <div class="iframe-debug">
            <strong>Iframe Content:</strong>
            <span>{{ compiledHtml.length }} chars</span>
            <button @click="showRawHtml = true" class="btn-toggle">Show raw HTML</button>
          </div>
          <iframe
            ref="previewFrame"
            :srcdoc="compiledHtml"
            class="newsletter-iframe"
            @load="handleIframeLoad"
            @error="handleIframeError"
            sandbox="allow-same-origin"
          />
        </div>

        <!-- Empty State -->
        <div v-else class="empty-content">
          <Icon name="lucide:file-text" class="w-12 h-12 text-slate-300" />
          <h4>No HTML Generated</h4>
          <p>Click "Run Detailed Compilation" to see what's happening.</p>
        </div>
      </div>
    </div>

    <!-- MJML Source Modal -->
    <Transition name="modal">
      <div v-if="showMjmlSource" class="modal-overlay" @click="showMjmlSource = false">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>Generated Source</h3>
            <button @click="showMjmlSource = false" class="modal-close">
              <Icon name="lucide:x" class="w-5 h-5" />
            </button>
          </div>
          <div class="modal-body">
            <div class="source-tabs">
              <button
                @click="sourceTab = 'mjml'"
                :class="{ active: sourceTab === 'mjml' }"
                class="tab-button"
              >
                MJML ({{ compiledMjml?.length || 0 }} chars)
              </button>
              <button
                @click="sourceTab = 'html'"
                :class="{ active: sourceTab === 'html' }"
                class="tab-button"
              >
                HTML ({{ compiledHtml?.length || 0 }} chars)
              </button>
              <button
                @click="sourceTab = 'debug'"
                :class="{ active: sourceTab === 'debug' }"
                class="tab-button"
              >
                Debug Steps
              </button>
            </div>
            <div class="source-content">
              <pre v-if="sourceTab === 'mjml'"><code>{{ compiledMjml || 'No MJML generated' }}</code></pre>
              <pre v-else-if="sourceTab === 'html'"><code>{{ compiledHtml || 'No HTML generated' }}</code></pre>
              <pre v-else-if="sourceTab === 'debug'"><code>{{ JSON.stringify(manualSteps, null, 2) }}</code></pre>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

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

// State
const compiledMjml = ref('')
const compiledHtml = ref('')
const isCompiling = ref(false)
const compilationError = ref<string | null>(null)
const showMjmlSource = ref(false)
const sourceTab = ref('mjml')
const previewFrame = ref<HTMLIFrameElement | null>(null)
const compilationMethod = ref('none')
const compilationStatus = ref('Not started')
const currentStep = ref('')
const failedStep = ref('')
const showRawHtml = ref(false)

// Manual compilation steps tracking
const manualSteps = ref<any[]>([])

// Computed properties
const compilationStatusClass = computed(() => {
  switch (compilationStatus.value) {
    case 'Success': return 'status-success'
    case 'Failed': return 'status-error'
    case 'In Progress': return 'status-progress'
    default: return 'status-default'
  }
})

// Add a step to the manual compilation log
const addStep = (id: number, description: string, result: string, status: 'success' | 'error' | 'warning' = 'success') => {
  manualSteps.value.push({
    id,
    description,
    result,
    status,
    timestamp: new Date().toLocaleTimeString()
  })
  
  console.log(`[Step ${id}] ${description}: ${result}`)
}

// Clear all steps
const clearSteps = () => {
  manualSteps.value = []
}

// Fix block data structure
const fixBlockDataStructure = () => {
  if (!props.newsletter?.blocks || !props.blockTypes) {
    addStep(1, 'Data validation', 'No blocks or block types available', 'error')
    return []
  }

  const fixed = props.newsletter.blocks.map((block: any, index: number) => {
    // Find the block type by slug or ID
    const blockType = props.blockTypes.find(bt => 
      bt.slug === block.type || 
      bt.id === block.block_type ||
      bt.id === block.type ||
      bt.slug === block.block_type
    )

    if (!blockType) {
      addStep(1, `Block ${index + 1} type matching`, `No match found for type: ${block.type}`, 'error')
      return null
    }

    addStep(1, `Block ${index + 1} type matching`, `Found: ${blockType.name} (${blockType.slug})`, 'success')

    // Create a properly structured block
    return {
      id: block.id,
      block_type: blockType.id,
      type: blockType.slug,
      content: block.content || {},
      sort: block.sort || 0
    }
  }).filter(Boolean)

  addStep(1, 'Block structure fix', `Fixed ${fixed.length} blocks`, 'success')
  return fixed
}

// Generate MJML from blocks
const generateMjmlFromBlocks = (blocks: any[]) => {
  if (!blocks?.length) {
    addStep(2, 'MJML generation', 'No blocks to process', 'warning')
    return createEmptyMjml()
  }

  let bodyContent = ''
  
  blocks.forEach((block, index) => {
    if (!block || !block.block_type) {
      addStep(2, `Block ${index + 1} MJML`, 'Invalid block structure', 'error')
      bodyContent += '<mj-section><mj-column><mj-text>Invalid block</mj-text></mj-column></mj-section>'
      return
    }

    const blockType = props.blockTypes.find(bt => bt.id === block.block_type)
    if (!blockType) {
      addStep(2, `Block ${index + 1} MJML`, `Block type ${block.block_type} not found`, 'error')
      bodyContent += `<mj-section><mj-column><mj-text>Unknown block type: ${block.block_type}</mj-text></mj-column></mj-section>`
      return
    }

    if (!blockType.mjml_template) {
      addStep(2, `Block ${index + 1} MJML`, `Block type ${blockType.name} has no template`, 'error')
      bodyContent += `<mj-section><mj-column><mj-text>No template for: ${blockType.name}</mj-text></mj-column></mj-section>`
      return
    }

    let mjml = blockType.mjml_template
    
    // Replace placeholders with actual values
    if (block.content) {
      const contentKeys = Object.keys(block.content)
      addStep(2, `Block ${index + 1} content`, `Processing keys: ${contentKeys.join(', ')}`, 'success')
      
      mjml = mjml.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        const value = block.content[key]
        if (value !== undefined) {
          addStep(2, `Block ${index + 1} placeholder`, `${key} = "${value}"`, 'success')
          return String(value)
        } else {
          addStep(2, `Block ${index + 1} placeholder`, `${key} = undefined (kept as ${match})`, 'warning')
          return match
        }
      })
      
      // Handle conditional content
      mjml = mjml.replace(/\{\{if (\w+)\}\}(.*?)\{\{\/if\}\}/gs, (match, key, content) => {
        const value = block.content[key]
        const shouldShow = value && value !== '' && value !== null && value !== undefined
        addStep(2, `Block ${index + 1} conditional`, `${key} condition: ${shouldShow}`, shouldShow ? 'success' : 'warning')
        return shouldShow ? content : ''
      })
    }

    addStep(2, `Block ${index + 1} MJML`, `Generated ${mjml.length} chars`, 'success')
    bodyContent += mjml + '\n'
  })

  const fullMjml = createFullMjml(bodyContent)
  addStep(2, 'MJML generation', `Complete MJML: ${fullMjml.length} chars`, 'success')
  
  return fullMjml
}

// Create empty MJML structure
const createEmptyMjml = () => {
  return `
    <mjml>
      <mj-head>
        <mj-title>${props.newsletter?.subject || 'Newsletter'}</mj-title>
        <mj-preview>${props.newsletter?.preheader || ''}</mj-preview>
      </mj-head>
      <mj-body>
        <mj-section>
          <mj-column>
            <mj-text>
              <h2>No content yet</h2>
              <p>Add some blocks to your newsletter to see them here.</p>
            </mj-text>
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>
  `
}

// Create full MJML document
const createFullMjml = (bodyContent: string) => {
  return `
    <mjml>
      <mj-head>
        <mj-title>${props.newsletter?.subject || 'Newsletter'}</mj-title>
        <mj-preview>${props.newsletter?.preheader || ''}</mj-preview>
        <mj-attributes>
          <mj-text font-family="Arial, sans-serif" font-size="16px" color="#333333" line-height="1.6" />
          <mj-button font-family="Arial, sans-serif" background-color="#007bff" color="white" />
        </mj-attributes>
      </mj-head>
      <mj-body background-color="#f4f4f4">
        ${bodyContent}
      </mj-body>
    </mjml>
  `
}

// Create fallback HTML
const createFallbackHtml = (newsletter: any): string => {
  const blocks = newsletter?.blocks || []
  
  let blockContent = ''
  
  if (blocks.length === 0) {
    blockContent = '<div class="block"><h2>No Content Yet</h2><p>Add some blocks to your newsletter to see them here.</p></div>'
  } else {
    blockContent = blocks.map((block: any, index: number) => {
      if (!block || !block.content) {
        return `<div class="block"><p>Block ${index + 1}: No content</p></div>`
      }

      const blockType = props.blockTypes.find(bt => bt.id === block.block_type)
      const blockTypeName = blockType?.name || 'Unknown'
      
      let content = `<h4>${blockTypeName}</h4>`
      
      // Generate basic content based on block data
      if (typeof block.content === 'object') {
        Object.entries(block.content).forEach(([key, value]) => {
          if (value && typeof value === 'string') {
            if (key.includes('text')) {
              content += `<p>${value}</p>`
            } else if (key.includes('url')) {
              content += `<p><a href="${value}">${value}</a></p>`
            } else {
              content += `<p><strong>${key}:</strong> ${value}</p>`
            }
          }
        })
      }
      
      return `<div class="block">${content}</div>`
    }).join('')
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${newsletter?.subject || 'Newsletter'}</title>
      <style>
        body { 
          margin: 0; 
          padding: 20px; 
          font-family: Arial, sans-serif;
          background: #f4f4f4;
          color: #333;
        }
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border-radius: 8px;
          padding: 30px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .block {
          margin-bottom: 20px;
          padding: 15px;
          border-left: 4px solid #007bff;
          background: #f8f9fa;
          border-radius: 4px;
        }
        .block h4 {
          margin: 0 0 10px 0;
          color: #007bff;
        }
        .block p {
          margin: 5px 0;
          line-height: 1.6;
        }
        .fallback-notice {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          color: #856404;
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 20px;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="fallback-notice">
          <strong>Fallback Preview:</strong> This is a simplified preview. The actual email will be fully styled.
        </div>
        ${blockContent}
      </div>
    </body>
    </html>
  `
}

// Run detailed compilation
const runDetailedCompilation = async () => {
  console.log('Starting detailed compilation...')
  
  clearSteps()
  isCompiling.value = true
  compilationError.value = null
  compilationStatus.value = 'In Progress'
  compilationMethod.value = 'manual'
  
  try {
    // Step 1: Fix block data structure
    currentStep.value = 'Fixing block data structure...'
    const fixedBlocks = fixBlockDataStructure()
    
    if (fixedBlocks.length === 0) {
      throw new Error('No valid blocks after structure fix')
    }
    
    // Step 2: Generate MJML
    currentStep.value = 'Generating MJML...'
    const mjml = generateMjmlFromBlocks(fixedBlocks)
    compiledMjml.value = mjml
    
    // Step 3: Try server compilation
    currentStep.value = 'Compiling MJML to HTML...'
    
    try {
      addStep(3, 'Server compilation', 'Attempting...', 'success')
      
      const response = await $fetch('/api/newsletter/compile-mjml', {
        method: 'POST',
        body: { mjml }
      })
      
      if (response.html) {
        addStep(3, 'Server compilation', `Success: ${response.html.length} chars`, 'success')
        compiledHtml.value = response.html
      } else {
        throw new Error('Server returned no HTML')
      }
    } catch (serverError) {
      addStep(3, 'Server compilation', `Failed: ${serverError.message}`, 'error')
      
      // Step 4: Fallback to client-side HTML
      currentStep.value = 'Generating fallback HTML...'
      addStep(4, 'Fallback HTML', 'Generating client-side HTML...', 'success')
      
      const fallbackHtml = createFallbackHtml({
        ...props.newsletter,
        blocks: fixedBlocks
      })
      
      compiledHtml.value = fallbackHtml
      addStep(4, 'Fallback HTML', `Generated: ${fallbackHtml.length} chars`, 'success')
    }
    
    // Success
    compilationStatus.value = 'Success'
    emit('update:compiled', { mjml: compiledMjml.value, html: compiledHtml.value })
    
  } catch (error) {
    compilationError.value = error instanceof Error ? error.message : 'Unknown error'
    compilationStatus.value = 'Failed'
    failedStep.value = currentStep.value
    addStep(999, 'Compilation failed', compilationError.value, 'error')
  } finally {
    isCompiling.value = false
    currentStep.value = ''
  }
}

// Utility functions
const handleIframeLoad = () => {
  console.log('Iframe loaded successfully')
}

const handleIframeError = (error: any) => {
  console.error('Iframe error:', error)
}

// Lifecycle
onMounted(() => {
  console.log('Enhanced debug preview mounted')
  runDetailedCompilation()
})
</script>

<style scoped>
@reference 'tailwindcss';
.newsletter-preview-container {
  @apply h-full flex flex-col bg-white;
}

.debug-info {
  @apply p-4 bg-blue-50 border-b border-blue-200;
}

.debug-info h4 {
  @apply text-lg font-semibold mb-3 text-blue-800;
}

.debug-details {
  @apply grid grid-cols-1 lg:grid-cols-3 gap-4;
}

.debug-item {
  @apply bg-white p-3 rounded border;
}

.debug-item strong {
  @apply block text-sm font-medium mb-2;
}

.newsletter-debug {
  @apply flex flex-wrap gap-2 text-xs;
}

.newsletter-debug span {
  @apply bg-blue-100 px-2 py-1 rounded text-blue-800;
}

.compilation-status {
  @apply flex flex-wrap gap-2 text-xs;
}

.compilation-status span {
  @apply px-2 py-1 rounded;
}

.status-success {
  @apply bg-green-100 text-green-800;
}

.status-error {
  @apply bg-red-100 text-red-800;
}

.status-progress {
  @apply bg-yellow-100 text-yellow-800;
}

.status-default {
  @apply bg-gray-100 text-gray-800;
}

.compilation-steps {
  @apply space-y-1;
}

.step-item {
  @apply flex items-center gap-2 text-xs p-2 rounded;
}

.step-item.success {
  @apply bg-green-50 text-green-800;
}

.step-item.error {
  @apply bg-red-50 text-red-800;
}

.step-item.warning {
  @apply bg-yellow-50 text-yellow-800;
}

.step-number {
  @apply font-bold min-w-[20px];
}

.step-description {
  @apply flex-1 font-medium;
}

.step-result {
  @apply text-gray-600;
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
  @apply mx-auto max-w-2xl;
}

.loading-state {
  @apply flex flex-col items-center justify-center p-8 text-slate-600 min-h-[400px];
}

.loading-state p {
  @apply mt-3 text-sm;
}

.loading-state small {
  @apply text-xs text-slate-500;
}

.compilation-error {
  @apply p-6 text-red-700 bg-red-50 border border-red-200 rounded-lg;
}

.compilation-error h4 {
  @apply font-medium mb-2;
}

.compilation-error p {
  @apply text-sm mb-2;
}

.error-details {
  @apply text-xs text-red-600 mb-3 p-2 bg-red-100 rounded;
}

.raw-html-display {
  @apply p-4 bg-gray-50 rounded-lg;
}

.raw-html-display h4 {
  @apply font-medium mb-2;
}

.html-code {
  @apply text-xs bg-white p-3 rounded border max-h-64 overflow-auto;
}

.btn-toggle {
  @apply mt-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700;
}

.preview-iframe-container {
  @apply relative;
}

.iframe-debug {
  @apply flex items-center justify-between p-2 bg-gray-100 rounded-t border text-sm;
}

.iframe-debug strong {
  @apply text-gray-700;
}

.iframe-debug span {
  @apply text-gray-600;
}

.newsletter-iframe {
  @apply w-full border border-slate-200 rounded-b bg-white;
  min-height: 500px;
}

.empty-content {
  @apply flex flex-col items-center justify-center p-8 text-slate-500 min-h-[400px];
}

.empty-content h4 {
  @apply text-lg font-medium mt-4 mb-2;
}

.empty-content p {
  @apply text-sm text-center mb-4;
}

/* Modal styles */
.modal-overlay {
  @apply fixed inset-0 bg-black/50 flex items-center justify-center z-50;
}

.modal-content {
  @apply bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden;
}

.modal-header {
  @apply flex items-center justify-between p-4 border-b border-slate-200;
}

.modal-header h3 {
  @apply text-lg font-medium;
}

.modal-close {
  @apply p-1 hover:bg-slate-100 rounded;
}

.modal-body {
  @apply flex flex-col h-96;
}

.source-tabs {
  @apply flex border-b border-slate-200;
}

.tab-button {
  @apply px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 border-b-2 border-transparent;
}

.tab-button.active {
  @apply text-blue-600 border-blue-600;
}

.source-content {
  @apply flex-1 overflow-auto p-4 bg-slate-50;
}

.source-content pre {
  @apply text-sm whitespace-pre-wrap;
}

/* Transitions */
.modal-enter-active, .modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from, .modal-leave-to {
  opacity: 0;
}
</style>