<!-- Fixed NewsletterPreview.vue -->
<template>
  <div class="newsletter-preview-container">
    <!-- Debug Info (toggle with environment variable) -->
    <div v-if="showDebug" class="debug-info">
      <h4>🔧 Content Mapping Debug</h4>
      <div class="debug-details">
        <div class="debug-item">
          <strong>Block Analysis:</strong>
          <div v-for="(block, index) in newsletter?.blocks || []" :key="index" class="block-debug">
            <p><strong>Block {{ index + 1 }}:</strong> {{ block.type }}</p>
            <p><strong>Content Keys:</strong> {{ Object.keys(block.content || {}).join(', ') }}</p>
            <p><strong>Expected Template:</strong> {{ getBlockTemplate(block)?.substring(0, 100) }}...</p>
          </div>
        </div>
        
        <div class="debug-item">
          <strong>Mapping Results:</strong>
          <div class="compilation-status">
            <span :class="compilationStatusClass">{{ compilationStatus }}</span>
            <span>Placeholders Replaced: {{ replacedPlaceholders }}</span>
            <span>MJML Length: {{ compiledMjml?.length || 0 }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Header -->
    <div class="preview-header">
      <div class="preview-title">
        <Icon name="lucide:mail" class="w-5 h-5" />
        <span>Newsletter Preview</span>
      </div>
      <div class="preview-controls">
        <button @click="compileNewsletter" class="control-button" :disabled="isCompiling">
          <Icon name="lucide:play" class="w-4 h-4" />
          {{ isCompiling ? 'Compiling...' : 'Compile' }}
        </button>
        <button @click="showMjmlSource = !showMjmlSource" class="control-button">
          <Icon name="lucide:code" class="w-4 h-4" />
          View Source
        </button>
        <button @click="showDebug = !showDebug" class="control-button">
          <Icon name="lucide:bug" class="w-4 h-4" />
          Debug
        </button>
      </div>
    </div>

    <!-- Source Code Modal -->
    <Transition name="modal">
      <div v-if="showMjmlSource" class="modal-overlay" @click="showMjmlSource = false">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>Generated Source Code</h3>
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
                <Icon name="lucide:code" class="w-4 h-4" />
                MJML
              </button>
              <button
                @click="sourceTab = 'html'"
                :class="{ active: sourceTab === 'html' }"
                class="tab-button"
              >
                <Icon name="lucide:globe" class="w-4 h-4" />
                HTML
              </button>
            </div>
            <div class="source-content">
              <div v-if="sourceTab === 'mjml'" class="source-panel">
                <div class="source-header">
                  <span class="source-title">MJML Template</span>
                  <button @click="copyToClipboard(compiledMjml)" class="copy-button">
                    <Icon name="lucide:copy" class="w-4 h-4" />
                    Copy MJML
                  </button>
                </div>
                <pre class="source-code"><code>{{ compiledMjml || 'No MJML generated yet. Click "Compile" to generate.' }}</code></pre>
              </div>
              
              <div v-else-if="sourceTab === 'html'" class="source-panel">
                <div class="source-header">
                  <span class="source-title">Generated HTML</span>
                  <button @click="copyToClipboard(compiledHtml)" class="copy-button">
                    <Icon name="lucide:copy" class="w-4 h-4" />
                    Copy HTML
                  </button>
                </div>
                <pre class="source-code"><code>{{ compiledHtml || 'No HTML generated yet. Click "Compile" to generate.' }}</code></pre>
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
        </div>

        <!-- Error State -->
        <div v-else-if="compilationError" class="compilation-error">
          <h4>Compilation Error</h4>
          <p>{{ compilationError }}</p>
          <details class="error-details">
            <summary>Debug Information</summary>
            <pre>{{ debugInfo }}</pre>
          </details>
        </div>

        <!-- Success State -->
        <div v-else-if="compiledHtml" class="preview-iframe-container">
          <iframe 
            ref="previewFrame"
            :srcdoc="compiledHtml"
            class="preview-iframe"
            @load="handleIframeLoad"
          />
        </div>

        <!-- Empty State -->
        <div v-else class="empty-content">
          <Icon name="lucide:mail-plus" class="w-12 h-12" />
          <h4>No Content Yet</h4>
          <p>Add some blocks to your newsletter to see the preview here.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { $fetch } from 'ofetch'
import { computed, nextTick, onMounted, ref, watch } from 'vue'

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
const compiledMjml = ref('')
const compiledHtml = ref('')
const isCompiling = ref(false)
const compilationError = ref<string | null>(null)
const showMjmlSource = ref(false)
const showDebug = ref(false)
const compilationStatus = ref('Ready')
const replacedPlaceholders = ref(0)
const debugInfo = ref('')

// Enhanced content mapping configuration for your specific block types
const contentMappingConfig: Record<string, any> = {
  'text': {
    mappings: {
      'text': 'text_content',
      'content': 'text_content',
      'body': 'text_content'
    },
    defaults: {
      'text_content': 'Enter your text here...',
      'background_color': '#ffffff',
      'text_color': '#333333',
      'text_align': 'left',
      'font_size': '16px',
      'padding': '20px'
    }
  },
  'button': {
    mappings: {
      'text': 'button_text',
      'label': 'button_text',
      'url': 'button_url',
      'link': 'button_url'
    },
    defaults: {
      'button_text': 'Click Here',
      'button_url': '#',
      'background_color': '#007bff',
      'text_color': '#ffffff',
      'text_align': 'center',
      'padding': '20px'
    }
  },
  'hero': {
    mappings: {
      'title': 'hero_title',
      'heading': 'hero_title',
      'subtitle': 'hero_subtitle',
      'description': 'hero_subtitle',
      'text': 'hero_content',
      'content': 'hero_content'
    },
    defaults: {
      'hero_title': 'Welcome!',
      'hero_subtitle': 'This is your newsletter',
      'background_color': '#f8f9fa',
      'text_color': '#333333',
      'text_align': 'center',
      'padding': '40px 20px'
    }
  },
  'image': {
    mappings: {
      'src': 'image_url',
      'url': 'image_url',
      'image': 'image_url',
      'alt': 'image_alt',
      'alt_text': 'image_alt'
    },
    defaults: {
      'image_url': 'https://via.placeholder.com/600x300',
      'image_alt': 'Newsletter Image',
      'padding': '20px'
    }
  },
  'event-card': {
    mappings: {
      'title': 'event_title',
      'heading': 'event_title',
      'subtitle': 'event_subtitle',
      'description': 'event_description',
      'text': 'event_description',
      'content': 'event_description',
      'date': 'event_date',
      'time': 'event_time',
      'location': 'event_location',
      'venue': 'event_location',
      'button_text': 'button_text',
      'button_url': 'button_url',
      'cta_text': 'button_text',
      'cta_url': 'button_url'
    },
    defaults: {
      'event_title': 'Upcoming Event',
      'event_subtitle': 'Join us for an exciting event',
      'event_description': 'Event description goes here',
      'event_date': 'TBD',
      'event_time': 'TBD',
      'event_location': 'TBD',
      'button_text': 'Register Now',
      'button_url': '#',
      'background_color': '#ffffff',
      'text_color': '#333333',
      'text_align': 'left',
      'padding': '20px'
    }
  },
  'team-member': {
    mappings: {
      'name': 'member_name',
      'title': 'member_title',
      'position': 'member_title',
      'role': 'member_title',
      'bio': 'member_bio',
      'description': 'member_bio',
      'text': 'member_bio',
      'content': 'member_bio',
      'image': 'member_image',
      'photo': 'member_image',
      'avatar': 'member_image',
      'image_url': 'member_image',
      'alt': 'image_alt',
      'alt_text': 'image_alt'
    },
    defaults: {
      'member_name': 'Team Member',
      'member_title': 'Position',
      'member_bio': 'Member bio goes here',
      'member_image': 'https://via.placeholder.com/150x150?text=Team+Member',
      'image_alt': 'Team Member Photo',
      'background_color': '#ffffff',
      'text_color': '#333333',
      'text_align': 'left',
      'padding': '20px'
    }
  },
  'social-links': {
    mappings: {
      'facebook': 'facebook_url',
      'facebook_url': 'facebook_url',
      'twitter': 'twitter_url',
      'twitter_url': 'twitter_url',
      'instagram': 'instagram_url',
      'instagram_url': 'instagram_url',
      'linkedin': 'linkedin_url',
      'linkedin_url': 'linkedin_url',
      'youtube': 'youtube_url',
      'youtube_url': 'youtube_url',
      'website': 'website_url',
      'website_url': 'website_url'
    },
    defaults: {
      'facebook_url': '',
      'twitter_url': '',
      'instagram_url': '',
      'linkedin_url': '',
      'youtube_url': '',
      'website_url': '',
      'icon_size': '24px',
      'text_align': 'center',
      'padding': '20px',
      'background_color': '#ffffff'
    }
  }
}

// Computed properties
const compilationStatusClass = computed(() => {
  switch (compilationStatus.value) {
    case 'Success': return 'status-success'
    case 'Error': return 'status-error'
    case 'Compiling': return 'status-progress'
    default: return 'status-default'
  }
})

// Get block template for debugging
const getBlockTemplate = (block: any) => {
  const blockType = props.blockTypes?.find(bt => 
    bt.slug === block.type || 
    bt.id === block.block_type ||
    bt.id === block.type ||
    bt.slug === block.block_type
  )
  return blockType?.mjml_template || 'No template found'
}

// Enhanced content mapping function
const mapBlockContent = (block: any, blockType: any): Record<string, any> => {
  const blockSlug = blockType.slug
  const config = contentMappingConfig[blockSlug]
  
  if (!config) {
    console.warn(`No mapping config for block type: ${blockSlug}`)
    return { ...block.content }
  }
  
  const mappedContent: Record<string, any> = {}
  const originalContent = block.content || {}
  
  // Apply mappings
  Object.entries(originalContent).forEach(([key, value]) => {
    const mappedKey = config.mappings?.[key] || key
    mappedContent[mappedKey] = value
  })
  
  // Apply defaults for missing fields
  if (config.defaults) {
    Object.entries(config.defaults).forEach(([key, defaultValue]) => {
      if (!(key in mappedContent)) {
        mappedContent[key] = defaultValue
      }
    })
  }
  
  console.log(`Mapped content for ${blockSlug}:`, mappedContent)
  return mappedContent
}

// Enhanced MJML compilation
const compileBlockToMjml = (block: any, blockType: any): string => {
  try {
    const mappedContent = mapBlockContent(block, blockType)
    let mjml = blockType.mjml_template
    
    // Count replacements for debugging
    let blockReplacements = 0
    
    // Replace triple braces first (unescaped content)
    mjml = mjml.replace(/\{\{\{(\w+)\}\}\}/g, (match, key) => {
      if (key in mappedContent) {
        blockReplacements++
        return String(mappedContent[key])
      }
      return match
    })
    
    // Replace double braces (escaped content)
    mjml = mjml.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      if (key in mappedContent) {
        blockReplacements++
        return String(mappedContent[key])
      }
      return match
    })
    
    // Handle conditionals {{#if field}}...{{/if}}
    mjml = mjml.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, key, content) => {
      const value = mappedContent[key]
      return (value && value !== '' && value !== null && value !== undefined) ? content : ''
    })
    
    replacedPlaceholders.value += blockReplacements
    console.log(`Block ${block.type}: ${blockReplacements} replacements made`)
    
    return mjml
  } catch (error) {
    console.error(`Error compiling block ${block.id}:`, error)
    return `<!-- Error compiling block ${block.id}: ${error.message} -->`
  }
}

// Main compilation function
const compileNewsletter = async () => {
  if (!props.newsletter?.blocks || !props.blockTypes) {
    compilationError.value = 'Missing newsletter data or block types'
    return
  }

  isCompiling.value = true
  compilationError.value = null
  compilationStatus.value = 'Compiling'
  replacedPlaceholders.value = 0
  
  try {
    console.log('Starting newsletter compilation...')
    
    // Debug information
    debugInfo.value = JSON.stringify({
      newsletter: props.newsletter,
      blockTypes: props.blockTypes.map(bt => ({ id: bt.id, name: bt.name, slug: bt.slug })),
      blocks: props.newsletter.blocks
    }, null, 2)
    
    // Process each block
    const compiledBlocks: string[] = []
    
    for (const block of props.newsletter.blocks) {
      const blockType = props.blockTypes.find(bt => 
        bt.slug === block.type || 
        bt.id === block.block_type ||
        bt.id === block.type ||
        bt.slug === block.block_type
      )
      
      if (!blockType) {
        console.error(`Block type not found for block:`, block)
        compiledBlocks.push(`<!-- Unknown block type: ${block.type} -->`)
        continue
      }
      
      if (!blockType.mjml_template) {
        console.error(`No template found for block type: ${blockType.name}`)
        compiledBlocks.push(`<!-- No template for: ${blockType.name} -->`)
        continue
      }
      
      const compiledBlock = compileBlockToMjml(block, blockType)
      compiledBlocks.push(compiledBlock)
    }
    
    // Build complete MJML document
    const mjmlDocument = createFullMjmlDocument(compiledBlocks.join('\n'))
    compiledMjml.value = mjmlDocument
    
    console.log(`MJML compilation complete: ${replacedPlaceholders.value} placeholders replaced`)
    
    // Try server-side MJML to HTML conversion
    try {
      const response = await $fetch('/api/newsletter/compile-mjml', {
        method: 'POST',
        body: { mjml: mjmlDocument }
      })
      
      if (response.html) {
        compiledHtml.value = response.html
        compilationStatus.value = 'Success'
        emit('update:compiled', { mjml: mjmlDocument, html: response.html })
      } else {
        throw new Error('Server returned no HTML')
      }
    } catch (serverError) {
      console.warn('Server compilation failed, using fallback:', serverError)
      
      // Create fallback HTML
      const fallbackHtml = createFallbackHtml()
      compiledHtml.value = fallbackHtml
      compilationStatus.value = 'Success'
      emit('update:compiled', { mjml: mjmlDocument, html: fallbackHtml })
    }
    
  } catch (error) {
    console.error('Newsletter compilation failed:', error)
    compilationError.value = error instanceof Error ? error.message : 'Unknown compilation error'
    compilationStatus.value = 'Error'
  } finally {
    isCompiling.value = false
  }
}

// Create complete MJML document
const createFullMjmlDocument = (bodyContent: string): string => {
  return `<mjml>
  <mj-head>
    <mj-title>${props.newsletter?.subject || props.newsletter?.title || 'Newsletter'}</mj-title>
    <mj-preview>${props.newsletter?.preheader || props.newsletter?.preview_text || ''}</mj-preview>
    <mj-attributes>
      <mj-text font-family="Arial, sans-serif" font-size="16px" color="#333333" line-height="1.6" />
      <mj-button font-family="Arial, sans-serif" background-color="#007bff" color="white" />
    </mj-attributes>
    <mj-style>
      .newsletter-content { max-width: 600px; margin: 0 auto; }
    </mj-style>
  </mj-head>
  <mj-body background-color="#f4f4f4">
    ${bodyContent}
  </mj-body>
</mjml>`
}

// Create fallback HTML when MJML compilation fails
const createFallbackHtml = (): string => {
  const blocks = props.newsletter?.blocks || []
  
  const blockContent = blocks.map((block: any, index: number) => {
    const blockType = props.blockTypes?.find(bt => 
      bt.slug === block.type || bt.id === block.block_type
    )
    
    const mappedContent = blockType ? mapBlockContent(block, blockType) : block.content
    
    let content = `<div class="block-header">${blockType?.name || 'Unknown Block'}</div>`
    
    Object.entries(mappedContent || {}).forEach(([key, value]) => {
      if (value && typeof value === 'string' && !key.startsWith('background_') && !key.startsWith('text_') && key !== 'padding') {
        if (key.includes('url') || key.includes('link')) {
          content += `<p><a href="${value}" style="color: #007bff;">${value}</a></p>`
        } else {
          content += `<p>${value}</p>`
        }
      }
    })
    
    return `<div class="block">${content}</div>`
  }).join('')

  return `<!DOCTYPE html>
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
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .block {
      margin-bottom: 25px;
      padding: 20px;
      background: #f8f9fa;
      border-left: 4px solid #007bff;
      border-radius: 4px;
    }
    .block-header {
      font-weight: bold;
      color: #007bff;
      margin-bottom: 10px;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .block p {
      margin: 8px 0;
      line-height: 1.6;
    }
    .success-notice {
      background: #d4edda;
      border: 1px solid #c3e6cb;
      color: #155724;
      padding: 15px;
      border-radius: 4px;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="success-notice">
      <strong>✅ Newsletter Preview</strong><br>
      Content successfully mapped with ${replacedPlaceholders.value} placeholder replacements.
    </div>
    ${blockContent}
  </div>
</body>
</html>`
}

// Utility functions
const handleIframeLoad = () => {
  console.log('Newsletter preview loaded successfully')
}

// Copy to clipboard functionality
const copyToClipboard = async (text: string) => {
  if (!text) {
    console.warn('No content to copy')
    return
  }
  
  try {
    await navigator.clipboard.writeText(text)
    console.log('Content copied to clipboard successfully')
    
    // Optional: You could add a toast notification here
    // showToast('Content copied to clipboard!')
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    console.log('Content copied using fallback method')
  }
}

// Watch for changes and auto-compile
watch([() => props.newsletter, () => props.blockTypes], () => {
  if (props.newsletter?.blocks?.length > 0 && props.blockTypes?.length > 0) {
    nextTick(() => {
      compileNewsletter()
    })
  }
}, { deep: true })

// Auto-compile on mount
onMounted(() => {
  if (props.newsletter?.blocks?.length > 0 && props.blockTypes?.length > 0) {
    compileNewsletter()
  }
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
  @apply grid grid-cols-1 lg:grid-cols-2 gap-4;
}

.debug-item {
  @apply bg-white p-3 rounded border;
}

.debug-item strong {
  @apply block text-sm font-medium mb-2;
}

.block-debug {
  @apply p-2 bg-blue-50 rounded mb-2 text-sm;
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
  @apply flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50;
}

.preview-title {
  @apply flex items-center gap-2 text-sm font-medium;
}

.preview-controls {
  @apply flex items-center gap-2;
}

.control-button {
  @apply p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50;
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

.preview-content {
  @apply flex-1 overflow-auto;
}

.email-preview-frame {
  @apply h-full;
}

.preview-iframe {
  @apply w-full h-full border-0;
}

.loading-state {
  @apply flex flex-col items-center justify-center p-8 text-gray-600 min-h-[400px];
}

.loading-state p {
  @apply mt-3 text-sm;
}

.compilation-error {
  @apply p-6 text-red-700 bg-red-50 border border-red-200 rounded-lg m-4;
}

.compilation-error h4 {
  @apply font-medium mb-2;
}

.error-details {
  @apply mt-4;
}

.error-details summary {
  @apply cursor-pointer font-medium;
}

.error-details pre {
  @apply mt-2 text-xs bg-red-100 p-2 rounded overflow-auto;
}

.empty-content {
  @apply flex flex-col items-center justify-center p-8 text-gray-500 min-h-[400px];
}

.empty-content h4 {
  @apply text-lg font-medium mt-4 mb-2;
}

.empty-content p {
  @apply text-sm text-center;
}
</style>