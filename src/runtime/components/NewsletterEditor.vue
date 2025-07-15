<!-- Updated NewsletterEditor.vue with proper device controls -->
<template>
  <div class="newsletter-editor">
    <!-- Header with enhanced controls -->
    <div class="editor-header">
      <div class="header-left">
        <div class="editor-title">
          <Icon name="lucide:mail" class="w-5 h-5 text-slate-600" />
          <h1>Newsletter Editor</h1>
        </div>
        <div class="header-actions">
          <button
            @click="showTemplateSelector = true"
            class="action-button secondary"
            title="Load from template"
          >
            <Icon name="lucide:layout-template" class="w-4 h-4" />
            Template
          </button>
        </div>
      </div>
      
      <div class="header-right">
        <!-- Device Preview Controls -->
        <div class="device-controls">
          <span class="device-label">Preview:</span>
          <div class="device-selector">
            <button
              @click="previewDevice = 'desktop'; console.log('Set to desktop')"
              class="device-button"
              :class="{ active: previewDevice === 'desktop' }"
              title="Desktop Preview"
            >
              <Icon name="lucide:monitor" class="w-4 h-4" />
            </button>
            <button
              @click="previewDevice = 'tablet'; console.log('Set to tablet')"
              class="device-button"
              :class="{ active: previewDevice === 'tablet' }"
              title="Tablet Preview"
            >
              <Icon name="lucide:tablet" class="w-4 h-4" />
            </button>
            <button
              @click="previewDevice = 'mobile'; console.log('Set to mobile')"
              class="device-button"
              :class="{ active: previewDevice === 'mobile' }"
              title="Mobile Preview"
            >
              <Icon name="lucide:smartphone" class="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <!-- Main Actions -->
        <div class="main-actions">
          <button
            @click="showPreview = !showPreview; console.log('Preview toggled to:', !showPreview)"
            class="action-button"
            :class="{ active: showPreview }"
            title="Toggle Preview"
          >
            <Icon name="lucide:eye" class="w-4 h-4" />
            <span class="hidden sm:inline">Preview</span>
          </button>
          <button
            @click="saveNewsletter"
            class="action-button primary"
            :disabled="props.disabled"
            title="Save Newsletter"
          >
            <Icon name="lucide:save" class="w-4 h-4" />
            <span class="hidden sm:inline">Save</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="main-content">
      <!-- Editor Panel -->
      <div v-if="!showPreview" class="editor-panel">
        <div class="debug-info" style="position: fixed; top: 50px; right: 10px; background: cyan; padding: 5px; z-index: 1000;">
          Show Preview: {{ showPreview }}
        </div>
        <!-- Block Types Palette -->
        <div class="block-palette">
          <div class="palette-header">
            <h2>Add Blocks</h2>
            <Icon name="lucide:plus" class="w-4 h-4 text-slate-500" />
          </div>
          
          <div class="palette-content">
            <div v-if="loadingBlockTypes" class="loading-state">
              <Icon name="lucide:loader-2" class="w-4 h-4 animate-spin" />
              <span>Loading blocks...</span>
            </div>
            
            <div v-else>
              <div
                v-for="category in blockCategories"
                :key="category"
                class="block-category"
              >
                <h3 class="category-title">{{ category }}</h3>
                <div class="category-blocks">
                  <button
                    v-for="blockType in blockTypes.filter(bt => bt.category === category)"
                    :key="blockType.id"
                    @click="addBlock(blockType.id)"
                    class="block-type-button"
                    :disabled="props.disabled"
                    :title="`Add ${blockType.name}`"
                  >
                    <Icon 
                      :name="blockType.icon || 'lucide:square'" 
                      class="block-type-icon" 
                    />
                    <span class="block-type-name">{{ blockType.name }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Block List -->
        <div class="blocks-container">
          <div class="blocks-header">
            <h2>Newsletter Content</h2>
            <div class="blocks-count">
              {{ blocks.length }} block{{ blocks.length !== 1 ? 's' : '' }}
            </div>
          </div>
          
          <BlockList
            v-model:blocks="blocks"
            :block-types="blockTypes"
            :disabled="props.disabled"
            @block:update="handleBlockUpdate"
            @block:duplicate="handleBlockDuplicate"
            @block:delete="handleBlockDelete"
          />
        </div>
      </div>

      <!-- Preview Panel - Full Width When Active -->
      <div v-if="showPreview" class="preview-panel">
        <div class="debug-info" style="position: fixed; top: 80px; right: 10px; background: lightgreen; padding: 5px; z-index: 1000;">
          Preview Active: {{ showPreview }}<br>
          Device: {{ previewDevice }}
        </div>
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
            <div class="template-grid">
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
                  <p>{{ template.description }}</p>
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
import { computed, onMounted, ref, watch } from 'vue'
import type { NewsletterData } from '../../types'
import BlockList from './BlockList.vue'
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

// Core newsletter editing
const {
  newsletter,
  blocks,
  addBlock,
  removeBlock,
  updateBlock,
  moveBlock,
  duplicateBlock,
  loadFromTemplate
} = useNewsletterEditor(props.modelValue)

// Directus integration
const { fetchBlockTypes, fetchTemplates, fetchTemplate } = useDirectusNewsletter()

// State
const errors = ref<Record<string, string>>({})
const notification = ref({
  show: false,
  message: '',
  type: 'success' as 'success' | 'error'
})

const blockTypes = ref<any[]>([])
const templates = ref<any[]>([])
const loadingBlockTypes = ref(true)
const showTemplateSelector = ref(false)
const showPreview = ref(true)
const previewDevice = ref<'desktop' | 'tablet' | 'mobile'>('desktop')

// Computed properties
const blockCategories = computed(() => {
  const categories = [...new Set(blockTypes.value.map(bt => bt.category))]
  return categories.sort()
})

// Methods
const handleBlockUpdate = (blockId: string, content: any) => {
  updateBlock(blockId, content)
  emit('update:modelValue', newsletter.value)
}

const handleBlockDuplicate = (blockId: string) => {
  duplicateBlock(blockId)
  emit('update:modelValue', newsletter.value)
}

const handleBlockDelete = (blockId: string) => {
  removeBlock(blockId)
  emit('update:modelValue', newsletter.value)
}

const handleCompiled = (compiled: { mjml: string; html: string }) => {
  // Update newsletter with compiled content
  newsletter.value.mjml = compiled.mjml
  newsletter.value.html = compiled.html
  emit('update:modelValue', newsletter.value)
}

const saveNewsletter = () => {
  emit('save')
  showNotification('Newsletter saved successfully!', 'success')
}

const loadTemplate = async (templateId: string) => {
  try {
    const template = await fetchTemplate(templateId)
    loadFromTemplate(template)
    showTemplateSelector.value = false
    emit('update:modelValue', newsletter.value)
    showNotification('Template loaded successfully!', 'success')
  } catch (error) {
    showNotification('Failed to load template', 'error')
  }
}

const showNotification = (message: string, type: 'success' | 'error') => {
  notification.value = { show: true, message, type }
  setTimeout(() => {
    notification.value.show = false
  }, 4000)
}

// Load initial data
onMounted(async () => {
  try {
    blockTypes.value = await fetchBlockTypes()
    templates.value = await fetchTemplates()
  } catch (error) {
    console.error('Failed to load initial data:', error)
  } finally {
    loadingBlockTypes.value = false
  }
})

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    newsletter.value = { ...newValue }
    blocks.value = [...(newValue.blocks || [])]
  }
}, { deep: true })
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

.action-button.secondary {
  @apply text-slate-700 bg-slate-100 hover:bg-slate-200;
}

.action-button.primary {
  @apply text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50;
}

.action-button.active {
  @apply bg-blue-100 text-blue-700;
}

.main-content {
  @apply flex-1 overflow-hidden;
}

.editor-panel {
  @apply h-full flex flex-col overflow-hidden bg-white;
}

.preview-panel {
  @apply h-full w-full overflow-hidden;
}

.block-palette {
  @apply border-b border-slate-200;
}

.palette-header {
  @apply flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200;
}

.palette-header h2 {
  @apply text-sm font-semibold text-slate-900;
}

.palette-content {
  @apply p-4 max-h-64 overflow-y-auto;
}

.loading-state {
  @apply flex items-center justify-center gap-2 py-8 text-slate-500;
}

.block-category {
  @apply space-y-3 mb-6 last:mb-0;
}

.category-title {
  @apply text-xs font-medium text-slate-700 uppercase tracking-wide;
}

.category-blocks {
  @apply grid grid-cols-1 gap-2;
}

.block-type-button {
  @apply flex items-center gap-2 p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors text-left;
}

.block-type-icon {
  @apply w-4 h-4 text-slate-600;
}

.block-type-name {
  @apply text-sm font-medium text-slate-700;
}

.blocks-container {
  @apply flex-1 overflow-y-auto p-4;
}

.blocks-header {
  @apply flex items-center justify-between mb-4;
}

.blocks-header h2 {
  @apply text-sm font-semibold text-slate-900;
}

.blocks-count {
  @apply text-xs text-slate-500;
}

/* Modal styles */
.modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
}

.modal-content {
  @apply bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col;
}

.modal-header {
  @apply flex items-center justify-between p-6 border-b border-slate-200;
}

.modal-header h3 {
  @apply text-lg font-medium text-slate-900;
}

.modal-close {
  @apply p-2 text-slate-400 hover:text-slate-600 rounded-md transition-colors;
}

.modal-body {
  @apply flex-1 overflow-y-auto p-6;
}

.template-grid {
  @apply grid grid-cols-1 sm:grid-cols-2 gap-4;
}

.template-card {
  @apply p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left;
}

.template-preview {
  @apply flex items-center justify-center h-20 bg-slate-100 rounded-lg mb-3;
}

.template-info h4 {
  @apply font-medium text-slate-900 mb-1;
}

.template-info p {
  @apply text-sm text-slate-600;
}

/* Notification styles */
.notification-container {
  @apply fixed top-4 right-4 z-50;
}

.notification {
  @apply flex items-center gap-3 px-4 py-3 bg-white border rounded-lg shadow-lg;
}

.notification.success {
  @apply border-green-200 bg-green-50 text-green-800;
}

.notification.error {
  @apply border-red-200 bg-red-50 text-red-800;
}

.notification-close {
  @apply p-1 text-slate-400 hover:text-slate-600 transition-colors;
}

/* Responsive design */
@media (max-width: 640px) {
  .editor-header {
    @apply flex-col gap-4;
  }
  
  .header-left,
  .header-right {
    @apply w-full justify-between;
  }
  
  .device-controls {
    @apply order-2;
  }
  
  .main-actions {
    @apply order-1;
  }
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  @apply transition-all duration-200;
}

.modal-enter-from,
.modal-leave-to {
  @apply opacity-0 transform scale-95;
}

.notification-enter-active,
.notification-leave-active {
  @apply transition-all duration-300;
}

.notification-enter-from,
.notification-leave-to {
  @apply opacity-0 translate-x-full;
}
</style>