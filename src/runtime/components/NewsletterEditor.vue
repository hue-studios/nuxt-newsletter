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

        <!-- Block Types -->
        <div class="sidebar-section">
          <h3 class="sidebar-title">Content Blocks</h3>
          <div v-if="loadingBlockTypes" class="loading-state">
            <Icon name="lucide:loader-2" class="w-5 h-5 animate-spin" />
            <span>Loading blocks...</span>
          </div>
          <div v-else class="block-types-grid">
            <template v-for="category in blockCategories" :key="category">
              <div class="block-category">
                <h4 class="block-category-title">{{ category }}</h4>
                <div class="block-type-buttons">
                  <button
                    v-for="blockType in blockTypes.filter(bt => bt.category === category)"
                    :key="blockType.id"
                    @click="addBlock(blockType.id)"
                    :disabled="props.disabled || isTransitioning"
                    class="block-type-button"
                    :title="blockType.description"
                  >
                    <Icon :name="blockType.icon" class="w-4 h-4" />
                    <span>{{ blockType.name }}</span>
                  </button>
                </div>
              </div>
            </template>
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
              :disabled="props.disabled || isTransitioning"
              class="btn btn-danger btn-sm"
            >
              <Icon name="lucide:trash-2" class="w-4 h-4" />
              Clear All
            </button>
          </div>
        </div>

        <div class="content-blocks">
          <div v-if="blocks.length === 0" class="empty-state">
            <Icon name="lucide:plus-circle" class="w-12 h-12 text-slate-400" />
            <h4 class="empty-title">No content blocks yet</h4>
            <p class="empty-description">
              Add your first content block from the sidebar to get started.
            </p>
          </div>

          <div v-else class="blocks-container">
            <!-- Important: Use stable keys and proper transition handling -->
            <TransitionGroup
              name="block-list"
              tag="div"
              class="blocks-list"
              @before-leave="onBeforeLeave"
              @after-leave="onAfterLeave"
            >
              <div
                v-for="(block, index) in blocks"
                :key="`block-${block.id}`"
                class="block-item"
                :class="{
                  'block-transitioning': isTransitioning,
                  'block-has-error': hasBlockError(block.id)
                }"
              >
                <div class="block-header">
                  <div class="block-info">
                    <Icon :name="getBlockIcon(block.type)" class="block-icon" />
                    <span class="block-name">{{ getBlockName(block.type) }}</span>
                    <span v-if="hasBlockError(block.id)" class="block-error-indicator">
                      <Icon name="lucide:alert-circle" class="w-4 h-4 text-red-500" />
                    </span>
                  </div>
                  <div class="block-actions">
                    <button
                      @click="moveBlockUp(index)"
                      :disabled="index === 0 || props.disabled || isTransitioning"
                      class="block-action-button"
                      title="Move Up"
                    >
                      <Icon name="lucide:chevron-up" class="w-4 h-4" />
                    </button>
                    <button
                      @click="moveBlockDown(index)"
                      :disabled="index === blocks.length - 1 || props.disabled || isTransitioning"
                      class="block-action-button"
                      title="Move Down"
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
                      @click="handleRemoveBlock(block.id)"
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
import { computed, onMounted, ref, watch } from 'vue'
import type { NewsletterData } from '../../types'
import { useDirectusNewsletter } from '../composables/useDirectusNewsletter'
import { useNewsletterEditor } from '../composables/useNewsletterEditor'
import { debounce } from '../utils/debounce'

interface Props {
  modelValue: NewsletterData
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: NewsletterData]
  'save': []
}>()

// Initialize editor with proper composable usage
const {
  newsletter,
  blocks,
  subject,
  preheader,
  isTransitioning,
  addBlock: editorAddBlock,
  removeBlock,
  updateBlock: editorUpdateBlock,
  moveBlock,
  duplicateBlock,
  clearBlocks,
  loadFromTemplate
} = useNewsletterEditor(props.modelValue)

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
  emit('update:modelValue', newsletter.value)
}

const addBlock = async (blockTypeId: string) => {
  if (isTransitioning.value) return
  
  try {
    await editorAddBlock(blockTypeId)
    updateNewsletter()
  } catch (error) {
    console.error('Error adding block:', error)
    showNotification('Failed to add block', 'error')
  }
}

const handleRemoveBlock = async (blockId: string) => {
  if (isTransitioning.value) return
  
  try {
    await removeBlock(blockId)
    updateNewsletter()
  } catch (error) {
    console.error('Error removing block:', error)
    showNotification('Failed to remove block', 'error')
  }
}

const moveBlockUp = async (index: number) => {
  if (index > 0 && !isTransitioning.value) {
    try {
      await moveBlock(index, index - 1)
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
      await moveBlock(index, index + 1)
      updateNewsletter()
    } catch (error) {
      console.error('Error moving block:', error)
      showNotification('Failed to move block', 'error')
    }
  }
}

const handleBlockUpdate = (blockId: string, content: any) => {
  try {
    editorUpdateBlock(blockId, { content })
    updateNewsletter()
  } catch (error) {
    console.error('Error updating block:', error)
    showNotification('Failed to update block', 'error')
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
  if (isTransitioning.value) return
  
  try {
    const template = await fetchTemplate(templateId)
    loadFromTemplate(template)
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

// Transition event handlers
const onBeforeLeave = (el: Element) => {
  // Store the element's current height to maintain smooth transitions
  const htmlEl = el as HTMLElement
  htmlEl.style.height = htmlEl.offsetHeight + 'px'
}

const onAfterLeave = (el: Element) => {
  // Clean up any inline styles
  const htmlEl = el as HTMLElement
  htmlEl.style.height = ''
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
  if (newValue && !isTransitioning.value) {
    newsletter.value = { ...newValue }
  }
}, { deep: true })

// Watch for subject/preheader changes and update newsletter
watch([subject, preheader], () => {
  debouncedUpdate()
})

// Lifecycle
onMounted(() => {
  loadInitialData()
})
</script>

<style scoped>
@reference 'tailwindcss'; 
/* Base Styles */
.newsletter-editor {
  @apply h-full flex flex-col bg-slate-50;
}

.editor-header {
  @apply flex items-center justify-between p-4 bg-white border-b border-slate-200;
}

.editor-title h2 {
  @apply text-lg font-semibold text-slate-900;
}

.editor-actions {
  @apply flex items-center gap-2;
}

.editor-main {
  @apply flex-1 flex overflow-hidden;
}

.editor-sidebar {
  @apply w-80 bg-white border-r border-slate-200 overflow-y-auto;
}

.editor-content {
  @apply flex-1 flex flex-col overflow-hidden;
}

.preview-panel {
  @apply w-96 bg-white border-l border-slate-200;
}

/* Sidebar Styles */
.sidebar-section {
  @apply p-4 border-b border-slate-200;
}

.sidebar-title {
  @apply text-sm font-medium text-slate-900 mb-3;
}

.form-group {
  @apply mb-3;
}

.form-label {
  @apply block text-sm font-medium text-slate-700 mb-1;
}

.form-input {
  @apply w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent;
}

.form-textarea {
  @apply w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none;
}

/* Block Types */
.loading-state {
  @apply flex items-center gap-2 text-sm text-slate-500 py-4;
}

.block-category {
  @apply mb-4;
}

.block-category-title {
  @apply text-xs font-medium text-slate-500 uppercase tracking-wide mb-2;
}

.block-type-buttons {
  @apply grid grid-cols-1 gap-1;
}

.block-type-button {
  @apply flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-md transition-colors;
}

.block-type-button:disabled {
  @apply opacity-50 cursor-not-allowed;
}

/* Content Styles */
.content-header {
  @apply flex items-center justify-between p-4 bg-white border-b border-slate-200;
}

.content-title {
  @apply text-sm font-medium text-slate-900;
}

.content-actions {
  @apply flex items-center gap-2;
}

.content-blocks {
  @apply flex-1 overflow-y-auto p-4;
}

.empty-state {
  @apply flex flex-col items-center justify-center h-64 text-center;
}

.empty-title {
  @apply text-lg font-medium text-slate-900 mt-4;
}

.empty-description {
  @apply text-sm text-slate-500 mt-2;
}

/* Block Styles */
.blocks-container {
  @apply space-y-4;
}

.blocks-list {
  @apply space-y-4;
}

.block-item {
  @apply bg-white rounded-lg border border-slate-200 shadow-sm;
  transition: all 0.3s ease;
}

.block-item.block-transitioning {
  @apply pointer-events-none;
}

.block-item.block-has-error {
  @apply border-red-300 bg-red-50;
}

.block-header {
  @apply flex items-center justify-between p-3 border-b border-slate-200;
}

.block-info {
  @apply flex items-center gap-2;
}

.block-icon {
  @apply w-4 h-4 text-slate-500;
}

.block-name {
  @apply text-sm font-medium text-slate-900;
}

.block-error-indicator {
  @apply ml-2;
}

.block-actions {
  @apply flex items-center gap-1;
}

.block-action-button {
  @apply p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors;
}

.block-action-button:disabled {
  @apply opacity-50 cursor-not-allowed hover:text-slate-400 hover:bg-transparent;
}

.block-action-button.danger {
  @apply text-red-400 hover:text-red-600 hover:bg-red-50;
}

.block-content {
  @apply p-4;
}

/* Button Styles */
.btn {
  @apply inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors;
}

.btn-primary {
  @apply bg-blue-600 text-white hover:bg-blue-700;
}

.btn-secondary {
  @apply bg-slate-200 text-slate-900 hover:bg-slate-300;
}

.btn-danger {
  @apply bg-red-600 text-white hover:bg-red-700;
}

.btn-sm {
  @apply px-2 py-1 text-xs;
}

.btn:disabled {
  @apply opacity-50 cursor-not-allowed;
}

/* Notification Styles */
.notification {
  @apply fixed top-4 right-4 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg z-50;
}

.notification-success {
  @apply bg-green-100 text-green-800 border border-green-200;
}

.notification-error {
  @apply bg-red-100 text-red-800 border border-red-200;
}

.notification-close {
  @apply ml-2 p-1 hover:bg-black hover:bg-opacity-10 rounded;
}

/* Modal Styles */
.modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
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