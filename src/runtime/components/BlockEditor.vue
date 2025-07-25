<!-- src/runtime/components/BlockEditor.vue -->
<template>
  <div class="block-editor" :class="{ 'is-expanded': isExpanded }">
    <!-- Block Header -->
    <div class="block-header" @click="toggleExpanded">
      <div class="flex items-center gap-3">
        <Icon :name="blockType?.icon || 'lucide:layout-template'" class="w-5 h-5 text-slate-600" />
        <div>
          <h4 class="block-title">{{ blockType?.name || 'Unknown Block' }}</h4>
          <p v-if="blockType?.description" class="block-description">{{ blockType.description }}</p>
        </div>
      </div>
      
      <div class="flex items-center gap-2">
        <button
          v-if="blockType?.mjml_template"
          @click.stop="togglePreview"
          :class="{ active: showPreview }"
          class="preview-toggle"
          title="Toggle Preview"
        >
          <Icon name="lucide:eye" />
        </button>
        
        <button @click="toggleExpanded" class="expand-toggle">
          <Icon name="lucide:chevron-down" :class="{ 'rotate-180': isExpanded }" />
        </button>
        
        <button @click="removeBlock" class="remove-button" title="Remove Block">
          <Icon name="lucide:trash-2" />
        </button>
      </div>
    </div>

    <!-- Block Content (Collapsible) -->
    <Transition
      name="collapse"
      @enter="onEnter"
      @leave="onLeave"
    >
      <div v-show="isExpanded" class="block-content">
        <div class="block-fields">
          <div v-for="field in visibleFields" :key="field.key" :class="field.size" class="field-wrapper">
            <!-- Rich Text Field -->
            <template v-if="isRichTextField(field)">
              <RichTextInput
                :model-value="localContent[field.key] || ''"
                @update:model-value="updateFieldContent(field.key, $event)"
                :label="field.label || field.key"
                :placeholder="field.placeholder"
                :required="field.required"
                :hint="field.help"
                :features="{
                  headings: true,
                  lists: true,
                  links: true,
                  alignment: false,
                  colors: false
                }"
              />
            </template>

            <!-- Regular Text Field -->
            <template v-else-if="field.type === 'text' || field.interface === 'input'">
              <div class="field-group">
                <label class="field-label">
                  {{ field.label || field.key }}
                  <span v-if="field.required" class="required">*</span>
                </label>
                <input
                  v-model="localContent[field.key]"
                  type="text"
                  :placeholder="field.placeholder"
                  class="form-input"
                  @input="updateContent"
                />
                <p v-if="field.help" class="field-help">{{ field.help }}</p>
              </div>
            </template>

            <!-- Textarea Field -->
            <template v-else-if="field.type === 'text' && field.interface === 'textarea'">
              <div class="field-group">
                <label class="field-label">
                  {{ field.label || field.key }}
                  <span v-if="field.required" class="required">*</span>
                </label>
                <textarea
                  v-model="localContent[field.key]"
                  :placeholder="field.placeholder"
                  rows="4"
                  class="form-textarea"
                  @input="updateContent"
                ></textarea>
                <p v-if="field.help" class="field-help">{{ field.help }}</p>
              </div>
            </template>

            <!-- Number Field -->
            <template v-else-if="field.type === 'integer' || field.type === 'number'">
              <div class="field-group">
                <label class="field-label">
                  {{ field.label || field.key }}
                  <span v-if="field.required" class="required">*</span>
                </label>
                <input
                  v-model.number="localContent[field.key]"
                  type="number"
                  :placeholder="field.placeholder"
                  class="form-input"
                  @input="updateContent"
                />
                <p v-if="field.help" class="field-help">{{ field.help }}</p>
              </div>
            </template>

            <!-- Color Field -->
            <template v-else-if="field.interface === 'color'">
              <div class="field-group">
                <label class="field-label">
                  {{ field.label || field.key }}
                  <span v-if="field.required" class="required">*</span>
                </label>
                <div class="color-picker-container">
                  <input
                    v-model="localContent[field.key]"
                    type="color"
                    class="color-input"
                    @input="updateContent"
                  />
                  <input
                    v-model="localContent[field.key]"
                    type="text"
                    :placeholder="field.placeholder || '#000000'"
                    class="color-text-input"
                    @input="updateContent"
                  />
                </div>
                <p v-if="field.help" class="field-help">{{ field.help }}</p>
              </div>
            </template>

            <!-- Boolean/Switch Field -->
            <template v-else-if="field.type === 'boolean' || field.interface === 'boolean'">
              <div class="field-group">
                <label class="switch-container">
                  <input
                    v-model="localContent[field.key]"
                    type="checkbox"
                    class="switch-input"
                    @change="updateContent"
                  />
                  <span class="switch-slider"></span>
                  <span class="switch-label">{{ field.label || field.key }}</span>
                </label>
                <p v-if="field.help" class="field-help">{{ field.help }}</p>
              </div>
            </template>

            <!-- Select Field -->
            <template v-else-if="field.interface === 'select-dropdown'">
              <div class="field-group">
                <label class="field-label">
                  {{ field.label || field.key }}
                  <span v-if="field.required" class="required">*</span>
                </label>
                <select
                  v-model="localContent[field.key]"
                  class="form-select"
                  @change="updateContent"
                >
                  <option value="" disabled>{{ field.placeholder || 'Select an option' }}</option>
                  <option
                    v-for="option in field.options"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
                <p v-if="field.help" class="field-help">{{ field.help }}</p>
              </div>
            </template>
          </div>
        </div>

        <!-- Block Preview (if enabled) -->
        <div v-if="showPreview" class="block-preview">
          <div class="preview-header">
            <h5>Preview</h5>
            <button @click="refreshPreview" :disabled="isRefreshing" class="refresh-button">
              <Icon name="lucide:refresh-cw" :class="{ 'animate-spin': isRefreshing }" />
            </button>
          </div>
          <div class="preview-content">
            <iframe
              v-if="compiledHtml"
              :srcdoc="previewHtml"
              class="preview-iframe"
            ></iframe>
            <div v-else-if="isRefreshing" class="preview-loading">
              <Icon name="lucide:loader-2" class="animate-spin" />
              <span>Generating preview...</span>
            </div>
            <div v-else class="preview-empty">
              <Icon name="lucide:image" />
              <span>Preview will appear here</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import RichTextInput from './RichTextInput.vue'

interface NewsletterBlock {
  id: string
  type: string
  content: Record<string, any>
  sort: number
}

interface BlockType {
  id: string
  name: string
  description?: string
  icon?: string
  field_visibility_config?: string[]
  fields?: any[]
  mjml_template?: string
}

interface Props {
  block: NewsletterBlock
  blockType?: BlockType
}

interface Emits {
  (e: 'update', block: NewsletterBlock): void
  (e: 'remove', blockId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Component state
const isExpanded = ref(true)
const showPreview = ref(false)
const isRefreshing = ref(false)
const compiledHtml = ref('')
const localContent = ref({ ...props.block.content })

// Helper function to determine if a field is a rich text field
const isRichTextField = (field: any) => {
  return field.interface === 'wysiwyg' || 
         field.interface === 'rich-text' ||
         field.type === 'text' && field.rich_text === true
}

// Get visible fields based on block type configuration
const visibleFields = computed(() => {
  if (!props.blockType?.field_visibility_config) return []
  
  return props.blockType.field_visibility_config.map(fieldKey => {
    // Mock field definitions - in real implementation, these would come from Directus field schema
    const commonFields: Record<string, any> = {
      title: { key: 'title', label: 'Title', type: 'text', interface: 'input', placeholder: 'Enter title...' },
      text: { key: 'text', label: 'Text', type: 'text', interface: 'wysiwyg', placeholder: 'Enter your text...' },
      content: { key: 'content', label: 'Content', type: 'text', interface: 'wysiwyg', placeholder: 'Enter content...' },
      description: { key: 'description', label: 'Description', type: 'text', interface: 'textarea', placeholder: 'Enter description...' },
      url: { key: 'url', label: 'URL', type: 'text', interface: 'input', placeholder: 'https://...' },
      background_color: { key: 'background_color', label: 'Background Color', type: 'text', interface: 'color', placeholder: '#ffffff' },
      text_color: { key: 'text_color', label: 'Text Color', type: 'text', interface: 'color', placeholder: '#000000' },
      padding: { key: 'padding', label: 'Padding', type: 'text', interface: 'input', placeholder: '20px' },
      alignment: { key: 'alignment', label: 'Alignment', type: 'text', interface: 'select-dropdown', options: [
        { label: 'Left', value: 'left' },
        { label: 'Center', value: 'center' },
        { label: 'Right', value: 'right' }
      ]},
      button_text: { key: 'button_text', label: 'Button Text', type: 'text', interface: 'input', placeholder: 'Click here' },
      button_url: { key: 'button_url', label: 'Button URL', type: 'text', interface: 'input', placeholder: 'https://...' },
      image_url: { key: 'image_url', label: 'Image URL', type: 'text', interface: 'input', placeholder: 'https://...' },
      alt_text: { key: 'alt_text', label: 'Alt Text', type: 'text', interface: 'input', placeholder: 'Image description' },
      spacer_height: { key: 'spacer_height', label: 'Height', type: 'text', interface: 'input', placeholder: '50px' },
      company_name: { key: 'company_name', label: 'Company Name', type: 'text', interface: 'input', placeholder: 'Your Company' },
      address: { key: 'address', label: 'Address', type: 'text', interface: 'textarea', placeholder: 'Company address...' },
      unsubscribe_url: { key: 'unsubscribe_url', label: 'Unsubscribe URL', type: 'text', interface: 'input', placeholder: 'https://...' },
    }
    
    return {
      ...commonFields[fieldKey],
      key: fieldKey,
      label: commonFields[fieldKey]?.label || fieldKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      type: commonFields[fieldKey]?.type || 'text',
      interface: commonFields[fieldKey]?.interface || 'input',
      size: 'col-span-1'
    }
  }).filter(Boolean)
})

const previewHtml = computed(() => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            line-height: 1.6;
            color: #333;
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
const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}

const togglePreview = () => {
  showPreview.value = !showPreview.value
  if (showPreview.value) {
    refreshPreview()
  }
}

const updateFieldContent = (fieldKey: string, value: any) => {
  localContent.value[fieldKey] = value
  updateContent()
}

const updateContent = () => {
  emit('update', {
    ...props.block,
    content: { ...localContent.value }
  })
}

const removeBlock = () => {
  emit('remove', props.block.id)
}

const refreshPreview = async () => {
  if (!props.blockType?.mjml_template) return
  
  try {
    isRefreshing.value = true
    // Placeholder for MJML compilation
    compiledHtml.value = '<div class="p-4">Preview will be generated here</div>'
  } catch (error) {
    console.error('Block preview compilation failed:', error)
  } finally {
    isRefreshing.value = false
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
  console.log(`🎨 Block editor mounted for: ${props.blockType?.name || 'unknown'} (${props.block.type})`)
})
</script>

<style scoped>
/* Block Editor Styles */
.block-editor {
  @apply border border-slate-200 rounded-lg bg-white overflow-hidden;
}

.block-editor.is-expanded {
  @apply shadow-sm;
}

.block-header {
  @apply flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors;
}

.block-title {
  @apply text-sm font-semibold text-slate-900;
}

.block-description {
  @apply text-xs text-slate-600 mt-1;
}

.preview-toggle {
  @apply p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors;
}

.preview-toggle.active {
  @apply bg-blue-100 text-blue-700;
}

.expand-toggle {
  @apply p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded transition-all;
}

.remove-button {
  @apply p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors;
}

.block-content {
  @apply overflow-hidden;
}

.block-fields {
  @apply p-4 grid grid-cols-1 md:grid-cols-2 gap-4;
}

/* Form Elements */
.field-wrapper {
  @apply space-y-2;
}

.field-group {
  @apply space-y-2;
}

.field-label {
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

/* Color picker */
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

/* Preview Styles */
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

/* Transitions */
.collapse-enter-active,
.collapse-leave-active {
  @apply transition-all duration-300 ease-in-out;
}

.collapse-enter-from,
.collapse-leave-to {
  @apply opacity-0;
}
</style>