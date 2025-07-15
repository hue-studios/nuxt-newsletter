<template>
  <div class="newsletter-editor">
    <!-- Header -->
    <div class="editor-header">
      <div class="header-left">
        <div class="editor-title">
          <Icon name="lucide:mail" class="w-5 h-5 text-slate-600" />
          <h1>Newsletter Editor</h1>
        </div>
        <div class="header-actions">
          <button @click="showTemplateSelector = true" class="action-button secondary">
            <Icon name="lucide:layout-template" class="w-4 h-4" />
            Templates
          </button>
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
              title="Desktop preview"
            >
              <Icon name="lucide:monitor" class="w-4 h-4" />
            </button>
            <button
              @click="previewDevice = 'tablet'"
              :class="{ active: previewDevice === 'tablet' }"
              class="device-button"
              title="Tablet preview"
            >
              <Icon name="lucide:tablet" class="w-4 h-4" />
            </button>
            <button
              @click="previewDevice = 'mobile'"
              :class="{ active: previewDevice === 'mobile' }"
              class="device-button"
              title="Mobile preview"
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
          <button @click="saveNewsletter" class="action-button primary" :disabled="props.disabled">
            <Icon name="lucide:save" class="w-4 h-4" />
            Save
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
            <div class="settings-row">
              <div class="form-group">
                <label for="subject">Subject Line</label>
                <input
                  id="subject"
                  v-model="newsletter.subject"
                  type="text"
                  placeholder="Enter newsletter subject..."
                  class="form-input"
                  :disabled="props.disabled"
                  @input="debouncedUpdate"
                />
              </div>
              <div class="form-group">
                <label for="preheader">Preheader Text</label>
                <input
                  id="preheader"
                  v-model="newsletter.preheader"
                  type="text"
                  placeholder="Preview text that appears after subject..."
                  class="form-input"
                  :disabled="props.disabled"
                  @input="debouncedUpdate"
                />
              </div>
            </div>
          </div>

          <!-- Block Types Toolbar -->
          <div class="block-toolbar">
            <div class="toolbar-header">
              <h3>Add Content Block</h3>
              <div class="block-stats">
                {{ blocks.length }} block{{ blocks.length !== 1 ? 's' : '' }}
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
                @click="addBlock(blockType.id)"
                class="block-type-button"
                :disabled="props.disabled"
              >
                <Icon :name="blockType.icon || 'lucide:square'" class="w-5 h-5" />
                <span>{{ blockType.name }}</span>
              </button>
            </div>
          </div>

          <!-- Content Blocks -->
          <div class="content-blocks">
            <div class="blocks-header">
              <h3>Newsletter Content</h3>
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
                :class="{ 'block-error': hasBlockError(block.id) }"
              >
                <div class="block-header">
                  <div class="block-info">
                    <Icon :name="getBlockIcon(block.block_type)" class="w-4 h-4 text-slate-500" />
                    <span class="block-title">{{ getBlockName(block.block_type) }}</span>
                    <span class="block-index">#{{ index + 1 }}</span>
                  </div>
                  <div class="block-actions">
                    <button
                      @click="moveBlockUp(index)"
                      :disabled="index === 0 || props.disabled"
                      class="block-action-button"
                      title="Move up"
                    >
                      <Icon name="lucide:chevron-up" class="w-4 h-4" />
                    </button>
                    <button
                      @click="moveBlockDown(index)"
                      :disabled="index === blocks.length - 1 || props.disabled"
                      class="block-action-button"
                      title="Move down"
                    >
                      <Icon name="lucide:chevron-down" class="w-4 h-4" />
                    </button>
                    <button
                      @click="duplicateBlock(block.id)"
                      :disabled="props.disabled"
                      class="block-action-button"
                      title="Duplicate"
                    >
                      <Icon name="lucide:copy" class="w-4 h-4" />
                    </button>
                    <button
                      @click="removeBlock(block.id)"
                      :disabled="props.disabled"
                      class="block-action-button danger"
                      title="Delete"
                    >
                      <Icon name="lucide:trash-2" class="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div class="block-content">
                  <NewsletterBlock
                    :block="block"
                    :block-type="getBlockType(block.block_type)"
                    :disabled="props.disabled"
                    @update="handleBlockUpdate"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Preview Panel -->
      <div v-if="showPreview" class="preview-panel">
        <NewsletterPreview
          :newsletter="newsletter"
          :block-types="blockTypes"
          :device="previewDevice"
          @update:compiled="handleCompiled"
        />
      </div>
    </div>

    <!-- Template Selection Modal -->
    <Transition name="modal">
      <div v-if="showTemplateSelector" class="modal-overlay" @click="showTemplateSelector = false">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>Choose Template</h3>
            <button @click="showTemplateSelector = false" class="modal-close">
              <Icon name="lucide:x" class="w-5 h-5" />
            </button>
          </div>
          <div class="modal-body">
            <div v-if="templates.length === 0" class="empty-templates">
              <Icon name="lucide:layout-template" class="w-12 h-12 text-slate-300" />
              <h4>No templates available</h4>
              <p>Create your first template by saving a newsletter as a template.</p>
            </div>
            <div v-else class="template-grid">
              <button
                v-for="template in templates"
                :key="template.id"
                @click="loadTemplate(template.id)"
                class="template-card"
              >
                <div class="template-preview">
                  <Icon name="lucide:layout-template" class="w-8 h-8 text-slate-400" />
                </div>
                <div class="template-info">
                  <h4>{{ template.name }}</h4>
                  <p>{{ template.description || 'No description' }}</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Notifications -->
    <Transition name="notification">
      <div v-if="notification.show" class="notification-container">
        <div class="notification" :class="notification.type">
          <Icon
            :name="notification.type === 'success' ? 'lucide:check-circle' : 'lucide:alert-circle'"
            class="w-5 h-5"
          />
          <span>{{ notification.message }}</span>
          <button @click="notification.show = false" class="notification-close">
            <Icon name="lucide:x" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { debounce } from 'lodash-es'
import { computed, onMounted, ref, watch } from 'vue'
import type { NewsletterData } from '../../types'
import NewsletterBlock from './NewsletterBlock.vue'
import NewsletterPreview from './NewsletterPreview.vue'

interface Props {
  modelValue?: NewsletterData
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: NewsletterData]
  'save': []
}>()

// Initialize newsletter data
const newsletter = ref<NewsletterData>({
  subject: '',
  preheader: '',
  blocks: [],
  ...props.modelValue
})

// Initialize blocks array
const blocks = ref<any[]>([...(props.modelValue?.blocks || [])])

// State
const blockTypes = ref<any[]>([])
const templates = ref<any[]>([])
const loadingBlockTypes = ref(true)
const showTemplateSelector = ref(false)
const showPreview = ref(true)
const previewDevice = ref<'desktop' | 'tablet' | 'mobile'>('desktop')
const errors = ref<Record<string, string>>({})
const notification = ref({
  show: false,
  message: '',
  type: 'success' as 'success' | 'error'
})

// Composables
const { fetchBlockTypes, fetchTemplates, fetchTemplate } = useDirectusNewsletter()

// Debounced update function
const debouncedUpdate = debounce(() => {
  updateNewsletter()
}, 300)

// Computed properties
const blockCategories = computed(() => {
  const categories = [...new Set(blockTypes.value.map(bt => bt.category))]
  return categories.sort()
})

// Core methods
const updateNewsletter = () => {
  newsletter.value.blocks = [...blocks.value]
  emit('update:modelValue', newsletter.value)
}

const addBlock = (blockTypeId: string) => {
  const blockType = blockTypes.value.find(bt => bt.id === blockTypeId)
  if (!blockType) return

  const newBlock = {
    id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    block_type: blockTypeId,
    content: {},
    sort: blocks.value.length
  }

  blocks.value.push(newBlock)
  updateNewsletter()
}

const removeBlock = (blockId: string) => {
  const index = blocks.value.findIndex(b => b.id === blockId)
  if (index > -1) {
    blocks.value.splice(index, 1)
    updateNewsletter()
  }
}

const duplicateBlock = (blockId: string) => {
  const originalBlock = blocks.value.find(b => b.id === blockId)
  if (!originalBlock) return

  const duplicatedBlock = {
    ...originalBlock,
    id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    sort: blocks.value.length
  }

  blocks.value.push(duplicatedBlock)
  updateNewsletter()
}

const moveBlockUp = (index: number) => {
  if (index > 0) {
    const block = blocks.value.splice(index, 1)[0]
    blocks.value.splice(index - 1, 0, block)
    updateNewsletter()
  }
}

const moveBlockDown = (index: number) => {
  if (index < blocks.value.length - 1) {
    const block = blocks.value.splice(index, 1)[0]
    blocks.value.splice(index + 1, 0, block)
    updateNewsletter()
  }
}

const handleBlockUpdate = (blockId: string, content: any) => {
  const block = blocks.value.find(b => b.id === blockId)
  if (block) {
    block.content = { ...content }
    updateNewsletter()
  }
}

const handleCompiled = (compiled: { mjml: string; html: string }) => {
  newsletter.value.mjml = compiled.mjml
  newsletter.value.html = compiled.html
  emit('update:modelValue', newsletter.value)
}

const togglePreview = () => {
  showPreview.value = !showPreview.value
}

const saveNewsletter = () => {
  emit('save')
  showNotification('Newsletter saved successfully!', 'success')
}

const loadTemplate = async (templateId: string) => {
  try {
    const template = await fetchTemplate(templateId)
    
    // Load template data
    newsletter.value.subject = template.subject || ''
    newsletter.value.preheader = template.preheader || ''
    blocks.value = [...(template.blocks || [])]
    
    updateNewsletter()
    showTemplateSelector.value = false
    showNotification('Template loaded successfully!', 'success')
  } catch (error) {
    showNotification('Failed to load template', 'error')
    console.error('Template loading error:', error)
  }
}

const showNotification = (message: string, type: 'success' | 'error') => {
  notification.value = { show: true, message, type }
  setTimeout(() => {
    notification.value.show = false
  }, 4000)
}

// Utility functions
const getBlockType = (blockTypeId: string) => {
  return blockTypes.value.find(bt => bt.id === blockTypeId)
}

const getBlockName = (blockTypeId: string) => {
  const blockType = getBlockType(blockTypeId)
  return blockType?.name || 'Unknown Block'
}

const getBlockIcon = (blockTypeId: string) => {
  const blockType = getBlockType(blockTypeId)
  return blockType?.icon || 'lucide:square'
}

const hasBlockError = (blockId: string) => {
  return errors.value[blockId] !== undefined
}

// Load initial data
const loadInitialData = async () => {
  try {
    loadingBlockTypes.value = true
    
    // Load block types and templates in parallel
    const [loadedBlockTypes, loadedTemplates] = await Promise.all([
      fetchBlockTypes(),
      fetchTemplates()
    ])
    
    blockTypes.value = loadedBlockTypes
    templates.value = loadedTemplates
    
  } catch (error) {
    console.error('Failed to load initial data:', error)
    showNotification('Failed to load editor components', 'error')
  } finally {
    loadingBlockTypes.value = false
  }
}

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    newsletter.value = { ...newValue }
    blocks.value = [...(newValue.blocks || [])]
  }
}, { deep: true })

// Lifecycle
onMounted(() => {
  loadInitialData()
})
</script>

<style scoped>
@reference 'tailwindcss';
.newsletter-editor {
  @apply h-full flex flex-col bg-slate-50;
}

.editor-header {
  @apply flex items-center justify-between p-4 bg-white border-b border-slate-200;
}

.header-left {
  @apply flex items-center gap-6;
}

.editor-title {
  @apply flex items-center gap-2;
}

.editor-title h1 {
  @apply text-lg font-semibold text-slate-900;
}

.header-actions {
  @apply flex items-center gap-2;
}

.header-right {
  @apply flex items-center gap-4;
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

.action-button.primary {
  @apply bg-blue-600 text-white hover:bg-blue-700;
}

.action-button.secondary {
  @apply bg-white text-slate-700 border border-slate-300 hover:bg-slate-50;
}

.action-button:disabled {
  @apply opacity-50 cursor-not-allowed;
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
  @apply max-w-2xl mx-auto p-6 space-y-6;
}

.newsletter-settings {
  @apply bg-white rounded-lg border border-slate-200 p-6;
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
  @apply w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent;
}

.form-input:disabled {
  @apply bg-slate-100 text-slate-500 cursor-not-allowed;
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

.loading-blocks {
  @apply flex items-center justify-center gap-2 py-8 text-slate-500;
}

.no-blocks {
  @apply flex items-center justify-center gap-2 py-8 text-slate-500;
}

.block-types-grid {
  @apply grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3;
}

.block-type-button {
  @apply flex flex-col items-center gap-2 p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors;
}

.block-type-button:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.block-type-button span {
  @apply text-sm font-medium text-slate-700;
}

.content-blocks {
  @apply bg-white rounded-lg border border-slate-200 p-6;
}

.blocks-header {
  @apply mb-4;
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

.empty-blocks p {
  @apply text-sm text-center;
}

.blocks-list {
  @apply space-y-4;
}

.block-item {
  @apply border border-slate-200 rounded-lg overflow-hidden;
}

.block-item.block-error {
  @apply border-red-300 bg-red-50;
}

.block-header {
  @apply flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200;
}

.block-info {
  @apply flex items-center gap-2;
}

.block-title {
  @apply text-sm font-medium text-slate-900;
}

.block-index {
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

.block-action-button:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.block-content {
  @apply p-4;
}

.preview-panel {
  @apply flex-1 border-l border-slate-200;
}

/* Modal styles */
.modal-overlay {
  @apply fixed inset-0 bg-black/50 flex items-center justify-center z-50;
}

.modal-content {
  @apply bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden;
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
  @apply p-4 max-h-96 overflow-auto;
}

.empty-templates {
  @apply flex flex-col items-center justify-center py-12 text-slate-500;
}

.empty-templates h4 {
  @apply text-lg font-medium mt-4 mb-2;
}

.empty-templates p {
  @apply text-sm text-center;
}

.template-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-4;
}

.template-card {
  @apply flex items-center gap-4 p-4 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors;
}

.template-preview {
  @apply flex-shrink-0;
}

.template-info {
  @apply flex-1 text-left;
}

.template-info h4 {
  @apply font-medium text-slate-900 mb-1;
}

.template-info p {
  @apply text-sm text-slate-500;
}

.notification-container {
  @apply fixed top-4 right-4 z-50;
}

.notification {
  @apply flex items-center gap-3 p-4 rounded-lg shadow-lg;
}

.notification.success {
  @apply bg-green-100 text-green-800 border border-green-200;
}

.notification.error {
  @apply bg-red-100 text-red-800 border border-red-200;
}

.notification-close {
  @apply p-1 hover:bg-black/10 rounded;
}

/* Transitions */
.modal-enter-active, .modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from, .modal-leave-to {
  opacity: 0;
}

.notification-enter-active, .notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from, .notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>