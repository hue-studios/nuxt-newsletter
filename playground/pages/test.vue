<!-- Simple test page to use the debug components -->
<template>
  <div class="test-page">
    <div class="page-header">
      <h1>Newsletter Module Debug Test</h1>
      <div class="actions">
        <button @click="loadSampleData" class="btn btn-primary">Load Sample Data</button>
        <button @click="clearData" class="btn btn-secondary">Clear Data</button>
        <button @click="showDebugInfo" class="btn btn-info">Show Debug Info</button>
        <button @click="testBlockTypes" class="btn btn-warning">Test Block Types</button>
        <button @click="testCompilation" class="btn btn-success">Test Compilation</button>
      </div>
    </div>

    <!-- Debug Info Display -->
    <div v-if="showDebug" class="debug-info-panel">
      <h3>Current Data Structure</h3>
      <div class="data-display">
        <div class="data-item">
          <strong>Newsletter Summary:</strong>
          <div class="newsletter-summary">
            <span>Subject: {{ newsletter.subject || 'Not set' }}</span>
            <span>Preheader: {{ newsletter.preheader || 'Not set' }}</span>
            <span>Blocks: {{ newsletter.blocks?.length || 0 }}</span>
          </div>
        </div>
        
        <div class="data-item" v-if="newsletter.blocks?.length > 0">
          <strong>Block Details:</strong>
          <div v-for="(block, index) in newsletter.blocks" :key="block.id" class="block-detail">
            <h4>Block {{ index + 1 }}</h4>
            <div class="block-info">
              <span>ID: {{ block.id }}</span>
              <span>Type: {{ block.type || 'undefined' }}</span>
              <span>Block Type: {{ block.block_type || 'undefined' }}</span>
              <span>Sort: {{ block.sort }}</span>
            </div>
            <div class="block-content">
              <strong>Content:</strong>
              <pre>{{ safeStringify(block.content, 5) }}</pre>
            </div>
          </div>
        </div>
        
        <div class="data-item">
          <strong>Full Newsletter Object:</strong>
          <pre>{{ safeStringify(newsletter, 6) }}</pre>
        </div>
      </div>
      <button @click="showDebug = false" class="btn btn-small">Hide Debug Info</button>
    </div>

    <!-- The Debug Components -->
    <div class="components-container">
      <!-- Debug Editor Component -->
      <div class="component-section">
        <h2>Debug Newsletter Editor</h2>
        <div class="component-wrapper">
          <DebugNewsletterEditor 
            v-model="newsletter" 
            @save="handleSave"
            @update:modelValue="handleNewsletterUpdate"
          />
        </div>
      </div>
    </div>

    <!-- Console Output -->
    <div class="console-section">
      <h3>Console Output</h3>
      <div class="console-output" ref="consoleRef">
        <div v-for="(log, index) in logs" :key="index" class="console-entry" :class="log.type">
          <span class="timestamp">{{ log.timestamp }}</span>
          <span class="message">{{ log.message }}</span>
          <pre v-if="log.data" class="log-data">{{ safeStringify(log.data, 2) }}</pre>
        </div>
      </div>
      <button @click="clearLogs" class="btn btn-small">Clear Logs</button>
    </div>
  </div>
</template>

<script setup>
import { nextTick, onMounted, ref, toRaw } from 'vue'
import DebugNewsletterEditor from '../../src/runtime/components/DebugNewsletterEditor.vue'

// Component data
const newsletter = ref({
  subject: '',
  preheader: '',
  blocks: []
})

const logs = ref([])
const consoleRef = ref(null)
const showDebug = ref(false)

// Safe stringify function
const safeStringify = (obj, maxDepth = 3, currentDepth = 0) => {
  if (currentDepth >= maxDepth) return '[Max Depth Reached]'
  
  try {
    const rawObj = toRaw(obj)
    
    if (rawObj === null || rawObj === undefined) {
      return String(rawObj)
    }
    
    if (typeof rawObj === 'function') {
      return '[Function]'
    }
    
    if (typeof rawObj === 'object') {
      if (Array.isArray(rawObj)) {
        const items = rawObj.slice(0, 10).map(item => safeStringify(item, maxDepth, currentDepth + 1))
        return `[\n${items.map(item => `  ${item}`).join(',\n')}\n${rawObj.length > 10 ? `  ... and ${rawObj.length - 10} more items` : ''}]`
      }
      
      const entries = Object.entries(rawObj).slice(0, 20)
      const formatted = entries.map(([key, value]) => {
        const safeValue = safeStringify(value, maxDepth, currentDepth + 1)
        return `  "${key}": ${safeValue}`
      }).join(',\n')
      
      return `{\n${formatted}\n${Object.keys(rawObj).length > 20 ? '  ... and more properties' : ''}}`
    }
    
    return JSON.stringify(rawObj)
  } catch (error) {
    return `[Error: ${error.message}]`
  }
}

// Logging function
const addLog = (type, message, data = null) => {
  logs.value.push({
    type,
    message,
    data: data ? toRaw(data) : null,
    timestamp: new Date().toLocaleTimeString()
  })
  
  nextTick(() => {
    if (consoleRef.value) {
      consoleRef.value.scrollTop = consoleRef.value.scrollHeight
    }
  })
}

// Methods
const loadSampleData = () => {
  newsletter.value = {
    subject: 'Test Newsletter Subject',
    preheader: 'This is a test newsletter preview text',
    blocks: [
      {
        id: 'block_1',
        type: 'text',
        block_type: 'text',
        content: {
          text: 'Welcome to our newsletter! This is a sample text block.'
        },
        sort: 0
      },
      {
        id: 'block_2',
        type: 'button',
        block_type: 'button',
        content: {
          text: 'Click Me',
          url: 'https://example.com'
        },
        sort: 1
      }
    ]
  }
  
  addLog('info', 'Sample data loaded', newsletter.value)
}

const clearData = () => {
  newsletter.value = {
    subject: '',
    preheader: '',
    blocks: []
  }
  
  addLog('info', 'Data cleared')
}

const handleSave = () => {
  addLog('success', 'Newsletter save triggered', newsletter.value)
}

const handleNewsletterUpdate = (newValue) => {
  addLog('info', 'Newsletter updated', {
    blocksCount: newValue?.blocks?.length || 0,
    subject: newValue?.subject,
    preheader: newValue?.preheader
  })
}

const showDebugInfo = () => {
  showDebug.value = true
  addLog('info', 'Debug info displayed')
  
  // Log detailed block information
  if (newsletter.value.blocks && newsletter.value.blocks.length > 0) {
    newsletter.value.blocks.forEach((block, index) => {
      addLog('info', `Block ${index + 1} details:`, {
        id: block.id,
        type: block.type,
        block_type: block.block_type,
        content: block.content,
        sort: block.sort,
        hasContent: !!block.content,
        contentKeys: block.content ? Object.keys(block.content) : [],
        rawBlock: toRaw(block)
      })
    })
  }
}

const testBlockTypes = async () => {
  addLog('info', 'Testing block types...')
  
  try {
    // Try to load block types using the composable
    if (typeof useDirectusNewsletter === 'function') {
      const { fetchBlockTypes } = useDirectusNewsletter()
      const types = await fetchBlockTypes()
      addLog('success', `Loaded ${types.length} block types`, types.slice(0, 3))
    } else {
      addLog('warning', 'useDirectusNewsletter composable not available')
    }
  } catch (error) {
    addLog('error', 'Failed to load block types', error.message)
  }
}

const testCompilation = async () => {
  addLog('info', 'Testing MJML compilation...')
  
  try {
    // Test the MJML compilation endpoint
    const testMjml = `
      <mjml>
        <mj-body>
          <mj-section>
            <mj-column>
              <mj-text>Hello World Test</mj-text>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `
    
    const response = await $fetch('/api/newsletter/compile-mjml', {
      method: 'POST',
      body: { mjml: testMjml }
    })
    
    addLog('success', 'MJML compilation test successful', {
      htmlLength: response.html?.length || 0,
      hasErrors: response.errors?.length > 0,
      errorCount: response.errors?.length || 0
    })
  } catch (error) {
    addLog('error', 'MJML compilation test failed', error.message)
  }
}

// Lifecycle
onMounted(() => {
  addLog('info', 'Test page mounted')
  
  // Override console methods to capture output
  const originalLog = console.log
  const originalWarn = console.warn
  const originalError = console.error
  
  console.log = (...args) => {
    originalLog(...args)
    addLog('log', args.join(' '), args.length > 1 ? args.slice(1) : null)
  }
  
  console.warn = (...args) => {
    originalWarn(...args)
    addLog('warning', args.join(' '), args.length > 1 ? args.slice(1) : null)
  }
  
  console.error = (...args) => {
    originalError(...args)
    addLog('error', args.join(' '), args.length > 1 ? args.slice(1) : null)
  }
})
</script>

<style scoped>
@reference 'tailwindcss';
.test-page {
  @apply min-h-screen bg-gray-50;
}

.page-header {
  @apply bg-white border-b border-gray-200 p-6;
}

.page-header h1 {
  @apply text-2xl font-bold text-gray-900 mb-4;
}

.actions {
  @apply flex gap-3;
}

.btn {
  @apply px-4 py-2 rounded-lg font-medium transition-colors;
}

.btn-primary {
  @apply bg-blue-600 text-white hover:bg-blue-700;
}

.btn-secondary {
  @apply bg-gray-600 text-white hover:bg-gray-700;
}

.btn-info {
  @apply bg-green-600 text-white hover:bg-green-700;
}

.btn-small {
  @apply px-3 py-1 text-sm bg-gray-500 text-white hover:bg-gray-600;
}

.debug-info-panel {
  @apply bg-yellow-50 border border-yellow-200 p-4 m-4 rounded-lg;
}

.debug-info-panel h3 {
  @apply text-lg font-semibold text-yellow-800 mb-3;
}

.data-display {
  @apply space-y-4;
}

.data-item {
  @apply bg-white p-4 rounded border;
}

.data-item strong {
  @apply block text-sm font-medium mb-2;
}

.data-item pre {
  @apply text-xs bg-gray-100 p-3 rounded max-h-64 overflow-auto;
}

.newsletter-summary {
  @apply flex flex-wrap gap-2 mb-3;
}

.newsletter-summary span {
  @apply bg-blue-100 px-3 py-1 rounded text-blue-800 text-sm;
}

.block-detail {
  @apply mb-4 p-3 bg-white border border-gray-200 rounded;
}

.block-detail h4 {
  @apply font-medium text-gray-900 mb-2;
}

.block-info {
  @apply flex flex-wrap gap-2 mb-2;
}

.block-info span {
  @apply bg-gray-100 px-2 py-1 rounded text-xs text-gray-700;
}

.block-content {
  @apply mt-2;
}

.block-content strong {
  @apply block text-sm font-medium mb-1;
}

.block-content pre {
  @apply text-xs bg-gray-50 p-2 rounded max-h-32 overflow-auto;
}

.components-container {
  @apply p-4;
}

.component-section {
  @apply mb-8;
}

.component-section h2 {
  @apply text-xl font-semibold text-gray-900 mb-4;
}

.component-wrapper {
  @apply bg-white rounded-lg shadow-sm border border-gray-200 min-h-96;
}

.console-section {
  @apply bg-gray-900 text-white p-4;
}

.console-section h3 {
  @apply text-lg font-semibold mb-3;
}

.console-output {
  @apply bg-black rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm mb-3;
}

.console-entry {
  @apply mb-2;
}

.console-entry.log {
  @apply text-green-400;
}

.console-entry.warning {
  @apply text-yellow-400;
}

.console-entry.error {
  @apply text-red-400;
}

.console-entry.info {
  @apply text-blue-400;
}

.console-entry.success {
  @apply text-emerald-400;
}

.timestamp {
  @apply text-gray-500 text-xs mr-2;
}

.message {
  @apply text-sm;
}

.log-data {
  @apply text-gray-300 text-xs mt-1 bg-gray-800 p-2 rounded;
}
</style>