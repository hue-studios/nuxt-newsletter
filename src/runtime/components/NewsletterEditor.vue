<!-- NewsletterEditor.vue - Simplified version without internal preview -->
<template>
  <div class="newsletter-editor">
    <div class="editor-header">
      <h2 class="editor-title">Newsletter Editor</h2>
      <div class="editor-actions">
        <button @click="showTemplateSelector = true" class="btn btn-secondary">
          <Icon name="lucide:layout-template" class="w-4 h-4" />
          Load Template
        </button>
        <button @click="saveNewsletter" class="btn btn-primary" :disabled="props.disabled">
          <Icon name="lucide:save" class="w-4 h-4" />
          Save
        </button>
      </div>
    </div>

    <div class="editor-content">
      <!-- Newsletter Settings -->
      <div class="settings-section">
        <h3>Newsletter Settings</h3>
        
        <div class="form-group">
          <label for="subject">Subject Line</label>
          <input
            id="subject"
            v-model="subject"
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
            v-model="preheader"
            type="text"
            class="form-input"
            placeholder="Enter preview text"
            @input="debouncedUpdate"
          />
        </div>
      </div>

      <!-- Content Blocks -->
      <div class="blocks-section">
        <h3>Content Blocks</h3>
        
        <NewsletterBlockList
          v-model:blocks="blocks"
          :block-types="blockTypes"
          @add-block="handleAddBlock"
          @update-block="handleUpdateBlock"
          @remove-block="handleRemoveBlock"
          @move-block="handleMoveBlock"
          @duplicate-block="handleDuplicateBlock"
        />
        
        <div v-if="blocks.length === 0" class="empty-blocks">
          <Icon name="lucide:layers" class="w-12 h-12 text-gray-300" />
          <p>No blocks added yet</p>
          <button @click="showBlockSelector = true" class="btn btn-primary mt-4">
            Add First Block
          </button>
        </div>
      </div>
    </div>

    <!-- Template Selector Modal -->
    <TemplateSelector
      v-if="showTemplateSelector"
      :templates="templates"
      @select="loadSelectedTemplate"
      @close="showTemplateSelector = false"
    />

    <!-- Notification -->
    <Transition name="notification">
      <div v-if="notification.show" :class="['notification', `notification-${notification.type}`]">
        {{ notification.message }}
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { debounce } from 'lodash-es';
import { onMounted, ref } from 'vue';

interface Props {
  modelValue: any
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
const showBlockSelector = ref(false)
const notification = ref({
  show: false,
  type: 'success',
  message: ''
})

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
  editorAddBlock(blockType)
  updateNewsletter()
}

const handleUpdateBlock = (blockId: string, content: any) => {
  editorUpdateBlock(blockId, content)
  debouncedUpdate()
}

const handleRemoveBlock = (blockId: string) => {
  editorRemoveBlock(blockId)
  updateNewsletter()
}

const handleMoveBlock = (fromIndex: number, toIndex: number) => {
  editorMoveBlock(fromIndex, toIndex)
  updateNewsletter()
}

const handleDuplicateBlock = (blockId: string) => {
  editorDuplicateBlock(blockId)
  updateNewsletter()
}

const loadSelectedTemplate = async (template: any) => {
  try {
    const fullTemplate = await fetchTemplate(template.id)
    loadFromTemplate(fullTemplate)
    updateNewsletter()
    showTemplateSelector.value = false
    showNotification('Template loaded successfully!', 'success')
  } catch (error) {
    console.error('Error loading template:', error)
    showNotification('Failed to load template', 'error')
  }
}

const saveNewsletter = () => {
  emit('save')
  showNotification('Newsletter saved successfully!', 'success')
}

const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
  notification.value = { show: true, message, type }
  setTimeout(() => {
    notification.value.show = false
  }, 3000)
}

// Lifecycle
onMounted(() => {
  loadBlockTypes()
  loadTemplates()
})
</script>

<style scoped>
@reference 'tailwindcss';
.newsletter-editor {
  @apply h-full flex flex-col bg-white;
}

.editor-header {
  @apply flex items-center justify-between p-4 border-b border-gray-200;
}

.editor-title {
  @apply text-xl font-semibold text-gray-900;
}

.editor-actions {
  @apply flex items-center gap-3;
}

.editor-content {
  @apply flex-1 overflow-y-auto p-6;
}

.settings-section {
  @apply mb-8;
}

.settings-section h3 {
  @apply text-lg font-medium text-gray-900 mb-4;
}

.form-group {
  @apply mb-4;
}

.form-group label {
  @apply block text-sm font-medium text-gray-700 mb-2;
}

.form-input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.blocks-section h3 {
  @apply text-lg font-medium text-gray-900 mb-4;
}

.empty-blocks {
  @apply text-center py-12;
}

.empty-blocks p {
  @apply text-gray-500 mt-2;
}

.btn {
  @apply inline-flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors;
}

.btn-primary {
  @apply bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-secondary {
  @apply bg-gray-100 text-gray-700 hover:bg-gray-200;
}

/* Notification styles */
.notification {
  @apply fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50;
}

.notification-success {
  @apply bg-green-50 text-green-800;
}

.notification-error {
  @apply bg-red-50 text-red-800;
}

.notification-enter-active,
.notification-leave-active {
  @apply transition-all duration-300;
}

.notification-enter-from {
  @apply translate-x-full opacity-0;
}

.notification-leave-to {
  @apply translate-x-full opacity-0;
}
</style>