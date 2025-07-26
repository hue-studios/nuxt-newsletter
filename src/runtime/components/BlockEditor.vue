<!-- BlockEditor.vue - Improved block editing with better content handling -->
<template>
  <div class="block-editor" :class="{ 'is-expanded': isExpanded }">
    <!-- Block Header -->
    <div class="block-header" @click="toggleExpanded">
      <div class="block-info">
        <Icon :name="blockType?.icon || 'lucide:layout-template'" class="w-5 h-5 text-slate-600" />
        <div class="block-details">
          <h4 class="block-title">{{ blockType?.name || 'Unknown Block' }}</h4>
          <p v-if="blockType?.description" class="block-description">{{ blockType.description }}</p>
        </div>
      </div>
      
      <div class="block-actions">
        <!-- Move Controls -->
        <button
          v-if="index > 0"
          @click.stop="$emit('move-up')"
          class="action-button"
          title="Move up"
        >
          <Icon name="lucide:chevron-up" class="w-4 h-4" />
        </button>
        
        <button
          @click.stop="$emit('move-down')"
          class="action-button"
          title="Move down"
        >
          <Icon name="lucide:chevron-down" class="w-4 h-4" />
        </button>
        
        <!-- Toggle Expand -->
        <button @click.stop="toggleExpanded" class="action-button">
          <Icon name="lucide:chevron-down" :class="{ 'rotate-180': isExpanded }" />
        </button>
        
        <!-- Duplicate -->
        <button @click.stop="handleDuplicate" class="action-button" title="Duplicate block">
          <Icon name="lucide:copy" class="w-4 h-4" />
        </button>
        
        <!-- Remove -->
        <button @click.stop="handleRemove" class="action-button remove-button" title="Remove block">
          <Icon name="lucide:trash-2" class="w-4 h-4" />
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
        <!-- Content Preview when collapsed -->
        <div v-if="!isExpanded" class="content-preview">
          <div v-if="hasContentPreview" class="preview-content">
            <div v-if="contentPreview.title" class="preview-title">
              {{ contentPreview.title }}
            </div>
            <div v-if="contentPreview.text" class="preview-text">
              {{ contentPreview.text }}
            </div>
          </div>
          <div v-else class="empty-preview">
            Click to edit content
          </div>
        </div>

        <!-- Content Fields when expanded -->
        <div v-if="isExpanded" class="content-fields">
          <!-- Dynamic fields based on block type -->
          <div v-if="editableFields.length > 0" class="fields-grid">
            <div
              v-for="field in editableFields"
              :key="field.name"
              class="field-group"
              :class="getFieldWidthClass(field.width)"
            >
              <label :for="`field-${field.name}`" class="field-label">
                {{ field.label || field.name }}
                <span v-if="field.required" class="required-indicator">*</span>
              </label>

              <!-- Text Input -->
              <input
                v-if="field.type === 'string' && !field.multiline"
                :id="`field-${field.name}`"
                v-model="localContent[field.name]"
                type="text"
                class="field-input"
                :placeholder="field.placeholder || `Enter ${field.label || field.name}`"
                @input="debouncedUpdate"
              />

              <!-- Textarea -->
              <textarea
                v-else-if="field.type === 'text' || field.multiline"
                :id="`field-${field.name}`"
                v-model="localContent[field.name]"
                class="field-textarea"
                :placeholder="field.placeholder || `Enter ${field.label || field.name}`"
                :rows="field.rows || 3"
                @input="debouncedUpdate"
              />

              <!-- Rich Text Editor (simplified) -->
              <div
                v-else-if="field.type === 'html'"
                class="field-html"
              >
                <textarea
                  v-model="localContent[field.name]"
                  class="field-textarea"
                  :placeholder="field.placeholder || 'Enter HTML content'"
                  @input="debouncedUpdate"
                />
                <small class="field-help">HTML content supported</small>
              </div>

              <!-- URL Input -->
              <input
                v-else-if="field.type === 'url'"
                :id="`field-${field.name}`"
                v-model="localContent[field.name]"
                type="url"
                class="field-input"
                :placeholder="field.placeholder || 'https://'"
                @input="debouncedUpdate"
              />

              <!-- Number Input -->
              <input
                v-else-if="field.type === 'integer' || field.type === 'float'"
                :id="`field-${field.name}`"
                v-model.number="localContent[field.name]"
                type="number"
                class="field-input"
                :placeholder="field.placeholder || '0'"
                @input="debouncedUpdate"
              />

              <!-- Boolean Checkbox -->
              <label
                v-else-if="field.type === 'boolean'"
                class="field-checkbox"
              >
                <input
                  v-model="localContent[field.name]"
                  type="checkbox"
                  @change="debouncedUpdate"
                />
                <span class="checkbox-label">{{ field.checkboxLabel || 'Enable' }}</span>
              </label>

              <!-- Color Input -->
              <input
                v-else-if="field.type === 'color'"
                :id="`field-${field.name}`"
                v-model="localContent[field.name]"
                type="color"
                class="field-color"
                @input="debouncedUpdate"
              />

              <!-- Default text input for unknown types -->
              <input
                v-else
                :id="`field-${field.name}`"
                v-model="localContent[field.name]"
                type="text"
                class="field-input"
                :placeholder="field.placeholder || `Enter ${field.label || field.name}`"
                @input="debouncedUpdate"
              />

              <!-- Field Help Text -->
              <small v-if="field.help" class="field-help">
                {{ field.help }}
              </small>
            </div>
          </div>

          <!-- Fallback: JSON editor for unknown structure -->
          <div v-else class="fallback-editor">
            <label class="field-label">Block Content (JSON)</label>
            <textarea
              v-model="jsonContent"
              class="field-textarea json-editor"
              placeholder="Enter block content as JSON"
              rows="8"
              @input="handleJsonUpdate"
            />
            <small class="field-help">
              Editing raw JSON content. This block type may not have field definitions configured.
            </small>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { debounce } from 'lodash-es'
import { computed, onMounted, ref, watch } from 'vue'

interface BlockField {
  name: string
  type: string
  label?: string
  placeholder?: string
  required?: boolean
  multiline?: boolean
  rows?: number
  width?: string
  help?: string
  checkboxLabel?: string
}

interface Props {
  block: any
  blockType?: any
  index?: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update': [block: any]
  'remove': [blockId: string]
  'move-up': []
  'move-down': []
  'duplicate': [blockId: string]
}>()

// State
const isExpanded = ref(false)
const localContent = ref(props.block?.content || {})
const jsonContent = ref('')

// Computed
const editableFields = computed((): BlockField[] => {
  if (!props.blockType) return []

  // Try to get fields from block type configuration
  const fields = props.blockType.fields || props.blockType.field_config || []
  
  if (Array.isArray(fields) && fields.length > 0) {
    return fields
  }

  // Fallback: generate fields from existing content
  if (localContent.value && typeof localContent.value === 'object') {
    return Object.keys(localContent.value).map(key => ({
      name: key,
      type: inferFieldType(localContent.value[key]),
      label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }))
  }

  // Default fields for common block types
  return getDefaultFields(props.blockType?.slug || props.block?.type)
})

const hasContentPreview = computed(() => {
  return Object.values(localContent.value).some(value => 
    value !== null && value !== undefined && value !== ''
  )
})

const contentPreview = computed(() => {
  const content = localContent.value
  return {
    title: content.title || content.heading || content.subject,
    text: content.text_content || content.text || content.description || content.subtitle
  }
})

// Methods
const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}

const handleRemove = () => {
  if (confirm('Remove this block?')) {
    emit('remove', props.block.id)
  }
}

const handleDuplicate = () => {
  emit('duplicate', props.block.id)
}

const updateContent = () => {
  emit('update', {
    ...props.block,
    content: { ...localContent.value }
  })
}

const debouncedUpdate = debounce(updateContent, 300)

const handleJsonUpdate = () => {
  try {
    const parsed = JSON.parse(jsonContent.value)
    localContent.value = parsed
    debouncedUpdate()
  } catch (error) {
    // Invalid JSON, don't update
  }
}

const inferFieldType = (value: any): string => {
  if (typeof value === 'boolean') return 'boolean'
  if (typeof value === 'number') return Number.isInteger(value) ? 'integer' : 'float'
  if (typeof value === 'string') {
    if (value.includes('http')) return 'url'
    if (value.includes('<') && value.includes('>')) return 'html'
    if (value.length > 100) return 'text'
  }
  return 'string'
}

const getDefaultFields = (blockType: string): BlockField[] => {
  const defaults: Record<string, BlockField[]> = {
    hero: [
      { name: 'title', type: 'string', label: 'Title', required: true },
      { name: 'subtitle', type: 'text', label: 'Subtitle' },
      { name: 'button_text', type: 'string', label: 'Button Text' },
      { name: 'button_url', type: 'url', label: 'Button URL' },
      { name: 'background_color', type: 'color', label: 'Background Color' }
    ],
    text: [
      { name: 'text_content', type: 'html', label: 'Content', required: true, rows: 6 }
    ],
    button: [
      { name: 'button_text', type: 'string', label: 'Button Text', required: true },
      { name: 'button_url', type: 'url', label: 'Button URL', required: true },
      { name: 'button_color', type: 'color', label: 'Button Color' }
    ],
    image: [
      { name: 'image_url', type: 'url', label: 'Image URL', required: true },
      { name: 'image_alt_text', type: 'string', label: 'Alt Text' },
      { name: 'caption', type: 'text', label: 'Caption' }
    ]
  }

  return defaults[blockType] || [
    { name: 'content', type: 'text', label: 'Content' }
  ]
}

const getFieldWidthClass = (width?: string): string => {
  switch (width) {
    case 'half': return 'col-span-1'
    case 'full': return 'col-span-2'
    default: return 'col-span-2'
  }
}

// Transition methods
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
watch(() => props.block?.content, (newContent) => {
  if (newContent) {
    localContent.value = { ...newContent }
    jsonContent.value = JSON.stringify(newContent, null, 2)
  }
}, { deep: true })

// Lifecycle
onMounted(() => {
  jsonContent.value = JSON.stringify(localContent.value, null, 2)
})
</script>

<style scoped>
@reference 'tailwindcss';
/* Block Editor Container */
.block-editor {
  @apply bg-white border border-slate-200 rounded-lg overflow-hidden mb-4 transition-all duration-200;
}

.block-editor:hover {
  @apply shadow-sm;
}

.dark-mode .block-editor {
  @apply bg-gray-800 border-gray-700;
}

/* Block Header */
.block-header {
  @apply flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors;
}

.dark-mode .block-header {
  @apply bg-gray-700 border-gray-600 hover:bg-gray-600;
}

.block-info {
  @apply flex items-center gap-3;
}

.block-details {
  @apply min-w-0 flex-1;
}

.block-title {
  @apply font-medium text-slate-900 text-sm;
}

.dark-mode .block-title {
  @apply text-white;
}

.block-description {
  @apply text-xs text-slate-600 mt-1 truncate;
}

.dark-mode .block-description {
  @apply text-gray-400;
}

.block-actions {
  @apply flex items-center gap-1;
}

.action-button {
  @apply p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors;
}

.action-button.remove-button:hover {
  @apply text-red-600 bg-red-50;
}

.dark-mode .action-button {
  @apply text-gray-400 hover:text-white hover:bg-gray-600;
}

.dark-mode .action-button.remove-button:hover {
  @apply text-red-400 bg-red-900;
}

/* Block Content */
.block-content {
  @apply overflow-hidden transition-all duration-300;
}

.content-preview {
  @apply p-4 bg-gray-50;
}

.dark-mode .content-preview {
  @apply bg-gray-700;
}

.preview-content {
  @apply space-y-2;
}

.preview-title {
  @apply font-medium text-slate-900 text-sm;
}

.dark-mode .preview-title {
  @apply text-white;
}

.preview-text {
  @apply text-xs text-slate-600 line-clamp-2;
}

.dark-mode .preview-text {
  @apply text-gray-400;
}

.empty-preview {
  @apply text-xs text-slate-500 italic;
}

.dark-mode .empty-preview {
  @apply text-gray-500;
}

/* Content Fields */
.content-fields {
  @apply p-4;
}

.fields-grid {
  @apply grid grid-cols-2 gap-4;
}

.field-group {
  @apply space-y-2;
}

.field-label {
  @apply block text-sm font-medium text-slate-700;
}

.dark-mode .field-label {
  @apply text-gray-300;
}

.required-indicator {
  @apply text-red-500;
}

.field-input, .field-textarea {
  @apply w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent;
}

.dark-mode .field-input,
.dark-mode .field-textarea {
  @apply bg-gray-700 border-gray-600 text-white placeholder-gray-400;
}

.field-textarea {
  @apply resize-vertical;
}

.field-color {
  @apply w-20 h-10 border border-slate-300 rounded-md cursor-pointer;
}

.field-checkbox {
  @apply flex items-center gap-2 cursor-pointer;
}

.field-checkbox input[type="checkbox"] {
  @apply rounded;
}

.checkbox-label {
  @apply text-sm text-slate-700;
}

.dark-mode .checkbox-label {
  @apply text-gray-300;
}

.field-help {
  @apply text-xs text-slate-500;
}

.dark-mode .field-help {
  @apply text-gray-400;
}

/* Fallback Editor */
.fallback-editor {
  @apply space-y-2;
}

.json-editor {
  @apply font-mono text-xs;
}

/* Transitions */
.collapse-enter-active,
.collapse-leave-active {
  @apply transition-all duration-300;
}

.collapse-enter-from,
.collapse-leave-to {
  @apply h-0 opacity-0;
}

/* Utility classes */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.col-span-1 {
  grid-column: span 1;
}

.col-span-2 {
  grid-column: span 2;
}
</style>