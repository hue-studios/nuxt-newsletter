<!-- Complete Fixed NewsletterStudio.vue - Bug fixes only, no design changes -->
<template>
  <div class="newsletter-studio">
    <!-- Header -->
    <div class="studio-header">
      <div class="header-left">
        <h2 class="studio-title">{{ title }}</h2>
        <span v-if="lastSaved" class="last-saved">
          Last saved {{ formatRelativeTime(lastSaved) }}
        </span>
      </div>
      <div class="header-actions">
        <slot name="header-actions">
          <button @click="handleNew" class="btn btn-secondary">
            <Icon name="lucide:plus" class="w-4 h-4" />
            New
          </button>
          <button @click="loadTemplates" class="btn btn-secondary">
            <Icon name="lucide:layout-template" class="w-4 h-4" />
            Templates
          </button>
          <button @click="handleSave" :disabled="saving" class="btn btn-primary">
            <Icon v-if="saving" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
            <Icon v-else name="lucide:save" class="w-4 h-4" />
            {{ saving ? 'Saving...' : 'Save' }}
          </button>
        </slot>
      </div>
    </div>

    <!-- Main Content -->
    <div class="studio-content">
      <!-- Left Panel - Settings & Blocks -->
      <div class="left-panel">
        <!-- Settings Section -->
        <div class="settings-section">
          <div class="section-header">
            <h3 class="section-title">Settings</h3>
          </div>
          <div class="form-group">
            <label>Subject Line</label>
            <input
              v-model="internalNewsletter.subject"
              @input="handleSubjectChange"
              type="text"
              placeholder="Enter subject..."
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>Preheader Text</label>
            <input
              v-model="internalNewsletter.preheader"
              @input="handlePreheaderChange"
              type="text"
              placeholder="Preview text..."
              class="form-input"
            />
          </div>
        </div>

        <!-- Add Blocks Section -->
        <div class="settings-section">
          <div class="section-header">
            <h3 class="section-title">Add Blocks</h3>
            <!-- Manual Refresh Button -->
            <button @click="refreshPreview" class="btn btn-xs btn-secondary">
              <Icon name="lucide:refresh-cw" class="w-3 h-3" />
              Refresh
            </button>
          </div>
          
          <div v-if="loadingBlockTypes" class="loading-state">
            <Icon name="lucide:loader-2" class="w-4 h-4 animate-spin" />
            <span>Loading block types...</span>
          </div>
          
          <div v-else class="block-types-grid">
            <button
              v-for="blockType in blockTypes"
              :key="blockType.id"
              @click="handleAddBlock(blockType)"
              class="block-type-btn"
            >
              <Icon v-if="blockType.icon" :name="blockType.icon" class="w-5 h-5" />
              <Icon v-else name="lucide:box" class="w-5 h-5" />
              <span>{{ blockType.name }}</span>
            </button>
          </div>
        </div>

        <!-- Actions Section -->
        <div class="settings-section">
          <div class="section-header">
            <h3 class="section-title">Actions</h3>
          </div>
          <div class="action-buttons">
            <button @click="clearAllBlocks" :disabled="!internalNewsletter.blocks?.length" class="btn btn-sm btn-outline-danger w-full">
              <Icon name="lucide:trash-2" class="w-4 h-4" />
              Clear All Blocks
            </button>
          </div>
        </div>
      </div>

      <!-- Content Panel - Block Editor -->
      <div class="content-panel">
        <div class="content-wrapper">
          <TransitionGroup name="block-list" tag="div" class="blocks-container">
            <NewsletterBlock
              v-for="(block, index) in internalNewsletter.blocks"
              :key="block.id"
              :block="block"
              :block-type="getBlockType(block)"
              :index="index"
              :total-blocks="internalNewsletter.blocks?.length || 0"
              @update="handleUpdateBlock"
              @remove="handleRemoveBlock"
              @move-up="() => handleMoveBlock(index, index - 1)"
              @move-down="() => handleMoveBlock(index, index + 1)"
              @duplicate="handleDuplicateBlock"
            />
          </TransitionGroup>
          
          <div v-if="!internalNewsletter.blocks?.length" class="empty-state">
            <Icon name="lucide:layout" class="w-12 h-12 text-gray-300" />
            <p class="text-gray-500 mt-2">Add blocks to start building your newsletter</p>
          </div>
        </div>
      </div>

      <!-- Preview Panel -->
      <div class="preview-panel">
        <NewsletterPreview
          ref="previewRef"
          :newsletter="frozenNewsletter"
          :block-types="blockTypes"
          @compiled="handleCompiled"
          @error="handlePreviewError"
        />
      </div>
    </div>

    <!-- Status Bar -->
    <div v-if="showStatusBar" class="studio-status-bar">
      <div class="status-left">
        <slot name="status-left">
          <span class="text-sm text-gray-600">
            {{ internalNewsletter.blocks?.length || 0 }} blocks
          </span>
        </slot>
      </div>
      <div class="status-right">
        <slot name="status-right">
          <span v-if="notification.show" :class="['notification', `notification-${notification.type}`]">
            {{ notification.message }}
          </span>
        </slot>
      </div>
    </div>

    <!-- Template Selector Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showTemplateSelector" class="modal-overlay" @click="showTemplateSelector = false">
          <div class="modal-content" @click.stop>
            <div class="modal-header">
              <h3 class="modal-title">Choose a Template</h3>
              <button @click="showTemplateSelector = false" class="modal-close">
                <Icon name="lucide:x" class="w-5 h-5" />
              </button>
            </div>
            <div class="modal-body">
              <div v-if="templates.length === 0" class="empty-state">
                <Icon name="lucide:layout-template" class="w-12 h-12 text-gray-300" />
                <p class="text-gray-500 mt-2">No templates available</p>
                <p class="text-sm text-gray-400 mt-1">Create templates in your Directus admin panel</p>
              </div>
              <div v-else class="template-grid">
                <div
                  v-for="template in templates"
                  :key="template.id"
                  @click="applyTemplate(template)"
                  class="template-card"
                >
                  <div class="template-preview">
                    <Icon name="lucide:layout-template" class="w-8 h-8 text-gray-400" />
                  </div>
                  <h4 class="template-name">{{ template.name }}</h4>
                  <p class="template-description">{{ template.description }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { debounce } from 'lodash-es'
import { computed, nextTick, onMounted, provide, ref, watch } from 'vue'
import type { NewsletterData } from '../../types'
import { useDirectusNewsletter } from '../composables/useDirectusNewsletter'

// Component imports
const NewsletterBlock = resolveComponent('NewsletterBlock')
const NewsletterPreview = resolveComponent('NewsletterPreview')

interface Props {
  modelValue?: NewsletterData
  title?: string
  autoSave?: boolean
  autoSaveDelay?: number
  showStatusBar?: boolean
  onSave?: (newsletter: NewsletterData) => Promise<void>
  onError?: (error: Error) => void
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Newsletter Editor',
  autoSave: false,
  autoSaveDelay: 3000,
  showStatusBar: true
})

const emit = defineEmits<{
  'update:modelValue': [newsletter: NewsletterData]
  'save': [newsletter: NewsletterData]
  'create': [newsletter: NewsletterData]
  'error': [error: Error]
}>()

// State
const internalNewsletter = ref<NewsletterData>({
  subject: '',
  preheader: '',
  blocks: [],
  status: 'draft'
})

// FIXED: Separate frozen state for preview
const frozenNewsletter = ref<NewsletterData>({
  subject: '',
  preheader: '',
  blocks: [],
  status: 'draft'
})

const blockTypes = ref<any[]>([])
const templates = ref<any[]>([])
const loadingBlockTypes = ref(true)
const saving = ref(false)
const showTemplateSelector = ref(false)
const lastSaved = ref<Date | null>(null)
const notification = ref({ show: false, type: 'info', message: '' })
const previewRef = ref()
const isInternalUpdate = ref(false) // FIXED: Flag to prevent loops

let autoSaveTimer: any = null

// Composables
const { fetchBlockTypes, fetchTemplates } = useDirectusNewsletter()

// Computed
const getBlockType = computed(() => (block: any) => {
  return blockTypes.value.find(bt => 
    bt.id === block.block_type || bt.slug === block.type
  )
})

// FIXED: Initialize without triggering updates
const initializeNewsletter = (data?: NewsletterData) => {
  const newsletter = data || props.modelValue || {
    subject: '',
    preheader: '',
    blocks: [],
    status: 'draft'
  }
  
  internalNewsletter.value = JSON.parse(JSON.stringify(newsletter))
  frozenNewsletter.value = JSON.parse(JSON.stringify(newsletter))
}

// FIXED: Safe emit that prevents loops
const emitUpdate = () => {
  if (isInternalUpdate.value) return
  
  const newsletterCopy = JSON.parse(JSON.stringify(internalNewsletter.value))
  emit('update:modelValue', newsletterCopy)
  setupAutoSave()
}

// FIXED: Debounced update for content changes
const debouncedEmitUpdate = debounce(() => {
  emitUpdate()
}, 300)

// FIXED: Manual refresh only
const refreshPreview = () => {
  frozenNewsletter.value = JSON.parse(JSON.stringify(internalNewsletter.value))
  nextTick(() => {
    previewRef.value?.refreshPreview?.()
  })
}

// Methods
const loadBlockTypes = async () => {
  try {
    loadingBlockTypes.value = true
    blockTypes.value = await fetchBlockTypes()
    console.log('Loaded block types:', blockTypes.value)
  } catch (error) {
    console.error('Failed to load block types:', error)
    showNotification('Failed to load block types', 'error')
  } finally {
    loadingBlockTypes.value = false
  }
}

const loadTemplates = async () => {
  try {
    console.log('Loading templates...')
    templates.value = await fetchTemplates()
    
    if (!templates.value || templates.value.length === 0) {
      // Show the modal even if no templates exist
      templates.value = []
      showTemplateSelector.value = true
      showNotification('No templates found. Create templates in Directus first.', 'info')
    } else {
      showTemplateSelector.value = true
      console.log('Loaded templates:', templates.value)
    }
  } catch (error) {
    console.error('Failed to load templates:', error)
    // Still show the modal with empty state
    templates.value = []
    showTemplateSelector.value = true
    showNotification('Failed to load templates. Check your Directus connection.', 'error')
  }
}

// FIXED: Separate input handlers that don't cause loops
const handleSubjectChange = () => {
  debouncedEmitUpdate()
}

const handlePreheaderChange = () => {
  debouncedEmitUpdate()
}

// FIXED: Block operations with direct updates
const handleAddBlock = (blockType: any) => {
  console.log('Adding block type:', blockType)
  
  const newBlock = {
    id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: blockType.slug,
    block_type: blockType.id,
    content: generateDefaultContent(blockType),
    sort: internalNewsletter.value.blocks?.length || 0
  }

  if (!internalNewsletter.value.blocks) {
    internalNewsletter.value.blocks = []
  }
  
  internalNewsletter.value.blocks.push(newBlock)
  emitUpdate()
  showNotification(`Added ${blockType.name} block`, 'success')
}

const generateDefaultContent = (blockType: any) => {
  const defaults: Record<string, any> = {
    hero: {
      title: 'Welcome to Our Newsletter!',
      subtitle: 'Your monthly dose of updates and insights',
      button_text: 'Learn More',
      button_url: '#'
    },
    text: {
      text_content: 'Add your content here...'
    },
    button: {
      button_text: 'Click Here',
      button_url: '#'
    },
    image: {
      image_url: 'https://via.placeholder.com/600x300',
      image_alt_text: 'Image description',
      caption: ''
    }
  }
  
  return defaults[blockType.slug] || {}
}

// FIXED: Update block without triggering loops
const handleUpdateBlock = (updatedBlock: any) => {
  const index = internalNewsletter.value.blocks?.findIndex(b => b.id === updatedBlock.id)
  if (index !== -1 && internalNewsletter.value.blocks) {
    // Update only the content, not the entire block
    internalNewsletter.value.blocks[index] = {
      ...internalNewsletter.value.blocks[index],
      content: { ...updatedBlock.content }
    }
    debouncedEmitUpdate()
  }
}

const handleRemoveBlock = (blockId: string) => {
  if (internalNewsletter.value.blocks) {
    internalNewsletter.value.blocks = internalNewsletter.value.blocks.filter(b => b.id !== blockId)
    // Re-sort remaining blocks
    internalNewsletter.value.blocks.forEach((block, index) => {
      block.sort = index
    })
    emitUpdate()
    showNotification('Block removed', 'info')
  }
}

const handleMoveBlock = (fromIndex: number, toIndex: number) => {
  if (!internalNewsletter.value.blocks || toIndex < 0 || toIndex >= internalNewsletter.value.blocks.length) {
    return
  }

  const blocks = [...internalNewsletter.value.blocks]
  const [movedBlock] = blocks.splice(fromIndex, 1)
  blocks.splice(toIndex, 0, movedBlock)
  
  // Update sort values
  blocks.forEach((block, index) => {
    block.sort = index
  })
  
  internalNewsletter.value.blocks = blocks
  emitUpdate()
}

const handleDuplicateBlock = (blockId: string) => {
  const originalBlock = internalNewsletter.value.blocks?.find(b => b.id === blockId)
  if (originalBlock) {
    const duplicatedBlock = {
      ...originalBlock,
      id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: { ...originalBlock.content }
    }
    
    const originalIndex = internalNewsletter.value.blocks!.findIndex(b => b.id === blockId)
    internalNewsletter.value.blocks!.splice(originalIndex + 1, 0, duplicatedBlock)
    
    // Re-sort blocks
    internalNewsletter.value.blocks!.forEach((block, index) => {
      block.sort = index
    })
    
    emitUpdate()
    showNotification('Block duplicated', 'success')
  }
}

const clearAllBlocks = () => {
  if (confirm('Remove all blocks? This action cannot be undone.')) {
    internalNewsletter.value.blocks = []
    emitUpdate()
    showNotification('All blocks removed', 'info')
  }
}

const applyTemplate = async (template: any) => {
  console.log('Applying template:', template)
  showTemplateSelector.value = false
  
  // Clear existing blocks
  internalNewsletter.value.blocks = []

  // Apply template blocks
  if (template.blocks_config) {
    let blocks = []
    
    // Parse blocks_config if it's a string
    try {
      blocks = typeof template.blocks_config === 'string' 
        ? JSON.parse(template.blocks_config) 
        : template.blocks_config
      
      console.log('Parsed blocks from template:', blocks)
    } catch (error) {
      console.error('Failed to parse template blocks:', error)
      showNotification('Failed to parse template blocks', 'error')
      return
    }

    // Create blocks from template
    blocks.forEach((blockConfig: any, index: number) => {
      console.log(`Processing block ${index}:`, blockConfig)
      
      // Try multiple ways to find the block type
      const blockTypeSlug = blockConfig.type || blockConfig.block_type || blockConfig.slug
      const blockTypeId = blockConfig.block_type_id || blockConfig.block_type
      
      // Find the actual block type from loaded types
      const blockType = blockTypes.value.find(bt => 
        bt.id === blockTypeId || 
        bt.slug === blockTypeSlug ||
        bt.id === blockTypeSlug || // Sometimes ID is used as type
        bt.slug === blockTypeId // Sometimes slug is in block_type field
      )
      
      if (blockType) {
        console.log(`Found block type for ${blockTypeSlug}:`, blockType)
        
        const newBlock = {
          id: `block_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
          type: blockType.slug,
          block_type: blockType.id,
          content: blockConfig.content || blockConfig.data || generateDefaultContent(blockType),
          sort: index
        }
        
        console.log('Created new block:', newBlock)
        internalNewsletter.value.blocks!.push(newBlock)
      } else {
        console.warn(`Block type not found for:`, blockConfig)
        showNotification(`Block type "${blockTypeSlug}" not found`, 'warning')
      }
    })
  }

  // Apply template metadata
  if (template.default_subject_pattern) {
    internalNewsletter.value.subject = template.default_subject_pattern
  }
  if (template.default_preheader) {
    internalNewsletter.value.preheader = template.default_preheader
  }

  console.log('Final newsletter after template:', internalNewsletter.value)
  
  // Emit update and refresh preview
  emitUpdate()
  refreshPreview()
  
  showNotification(`Applied template: ${template.name}`, 'success')
}

const handleSave = async () => {
  if (saving.value) return

  try {
    saving.value = true
    
    if (props.onSave) {
      await props.onSave(internalNewsletter.value)
    }
    
    lastSaved.value = new Date()
    showNotification('Newsletter saved successfully', 'success')
    emit('save', internalNewsletter.value)
  } catch (error) {
    console.error('Save failed:', error)
    showNotification('Failed to save newsletter', 'error')
    if (props.onError) {
      props.onError(error as Error)
    }
  } finally {
    saving.value = false
  }
}

const handleNew = async () => {
  if (confirm('Create a new newsletter? Unsaved changes will be lost.')) {
    initializeNewsletter({
      subject: '',
      preheader: '',
      blocks: [],
      status: 'draft'
    })
    lastSaved.value = null
    emitUpdate()
    showNotification('Created new newsletter', 'info')
    emit('create', internalNewsletter.value)
  }
}

const handleCompiled = (result: any) => {
  // Store compiled result but don't trigger updates
  if (result.mjml) {
    internalNewsletter.value.mjml = result.mjml
  }
  if (result.html) {
    internalNewsletter.value.html = result.html
  }
}

const handlePreviewError = (error: any) => {
  console.error('Preview error:', error)
  showNotification('Preview compilation failed', 'error')
}

const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  notification.value = { show: true, type, message }
  setTimeout(() => {
    notification.value.show = false
  }, 3000)
}

const setupAutoSave = () => {
  if (props.autoSave && props.autoSaveDelay > 0) {
    if (autoSaveTimer) clearTimeout(autoSaveTimer)
    
    autoSaveTimer = setTimeout(() => {
      if (internalNewsletter.value.id) {
        handleSave()
      }
    }, props.autoSaveDelay)
  }
}

const formatRelativeTime = (date: Date): string => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  
  return date.toLocaleDateString()
}

// FIXED: Watch for external changes without causing loops
watch(() => props.modelValue, (newVal) => {
  if (newVal && !isInternalUpdate.value && JSON.stringify(newVal) !== JSON.stringify(internalNewsletter.value)) {
    isInternalUpdate.value = true
    initializeNewsletter(newVal)
    nextTick(() => {
      isInternalUpdate.value = false
    })
  }
}, { 
  immediate: true,
  deep: false // Prevent deep watching to avoid recursion
})

// Lifecycle
onMounted(async () => {
  console.log('NewsletterStudio mounted')
  initializeNewsletter()
  await loadBlockTypes()
})

// Provide context for child components
provide('newsletterStudio', {
  newsletter: internalNewsletter,
  blockTypes,
  saving,
  showNotification
})

// Expose methods for parent components
defineExpose({
  save: handleSave,
  refresh: refreshPreview,
  getNewsletter: () => internalNewsletter.value,
  loadBlockTypes,
  loadTemplates,
  showNotification,
  blockTypes
})
</script>

<style scoped>
@reference 'tailwindcss';
/* Studio Container */
.newsletter-studio {
  @apply h-full flex flex-col bg-gray-50;
}

/* Header */
.studio-header {
  @apply flex items-center justify-between p-4 bg-white border-b border-gray-200;
}

.header-left {
  @apply flex items-center gap-4;
}

.studio-title {
  @apply text-lg font-semibold text-gray-900;
}

.last-saved {
  @apply text-sm text-gray-500;
}

.header-actions {
  @apply flex items-center gap-2;
}

/* Three Panel Layout */
.studio-content {
  @apply flex-1 flex overflow-hidden;
}

.left-panel {
  @apply w-80 bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0;
}

.content-panel {
  @apply flex-1 bg-gray-50 border-r border-gray-200 overflow-y-auto min-w-0;
}

.preview-panel {
  @apply flex-1 bg-white overflow-hidden min-w-0;
}

/* Left Panel Styles */
.settings-section {
  @apply p-4 border-b border-gray-100;
}

.section-header {
  @apply flex items-center justify-between mb-3;
}

.section-title {
  @apply text-sm font-medium text-gray-900;
}

.form-group {
  @apply mb-4;
}

.form-group label {
  @apply block text-sm font-medium text-gray-700 mb-1;
}

.form-input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
}

.loading-state {
  @apply flex items-center gap-2 text-gray-500 p-4;
}

.block-types-grid {
  @apply grid grid-cols-2 gap-2;
}

.block-type-btn {
  @apply flex flex-col items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors;
}

.block-type-btn span {
  @apply text-xs text-gray-700;
}

.action-buttons {
  @apply space-y-2;
}

/* Content Panel Styles */
.content-wrapper {
  @apply p-4 max-w-4xl mx-auto;
}

.blocks-container {
  @apply space-y-4;
}

.empty-state {
  @apply flex flex-col items-center justify-center py-16 text-center;
}

.empty-state {
  @apply flex flex-col items-center justify-center py-16 text-center;
}

/* Status Bar */
.studio-status-bar {
  @apply flex items-center justify-between px-4 py-2 bg-white border-t border-gray-200;
}

.status-left,
.status-right {
  @apply flex items-center gap-4;
}

.notification {
  @apply text-sm px-3 py-1 rounded-full;
}

.notification-success {
  @apply bg-green-100 text-green-700;
}

.notification-error {
  @apply bg-red-100 text-red-700;
}

.notification-info {
  @apply bg-blue-100 text-blue-700;
}

/* Modal Styles */
.modal-overlay {
  @apply fixed inset-0 bg-black/50 flex items-center justify-center z-50;
}

.modal-content {
  @apply bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] flex flex-col;
}

.modal-header {
  @apply flex items-center justify-between p-6 border-b border-gray-200;
}

.modal-title {
  @apply text-xl font-semibold text-gray-900;
}

.modal-close {
  @apply p-2 hover:bg-gray-100 rounded-lg transition-colors;
}

.modal-body {
  @apply flex-1 overflow-y-auto p-6;
}

.template-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4;
}

.template-card {
  @apply border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer;
}

.template-preview {
  @apply h-32 bg-gray-100 rounded-lg flex items-center justify-center mb-3;
}

.template-name {
  @apply font-medium text-gray-900 mb-1;
}

.template-description {
  @apply text-sm text-gray-600 line-clamp-2;
}

/* Buttons */
.btn {
  @apply inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2;
}

.btn-primary {
  @apply bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500;
}

.btn-secondary {
  @apply bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500;
}

.btn-outline-danger {
  @apply border border-red-300 text-red-600 hover:bg-red-50 focus:ring-red-500;
}

.btn-xs {
  @apply px-2 py-1 text-xs;
}

.btn-sm {
  @apply px-3 py-1.5 text-sm;
}

.btn:disabled {
  @apply opacity-50 cursor-not-allowed;
}

/* Transitions */
.block-list-move,
.block-list-enter-active,
.block-list-leave-active {
  transition: all 0.3s ease;
}

.block-list-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.block-list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.block-list-leave-active {
  position: absolute;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

/* Utility Classes */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>