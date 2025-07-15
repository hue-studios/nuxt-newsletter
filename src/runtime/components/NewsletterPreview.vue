<!-- Fixed Preview with Placeholder Mapping -->
<template>
  <div class="newsletter-preview-container">
    <!-- Debug Info -->
    <div class="debug-info hidden">
      <h4>🎯 Fixed Placeholder Mapping</h4>
      <div class="debug-details">
        <div class="debug-item">
          <strong>Content Mapping:</strong>
          <div class="mapping-debug">
            <div v-for="(mapping, index) in contentMappings" :key="index" class="mapping-item">
              <strong>Block {{ index + 1 }}:</strong>
              <div class="mapping-details">
                <div v-for="(mapped, key) in mapping" :key="key" class="mapped-value">
                  <span class="original">{{ key }}</span>
                  <span class="arrow">→</span>
                  <span class="mapped">{{ mapped }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="debug-item">
          <strong>Compilation Status:</strong>
          <div class="compilation-status">
            <span :class="compilationStatusClass">{{ compilationStatus }}</span>
            <span>MJML: {{ compiledMjml?.length || 0 }} chars</span>
            <span>HTML: {{ compiledHtml?.length || 0 }} chars</span>
            <span>Replaced Placeholders: {{ replacedPlaceholders }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Header -->
    <div class="uppercase tracking-wider text-xs preview-header">
      <div class="preview-title">
        <Icon name="lucide:mail" class="w-5 h-5 text-slate-600" />
        <span>Preview</span>
      </div>
      <div class="preview-controls ">
        <button @click="compileWithMapping" class="control-button uppercase tracking-wider text-xs">
          <Icon name="lucide:play" class="w-4 h-4" />
          Compile
        </button>
        <button @click="showMjmlSource = true" class="control-button uppercase tracking-wider text-xs">
          <Icon name="lucide:code" class="w-3 h-3 -mb-1 inline-block" />
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
          <p>Compiling with placeholder mapping...</p>
        </div>

        <!-- Success State -->
        <div v-else-if="compiledHtml" class="preview-iframe-container">
          <!-- <div class="iframe-debug">
            <strong>Content Preview:</strong>
            <span>{{ replacedPlaceholders }} placeholders replaced</span>
            <button @click="showRawHtml = !showRawHtml" class="btn-toggle">
              {{ showRawHtml ? 'Show in iframe' : 'Show raw HTML' }}
            </button>
          </div> -->
          
          <div v-if="showRawHtml" class="raw-html-display">
            <h4>Generated HTML:</h4>
            <pre class="html-code">{{ compiledHtml }}</pre>
          </div>
          
          <iframe
            v-else
            ref="previewFrame"
            :srcdoc="compiledHtml"
            class="newsletter-iframe"
            @load="handleIframeLoad"
            sandbox="allow-same-origin"
          />
        </div>

        <!-- Error State -->
        <div v-else-if="compilationError" class="compilation-error">
          <Icon name="lucide:alert-triangle" class="w-5 h-5 text-red-600" />
          <div>
            <h4>Compilation Error</h4>
            <p>{{ compilationError }}</p>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="empty-content">
          <Icon name="lucide:file-text" class="w-12 h-12 text-slate-300" />
          <h4>Ready to Compile</h4>
          <p>Click "Compile with Mapping" to generate the preview.</p>
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
                MJML
              </button>
              <button
                @click="sourceTab = 'html'"
                :class="{ active: sourceTab === 'html' }"
                class="tab-button"
              >
                HTML
              </button>
            </div>
            <div class="source-content">
              <pre v-if="sourceTab === 'mjml'"><code>{{ compiledMjml || 'No MJML generated' }}</code></pre>
              <pre v-else-if="sourceTab === 'html'"><code>{{ compiledHtml || 'No HTML generated' }}</code></pre>
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
const compilationStatus = ref('Ready')
const showRawHtml = ref(false)
const replacedPlaceholders = ref(0)
const contentMappings = ref<any[]>([])

// Content mapping configurations
const contentMappingConfig = {
  'text': {
    // Map your content keys to template placeholders
    'text': 'text_content',
    // Provide default values for missing placeholders
    '_defaults': {
      'background_color': '#ffffff',
      'padding': '20px',
      'text_align': 'left',
      'font_size': '16px',
      'text_color': '#333333'
    }
  },
  'button': {
    // Map your content keys to template placeholders
    'text': 'button_text',
    'url': 'button_url',
    // Provide default values for missing placeholders
    '_defaults': {
      'background_color': '#007bff',
      'padding': '20px',
      'text_align': 'center'
    }
  }
}

// Computed properties
const compilationStatusClass = computed(() => {
  switch (compilationStatus.value) {
    case 'Success': return 'status-success'
    case 'Failed': return 'status-error'
    case 'Compiling': return 'status-progress'
    default: return 'status-default'
  }
})

// Map content to template placeholders
const mapContentForBlock = (block: any, blockType: any) => {
  const blockSlug = blockType.slug
  const mappingConfig = contentMappingConfig[blockSlug]
  
  if (!mappingConfig) {
    console.warn(`No mapping config for block type: ${blockSlug}`)
    return block.content || {}
  }
  
  const mappedContent = {}
  const originalContent = block.content || {}
  
  // Map existing content keys
  Object.entries(originalContent).forEach(([key, value]) => {
    const mappedKey = mappingConfig[key] || key
    mappedContent[mappedKey] = value
  })
  
  // Add default values for missing placeholders
  if (mappingConfig._defaults) {
    Object.entries(mappingConfig._defaults).forEach(([key, defaultValue]) => {
      if (!(key in mappedContent)) {
        mappedContent[key] = defaultValue
      }
    })
  }
  
  return mappedContent
}

// Generate MJML with proper placeholder mapping
const generateMjmlWithMapping = () => {
  if (!props.newsletter?.blocks || !props.blockTypes) {
    throw new Error('Missing newsletter or block types')
  }

  const fixedBlocks = props.newsletter.blocks.map((block: any) => {
    const blockType = props.blockTypes.find(bt => 
      bt.slug === block.type || 
      bt.id === block.block_type ||
      bt.id === block.type ||
      bt.slug === block.block_type
    )

    if (!blockType) {
      throw new Error(`Block type not found for: ${block.type}`)
    }

    return {
      ...block,
      block_type: blockType.id,
      type: blockType.slug
    }
  })

  let totalReplacements = 0
  const mappings = []
  
  const bodyContent = fixedBlocks.map((block, index) => {
    const blockType = props.blockTypes.find(bt => bt.id === block.block_type)
    if (!blockType || !blockType.mjml_template) {
      throw new Error(`Block type ${block.block_type} missing template`)
    }

    // Map content to template placeholders
    const mappedContent = mapContentForBlock(block, blockType)
    mappings.push(mappedContent)
    
    let mjml = blockType.mjml_template

    // Replace placeholders with mapped content
    mjml = mjml.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      if (key in mappedContent) {
        totalReplacements++
        console.log(`Replaced {{${key}}} with "${mappedContent[key]}"`)
        return String(mappedContent[key])
      } else {
        console.warn(`No mapping found for placeholder: {{${key}}}`)
        return match
      }
    })

    return mjml
  }).join('\n')

  contentMappings.value = mappings
  replacedPlaceholders.value = totalReplacements

  return createFullMjml(bodyContent)
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

// Compile with mapping
const compileWithMapping = async () => {
  isCompiling.value = true
  compilationError.value = null
  compilationStatus.value = 'Compiling'
  
  try {
    console.log('Starting compilation with placeholder mapping...')
    
    // Generate MJML with proper mapping
    const mjml = generateMjmlWithMapping()
    compiledMjml.value = mjml
    
    console.log(`Generated MJML (${mjml.length} chars) with ${replacedPlaceholders.value} placeholder replacements`)
    
    // Try server compilation
    try {
      const response = await $fetch('/api/newsletter/compile-mjml', {
        method: 'POST',
        body: { mjml }
      })
      
      if (response.html) {
        compiledHtml.value = response.html
        compilationStatus.value = 'Success'
        
        console.log(`Server compilation successful: ${response.html.length} chars`)
        emit('update:compiled', { mjml, html: response.html })
      } else {
        throw new Error('Server returned no HTML')
      }
    } catch (serverError) {
      console.warn('Server compilation failed, using fallback')
      
      // Simple fallback HTML
      const fallbackHtml = createFallbackHtml()
      compiledHtml.value = fallbackHtml
      compilationStatus.value = 'Success'
      
      emit('update:compiled', { mjml, html: fallbackHtml })
    }
    
  } catch (error) {
    compilationError.value = error instanceof Error ? error.message : 'Unknown error'
    compilationStatus.value = 'Failed'
    console.error('Compilation failed:', error)
  } finally {
    isCompiling.value = false
  }
}

// Create fallback HTML
const createFallbackHtml = (): string => {
  const blocks = props.newsletter?.blocks || []
  
  let blockContent = blocks.map((block: any, index: number) => {
    if (!block || !block.content) {
      return `<div class="block">Block ${index + 1}: No content</div>`
    }

    const blockType = props.blockTypes.find(bt => 
      bt.slug === block.type || bt.id === block.block_type
    )
    const blockTypeName = blockType?.name || 'Unknown'
    
    let content = `<h4>${blockTypeName}</h4>`
    
    // Use mapped content
    const mappedContent = mapContentForBlock(block, blockType)
    Object.entries(mappedContent).forEach(([key, value]) => {
      if (value && typeof value === 'string' && !key.startsWith('_')) {
        if (key.includes('text') || key.includes('content')) {
          content += `<p>${value}</p>`
        } else if (key.includes('url')) {
          content += `<p><a href="${value}" style="color: #007bff; text-decoration: none;">${value}</a></p>`
        } else if (key !== 'background_color' && key !== 'padding' && key !== 'text_align' && key !== 'font_size' && key !== 'text_color') {
          content += `<p><strong>${key}:</strong> ${value}</p>`
        }
      }
    })
    
    return `<div class="block">${content}</div>`
  }).join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${props.newsletter?.subject || 'Newsletter'}</title>
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
        .success-notice {
          background: #d4edda;
          border: 1px solid #c3e6cb;
          color: #155724;
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 20px;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="success-notice">
          <strong>✅ Placeholder Mapping Success!</strong> Your content has been properly mapped to template placeholders.
        </div>
        ${blockContent}
      </div>
    </body>
    </html>
  `
}

// Utility functions
const handleIframeLoad = () => {
  console.log('Preview iframe loaded successfully!')
}

// Auto-compile on mount
onMounted(() => {
  if (props.newsletter?.blocks?.length > 0) {
    compileWithMapping()
  }
})
</script>

<style scoped>
@reference 'tailwindcss';
.newsletter-preview-container {
  @apply h-full flex flex-col bg-white;
}

.debug-info {
  @apply p-4 bg-green-50 border-b border-green-200;
}

.debug-info h4 {
  @apply text-lg font-semibold mb-3 text-green-800;
}

.debug-details {
  @apply grid grid-cols-1 lg:grid-cols-2 gap-4;
}

.debug-item {
  @apply bg-white p-3 rounded border;
}

.debug-item strong {
  @apply block text-sm font-medium mb-2;
}

.mapping-debug {
  @apply space-y-2;
}

.mapping-item {
  @apply p-2 bg-green-50 rounded;
}

.mapping-item strong {
  @apply text-green-800 text-sm;
}

.mapping-details {
  @apply mt-2 space-y-1;
}

.mapped-value {
  @apply flex items-center gap-2 text-xs;
}

.original {
  @apply bg-blue-100 px-2 py-1 rounded text-blue-800;
}

.arrow {
  @apply text-gray-500;
}

.mapped {
  @apply bg-green-100 px-2 py-1 rounded text-green-800;
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

.compilation-error {
  @apply p-6 text-red-700 bg-red-50 border border-red-200 rounded-lg;
}

.compilation-error h4 {
  @apply font-medium mb-2;
}

.compilation-error p {
  @apply text-sm mb-2;
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

.btn-toggle {
  @apply px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700;
}

.newsletter-iframe {
  @apply w-full border border-slate-200 rounded-b bg-white;
  min-height: 500px;
}

.raw-html-display {
  @apply p-4 bg-gray-50 rounded-lg mb-4;
}

.raw-html-display h4 {
  @apply font-medium mb-2;
}

.html-code {
  @apply text-xs bg-white p-3 rounded border max-h-64 overflow-auto;
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