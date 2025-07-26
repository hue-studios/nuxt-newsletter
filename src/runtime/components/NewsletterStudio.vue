<template>
  <div class="newsletter-studio" :class="[`layout-${layout}`, { 'dark': darkMode }]">
    <!-- Header -->
    <div v-if="showHeader" class="studio-header">
      <div class="header-left">
        <h1 class="studio-title">{{ title }}</h1>
        <div v-if="lastSaved" class="last-saved">
          Last saved: {{ formatRelativeTime(lastSaved) }}
        </div>
      </div>
      
      <div class="header-actions">
        <button @click="loadTemplates" class="btn-secondary">
          <Icon name="lucide:layout-template" class="w-4 h-4" />
          Templates
        </button>
        <button @click="handleNew" class="btn-secondary">
          <Icon name="lucide:plus" class="w-4 h-4" />
          New
        </button>
        <button @click="handleSave" :disabled="saving" class="btn-primary">
          <Icon :name="saving ? 'lucide:loader-2' : 'lucide:save'" 
                :class="['w-4 h-4', { 'animate-spin': saving }]" />
          {{ saving ? 'Saving...' : 'Save' }}
        </button>
      </div>
    </div>

    <!-- Main Content - Three Panel Layout -->
    <div class="studio-content">
      <!-- Panel 1: Settings & Block Types (Left) -->
      <div v-if="showEditor" class="left-panel">
        <!-- Newsletter Settings -->
        <div class="settings-section">
          <h3 class="section-title">Newsletter Settings</h3>
          
          <div class="form-group">
            <label>Subject Line</label>
            <input 
              v-model="internalNewsletter.subject" 
              @input="handleSubjectChange"
              type="text" 
              placeholder="Enter subject line..."
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>Preheader</label>
            <input 
              v-model="internalNewsletter.preheader" 
              @input="handlePreheaderChange"
              type="text" 
              placeholder="Enter preheader..."
              class="form-input"
            />
          </div>
        </div>

        <!-- Block Types -->
        <div class="settings-section">
          <div class="section-header">
            <h3 class="section-title">Add Blocks</h3>
          </div>
          
          <div v-if="loadingBlockTypes" class="loading-state">
            <Icon name="lucide:loader-2" class="w-4 h-4 animate-spin" />
            <span>Loading blocks...</span>
          </div>
          <div v-else class="block-types-grid">
            <button
              v-for="blockType in blockTypes"
              :key="blockType.id"
              @click="handleAddBlock(blockType)"
              class="block-type-button"
            >
              <Icon :name="blockType.icon || 'lucide:plus'" class="w-4 h-4" />
              <span>{{ blockType.name }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Panel 2: Content Blocks Editor (Middle) -->
      <div v-if="showEditor" class="content-panel">
        <div class="content-header">
          <div class="content-title">
            <h3>Content Blocks</h3>
            <span class="block-count">{{ internalNewsletter.blocks?.length || 0 }} blocks</span>
          </div>
          <div class="content-actions">
            <button @click="refreshPreview" class="btn-ghost">
              <Icon name="lucide:refresh-cw" class="w-4 h-4" />
              Refresh Preview
            </button>
            <button @click="clearAllBlocks" class="btn-ghost" v-if="internalNewsletter.blocks?.length">
              <Icon name="lucide:trash-2" class="w-4 h-4" />
              Clear All
            </button>
          </div>
        </div>

        <div class="content-body">
          <!-- Empty State -->
          <div v-if="!internalNewsletter.blocks?.length" class="empty-state">
            <Icon name="lucide:inbox" class="w-12 h-12 text-gray-400" />
            <h4>No content blocks yet</h4>
            <p>Add blocks from the left panel to start building your newsletter</p>
          </div>
          
          <!-- Blocks List -->
          <div v-else class="blocks-container">
            <div
              v-for="(block, index) in internalNewsletter.blocks"
              :key="block.id"
              :class="['block-item', dragClasses(index)]"
              v-bind="dragAttributes(index)"
            >
              <NewsletterBlock
                :block="block"
                :block-type="getBlockType(block.type)"
                @update="handleUpdateBlock"
                @remove="handleRemoveBlock"
                @duplicate="handleDuplicateBlock"
                @move-up="() => handleMoveBlock(index, index - 1)"
                @move-down="() => handleMoveBlock(index, index + 1)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Panel 3: Email Preview (Right) -->
      <div v-if="showPreview" class="preview-panel">
        <NewsletterPreview
          ref="previewRef"
          :newsletter="frozenNewsletter"
          :block-types="blockTypes"
          :devices="devices"
          :default-device="defaultDevice"
          @error="handlePreviewError"
        />
      </div>
    </div>

    <!-- Status Bar -->
    <div v-if="showStatusBar" class="status-bar">
      <div class="status-left">
        <span class="block-count">{{ internalNewsletter.blocks?.length || 0 }} blocks</span>
        <span v-if="internalNewsletter.status" class="status-badge" :class="`status-${internalNewsletter.status}`">
          {{ internalNewsletter.status }}
        </span>
      </div>
      <div class="status-right">
        <span v-if="isDraggingBlock" class="drag-indicator">
          <Icon name="lucide:move" class="w-4 h-4" />
          Drag to reorder
        </span>
      </div>
    </div>

    <!-- Template Selector Modal -->
    <div v-if="showTemplateSelector" class="modal-overlay" @click="showTemplateSelector = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Choose Template</h3>
          <button @click="showTemplateSelector = false" class="btn-ghost">
            <Icon name="lucide:x" class="w-4 h-4" />
          </button>
        </div>
        <div class="modal-body">
          <div v-if="templates.length === 0" class="empty-state">
            <Icon name="lucide:layout-template" class="w-8 h-8 text-gray-400" />
            <p>No templates available</p>
          </div>
          <div v-else class="templates-grid">
            <button
              v-for="template in templates"
              :key="template.id"
              @click="handleTemplateSelect(template)"
              class="template-card"
            >
              <div class="template-preview">
                <Icon name="lucide:layout-template" class="w-6 h-6" />
              </div>
              <div class="template-info">
                <h4>{{ template.name }}</h4>
                <p v-if="template.description">{{ template.description }}</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Notification -->
    <div v-if="notification.show" class="notification" :class="`notification-${notification.type}`">
      <Icon :name="notificationIcon" class="w-4 h-4" />
      <span>{{ notification.message }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { debounce } from 'lodash-es'
import { computed, nextTick, onMounted, provide, ref, watch } from 'vue'

interface NewsletterData {
  id?: string
  subject: string
  preheader: string
  blocks: any[]
  status?: string
  [key: string]: any
}

interface Props {
  modelValue?: NewsletterData
  title?: string
  layout?: 'horizontal' | 'vertical' | 'editor-only' | 'preview-only'
  showHeader?: boolean
  showStatusBar?: boolean
  showEditor?: boolean
  showPreview?: boolean
  resizable?: boolean
  darkMode?: boolean
  editorWidth?: string
  devices?: ('mobile' | 'tablet')[]
  defaultDevice?: 'mobile' | 'tablet'
  autoSave?: boolean
  autoSaveDelay?: number
  onSave?: (newsletter: NewsletterData) => Promise<any>
  onCreate?: (newsletter: NewsletterData) => Promise<any>
  onError?: (error: Error) => void
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Newsletter Studio',
  layout: 'horizontal',
  showHeader: true,
  showStatusBar: true,
  showEditor: true,
  showPreview: true,
  resizable: true,
  darkMode: false,
  editorWidth: '400px',
  devices: () => ['mobile', 'tablet'],
  defaultDevice: 'mobile',
  autoSave: false,
  autoSaveDelay: 2000
})

const emit = defineEmits<{
  'update:modelValue': [value: NewsletterData]
  'save': [newsletter: NewsletterData]
  'create': [newsletter: NewsletterData]
  'error': [error: Error]
}>()

// FIXED: Separate internal state from reactive props
const internalNewsletter = ref<NewsletterData>({
  subject: '',
  preheader: '',
  blocks: [],
  status: 'draft'
})

// FIXED: Completely separate frozen state for preview
const frozenNewsletter = ref<NewsletterData>({ ...internalNewsletter.value })

const blockTypes = ref<any[]>([])
const templates = ref<any[]>([])
const loadingBlockTypes = ref(false)
const saving = ref(false)
const lastSaved = ref<Date | null>(null)
const showTemplateSelector = ref(false)
const previewRef = ref()

// Auto-save timer
let autoSaveTimer: NodeJS.Timeout | null = null

// Notification system
const notification = ref({
  show: false,
  type: 'success' as 'success' | 'error' | 'info',
  message: ''
})

// Composables
const { fetchBlockTypes, fetchTemplates, fetchTemplate } = useDirectusNewsletter()

// Drag and drop for block reordering
const { 
  getDragAttributes, 
  getDragClasses,
  isDragging: isDraggingBlock
} = useDragAndDrop({
  onMove: (fromIndex: number, toIndex: number) => {
    if (!internalNewsletter.value.blocks) return
    
    const blocks = [...internalNewsletter.value.blocks]
    const [movedBlock] = blocks.splice(fromIndex, 1)
    blocks.splice(toIndex, 0, movedBlock)
    
    // Update sort values
    blocks.forEach((block, index) => {
      block.sort = index
    })
    
    internalNewsletter.value.blocks = blocks
    emitUpdate()
    refreshPreview()
  },
  hapticFeedback: true,
  smoothAnimations: true
})

// Drag attributes and classes for template
const dragAttributes = (index: number) => getDragAttributes(index)
const dragClasses = (index: number) => getDragClasses(index)

// Computed
const notificationIcon = computed(() => {
  switch (notification.value.type) {
    case 'success': return 'lucide:check-circle'
    case 'error': return 'lucide:x-circle'
    case 'info': return 'lucide:info'
    default: return 'lucide:info'
  }
})

// FIXED: Initialize internal state only once
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

// FIXED: Safe emit that doesn't trigger loops
const emitUpdate = () => {
  const newsletterCopy = JSON.parse(JSON.stringify(internalNewsletter.value))
  emit('update:modelValue', newsletterCopy)
  setupAutoSave()
}

// FIXED: Debounced update for content changes only
const debouncedEmitUpdate = debounce(() => {
  emitUpdate()
}, 300)

// FIXED: Manual refresh function for preview
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
    templates.value = await fetchTemplates()
    showTemplateSelector.value = true
    console.log('Loaded templates:', templates.value)
  } catch (error) {
    console.error('Failed to load templates:', error)
    showNotification('Failed to load templates', 'error')
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
  refreshPreview()
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
      image_alt_text: 'Image description',
      caption: ''
    }
  }
  
  return defaults[blockType.slug] || {}
}

const handleUpdateBlock = (updatedBlock: any) => {
  const index = internalNewsletter.value.blocks?.findIndex(b => b.id === updatedBlock.id)
  if (index !== -1 && internalNewsletter.value.blocks) {
    internalNewsletter.value.blocks[index] = { ...internalNewsletter.value.blocks[index], ...updatedBlock }
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
    refreshPreview()
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
  refreshPreview()
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
    refreshPreview()
    showNotification('Block duplicated', 'success')
  }
}

const clearAllBlocks = () => {
  if (confirm('Remove all blocks? This action cannot be undone.')) {
    internalNewsletter.value.blocks = []
    emitUpdate()
    refreshPreview()
    showNotification('All blocks removed', 'info')
  }
}

// FIXED: Improved template selection
const handleTemplateSelect = async (template: any) => {
  try {
    console.log('Loading template:', template)
    const fullTemplate = await fetchTemplate(template.id)
    console.log('Full template loaded:', fullTemplate)
    
    await loadFromTemplate(fullTemplate)
    showTemplateSelector.value = false
    showNotification('Template loaded successfully!', 'success')
  } catch (error) {
    console.error('Error loading template:', error)
    showNotification('Failed to load template', 'error')
  }
}

// FIXED: Improved template loading with better error handling
const loadFromTemplate = async (template: any) => {
  if (!template) {
    console.error('No template provided')
    return
  }

  console.log('Loading template blocks:', template)

  // Clear existing blocks
  internalNewsletter.value.blocks = []

  // Parse template blocks
  let templateBlocks: any[] = []
  try {
    if (template.blocks_config) {
      templateBlocks = Array.isArray(template.blocks_config)
        ? template.blocks_config
        : JSON.parse(template.blocks_config)
    } else if (template.blocks) {
      templateBlocks = Array.isArray(template.blocks)
        ? template.blocks
        : JSON.parse(template.blocks)
    }
    
    console.log('Parsed template blocks:', templateBlocks)
  } catch (error) {
    console.error('Invalid template blocks config:', error)
    showNotification('Template has invalid block configuration', 'error')
    return
  }

  // Ensure block types are loaded
  if (!blockTypes.value.length) {
    console.log('Block types not loaded, loading now...')
    await loadBlockTypes()
  }

  // Create blocks from template
  templateBlocks.forEach((blockConfig: any, index: number) => {
    console.log('Processing block config:', blockConfig)
    
    // Find matching block type
    const blockType = blockTypes.value.find(bt => 
      bt.slug === blockConfig.type || 
      bt.id === blockConfig.block_type ||
      bt.slug === blockConfig.block_type_slug
    )
    
    if (blockType) {
      console.log('Found matching block type:', blockType)
      
      const newBlock = {
        id: `block_${Date.now()}_${index}`,
        type: blockType.slug,
        block_type: blockType.id,
        content: { ...(blockConfig.content || blockConfig.data || {}) },
        sort: index
      }
      
      internalNewsletter.value.blocks!.push(newBlock)
      console.log('Added block:', newBlock)
    } else {
      console.warn('No matching block type found for:', blockConfig)
    }
  })

  // Apply template settings
  if (template.default_subject_pattern) {
    internalNewsletter.value.subject = template.default_subject_pattern
  }
  
  // Update both internal and frozen state
  emitUpdate()
  refreshPreview()
  
  console.log('Template loaded successfully, blocks count:', internalNewsletter.value.blocks?.length)
}

const getBlockType = (blockTypeSlug: string) => {
  return blockTypes.value.find(bt => bt.slug === blockTypeSlug)
}

const handleSave = async () => {
  if (saving.value) return

  saving.value = true
  try {
    if (props.onSave) {
      await props.onSave(internalNewsletter.value)
    }
    lastSaved.value = new Date()
    showNotification('Newsletter saved successfully!', 'success')
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
    refreshPreview()
    showNotification('Created new newsletter', 'info')
    emit('create', internalNewsletter.value)
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

// FIXED: Safe watcher that only updates from external changes
watch(() => props.modelValue, (newVal) => {
  if (newVal && JSON.stringify(newVal) !== JSON.stringify(internalNewsletter.value)) {
    console.log('Props changed, updating internal state:', newVal)
    initializeNewsletter(newVal)
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
  showNotification
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
  @apply flex items-center gap-2 text-gray-500 py-4;
}

.block-types-grid {
  @apply grid grid-cols-1 gap-2;
}

.block-type-button {
  @apply flex items-center gap-2 p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors;
}

.block-type-button span {
  @apply text-sm font-medium text-gray-700;
}

/* Content Panel Styles */
.content-header {
  @apply flex items-center justify-between p-4 bg-white border-b border-gray-200;
}

.content-title {
  @apply flex items-center gap-3;
}

.content-title h3 {
  @apply text-lg font-semibold text-gray-900;
}

.block-count {
  @apply px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full;
}

.content-actions {
  @apply flex items-center gap-2;
}

.content-body {
  @apply flex-1 p-4;
}

.empty-state {
  @apply text-center py-12 text-gray-500;
}

.empty-state h4 {
  @apply text-lg font-medium mt-4 mb-2 text-gray-900;
}

.empty-state p {
  @apply text-gray-600;
}

.blocks-container {
  @apply space-y-4;
}

.block-item {
  @apply transition-all duration-200 ease-in-out;
}

.block-item.is-dragging {
  @apply opacity-50 scale-95;
}

.block-item.drop-zone-active {
  @apply transform scale-102 bg-blue-50 border-blue-300 shadow-lg;
}

/* Status Bar */
.status-bar {
  @apply flex items-center justify-between p-3 bg-white border-t border-gray-200;
}

.status-left {
  @apply flex items-center gap-3;
}

.status-right {
  @apply flex items-center gap-2;
}

.status-badge {
  @apply px-2 py-1 text-xs font-medium rounded-full;
}

.status-draft {
  @apply bg-gray-100 text-gray-700;
}

.status-ready {
  @apply bg-green-100 text-green-700;
}

.status-sent {
  @apply bg-blue-100 text-blue-700;
}

.drag-indicator {
  @apply flex items-center gap-1 text-sm text-blue-600;
}

/* Modal Styles */
.modal-overlay {
  @apply fixed inset-0 bg-black/50 flex items-center justify-center z-50;
}

.modal-content {
  @apply bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden;
}

.modal-header {
  @apply flex items-center justify-between p-4 border-b border-gray-200;
}

.modal-header h3 {
  @apply text-lg font-semibold text-gray-900;
}

.modal-body {
  @apply p-4 overflow-y-auto;
}

.templates-grid {
  @apply grid grid-cols-2 gap-4;
}

.template-card {
  @apply p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors;
}

.template-preview {
  @apply w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mb-3;
}

.template-info h4 {
  @apply font-medium text-gray-900 mb-1;
}

.template-info p {
  @apply text-sm text-gray-600;
}

/* Notification */
.notification {
  @apply fixed bottom-4 right-4 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg z-50;
}

.notification-success {
  @apply bg-green-50 text-green-700 border border-green-200;
}

.notification-error {
  @apply bg-red-50 text-red-700 border border-red-200;
}

.notification-info {
  @apply bg-blue-50 text-blue-700 border border-blue-200;
}

/* Button Styles */
.btn-primary {
  @apply px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2;
}

.btn-secondary {
  @apply px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2;
}

.btn-ghost {
  @apply px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg flex items-center gap-2;
}

.btn-sm {
  @apply px-2 py-1 text-sm;
}
</style>