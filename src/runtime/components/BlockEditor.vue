<template>
  <div class="block-editor">
    <!-- Block Header -->
    <div class="block-header">
      <div class="block-info">
        <div class="block-icon">
          <Icon :name="blockType?.icon || 'lucide:square'" />
        </div>
        <div class="block-details">
          <h4 class="block-title">{{ blockType?.name || 'Unknown Block' }}</h4>
          <p class="block-description">{{ blockType?.description || 'Edit block content' }}</p>
        </div>
      </div>
      
      <div class="block-actions">
        <button @click="toggleCollapsed" class="action-button collapse-button">
          <Icon :name="collapsed ? 'lucide:chevron-down' : 'lucide:chevron-up'" />
        </button>
        <button @click="duplicateBlock" class="action-button">
          <Icon name="lucide:copy" />
        </button>
        <button @click="removeBlock" class="action-button delete-button">
          <Icon name="lucide:trash-2" />
        </button>
      </div>
    </div>

    <!-- Block Content (Collapsible) -->
    <Transition name="collapse" @enter="onEnter" @leave="onLeave">
      <div v-if="!collapsed" class="block-content">
        <!-- Dynamic Form Fields based on block type -->
        <div class="form-container">
          <div class="form-grid">
            <!-- Text Fields -->
            <template v-for="field in textFields" :key="field.key">
              <div class="form-group" :class="field.size || 'col-span-1'">
                <label :for="`${block.id}-${field.key}`" class="form-label">
                  {{ field.label }}
                  <span v-if="field.required" class="required">*</span>
                </label>
                
                <!-- Regular Input -->
                <input
                  v-if="field.type === 'text' || field.type === 'email' || field.type === 'url'"
                  :id="`${block.id}-${field.key}`"
                  v-model="localContent[field.key]"
                  :type="field.type"
                  :placeholder="field.placeholder"
                  :required="field.required"
                  class="form-input"
                  @input="updateContent"
                />
                
                <!-- Textarea -->
                <textarea
                  v-else-if="field.type === 'textarea'"
                  :id="`${block.id}-${field.key}`"
                  v-model="localContent[field.key]"
                  :placeholder="field.placeholder"
                  :rows="field.rows || 3"
                  :required="field.required"
                  class="form-textarea"
                  @input="updateContent"
                ></textarea>
                
                <!-- Rich Text Editor -->
                <div
                  v-else-if="field.type === 'richtext'"
                  class="rich-text-editor"
                >
                  <div class="editor-toolbar">
                    <button @click="formatText('bold')" class="format-button" :class="{ 'active': isActive('bold') }">
                      <Icon name="lucide:bold" />
                    </button>
                    <button @click="formatText('italic')" class="format-button" :class="{ 'active': isActive('italic') }">
                      <Icon name="lucide:italic" />
                    </button>
                    <button @click="formatText('underline')" class="format-button" :class="{ 'active': isActive('underline') }">
                      <Icon name="lucide:underline" />
                    </button>
                    <div class="toolbar-divider"></div>
                    <button @click="insertLink" class="format-button">
                      <Icon name="lucide:link" />
                    </button>
                    <button @click="formatText('removeFormat')" class="format-button">
                      <Icon name="lucide:eraser" />
                    </button>
                  </div>
                  <div
                    ref="richTextRef"
                    :contenteditable="true"
                    class="rich-text-content"
                    @input="updateRichText(field.key, $event)"
                    @keydown="handleKeydown"
                    v-html="localContent[field.key] || ''"
                  ></div>
                </div>
                
                <!-- Color Picker -->
                <div v-else-if="field.type === 'color'" class="color-picker-container">
                  <input
                    :id="`${block.id}-${field.key}`"
                    v-model="localContent[field.key]"
                    type="color"
                    class="color-input"
                    @input="updateContent"
                  />
                  <input
                    v-model="localContent[field.key]"
                    type="text"
                    class="color-text-input"
                    :placeholder="field.placeholder || '#000000'"
                    @input="updateContent"
                  />
                </div>
                
                <!-- Select Dropdown -->
                <select
                  v-else-if="field.type === 'select'"
                  :id="`${block.id}-${field.key}`"
                  v-model="localContent[field.key]"
                  class="form-select"
                  @change="updateContent"
                >
                  <option value="">{{ field.placeholder || 'Choose an option' }}</option>
                  <option v-for="option in field.options" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
                
                <!-- Switch/Toggle -->
                <label v-else-if="field.type === 'switch'" class="switch-container">
                  <input
                    v-model="localContent[field.key]"
                    type="checkbox"
                    class="switch-input"
                    @change="updateContent"
                  />
                  <span class="switch-slider"></span>
                  <span class="switch-label">{{ field.switchLabel || 'Enable' }}</span>
                </label>
                
                <!-- Number Input -->
                <input
                  v-else-if="field.type === 'number'"
                  :id="`${block.id}-${field.key}`"
                  v-model.number="localContent[field.key]"
                  type="number"
                  :min="field.min"
                  :max="field.max"
                  :step="field.step"
                  :placeholder="field.placeholder"
                  class="form-input"
                  @input="updateContent"
                />

                <p v-if="field.help" class="field-help">{{ field.help }}</p>
              </div>
            </template>

            <!-- Image Upload Fields -->
            <template v-for="field in imageFields" :key="field.key">
              <div class="form-group" :class="field.size || 'col-span-2'">
                <label class="form-label">
                  {{ field.label }}
                  <span v-if="field.required" class="required">*</span>
                </label>
                
                <ImageUpload
                  v-model="localContent[field.key]"
                  :alt-field="`${field.key}_alt`"
                  :alt-value="localContent[`${field.key}_alt`]"
                  @update:alt="localContent[`${field.key}_alt`] = $event; updateContent()"
                  @update:modelValue="updateContent"
                />
                
                <p v-if="field.help" class="field-help">{{ field.help }}</p>
              </div>
            </template>
          </div>
        </div>

        <!-- Block Preview -->
        <div v-if="showPreview" class="block-preview">
          <div class="preview-header">
            <h5>Block Preview</h5>
            <button @click="refreshPreview" class="refresh-button" :disabled="isCompiling">
              <Icon :name="isCompiling ? 'lucide:loader-2' : 'lucide:refresh-cw'" :class="{ 'animate-spin': isCompiling }" />
            </button>
          </div>
          
          <div class="preview-content">
            <div v-if="compilationError" class="preview-error">
              <Icon name="lucide:alert-triangle" />
              <span>{{ compilationError }}</span>
            </div>
            
            <div v-else-if="isCompiling" class="preview-loading">
              <Icon name="lucide:loader-2" class="animate-spin" />
              <span>Compiling...</span>
            </div>
            
            <iframe
              v-else-if="compiledHtml"
              :srcdoc="previewContent"
              class="preview-iframe"
            ></iframe>
            
            <div v-else class="preview-empty">
              <Icon name="lucide:eye-off" />
              <span>No preview available</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { debounce } from 'lodash-es';
import { computed, onMounted, ref, watch } from 'vue';

interface Props {
  block: any
  blockType: any
}

const props = defineProps<Props>()

const emit = defineEmits<{
  update: [blockId: string, updates: any]
  duplicate: [blockId: string]
  remove: [blockId: string]
}>()

// Composables
const { compileBlockToMjml, compileMjmlToHtml, isCompiling, compilationError } = useMjmlCompiler()

// State
const collapsed = ref(false)
const showPreview = ref(false)
const localContent = ref({ ...props.block.content })
const compiledHtml = ref('')
const richTextRef = ref<HTMLElement>()

// Computed field configurations
const textFields = computed(() => {
  if (!props.blockType?.field_visibility_config) return []
  
  return props.blockType.field_visibility_config
    .filter(field => field.type !== 'image')
    .map(field => ({
      ...field,
      key: field.name || field.key,
      label: field.label || field.name,
      type: field.type || 'text',
      size: field.grid_size || 'col-span-1'
    }))
})

const imageFields = computed(() => {
  if (!props.blockType?.field_visibility_config) return []
  
  return props.blockType.field_visibility_config
    .filter(field => field.type === 'image')
    .map(field => ({
      ...field,
      key: field.name || field.key,
      label: field.label || field.name,
      size: field.grid_size || 'col-span-2'
    }))
})

const previewContent = computed(() => {
  if (!compiledHtml.value) return ''
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
            margin: 0;
            padding: 16px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #f8fafc;
          }
          
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            overflow: hidden;
          }
        </style>
      </head>
      <body>
        <div class="container">
          ${compiledHtml.value}
        </div>
      </body>
    </html>
  `
})

// Methods
const updateContent = debounce(() => {
  emit('update', props.block.id, { content: localContent.value })
}, 300)

const updateRichText = debounce((key: string, event: Event) => {
  const target = event.target as HTMLElement
  localContent.value[key] = target.innerHTML
  updateContent()
}, 300)

const formatText = (command: string) => {
  document.execCommand(command, false)
  if (richTextRef.value) {
    richTextRef.value.focus()
  }
}

const isActive = (command: string) => {
  return document.queryCommandState(command)
}

const insertLink = () => {
  const url = prompt('Enter URL:')
  if (url) {
    document.execCommand('createLink', false, url)
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  // Prevent certain key combinations that could break the editor
  if (event.ctrlKey || event.metaKey) {
    if (['s', 'a', 'z', 'y'].includes(event.key.toLowerCase())) {
      event.preventDefault()
    }
  }
}

const toggleCollapsed = () => {
  collapsed.value = !collapsed.value
}

const duplicateBlock = () => {
  emit('duplicate', props.block.id)
}

const removeBlock = () => {
  if (confirm('Are you sure you want to delete this block?')) {
    emit('remove', props.block.id)
  }
}

const refreshPreview = async () => {
  if (!props.blockType?.mjml_template) return
  
  try {
    const mjml = await compileBlockToMjml(props.block, props.blockType)
    const html = await compileMjmlToHtml(mjml)
    compiledHtml.value = html
  } catch (error) {
    console.error('Block preview compilation failed:', error)
  }
}

// Transition handlers
const onEnter = (el: HTMLElement) => {
  el.style.height = '0'
  el.offsetHeight // trigger reflow
  el.style.height = el.scrollHeight + 'px'
}

const onLeave = (el: HTMLElement) => {
  el.style.height = el.scrollHeight + 'px'
  el.offsetHeight // trigger reflow
  el.style.height = '0'
}

// Watchers
watch(() => props.block.content, (newContent) => {
  localContent.value = { ...newContent }
}, { deep: true })

watch(localContent, () => {
  if (showPreview.value) {
    refreshPreview()
  }
}, { deep: true })

// Lifecycle
onMounted(() => {
  // Initialize preview if block has content
  if (Object.keys(localContent.value).length > 0) {
    showPreview.value = true
    refreshPreview()
  }
})
</script>

<style scoped>
@reference 'tailwindcss';
.block-editor {
  @apply bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm;
}

/* Block Header */
.block-header {
  @apply flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200;
}

.block-info {
  @apply flex items-center gap-3;
}

.block-icon {
  @apply w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center;
}

.block-icon svg {
  @apply w-4 h-4 text-blue-600;
}

.block-details {
  @apply min-w-0;
}

.block-title {
  @apply text-sm font-semibold text-slate-900;
}

.block-description {
  @apply text-xs text-slate-600;
}

.block-actions {
  @apply flex items-center gap-1;
}

.action-button {
  @apply p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-md transition-colors;
}

.collapse-button {
  @apply mr-2;
}

.delete-button {
  @apply hover:text-red-600 hover:bg-red-50;
}

/* Block Content */
.block-content {
  @apply overflow-hidden;
}

.form-container {
  @apply p-4;
}

.form-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-4;
}

.form-group {
  @apply space-y-2;
}

.form-group.col-span-2 {
  @apply md:col-span-2;
}

.form-label {
  @apply block text-sm font-medium text-slate-700;
}

.required {
  @apply text-red-500;
}

.form-input,
.form-textarea,
.form-select {
  @apply block w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors;
}

.form-textarea {
  @apply resize-vertical min-h-[80px];
}

.field-help {
  @apply text-xs text-slate-500;
}

/* Rich Text Editor */
.rich-text-editor {
  @apply border border-slate-300 rounded-lg overflow-hidden;
}

.editor-toolbar {
  @apply flex items-center gap-1 p-2 bg-slate-50 border-b border-slate-200;
}

.format-button {
  @apply p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors;
}

.format-button.active {
  @apply bg-blue-100 text-blue-700;
}

.toolbar-divider {
  @apply w-px h-4 bg-slate-300 mx-1;
}

.rich-text-content {
  @apply p-3 min-h-[100px] focus:outline-none;
}

.rich-text-content:focus {
  @apply ring-2 ring-blue-500;
}

/* Color Picker */
.color-picker-container {
  @apply flex items-center gap-2;
}

.color-input {
  @apply w-12 h-10 border border-slate-300 rounded-lg cursor-pointer;
}

.color-text-input {
  @apply flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
}

/* Switch */
.switch-container {
  @apply flex items-center gap-3 cursor-pointer;
}

.switch-input {
  @apply sr-only;
}

.switch-slider {
  @apply relative w-11 h-6 bg-slate-300 rounded-full transition-colors;
}

.switch-slider::before {
  content: '';
  @apply absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform;
}

.switch-input:checked + .switch-slider {
  @apply bg-blue-600;
}

.switch-input:checked + .switch-slider::before {
  @apply translate-x-5;
}

.switch-label {
  @apply text-sm font-medium text-slate-700;
}

/* Block Preview */
.block-preview {
  @apply border-t border-slate-200 bg-slate-50;
}

.preview-header {
  @apply flex items-center justify-between p-3 border-b border-slate-200;
}

.preview-header h5 {
  @apply text-sm font-semibold text-slate-900;
}

.refresh-button {
  @apply p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors disabled:opacity-50;
}

.preview-content {
  @apply h-64;
}

.preview-iframe {
  @apply w-full h-full border-none;
}

.preview-error,
.preview-loading,
.preview-empty {
  @apply h-full flex items-center justify-center gap-2 text-sm text-slate-600;
}

.preview-error {
  @apply text-red-600;
}

.preview-error svg,
.preview-loading svg,
.preview-empty svg {
  @apply w-5 h-5;
}

/* Collapse Transition */
.collapse-enter-active,
.collapse-leave-active {
  @apply transition-all duration-300 ease-in-out;
}

.collapse-enter-from,
.collapse-leave-to {
  @apply opacity-0;
}
</style>