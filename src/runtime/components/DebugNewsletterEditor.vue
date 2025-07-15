<!-- Debug NewsletterEditor.vue -->
<template>
  <div class="newsletter-editor debug-mode">
    <!-- Debug Info Panel -->
    <div class="debug-panel">
      <h3>🔍 Debug Information</h3>
      <div class="debug-grid">
        <div class="debug-item">
          <strong>Newsletter Object:</strong>
          <pre>{{ JSON.stringify(newsletter, null, 2) }}</pre>
        </div>
        <div class="debug-item">
          <strong>Blocks Array:</strong>
          <pre>{{ JSON.stringify(blocks, null, 2) }}</pre>
        </div>
        <div class="debug-item">
          <strong>Block Types:</strong>
          <pre>{{ JSON.stringify(blockTypes.map(bt => ({ id: bt.id, name: bt.name, slug: bt.slug })), null, 2) }}</pre>
        </div>
        <div class="debug-item">
          <strong>Component Props:</strong>
          <pre>{{ JSON.stringify(props, null, 2) }}</pre>
        </div>
      </div>
    </div>

    <!-- Header -->
    <div class="editor-header">
      <div class="header-left">
        <div class="editor-title">
          <Icon name="lucide:mail" class="w-5 h-5 text-slate-600" />
          <h1>Newsletter Editor (Debug Mode)</h1>
        </div>
      </div>
      
      <div class="header-right">
        <div class="device-controls">
          <span class="device-label">Preview:</span>
          <div class="device-selector">
            <button
              @click="previewDevice = 'desktop'"
              :class="{ active: previewDevice === 'desktop' }"
              class="device-button"
            >
              <Icon name="lucide:monitor" class="w-4 h-4" />
            </button>
            <button
              @click="previewDevice = 'mobile'"
              :class="{ active: previewDevice === 'mobile' }"
              class="device-button"
            >
              <Icon name="lucide:smartphone" class="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div class="main-actions">
          <button @click="togglePreview" class="action-button secondary">
            <Icon :name="showPreview ? 'lucide:eye-off' : 'lucide:eye'" class="w-4 h-4" />
            {{ showPreview ? 'Hide' : 'Show' }} Preview
          </button>
          <button @click="debugLog" class="action-button secondary">
            <Icon name="lucide:bug" class="w-4 h-4" />
            Debug Log
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="main-content" :class="{ 'with-preview': showPreview }">
      <!-- Editor Panel -->
      <div class="editor-panel">
        <div class="editor-container">
          <!-- Newsletter Settings -->
          <div class="newsletter-settings">
            <h3>Newsletter Settings</h3>
            <div class="settings-row">
              <div class="form-group">
                <label for="subject">Subject Line</label>
                <input
                  id="subject"
                  v-model="newsletter.subject"
                  type="text"
                  placeholder="Enter newsletter subject..."
                  class="form-input"
                  @input="handleSubjectChange"
                />
                <small>Value: {{ newsletter.subject }}</small>
              </div>
              <div class="form-group">
                <label for="preheader">Preheader Text</label>
                <input
                  id="preheader"
                  v-model="newsletter.preheader"
                  type="text"
                  placeholder="Preview text..."
                  class="form-input"
                  @input="handlePreheaderChange"
                />
                <small>Value: {{ newsletter.preheader }}</small>
              </div>
            </div>
          </div>

          <!-- Block Types -->
          <div class="block-toolbar">
            <div class="toolbar-header">
              <h3>Add Content Block</h3>
              <div class="block-stats">
                {{ blocks.length }} blocks | {{ blockTypes.length }} types available
              </div>
            </div>
            
            <div v-if="loadingBlockTypes" class="loading-blocks">
              <Icon name="lucide:loader-2" class="w-4 h-4 animate-spin" />
              <span>Loading block types...</span>
            </div>
            
            <div v-else-if="blockTypes.length === 0" class="no-blocks">
              <Icon name="lucide:alert-triangle" class="w-5 h-5 text-amber-500" />
              <span>No block types available</span>
            </div>
            
            <div v-else class="block-types-grid">
              <button
                v-for="blockType in blockTypes"
                :key="blockType.id"
                @click="addBlock(blockType)"
                class="block-type-button"
              >
                <Icon :name="blockType.icon || 'lucide:square'" class="w-5 h-5" />
                <span>{{ blockType.name }}</span>
                <small>{{ blockType.slug }}</small>
              </button>
            </div>
          </div>

          <!-- Content Blocks -->
          <div class="content-blocks">
            <div class="blocks-header">
              <h3>Newsletter Content</h3>
              <button @click="addTestBlock" class="action-button secondary">
                <Icon name="lucide:plus" class="w-4 h-4" />
                Add Test Block
              </button>
            </div>
            
            <div v-if="blocks.length === 0" class="empty-blocks">
              <Icon name="lucide:plus-circle" class="w-12 h-12 text-slate-300" />
              <h4>No content blocks yet</h4>
              <p>Add your first content block using the buttons above.</p>
            </div>
            
            <div v-else class="blocks-list">
              <div
                v-for="(block, index) in blocks"
                :key="block.id"
                class="block-item"
              >
                <div class="block-header">
                  <div class="block-info">
                    <span class="block-title">Block {{ index + 1 }}</span>
                    <span class="block-type">Type: {{ block.type || block.block_type || 'Unknown' }}</span>
                  </div>
                  <div class="block-actions">
                    <button @click="removeBlock(block.id)" class="block-action-button danger">
                      <Icon name="lucide:trash-2" class="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div class="block-content">
                  <div class="block-debug">
                    <strong>Block Data:</strong>
                    <pre>{{ JSON.stringify(block, null, 2) }}</pre>
                  </div>
                  
                  <!-- Simple content editor -->
                  <div class="simple-editor">
                    <label>Block Content (JSON):</label>
                    <textarea
                      v-model="block.content"
                      @input="handleBlockContentChange(block.id, $event)"
                      class="content-textarea"
                      rows="4"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Preview Panel -->
      <div v-if="showPreview" class="preview-panel">
        <DebugNewsletterPreview 
          :newsletter="newsletter"
          :block-types="blockTypes"
          :device="previewDevice"
          @update:compiled="handleCompiled"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import DebugNewsletterPreview from './DebugNewsletterPreview.vue';

interface Props {
  modelValue?: any
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: any]
  'save': []
}>()

// Initialize with proper data structure
const newsletter = ref({
  subject: props.modelValue?.subject || props.modelValue?.subject_line || '',
  preheader: props.modelValue?.preheader || props.modelValue?.preview_text || '',
  blocks: props.modelValue?.blocks || [],
  ...props.modelValue
})

const blocks = ref([...(props.modelValue?.blocks || [])])
const blockTypes = ref<any[]>([])
const loadingBlockTypes = ref(true)
const showPreview = ref(true)
const previewDevice = ref<'desktop' | 'mobile'>('desktop')

// Try to load composables
let directusComposable: any = null
try {
  directusComposable = useDirectusNewsletter()
} catch (error) {
  console.warn('useDirectusNewsletter not available:', error)
}

// Methods
const handleSubjectChange = () => {
  console.log('Subject changed:', newsletter.value.subject)
  updateNewsletter()
}

const handlePreheaderChange = () => {
  console.log('Preheader changed:', newsletter.value.preheader)
  updateNewsletter()
}

const handleBlockContentChange = (blockId: string, event: any) => {
  const block = blocks.value.find(b => b.id === blockId)
  if (block) {
    try {
      block.content = JSON.parse(event.target.value)
    } catch (error) {
      console.warn('Invalid JSON in block content:', error)
    }
    updateNewsletter()
  }
}

const updateNewsletter = () => {
  newsletter.value.blocks = [...blocks.value]
  console.log('Updating newsletter:', newsletter.value)
  emit('update:modelValue', newsletter.value)
}

const addBlock = (blockType: any) => {
  console.log('Adding block:', blockType)
  const newBlock = {
    id: `block_${Date.now()}`,
    type: blockType.slug,
    block_type: blockType.id,
    content: {},
    sort: blocks.value.length
  }
  blocks.value.push(newBlock)
  updateNewsletter()
}

const addTestBlock = () => {
  const testBlock = {
    id: `test_block_${Date.now()}`,
    type: 'text',
    block_type: 'text',
    content: {
      text: 'This is a test block'
    },
    sort: blocks.value.length
  }
  blocks.value.push(testBlock)
  updateNewsletter()
}

const removeBlock = (blockId: string) => {
  const index = blocks.value.findIndex(b => b.id === blockId)
  if (index > -1) {
    blocks.value.splice(index, 1)
    updateNewsletter()
  }
}

const handleCompiled = (compiled: any) => {
  console.log('Compiled result:', compiled)
  newsletter.value.mjml = compiled.mjml
  newsletter.value.html = compiled.html
  emit('update:modelValue', newsletter.value)
}

const togglePreview = () => {
  showPreview.value = !showPreview.value
}

const debugLog = () => {
  console.log('=== NEWSLETTER DEBUG ===')
  console.log('Newsletter:', newsletter.value)
  console.log('Blocks:', blocks.value)
  console.log('Block Types:', blockTypes.value)
  console.log('Props:', props)
  console.log('========================')
}

// Load block types
const loadBlockTypes = async () => {
  try {
    if (directusComposable) {
      blockTypes.value = await directusComposable.fetchBlockTypes()
      console.log('Loaded block types:', blockTypes.value)
    } else {
      // Mock data for testing
      blockTypes.value = [
        {
          id: 'text',
          name: 'Text Block',
          slug: 'text',
          icon: 'lucide:type',
          mjml_template: '<mj-section><mj-column><mj-text>{{text}}</mj-text></mj-column></mj-section>'
        },
        {
          id: 'button',
          name: 'Button Block',
          slug: 'button',
          icon: 'lucide:mouse-pointer',
          mjml_template: '<mj-section><mj-column><mj-button href="{{url}}">{{text}}</mj-button></mj-column></mj-section>'
        }
      ]
    }
  } catch (error) {
    console.error('Error loading block types:', error)
  } finally {
    loadingBlockTypes.value = false
  }
}

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    console.log('Props changed:', newValue)
    newsletter.value = { ...newValue }
    blocks.value = [...(newValue.blocks || [])]
  }
}, { deep: true })

// Lifecycle
onMounted(() => {
  console.log('Editor mounted with props:', props)
  loadBlockTypes()
})
</script>

<style scoped>
@reference 'tailwindcss';
.newsletter-editor.debug-mode {
  @apply h-full flex flex-col bg-slate-50;
}

.debug-panel {
  @apply p-4 bg-yellow-50 border-b-2 border-yellow-200;
}

.debug-panel h3 {
  @apply text-lg font-semibold mb-3 text-yellow-800;
}

.debug-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4;
}

.debug-item {
  @apply bg-white p-3 rounded border;
}

.debug-item strong {
  @apply block text-sm font-medium mb-2;
}

.debug-item pre {
  @apply text-xs bg-gray-100 p-2 rounded max-h-32 overflow-auto;
}

.editor-header {
  @apply flex items-center justify-between p-4 bg-white border-b border-slate-200;
}

.header-left, .header-right {
  @apply flex items-center gap-4;
}

.editor-title {
  @apply flex items-center gap-2;
}

.editor-title h1 {
  @apply text-lg font-semibold text-slate-900;
}

.device-controls {
  @apply flex items-center gap-3;
}

.device-label {
  @apply text-sm font-medium text-slate-700;
}

.device-selector {
  @apply flex items-center gap-1 bg-slate-100 rounded-lg p-1;
}

.device-button {
  @apply p-2 rounded-md text-slate-600 hover:text-slate-900 transition-colors;
}

.device-button.active {
  @apply bg-white text-blue-600 shadow-sm;
}

.main-actions {
  @apply flex items-center gap-2;
}

.action-button {
  @apply flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors;
}

.action-button.secondary {
  @apply bg-white text-slate-700 border border-slate-300 hover:bg-slate-50;
}

.main-content {
  @apply flex-1 flex overflow-hidden;
}

.main-content.with-preview {
  @apply gap-1;
}

.editor-panel {
  @apply flex-1 overflow-auto;
}

.editor-container {
  @apply max-w-4xl mx-auto p-6 space-y-6;
}

.newsletter-settings {
  @apply bg-white rounded-lg border border-slate-200 p-6;
}

.newsletter-settings h3 {
  @apply text-lg font-medium mb-4;
}

.settings-row {
  @apply grid grid-cols-1 md:grid-cols-2 gap-4;
}

.form-group {
  @apply space-y-2;
}

.form-group label {
  @apply block text-sm font-medium text-slate-700;
}

.form-input {
  @apply w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.form-group small {
  @apply text-xs text-slate-500;
}

.block-toolbar {
  @apply bg-white rounded-lg border border-slate-200 p-6;
}

.toolbar-header {
  @apply flex items-center justify-between mb-4;
}

.toolbar-header h3 {
  @apply text-lg font-medium text-slate-900;
}

.block-stats {
  @apply text-sm text-slate-500;
}

.loading-blocks, .no-blocks {
  @apply flex items-center justify-center gap-2 py-8 text-slate-500;
}

.block-types-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3;
}

.block-type-button {
  @apply flex flex-col items-center gap-2 p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors;
}

.block-type-button span {
  @apply text-sm font-medium text-slate-700;
}

.block-type-button small {
  @apply text-xs text-slate-500;
}

.content-blocks {
  @apply bg-white rounded-lg border border-slate-200 p-6;
}

.blocks-header {
  @apply flex items-center justify-between mb-4;
}

.blocks-header h3 {
  @apply text-lg font-medium text-slate-900;
}

.empty-blocks {
  @apply flex flex-col items-center justify-center py-12 text-slate-500;
}

.empty-blocks h4 {
  @apply text-lg font-medium mt-4 mb-2;
}

.blocks-list {
  @apply space-y-4;
}

.block-item {
  @apply border border-slate-200 rounded-lg overflow-hidden;
}

.block-header {
  @apply flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200;
}

.block-info {
  @apply flex flex-col gap-1;
}

.block-title {
  @apply text-sm font-medium text-slate-900;
}

.block-type {
  @apply text-xs text-slate-500;
}

.block-actions {
  @apply flex items-center gap-1;
}

.block-action-button {
  @apply p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors;
}

.block-action-button.danger {
  @apply hover:text-red-600 hover:bg-red-100;
}

.block-content {
  @apply p-4 space-y-4;
}

.block-debug {
  @apply bg-gray-50 p-3 rounded;
}

.block-debug strong {
  @apply block text-sm font-medium mb-2;
}

.block-debug pre {
  @apply text-xs bg-gray-100 p-2 rounded max-h-32 overflow-auto;
}

.simple-editor {
  @apply space-y-2;
}

.simple-editor label {
  @apply block text-sm font-medium text-slate-700;
}

.content-textarea {
  @apply w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm;
}

.preview-panel {
  @apply flex-1 border-l border-slate-200;
}
</style>