<!-- NewsletterStudio.vue - Bulletproof recursion fix -->
<template>
  <div class="newsletter-studio" :class="{ 'dark-mode': darkMode }">
    <!-- Header Bar -->
    <header v-if="showHeader" class="studio-header">
      <div class="header-content">
        <div class="header-title">
          <h1>{{ title }}</h1>
          <div v-if="newsletter.id" class="newsletter-meta">
            <span class="newsletter-id">ID: {{ newsletter.id }}</span>
            <span v-if="lastSaved" class="last-saved">
              Saved {{ formatRelativeTime(lastSaved) }}
            </span>
          </div>
        </div>
        
        <div class="header-actions">
          <slot name="header-actions">
            <button @click="handleNew" class="action-button secondary">
              <Icon name="lucide:file-plus" class="w-4 h-4" />
              New
            </button>
            
            <button @click="loadTemplates" class="action-button secondary">
              <Icon name="lucide:layout-template" class="w-4 h-4" />
              Templates
            </button>
            
            <button 
              @click="handleSave" 
              :disabled="saving"
              class="action-button primary"
            >
              <Icon :name="saving ? 'lucide:loader-2' : 'lucide:save'" 
                    :class="['w-4 h-4', { 'animate-spin': saving }]" />
              {{ saving ? 'Saving...' : 'Save' }}
            </button>
          </slot>
        </div>
      </div>
    </header>

    <!-- Main Content - Three Panel Layout -->
    <div class="studio-content">
      <!-- Panel 1: Settings & Block Types (Narrow Left) -->
      <div v-if="showEditor" class="left-panel">
        <!-- Newsletter Settings -->
        <div class="settings-section">
          <h3 class="panel-title">Newsletter Settings</h3>
          
          <div class="form-group">
            <label for="subject">Subject Line</label>
            <input
              id="subject"
              v-model="newsletter.subject"
              type="text"
              class="form-input"
              placeholder="Enter subject line"
              @input="handleSubjectChange"
            />
          </div>

          <div class="form-group">
            <label for="preheader">Preview Text</label>
            <input
              id="preheader"
              v-model="newsletter.preheader"
              type="text"
              class="form-input"
              placeholder="Enter preview text"
              @input="handlePreheaderChange"
            />
          </div>
        </div>

        <!-- Block Types -->
        <div class="block-types-section">
          <div class="section-header">
            <h3 class="panel-title">Add Blocks</h3>
            <button @click="loadTemplates" class="btn-icon" title="Load template">
              <Icon name="lucide:layout-template" class="w-4 h-4" />
            </button>
          </div>
          
          <div v-if="loadingBlockTypes" class="loading-state">
            <Icon name="lucide:loader-2" class="w-4 h-4 animate-spin" />
            <span>Loading blocks...</span>
          </div>
          
          <div v-else-if="blockTypes.length === 0" class="empty-state">
            <Icon name="lucide:alert-triangle" class="w-5 h-5 text-amber-500" />
            <span>No block types available</span>
          </div>
          
          <div v-else class="block-types-grid">
            <button 
              v-for="blockType in blockTypes" 
              :key="blockType.id"
              @click="handleAddBlock(blockType)"
              class="block-type-button"
              :title="`Add ${blockType.name} block`"
            >
              <Icon :name="blockType.icon || 'lucide:plus'" class="w-4 h-4" />
              <span class="block-type-name">{{ blockType.name }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Panel 2: Content Editor (Middle) -->
      <div v-if="showEditor" class="content-panel">
        <div class="content-header">
          <h3 class="panel-title">Newsletter Content</h3>
          <div class="content-actions">
            <span class="block-count">{{ newsletter.blocks?.length || 0 }} blocks</span>
            <button 
              v-if="newsletter.blocks?.length > 0"
              @click="clearAllBlocks"
              class="btn-clear"
              title="Clear all blocks"
            >
              <Icon name="lucide:trash-2" class="w-4 h-4" />
            </button>
          </div>
        </div>

        <div class="content-body">
          <div v-if="!newsletter.blocks?.length" class="empty-content">
            <Icon name="lucide:plus-circle" class="w-8 h-8 text-gray-400" />
            <p>No blocks added yet</p>
            <small>Choose a block type from the left panel</small>
          </div>

          <div v-else class="blocks-list">
            <NewsletterBlock
              v-for="(block, index) in newsletter.blocks"
              :key="block.id"
              :block="block"
              :block-type="getBlockType(block.type)"
              :index="index"
              :total-blocks="newsletter.blocks.length"
              @update="handleUpdateBlock"
              @remove="handleRemoveBlock"
              @move="handleMoveBlock"
              @duplicate="handleDuplicateBlock"
            />
          </div>
        </div>
      </div>

      <!-- Panel 3: Preview (Right) -->
      <div v-if="showPreview" class="preview-panel">
        <NewsletterPreview
          ref="previewRef"
          :newsletter="frozenNewsletter"
          :block-types="blockTypes"
          :device="defaultDevice"
          @error="handlePreviewError"
        />
      </div>
    </div>

    <!-- Status Bar -->
    <footer v-if="showStatusBar" class="studio-status">
      <div class="status-info">
        <slot name="status-left">
          <span v-if="newsletter.id" class="status-item">
            ID: {{ newsletter.id }}
          </span>
          <span class="status-item">
            {{ newsletter.blocks?.length || 0 }} blocks
          </span>
          <span v-if="lastSaved" class="status-item">
            Saved {{ formatRelativeTime(lastSaved) }}
          </span>
        </slot>
      </div>
      
      <div class="status-actions">
        <slot name="status-right">
          <button 
            @click="refreshPreview" 
            class="status-button refresh-preview"
            title="Refresh preview to see latest changes"
          >
            <Icon name="lucide:refresh-cw" class="w-4 h-4" />
            Update Preview
          </button>
        </slot>
      </div>
    </footer>

    <!-- Template Selector Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showTemplateSelector" class="template-modal" @click="showTemplateSelector = false">
          <div class="template-modal-content" @click.stop>
            <div class="template-modal-header">
              <h3>Choose Template</h3>
              <button @click="showTemplateSelector = false" class="close-button">
                <Icon name="lucide:x" class="w-5 h-5" />
              </button>
            </div>
            
            <div class="template-modal-body">
              <div v-if="templates.length === 0" class="empty-templates">
                <Icon name="lucide:layout-template" class="w-12 h-12 text-gray-300" />
                <p>No templates available</p>
                <button @click="showTemplateSelector = false" class="action-button secondary">
                  Close
                </button>
              </div>
              
              <div v-else class="templates-grid">
                <div
                  v-for="template in templates"
                  :key="template.id"
                  @click="handleTemplateSelect(template)"
                  class="template-card"
                >
                  <div class="template-preview">
                    <Icon name="lucide:file-text" class="w-8 h-8" />
                  </div>
                  <div class="template-info">
                    <h4>{{ template.name }}</h4>
                    <p>{{ template.description || 'No description' }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Notification Toast -->
    <Transition name="notification">
      <div v-if="notification.show" class="notification-toast" :class="notification.type">
        <Icon :name="notificationIcon" class="w-5 h-5" />
        <span>{{ notification.message }}</span>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { debounce } from 'lodash-es'
import { computed, onMounted, provide, ref, watch } from 'vue'

// Types
interface NewsletterData {
  id?: string
  subject?: string
  preheader?: string
  blocks?: any[]
  status?: string
  [key: string]: any
}

interface Props {
  modelValue?: NewsletterData
  
  // UI Configuration
  title?: string
  layout?: 'horizontal' | 'vertical' | 'editor-only' | 'preview-only'
  showHeader?: boolean
  showStatusBar?: boolean
  showEditor?: boolean
  showPreview?: boolean
  resizable?: boolean
  darkMode?: boolean
  
  // Editor Configuration
  editorWidth?: string
  devices?: ('mobile' | 'tablet')[]
  defaultDevice?: 'mobile' | 'tablet'
  
  // API Configuration
  autoSave?: boolean
  autoSaveDelay?: number
  
  // Callbacks
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

// Core state
const newsletter = ref<NewsletterData>(props.modelValue || {
  subject: '',
  preheader: '',
  blocks: [],
  status: 'draft'
})

// FIXED: Separate frozen newsletter for preview to prevent circular updates
const frozenNewsletter = ref<NewsletterData>({ ...newsletter.value })

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

// Computed
const notificationIcon = computed(() => {
  switch (notification.value.type) {
    case 'success': return 'lucide:check-circle'
    case 'error': return 'lucide:x-circle'
    case 'info': return 'lucide:info'
    default: return 'lucide:info'
  }
})

// FIXED: Simple, direct emit without debouncing for immediate actions
const emitUpdate = () => {
  emit('update:modelValue', newsletter.value)
  setupAutoSave()
}

// FIXED: Debounced update only for content changes
const debouncedEmitUpdate = debounce(() => {
  emit('update:modelValue', newsletter.value)
  setupAutoSave()
}, 300)

// FIXED: Manual refresh function for preview
const refreshPreview = () => {
  // Update frozen newsletter with current data
  frozenNewsletter.value = JSON.parse(JSON.stringify(newsletter.value))
  // Trigger preview refresh
  previewRef.value?.refreshPreview()
}

// Methods
const loadBlockTypes = async () => {
  try {
    loadingBlockTypes.value = true
    blockTypes.value = await fetchBlockTypes()
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
  } catch (error) {
    console.error('Failed to load templates:', error)
    showNotification('Failed to load templates', 'error')
  }
}

// FIXED: Completely separate input handlers
const handleSubjectChange = () => {
  debouncedEmitUpdate()
}

const handlePreheaderChange = () => {
  debouncedEmitUpdate()
}

// FIXED: Block operations with direct emit
const handleAddBlock = (blockType: any) => {
  const newBlock = {
    id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: blockType.slug,
    block_type: blockType.id,
    content: generateDefaultContent(blockType),
    sort: newsletter.value.blocks?.length || 0
  }

  if (!newsletter.value.blocks) {
    newsletter.value.blocks = []
  }
  
  newsletter.value.blocks.push(newBlock)
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
      image_alt_text: 'Image description',
      caption: ''
    }
  }
  
  return defaults[blockType.slug] || {}
}

const handleUpdateBlock = (updatedBlock: any) => {
  const index = newsletter.value.blocks?.findIndex(b => b.id === updatedBlock.id)
  if (index !== -1 && newsletter.value.blocks) {
    newsletter.value.blocks[index] = { ...newsletter.value.blocks[index], ...updatedBlock }
    debouncedEmitUpdate()
  }
}

const handleRemoveBlock = (blockId: string) => {
  if (newsletter.value.blocks) {
    newsletter.value.blocks = newsletter.value.blocks.filter(b => b.id !== blockId)
    // Re-sort remaining blocks
    newsletter.value.blocks.forEach((block, index) => {
      block.sort = index
    })
    emitUpdate()
    showNotification('Block removed', 'info')
  }
}

const handleMoveBlock = (fromIndex: number, toIndex: number) => {
  if (!newsletter.value.blocks || toIndex < 0 || toIndex >= newsletter.value.blocks.length) {
    return
  }

  const blocks = [...newsletter.value.blocks]
  const [movedBlock] = blocks.splice(fromIndex, 1)
  blocks.splice(toIndex, 0, movedBlock)
  
  // Update sort values
  blocks.forEach((block, index) => {
    block.sort = index
  })
  
  newsletter.value.blocks = blocks
  emitUpdate()
}

const handleDuplicateBlock = (blockId: string) => {
  const originalBlock = newsletter.value.blocks?.find(b => b.id === blockId)
  if (originalBlock) {
    const duplicatedBlock = {
      ...originalBlock,
      id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: { ...originalBlock.content }
    }
    
    const originalIndex = newsletter.value.blocks!.findIndex(b => b.id === blockId)
    newsletter.value.blocks!.splice(originalIndex + 1, 0, duplicatedBlock)
    
    // Re-sort blocks
    newsletter.value.blocks!.forEach((block, index) => {
      block.sort = index
    })
    
    emitUpdate()
    showNotification('Block duplicated', 'success')
  }
}

const clearAllBlocks = () => {
  if (confirm('Remove all blocks? This action cannot be undone.')) {
    newsletter.value.blocks = []
    emitUpdate()
    showNotification('All blocks removed', 'info')
  }
}

const handleTemplateSelect = async (template: any) => {
  try {
    const fullTemplate = await fetchTemplate(template.id)
    loadFromTemplate(fullTemplate)
    showTemplateSelector.value = false
    showNotification('Template loaded successfully!', 'success')
  } catch (error) {
    console.error('Error loading template:', error)
    showNotification('Failed to load template', 'error')
  }
}

const loadFromTemplate = (template: any) => {
  if (!template) return

  // Clear existing blocks
  newsletter.value.blocks = []

  // Parse template blocks
  let templateBlocks: any[] = []
  try {
    templateBlocks = Array.isArray(template.blocks_config)
      ? template.blocks_config
      : JSON.parse(template.blocks_config || '[]')
  } catch (error) {
    console.error('Invalid template blocks_config:', error)
    return
  }

  // Create blocks from template
  templateBlocks.forEach((blockConfig: any, index: number) => {
    const blockType = blockTypes.value.find(bt => 
      bt.slug === blockConfig.type || bt.id === blockConfig.block_type
    )
    
    if (blockType) {
      const newBlock = {
        id: `block_${Date.now()}_${index}`,
        type: blockType.slug,
        block_type: blockType.id,
        content: { ...(blockConfig.content || {}) },
        sort: index
      }
      newsletter.value.blocks!.push(newBlock)
    }
  })

  // Apply template settings
  if (template.default_subject_pattern) {
    newsletter.value.subject = template.default_subject_pattern
  }
  
  emitUpdate()
}

const getBlockType = (blockTypeSlug: string) => {
  return blockTypes.value.find(bt => bt.slug === blockTypeSlug)
}

const handleSave = async () => {
  if (saving.value) return

  saving.value = true
  try {
    if (props.onSave) {
      await props.onSave(newsletter.value)
    }
    lastSaved.value = new Date()
    showNotification('Newsletter saved successfully!', 'success')
    emit('save', newsletter.value)
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
    newsletter.value = {
      subject: '',
      preheader: '',
      blocks: [],
      status: 'draft'
    }
    lastSaved.value = null
    emitUpdate()
    showNotification('Created new newsletter', 'info')
    emit('create', newsletter.value)
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
      if (newsletter.value.id) {
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

// FIXED: Simple watcher that only updates from external props
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    newsletter.value = { ...newVal }
    frozenNewsletter.value = { ...newVal }
  }
}, { immediate: true })

// Lifecycle
onMounted(() => {
  loadBlockTypes()
})

// Provide context for child components
provide('newsletterStudio', {
  newsletter,
  blockTypes,
  saving,
  showNotification
})

// Expose methods for parent components
defineExpose({
  save: handleSave,
  refresh: refreshPreview,
  getNewsletter: () => newsletter.value
})
</script>

<style scoped>
@reference 'tailwindcss';
/* Studio Container */
.newsletter-studio {
  @apply h-full flex flex-col bg-white;
}

.dark-mode {
  @apply bg-gray-900 text-white;
}

/* Header */
.studio-header {
  @apply flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4;
}

.dark-mode .studio-header {
  @apply bg-gray-800 border-gray-700;
}

.header-content {
  @apply flex items-center justify-between;
}

.header-title h1 {
  @apply text-xl font-semibold text-gray-900;
}

.dark-mode .header-title h1 {
  @apply text-white;
}

.newsletter-meta {
  @apply flex items-center gap-3 mt-1 text-sm text-gray-600;
}

.dark-mode .newsletter-meta {
  @apply text-gray-300;
}

.header-actions {
  @apply flex items-center gap-2;
}

/* Action Buttons */
.action-button {
  @apply flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors;
}

.action-button.primary {
  @apply bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed;
}

.action-button.secondary {
  @apply bg-white text-gray-700 border border-gray-300 hover:bg-gray-50;
}

.dark-mode .action-button.secondary {
  @apply bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700;
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

.dark-mode .left-panel,
.dark-mode .content-panel,
.dark-mode .preview-panel {
  @apply bg-gray-800 border-gray-700;
}

.dark-mode .content-panel {
  @apply bg-gray-900;
}

/* Left Panel Styles */
.settings-section {
  @apply p-4 border-b border-gray-200;
}

.dark-mode .settings-section {
  @apply border-gray-700;
}

.block-types-section {
  @apply p-4;
}

.section-header {
  @apply flex items-center justify-between mb-3;
}

.panel-title {
  @apply text-sm font-semibold text-gray-900;
}

.dark-mode .panel-title {
  @apply text-white;
}

.btn-icon {
  @apply p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded;
}

.dark-mode .btn-icon {
  @apply text-gray-500 hover:text-gray-300 hover:bg-gray-700;
}

.form-group {
  @apply mb-3;
}

.form-group label {
  @apply block text-xs font-medium text-gray-700 mb-1;
}

.dark-mode .form-group label {
  @apply text-gray-300;
}

.form-input {
  @apply w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500;
}

.dark-mode .form-input {
  @apply bg-gray-700 border-gray-600 text-white;
}

.loading-state, .empty-state {
  @apply flex items-center gap-2 text-sm text-gray-600 py-3;
}

.dark-mode .loading-state,
.dark-mode .empty-state {
  @apply text-gray-400;
}

.block-types-grid {
  @apply space-y-1;
}

.block-type-button {
  @apply w-full flex items-center gap-2 p-2 text-left text-sm bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 transition-colors;
}

.dark-mode .block-type-button {
  @apply bg-gray-700 hover:bg-gray-600 border-gray-600;
}

.block-type-name {
  @apply text-gray-900 font-medium;
}

.dark-mode .block-type-name {
  @apply text-white;
}

/* Content Panel Styles */
.content-header {
  @apply flex items-center justify-between p-4 bg-white border-b border-gray-200;
}

.dark-mode .content-header {
  @apply bg-gray-800 border-gray-700;
}

.content-actions {
  @apply flex items-center gap-2;
}

.block-count {
  @apply text-xs text-gray-600;
}

.dark-mode .block-count {
  @apply text-gray-400;
}

.btn-clear {
  @apply p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded;
}

.dark-mode .btn-clear {
  @apply hover:text-red-400 hover:bg-red-900;
}

.content-body {
  @apply p-4;
}

.empty-content {
  @apply flex flex-col items-center justify-center py-12 text-center text-gray-500;
}

.dark-mode .empty-content {
  @apply text-gray-400;
}

.empty-content p {
  @apply mt-2 font-medium;
}

.empty-content small {
  @apply mt-1 text-xs;
}

.blocks-list {
  @apply space-y-3;
}

/* Status Bar */
.studio-status {
  @apply flex items-center justify-between px-4 py-2 border-t border-gray-200 bg-gray-50 text-sm;
}

.dark-mode .studio-status {
  @apply border-gray-700 bg-gray-800;
}

.status-info {
  @apply flex items-center gap-4;
}

.status-item {
  @apply text-gray-600;
}

.dark-mode .status-item {
  @apply text-gray-300;
}

.status-actions {
  @apply flex items-center gap-2;
}

.status-button {
  @apply flex items-center gap-2 px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors;
}

.refresh-preview {
  @apply border border-blue-200;
}

.dark-mode .status-button {
  @apply text-blue-400 bg-blue-900 hover:bg-blue-800 border-blue-700;
}

/* Template Modal */
.template-modal {
  @apply fixed inset-0 bg-black/50 flex items-center justify-center z-50;
}

.template-modal-content {
  @apply bg-white rounded-lg shadow-xl max-w-4xl max-h-full overflow-hidden;
}

.dark-mode .template-modal-content {
  @apply bg-gray-800;
}

.template-modal-header {
  @apply flex items-center justify-between p-4 border-b border-gray-200;
}

.dark-mode .template-modal-header {
  @apply border-gray-700;
}

.template-modal-header h3 {
  @apply text-lg font-semibold;
}

.close-button {
  @apply p-2 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100;
}

.dark-mode .close-button {
  @apply text-gray-400 hover:text-gray-200 hover:bg-gray-700;
}

.template-modal-body {
  @apply p-4 max-h-96 overflow-y-auto;
}

.empty-templates {
  @apply text-center text-gray-500 py-8;
}

.dark-mode .empty-templates {
  @apply text-gray-400;
}

.templates-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4;
}

.template-card {
  @apply p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors;
}

.dark-mode .template-card {
  @apply border-gray-700 hover:bg-gray-700;
}

.template-preview {
  @apply flex items-center justify-center h-20 bg-gray-100 rounded mb-3;
}

.dark-mode .template-preview {
  @apply bg-gray-700;
}

.template-info h4 {
  @apply font-medium text-gray-900 mb-1;
}

.dark-mode .template-info h4 {
  @apply text-white;
}

.template-info p {
  @apply text-sm text-gray-600;
}

.dark-mode .template-info p {
  @apply text-gray-300;
}

/* Notification Toast */
.notification-toast {
  @apply fixed top-4 right-4 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg z-50;
}

.notification-toast.success {
  @apply bg-green-100 text-green-800 border border-green-200;
}

.notification-toast.error {
  @apply bg-red-100 text-red-800 border border-red-200;
}

.notification-toast.info {
  @apply bg-blue-100 text-blue-800 border border-blue-200;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .studio-content {
    @apply flex-col;
  }
  
  .left-panel {
    @apply w-full h-auto border-r-0 border-b border-gray-200;
  }
  
  .content-panel {
    @apply border-r-0 border-b border-gray-200;
  }
  
  .preview-panel {
    @apply min-h-96;
  }
}

/* Transitions */
.modal-enter-active, .modal-leave-active {
  transition: opacity 0.3s;
}

.modal-enter-from, .modal-leave-to {
  opacity: 0;
}

.notification-enter-active, .notification-leave-active {
  transition: all 0.3s;
}

.notification-enter-from, .notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>