<!-- NewsletterStudio.vue - Improved three-panel layout -->
<template>
  <div class="newsletter-studio" :class="[`layout-${layout}`, { 'dark-mode': darkMode }]">
    <!-- Header Bar -->
    <header v-if="showHeader" class="studio-header">
      <div class="header-content">
        <div class="header-title">
          <slot name="header-title">
            <h1>{{ title }}</h1>
          </slot>
        </div>
        
        <div class="header-actions">
          <slot name="header-actions">
            <button @click="handleNew" class="btn btn-secondary">
              <Icon name="lucide:plus" />
              New
            </button>
            <button @click="handleSave" class="btn btn-primary" :disabled="saving">
              <Icon name="lucide:save" />
              {{ saving ? 'Saving...' : 'Save' }}
            </button>
          </slot>
        </div>
      </div>
    </header>

    <!-- Main Content - Three Panel Layout -->
    <div class="studio-content">
      <!-- Left Panel: Settings & Block Types -->
      <div class="settings-blocks-panel">
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
              @input="debouncedUpdate"
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
              @input="debouncedUpdate"
            />
          </div>
        </div>

        <!-- Block Types -->
        <div class="block-types-section">
          <div class="section-header">
            <h3 class="panel-title">Block Types</h3>
            <button @click="loadTemplates" class="btn btn-xs btn-secondary">
              <Icon name="lucide:layout-template" class="w-3 h-3" />
              Templates
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
              :title="blockType.description"
            >
              <Icon :name="blockType.icon || 'lucide:square'" class="w-4 h-4" />
              <span>{{ blockType.name }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Middle Panel: Content Blocks -->
      <div class="content-blocks-panel">
        <div class="panel-header">
          <h3 class="panel-title">Content Blocks</h3>
          <div class="panel-actions">
            <span class="block-count">{{ newsletter.blocks?.length || 0 }} blocks</span>
            <button @click="clearAllBlocks" v-if="newsletter.blocks?.length > 0" class="btn btn-xs btn-secondary">
              <Icon name="lucide:trash-2" class="w-3 h-3" />
              Clear All
            </button>
          </div>
        </div>

        <div class="blocks-container">
          <div v-if="!newsletter.blocks || newsletter.blocks.length === 0" class="empty-blocks">
            <Icon name="lucide:plus-circle" class="w-12 h-12 text-gray-300" />
            <h4>No content blocks yet</h4>
            <p>Select a block type from the left panel to add your first block.</p>
          </div>
          
          <div v-else class="blocks-list">
            <NewsletterBlock
              v-for="(block, index) in newsletter.blocks"
              :key="block.id"
              :block="block"
              :block-type="getBlockType(block.type)"
              @update="handleUpdateBlock"
            >
              <template #actions>
                <div class="block-actions">
                  <button 
                    v-if="index > 0"
                    @click="handleMoveBlock(index, index - 1)"
                    class="action-btn"
                    title="Move up"
                  >
                    <Icon name="lucide:chevron-up" class="w-4 h-4" />
                  </button>
                  
                  <button 
                    v-if="index < newsletter.blocks.length - 1"
                    @click="handleMoveBlock(index, index + 1)"
                    class="action-btn"
                    title="Move down"
                  >
                    <Icon name="lucide:chevron-down" class="w-4 h-4" />
                  </button>
                  
                  <button 
                    @click="handleDuplicateBlock(block.id)"
                    class="action-btn"
                    title="Duplicate"
                  >
                    <Icon name="lucide:copy" class="w-4 h-4" />
                  </button>
                  
                  <button 
                    @click="handleRemoveBlock(block.id)"
                    class="action-btn remove-btn"
                    title="Remove"
                  >
                    <Icon name="lucide:trash-2" class="w-4 h-4" />
                  </button>
                </div>
              </template>
            </NewsletterBlock>
          </div>
        </div>
      </div>

      <!-- Right Panel: Preview -->
      <div class="preview-panel">
        <NewsletterPreview
          ref="previewRef"
          :newsletter="newsletter"
          :block-types="blockTypes"
          @error="handlePreviewError"
        />
      </div>
    </div>

    <!-- Template Loading Modal (Simple) -->
    <Teleport to="body" v-if="showTemplateSelector">
      <div class="modal-overlay" @click="showTemplateSelector = false">
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <h2 class="modal-title">Choose a Template</h2>
            <button @click="showTemplateSelector = false" class="close-button">
              <Icon name="lucide:x" class="w-5 h-5" />
            </button>
          </div>

          <div class="modal-content">
            <div v-if="templates.length === 0" class="empty-state">
              <Icon name="lucide:layout-template" class="w-12 h-12 text-gray-300" />
              <p>No templates available</p>
              <button @click="showTemplateSelector = false" class="btn btn-secondary">
                Close
              </button>
            </div>
            
            <div v-else class="templates-grid">
              <button
                v-for="template in templates"
                :key="template.id"
                @click="handleTemplateSelect(template)"
                class="template-card"
              >
                <div class="template-info">
                  <h3 class="template-name">{{ template.name }}</h3>
                  <p v-if="template.description" class="template-description">
                    {{ template.description }}
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

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
          <button @click="toggleLayout" class="status-btn">
            <Icon :name="layout === 'horizontal' ? 'lucide:columns' : 'lucide:rows'" />
          </button>
        </slot>
      </div>
    </footer>

    <!-- Notifications -->
    <Teleport to="body">
      <Transition name="notification">
        <div
          v-if="notification.show"
          :class="['notification', `notification-${notification.type}`]"
        >
          <Icon :name="notificationIcon" />
          <span>{{ notification.message }}</span>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { debounce } from 'lodash-es'
import { computed, onMounted, provide, ref, watch } from 'vue'
import type { NewsletterData } from '../../types'

interface Props {
  // Initial newsletter data
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
  debouncedUpdate()
  showNotification(`Added ${blockType.name} block`, 'success')
}

const generateDefaultContent = (blockType: any) => {
  // Generate sensible defaults based on block type
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
    debouncedUpdate()
  }
}

const handleRemoveBlock = (blockId: string) => {
  if (newsletter.value.blocks) {
    newsletter.value.blocks = newsletter.value.blocks.filter(b => b.id !== blockId)
    // Re-sort remaining blocks
    newsletter.value.blocks.forEach((block, index) => {
      block.sort = index
    })
    debouncedUpdate()
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
  debouncedUpdate()
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
    
    debouncedUpdate()
    showNotification('Block duplicated', 'success')
  }
}

const clearAllBlocks = () => {
  if (confirm('Remove all blocks? This action cannot be undone.')) {
    newsletter.value.blocks = []
    debouncedUpdate()
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
  
  debouncedUpdate()
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

const debouncedUpdate = debounce(() => {
  emit('update:modelValue', newsletter.value)
  setupAutoSave()
}, 300)

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

const toggleLayout = () => {
  // Layout toggle functionality if needed
}

const notificationIcon = computed(() => {
  switch (notification.value.type) {
    case 'success': return 'lucide:check-circle'
    case 'error': return 'lucide:x-circle'
    case 'info': return 'lucide:info'
    default: return 'lucide:info'
  }
})

// Watchers
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    newsletter.value = newVal
  }
}, { deep: true })

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
  refresh: () => previewRef.value?.refreshPreview(),
  getNewsletter: () => newsletter.value,
  showNotification
})
</script>

<style scoped>
@reference 'tailwindcss';
.newsletter-studio {
  @apply h-screen flex flex-col bg-gray-50;
}

.newsletter-studio.dark-mode {
  @apply bg-gray-900;
}

/* Header */
.studio-header {
  @apply bg-white border-b border-gray-200 px-6 py-4;
}

.dark-mode .studio-header {
  @apply bg-gray-800 border-gray-700;
}

.header-content {
  @apply flex items-center justify-between;
}

.header-title h1 {
  @apply text-2xl font-bold text-gray-900;
}

.dark-mode .header-title h1 {
  @apply text-white;
}

.header-actions {
  @apply flex items-center gap-3;
}

/* Three Panel Layout */
.studio-content {
  @apply flex-1 flex overflow-hidden;
}

.settings-blocks-panel {
  @apply w-80 bg-white border-r border-gray-200 overflow-y-auto;
}

.content-blocks-panel {
  @apply flex-1 bg-white border-r border-gray-200 overflow-y-auto;
}

.preview-panel {
  @apply flex-1 bg-white overflow-hidden flex flex-col;
}

.dark-mode .settings-blocks-panel,
.dark-mode .content-blocks-panel,
.dark-mode .preview-panel {
  @apply bg-gray-800;
}

/* Panel Headers */
.panel-header {
  @apply flex items-center justify-between p-4 border-b border-gray-200;
}

.dark-mode .panel-header {
  @apply border-gray-700;
}

.panel-title {
  @apply text-lg font-semibold text-gray-900;
}

.dark-mode .panel-title {
  @apply text-white;
}

.panel-actions {
  @apply flex items-center gap-2;
}

.block-count {
  @apply text-sm text-gray-600;
}

.dark-mode .block-count {
  @apply text-gray-400;
}

/* Settings Section */
.settings-section {
  @apply p-4 border-b border-gray-200;
}

.dark-mode .settings-section {
  @apply border-gray-700;
}

.form-group {
  @apply mb-4;
}

.form-group label {
  @apply block text-sm font-medium text-gray-700 mb-1;
}

.dark-mode .form-group label {
  @apply text-gray-300;
}

.form-input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.dark-mode .form-input {
  @apply bg-gray-700 border-gray-600 text-white;
}

/* Block Types Section */
.block-types-section {
  @apply p-4;
}

.section-header {
  @apply flex items-center justify-between mb-3;
}

.block-types-grid {
  @apply space-y-2;
}

.block-type-button {
  @apply w-full flex items-center gap-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors;
}

.dark-mode .block-type-button {
  @apply border-gray-600 hover:bg-gray-700 hover:border-blue-500 text-white;
}

.block-type-button span {
  @apply text-sm font-medium;
}

/* Content Blocks Panel */
.blocks-container {
  @apply p-4;
}

.empty-blocks {
  @apply flex flex-col items-center justify-center py-12 text-center;
}

.empty-blocks h4 {
  @apply text-lg font-medium text-gray-900 mt-4;
}

.dark-mode .empty-blocks h4 {
  @apply text-white;
}

.empty-blocks p {
  @apply text-gray-600 mt-2;
}

.dark-mode .empty-blocks p {
  @apply text-gray-400;
}

.blocks-list {
  @apply space-y-4;
}

/* Loading and Empty States */
.loading-state, .empty-state {
  @apply flex items-center gap-2 text-sm text-gray-600 py-3;
}

.dark-mode .loading-state,
.dark-mode .empty-state {
  @apply text-gray-400;
}

/* Buttons */
.btn {
  @apply inline-flex items-center gap-2 px-3 py-2 rounded-md font-medium transition-colors;
}

.btn-primary {
  @apply bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50;
}

.btn-secondary {
  @apply bg-gray-100 text-gray-700 hover:bg-gray-200;
}

.btn-xs {
  @apply px-2 py-1 text-xs;
}

.dark-mode .btn-secondary {
  @apply bg-gray-700 text-gray-200 hover:bg-gray-600;
}

/* Status Bar */
.studio-status {
  @apply bg-white border-t border-gray-200 px-6 py-2 flex items-center justify-between text-sm;
}

.dark-mode .studio-status {
  @apply bg-gray-800 border-gray-700 text-gray-300;
}

.status-info {
  @apply flex items-center gap-4 text-gray-600;
}

.dark-mode .status-info {
  @apply text-gray-400;
}

.status-item {
  @apply flex items-center gap-1;
}

.status-btn {
  @apply p-1 rounded hover:bg-gray-100 transition-colors;
}

.dark-mode .status-btn {
  @apply hover:bg-gray-700;
}

/* Notifications */
.notification {
  @apply fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50;
}

.notification-success {
  @apply bg-green-50 text-green-800;
}

.notification-error {
  @apply bg-red-50 text-red-800;
}

.notification-info {
  @apply bg-blue-50 text-blue-800;
}

.notification-enter-active,
.notification-leave-active {
  @apply transition-all duration-300;
}

.notification-enter-from,
.notification-leave-to {
  @apply translate-x-full opacity-0;
}

/* Simple Modal Styles */
.modal-overlay {
  @apply fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4;
}

.modal-container {
  @apply bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col;
}

.dark-mode .modal-container {
  @apply bg-gray-800;
}

.modal-header {
  @apply flex items-center justify-between p-6 border-b border-gray-200;
}

.dark-mode .modal-header {
  @apply border-gray-700;
}

.modal-title {
  @apply text-xl font-bold text-gray-900;
}

.dark-mode .modal-title {
  @apply text-white;
}

.close-button {
  @apply p-2 rounded-lg hover:bg-gray-100 transition-colors;
}

.dark-mode .close-button {
  @apply hover:bg-gray-700 text-gray-300;
}

.modal-content {
  @apply flex-1 overflow-auto p-6;
}

.templates-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-4;
}

.template-card {
  @apply p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all text-left;
}

.dark-mode .template-card {
  @apply border-gray-600 hover:border-blue-500;
}

.template-info {
  @apply space-y-2;
}

.template-name {
  @apply font-semibold text-gray-900;
}

.dark-mode .template-name {
  @apply text-white;
}

.template-description {
  @apply text-sm text-gray-600;
}

.dark-mode .template-description {
  @apply text-gray-400;
}

.empty-state {
  @apply flex flex-col items-center justify-center py-12 text-center;
}

.empty-state p {
  @apply text-gray-600 mt-4 mb-6;
}

.dark-mode .empty-state p {
  @apply text-gray-400;
}

/* Block Actions */
.block-actions {
  @apply flex items-center gap-1;
}

.action-btn {
  @apply p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors;
}

.action-btn.remove-btn:hover {
  @apply text-red-600 bg-red-50;
}

.dark-mode .action-btn {
  @apply text-gray-400 hover:text-white hover:bg-gray-600;
}

.dark-mode .action-btn.remove-btn:hover {
  @apply text-red-400 bg-red-900;
}
</style>