<template>
  <div class="newsletter-editor">
    <!-- Header -->
    <div class="editor-header">
      <div class="editor-title">
        <h2 class="text-lg font-semibold text-slate-900">Newsletter Editor</h2>
      </div>
      <div class="editor-actions">
        <button
          @click="showTemplateSelector = true"
          class="btn btn-secondary"
          :disabled="props.disabled || isTransitioning"
        >
          <Icon name="lucide:file-template" class="w-4 h-4" />
          Load Template
        </button>
        <button
          @click="togglePreview"
          class="btn btn-secondary"
          :disabled="props.disabled"
        >
          <Icon :name="showPreview ? 'lucide:eye-off' : 'lucide:eye'" class="w-4 h-4" />
          {{ showPreview ? 'Hide' : 'Show' }} Preview
        </button>
        <button
          @click="saveNewsletter"
          class="btn btn-primary"
          :disabled="props.disabled || isTransitioning"
        >
          <Icon name="lucide:save" class="w-4 h-4" />
          Save
        </button>
      </div>
    </div>

    <div class="editor-main">
      <!-- Sidebar -->
      <div class="editor-sidebar">
        <!-- Newsletter Settings -->
        <div class="sidebar-section">
          <h3 class="sidebar-title">Newsletter Settings</h3>
          <div class="form-group">
            <label class="form-label">Subject Line</label>
            <input
              v-model="subject"
              type="text"
              class="form-input"
              placeholder="Enter subject line"
              :disabled="props.disabled"
            />
          </div>
          <div class="form-group">
            <label class="form-label">Preview Text</label>
            <textarea
              v-model="preheader"
              class="form-textarea"
              rows="3"
              placeholder="Enter preview text"
              :disabled="props.disabled"
            />
          </div>
        </div>

        <!-- Block Library -->
        <div class="sidebar-section">
          <h3 class="sidebar-title">Content Blocks</h3>
          <div v-if="loading" class="loading-blocks">
            <Icon name="lucide:loader-2" class="w-5 h-5 animate-spin" />
            <span>Loading blocks...</span>
          </div>
          <div v-else-if="blockTypes.length === 0" class="empty-blocks">
            <p>No block types available</p>
          </div>
          <div v-else class="block-types-grid">
            <button
              v-for="blockType in blockTypes"
              :key="blockType.id"
              @click="handleAddBlock(blockType)"
              class="block-type-button"
              :disabled="props.disabled || isTransitioning"
            >
              <Icon :name="blockType.icon || 'lucide:square'" class="w-5 h-5" />
              <span>{{ blockType.name }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Content Area -->
      <div class="editor-content">
        <div class="content-header">
          <h3 class="content-title">Newsletter Content</h3>
          <div class="content-actions">
            <button
              v-if="blocks.length > 0"
              @click="clearBlocks"
              class="btn btn-danger-outline"
              :disabled="props.disabled || isTransitioning"
            >
              <Icon name="lucide:trash-2" class="w-4 h-4" />
              Clear All
            </button>
          </div>
        </div>

        <!-- Blocks -->
        <div class="blocks-container">
          <div v-if="blocks.length === 0" class="empty-state">
            <Icon name="lucide:layers" class="w-12 h-12" />
            <h4>No content blocks</h4>
            <p>Add blocks from the sidebar to start building your newsletter</p>
          </div>
          
          <TransitionGroup v-else name="block-list" tag="div" class="blocks-list">
            <div
              v-for="(block, index) in blocks"
              :key="block.id"
              class="block-wrapper"
            >
              <div class="block-controls">
                <div class="block-info">
                  <Icon :name="getBlockIcon(block.type)" class="w-4 h-4" />
                  <span>{{ getBlockName(block.type) }}</span>
                </div>
                <div class="block-actions">
                  <button
                    @click="moveBlockUp(index)"
                    :disabled="index === 0 || props.disabled || isTransitioning"
                    class="block-action-button"
                    title="Move up"
                  >
                    <Icon name="lucide:chevron-up" class="w-4 h-4" />
                  </button>
                  <button
                    @click="moveBlockDown(index)"
                    :disabled="index === blocks.length - 1 || props.disabled || isTransitioning"
                    class="block-action-button"
                    title="Move down"
                  >
                    <Icon name="lucide:chevron-down" class="w-4 h-4" />
                  </button>
                  <button
                    @click="duplicateBlock(block.id)"
                    :disabled="props.disabled || isTransitioning"
                    class="block-action-button"
                    title="Duplicate"
                  >
                    <Icon name="lucide:copy" class="w-4 h-4" />
                  </button>
                  <button
                    @click="removeBlock(block.id)"
                    :disabled="props.disabled || isTransitioning"
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
                  :block-type="getBlockType(block.type)"
                  :disabled="props.disabled || isTransitioning"
                  @update="handleBlockUpdate"
                />
              </div>
            </div>
          </TransitionGroup>
        </div>
      </div>

      <!-- Preview Panel -->
      <div v-if="showPreview" class="preview-panel">
        <NewsletterPreview
          ref="previewRef"
          :newsletter="previewNewsletter"
          :block-types="blockTypes"
          :device="previewDevice"
          @update:compiled="handleCompiled"
        />
      </div>
    </div>

    <!-- Notification -->
    <Transition name="notification">
      <div
        v-if="notification.show"
        :class="[
          'notification',
          notification.type === 'error' ? 'notification-error' : 'notification-success'
        ]"
      >
        <Icon 
          :name="notification.type === 'error' ? 'lucide:x-circle' : 'lucide:check-circle'" 
          class="w-5 h-5" 
        />
        <span>{{ notification.message }}</span>
        <button @click="notification.show = false" class="notification-close">
          <Icon name="lucide:x" class="w-4 h-4" />
        </button>
      </div>
    </Transition>

    <!-- Template Selection Modal -->
    <Transition name="modal">
      <div v-if="showTemplateSelector" class="modal-overlay" @click="showTemplateSelector = false">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">Choose Template</h3>
            <button @click="showTemplateSelector = false" class="modal-close">
              <Icon name="lucide:x" class="w-5 h-5" />
            </button>
          </div>
          <div class="modal-body">
            <div v-if="templates.length === 0" class="empty-templates">
              <Icon name="lucide:file-template" class="w-12 h-12 text-slate-400" />
              <p>No templates available</p>
            </div>
            <div v-else class="templates-grid">
              <button
                v-for="template in templates"
                :key="template.id"
                @click="loadTemplate(template.id)"
                class="template-card"
              >
                <div class="template-preview">
                  <Icon name="lucide:file-template" class="w-8 h-8" />
                </div>
                <div class="template-info">
                  <h4 class="template-name">{{ template.name }}</h4>
                  <p class="template-description">{{ template.description }}</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { debounce } from 'lodash'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import type { NewsletterData } from '../../types'
import { useDirectusNewsletter } from '../composables/useDirectusNewsletter'
import { useNewsletterEditor } from '../composables/useNewsletterEditor'

interface Props {
  modelValue: NewsletterData
  disabled?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits(['update:modelValue', 'save'])

// Composables
const { 
  fetchBlockTypes, 
  fetchTemplates,
  fetchTemplate
} = useDirectusNewsletter()

const {
  newsletter,
  blocks,
  subject,
  preheader,
  isTransitioning,
  addBlock: editorAddBlock,
  removeBlock: editorRemoveBlock,
  updateBlock: editorUpdateBlock,
  moveBlock: editorMoveBlock,
  duplicateBlock: editorDuplicateBlock,
  clearBlocks: editorClearBlocks,
  loadFromTemplate
} = useNewsletterEditor(props.modelValue)

// State
const blockTypes = ref<any[]>([])
const templates = ref<any[]>([])
const loading = ref(true)
const showTemplateSelector = ref(false)
const showPreview = ref(true)
const previewDevice = ref<'desktop' | 'mobile' | 'tablet'>('desktop')
const notification = ref({
  show: false,
  type: 'success',
  message: ''
})
const previewRef = ref()

// Computed
const previewNewsletter = computed(() => ({
  ...newsletter.value,
  blocks: blocks.value.map(block => ({
    ...block,
    content: { ...block.content }
  }))
}))

// Methods
const updateNewsletter = () => {
  const updatedNewsletter = {
    ...newsletter.value,
    blocks: blocks.value
  }
  emit('update:modelValue', updatedNewsletter)
}

const debouncedUpdate = debounce(updateNewsletter, 300)

const loadBlockTypes = async () => {
  try {
    loading.value = true
    blockTypes.value = await fetchBlockTypes()
  } catch (error) {
    console.error('Failed to load block types:', error)
    showNotification('Failed to load block types', 'error')
  } finally {
    loading.value = false
  }
}

const loadTemplates = async () => {
  try {
    templates.value = await fetchTemplates()
  } catch (error) {
    console.error('Failed to load templates:', error)
  }
}

const handleAddBlock = (blockType: any) => {
  const initialContent: Record<string, any> = {}
  
  if (blockType.field_visibility_config) {
    blockType.field_visibility_config.forEach((fieldKey: string) => {
      switch(fieldKey) {
        case 'title':
        case 'subtitle':
        case 'button_text':
          initialContent[fieldKey] = ''
          break
        case 'text_content':
          initialContent[fieldKey] = '<p>Enter your content here...</p>'
          break
        case 'button_url':
        case 'facebook_url':
        case 'twitter_url':
        case 'instagram_url':
        case 'linkedin_url':
        case 'youtube_url':
          initialContent[fieldKey] = '#'
          break
        case 'background_color':
          initialContent[fieldKey] = '#ffffff'
          break
        case 'text_color':
          initialContent[fieldKey] = '#333333'
          break
        case 'text_align':
          initialContent[fieldKey] = 'left'
          break
        case 'padding':
          initialContent[fieldKey] = '20px'
          break
        case 'font_size':
          initialContent[fieldKey] = '16px'
          break
        case 'image':
        case 'image_alt_text':
        case 'image_caption':
          initialContent[fieldKey] = ''
          break
        default:
          initialContent[fieldKey] = ''
      }
    })
  }
  
  const newBlock = {
    id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: blockType.slug,
    block_type: blockType.id,
    content: initialContent,
    sort: blocks.value.length
  }
  
  blocks.value.push(newBlock)
  updateNewsletter()
}

const handleBlockUpdate = (blockId: string, content: any) => {
  try {
    const blockIndex = blocks.value.findIndex(b => b.id === blockId)
    if (blockIndex !== -1) {
      blocks.value[blockIndex] = {
        ...blocks.value[blockIndex],
        content: { ...content }
      }
    }
    
    editorUpdateBlock(blockId, { content })
    updateNewsletter()
    
    // Force preview refresh
    nextTick(() => {
      if (previewRef.value?.refreshPreview) {
        previewRef.value.refreshPreview()
      }
    })
  } catch (error) {
    console.error('Error updating block:', error)
    showNotification('Failed to update block', 'error')
  }
}

const removeBlock = async (blockId: string) => {
  if (!isTransitioning.value) {
    try {
      await editorRemoveBlock(blockId)
      updateNewsletter()
      showNotification('Block removed', 'success')
    } catch (error) {
      console.error('Error removing block:', error)
      showNotification('Failed to remove block', 'error')
    }
  }
}

const moveBlockUp = async (index: number) => {
  if (index > 0 && !isTransitioning.value) {
    try {
      await editorMoveBlock(index, index - 1)
      updateNewsletter()
    } catch (error) {
      console.error('Error moving block:', error)
      showNotification('Failed to move block', 'error')
    }
  }
}

const moveBlockDown = async (index: number) => {
  if (index < blocks.value.length - 1 && !isTransitioning.value) {
    try {
      await editorMoveBlock(index, index + 1)
      updateNewsletter()
    } catch (error) {
      console.error('Error moving block:', error)
      showNotification('Failed to move block', 'error')
    }
  }
}

const duplicateBlock = async (blockId: string) => {
  if (!isTransitioning.value) {
    try {
      await editorDuplicateBlock(blockId)
      updateNewsletter()
      showNotification('Block duplicated', 'success')
    } catch (error) {
      console.error('Error duplicating block:', error)
      showNotification('Failed to duplicate block', 'error')
    }
  }
}

const clearBlocks = async () => {
  if (!isTransitioning.value && confirm('Are you sure you want to remove all blocks?')) {
    try {
      await editorClearBlocks()
      updateNewsletter()
      showNotification('All blocks removed', 'success')
    } catch (error) {
      console.error('Error clearing blocks:', error)
      showNotification('Failed to clear blocks', 'error')
    }
  }
}

const loadTemplate = async (templateId: string) => {
  if (isTransitioning.value) return
  
  try {
    const template = await fetchTemplate(templateId)
    
    // Clear existing blocks
    blocks.value = []
    
    // Parse template blocks
    let templateBlocks = []
    try {
      templateBlocks = typeof template.blocks_config === 'string' 
        ? JSON.parse(template.blocks_config)
        : template.blocks_config || []
    } catch (error) {
      console.error('Invalid template blocks_config:', error)
      showNotification('Template has invalid configuration', 'error')
      return
    }
    
    // Create new blocks with unique IDs
    templateBlocks.forEach((blockConfig: any, index: number) => {
      const blockType = blockConfig.type || blockConfig.block_type_slug || blockConfig.blockType
      
      if (!blockType) {
        console.warn('Invalid block config:', blockConfig)
        return
      }
      
      const newBlock = {
        id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${index}`,
        type: blockType,
        content: { ...(blockConfig.content || blockConfig.data || {}) },
        sort: index
      }
      
      blocks.value.push(newBlock)
    })
    
    // Apply template settings
    if (template.default_subject_pattern) {
      subject.value = template.default_subject_pattern
    }
    if (template.default_from_name) {
      newsletter.value.from_name = template.default_from_name
    }
    if (template.default_from_email) {
      newsletter.value.from_email = template.default_from_email
    }
    if (template.default_reply_to) {
      newsletter.value.reply_to = template.default_reply_to
    }
    if (template.default_category) {
      newsletter.value.category = template.default_category
    }
    
    updateNewsletter()
    showTemplateSelector.value = false
    showNotification('Template loaded successfully!', 'success')
    
    // Refresh preview after template load
    nextTick(() => {
      if (previewRef.value?.refreshPreview) {
        previewRef.value.refreshPreview()
      }
    })
  } catch (error) {
    console.error('Error loading template:', error)
    showNotification('Failed to load template', 'error')
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

const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
  notification.value = {
    show: true,
    type,
    message
  }
  
  setTimeout(() => {
    notification.value.show = false
  }, 3000)
}

const getBlockType = (slug: string) => {
  return blockTypes.value.find(bt => bt.slug === slug || bt.id === slug)
}

const getBlockIcon = (slug: string) => {
  const blockType = getBlockType(slug)
  return blockType?.icon || 'lucide:square'
}

const getBlockName = (slug: string) => {
  const blockType = getBlockType(slug)
  return blockType?.name || slug
}

// Watchers
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    newsletter.value = { ...newVal }
    blocks.value = newVal.blocks || []
  }
}, { deep: true })

watch(subject, () => {
  debouncedUpdate()
})

watch(preheader, () => {
  debouncedUpdate()
})

// Lifecycle
onMounted(async () => {
  await Promise.all([
    loadBlockTypes(),
    loadTemplates()
  ])
})
</script>

<style scoped>
@reference 'tailwindcss';
.newsletter-editor {
  @apply h-full flex flex-col bg-gray-50;
}

/* Header */
.editor-header {
  @apply flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200;
}

.editor-title h2 {
  @apply text-lg font-semibold text-gray-900;
}

.editor-actions {
  @apply flex items-center gap-3;
}

/* Buttons */
.btn {
  @apply inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors;
}

.btn:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.btn-primary {
  @apply bg-blue-600 text-white hover:bg-blue-700;
}

.btn-secondary {
  @apply bg-white text-gray-700 border border-gray-300 hover:bg-gray-50;
}

.btn-danger-outline {
  @apply text-red-600 border border-red-300 hover:bg-red-50;
}

/* Main Layout */
.editor-main {
  @apply flex-1 flex overflow-hidden;
}

/* Sidebar */
.editor-sidebar {
  @apply w-64 bg-white border-r border-gray-200 overflow-y-auto;
}

.sidebar-section {
  @apply p-4 border-b border-gray-100;
}

.sidebar-title {
  @apply text-sm font-semibold text-gray-900 mb-3;
}

/* Form Elements */
.form-group {
  @apply mb-4;
}

.form-group:last-child {
  @apply mb-0;
}

.form-label {
  @apply block text-sm font-medium text-gray-700 mb-1;
}

.form-input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
}

.form-textarea {
  @apply w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none;
}

/* Block Types Grid */
.block-types-grid {
  @apply grid grid-cols-2 gap-2;
}

.block-type-button {
  @apply flex flex-col items-center gap-2 p-3 text-center border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors;
}

.block-type-button:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.block-type-button span {
  @apply text-xs text-gray-700;
}

.loading-blocks,
.empty-blocks {
  @apply flex items-center justify-center gap-2 py-8 text-gray-500;
}

/* Content Area */
.editor-content {
  @apply flex-1 overflow-y-auto p-6;
}

.content-header {
  @apply flex items-center justify-between mb-4;
}

.content-title {
  @apply text-lg font-semibold text-gray-900;
}

/* Blocks */
.blocks-container {
  @apply min-h-[400px];
}

.empty-state {
  @apply flex flex-col items-center justify-center py-16 text-gray-400;
}

.empty-state h4 {
  @apply text-lg font-medium mt-3 mb-1;
}

.empty-state p {
  @apply text-sm;
}

.blocks-list {
  @apply space-y-4;
}

.block-wrapper {
  @apply bg-white rounded-lg border border-gray-200 overflow-hidden;
}

.block-controls {
  @apply flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200;
}

.block-info {
  @apply flex items-center gap-2 text-sm font-medium text-gray-700;
}

.block-actions {
  @apply flex items-center gap-1;
}

.block-action-button {
  @apply p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors;
}

.block-action-button:disabled {
  @apply opacity-50 cursor-not-allowed hover:bg-transparent hover:text-gray-500;
}

.block-action-button.danger {
  @apply hover:text-red-600 hover:bg-red-50;
}

.block-content {
  @apply p-4;
}

/* Preview Panel */
.preview-panel {
  @apply w-1/2 bg-gray-50 border-l border-gray-200 overflow-hidden;
}

/* Notification */
.notification {
  @apply fixed top-4 right-4 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg z-50;
}

.notification-success {
  @apply bg-green-100 text-green-800 border border-green-200;
}

.notification-error {
  @apply bg-red-100 text-red-800 border border-red-200;
}

.notification-close {
  @apply ml-2 p-1 hover:bg-black hover:bg-black/10 rounded;
}

/* Modal Styles */
.modal-overlay {
  @apply fixed inset-0 bg-black/50 flex items-center justify-center z-50;
}

.modal-content {
  @apply bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden;
}

.modal-header {
  @apply flex items-center justify-between p-4 border-b border-slate-200;
}

.modal-title {
  @apply text-lg font-semibold text-slate-900;
}

.modal-close {
  @apply p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded;
}

.modal-body {
  @apply p-4 overflow-y-auto;
}

.empty-templates {
  @apply flex flex-col items-center justify-center py-12 text-center;
}

.templates-grid {
  @apply grid grid-cols-2 gap-4;
}

.template-card {
  @apply flex flex-col items-center p-4 border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors;
}

.template-preview {
  @apply mb-3 text-slate-400;
}

.template-info {
  @apply text-center;
}

.template-name {
  @apply text-sm font-medium text-slate-900 mb-1;
}

.template-description {
  @apply text-xs text-slate-500;
}

/* Transition Styles */
.block-list-move,
.block-list-enter-active,
.block-list-leave-active {
  transition: all 0.3s ease;
}

.block-list-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.block-list-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.block-list-leave-active {
  position: absolute;
  right: 0;
  left: 0;
}

.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from,
.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>