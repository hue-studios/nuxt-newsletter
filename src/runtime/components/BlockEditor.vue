<!-- Enhanced BlockEditor.vue - Fetches real field schemas from Directus -->
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
        <!-- Loading State -->
        <div v-if="fieldsLoading" class="loading-state">
          <Icon name="lucide:loader-2" class="w-5 h-5 animate-spin" />
          <span>Loading field schema...</span>
        </div>

        <!-- Error State -->
        <div v-else-if="fieldsError" class="error-state">
          <Icon name="lucide:alert-circle" class="w-5 h-5 text-red-500" />
          <span>Failed to load field configuration</span>
          <button @click="retryLoadFields" class="retry-btn">Retry</button>
        </div>

        <!-- Field Editor -->
        <div v-else class="block-fields">
          <div v-for="field in dynamicFields" :key="field.field" :class="getFieldWidth(field)" class="field-wrapper">
            
            <!-- Rich Text Field -->
            <template v-if="isRichTextField(field)">
              <RichTextInput
                :model-value="localContent[field.field] || ''"
                @update:model-value="updateFieldContent(field.field, $event)"
                :label="field.meta?.display_name || field.name || field.field"
                :placeholder="field.meta?.note || `Enter ${field.field}...`"
                :required="field.meta?.required || false"
                :hint="field.meta?.note"
                :features="{
                  headings: true,
                  lists: true,
                  links: true,
                  bold: true,
                  italic: true,
                  alignment: field.meta?.options?.enable_alignment !== false,
                  colors: field.meta?.options?.enable_colors !== false
                }"
              />
            </template>

            <!-- Regular Text Field -->
            <template v-else-if="isTextField(field)">
              <div class="field-group">
                <label class="field-label">
                  {{ field.meta?.display_name || field.name || field.field }}
                  <span v-if="field.meta?.required" class="required">*</span>
                </label>
                <input
                  v-model="localContent[field.field]"
                  type="text"
                  :placeholder="field.meta?.note || `Enter ${field.field}...`"
                  class="form-input"
                  @input="updateContent"
                />
                <p v-if="field.meta?.note" class="field-help">{{ field.meta.note }}</p>
              </div>
            </template>

            <!-- Textarea Field -->
            <template v-else-if="isTextareaField(field)">
              <div class="field-group">
                <label class="field-label">
                  {{ field.meta?.display_name || field.name || field.field }}
                  <span v-if="field.meta?.required" class="required">*</span>
                </label>
                <textarea
                  v-model="localContent[field.field]"
                  :placeholder="field.meta?.note || `Enter ${field.field}...`"
                  rows="4"
                  class="form-textarea"
                  @input="updateContent"
                ></textarea>
                <p v-if="field.meta?.note" class="field-help">{{ field.meta.note }}</p>
              </div>
            </template>

            <!-- Number Field -->
            <template v-else-if="isNumberField(field)">
              <div class="field-group">
                <label class="field-label">
                  {{ field.meta?.display_name || field.name || field.field }}
                  <span v-if="field.meta?.required" class="required">*</span>
                </label>
                <input
                  v-model.number="localContent[field.field]"
                  type="number"
                  :placeholder="field.meta?.note || `Enter ${field.field}...`"
                  class="form-input"
                  @input="updateContent"
                />
                <p v-if="field.meta?.note" class="field-help">{{ field.meta.note }}</p>
              </div>
            </template>

            <!-- Color Field -->
            <template v-else-if="isColorField(field)">
              <div class="field-group">
                <label class="field-label">
                  {{ field.meta?.display_name || field.name || field.field }}
                  <span v-if="field.meta?.required" class="required">*</span>
                </label>
                <div class="color-picker-container">
                  <input
                    v-model="localContent[field.field]"
                    type="color"
                    class="color-input"
                    @input="updateContent"
                  />
                  <input
                    v-model="localContent[field.field]"
                    type="text"
                    :placeholder="field.meta?.note || '#000000'"
                    class="color-text-input"
                    @input="updateContent"
                  />
                </div>
                <p v-if="field.meta?.note" class="field-help">{{ field.meta.note }}</p>
              </div>
            </template>

            <!-- Boolean/Switch Field -->
            <template v-else-if="isBooleanField(field)">
              <div class="field-group">
                <label class="switch-container">
                  <input
                    v-model="localContent[field.field]"
                    type="checkbox"
                    class="switch-input"
                    @change="updateContent"
                  />
                  <span class="switch-slider"></span>
                  <span class="switch-label">{{ field.meta?.display_name || field.name || field.field }}</span>
                </label>
                <p v-if="field.meta?.note" class="field-help">{{ field.meta.note }}</p>
              </div>
            </template>

            <!-- File/Image Field -->
            <template v-else-if="isFileField(field)">
              <div class="field-group">
                <label class="field-label">
                  {{ field.meta?.display_name || field.name || field.field }}
                  <span v-if="field.meta?.required" class="required">*</span>
                </label>
                <input
                  v-model="localContent[field.field]"
                  type="text"
                  :placeholder="field.meta?.note || 'File ID or URL'"
                  class="form-input"
                  @input="updateContent"
                />
                <p v-if="field.meta?.note" class="field-help">{{ field.meta.note }}</p>
              </div>
            </template>

            <!-- Fallback for Unknown Fields -->
            <template v-else>
              <div class="field-group">
                <label class="field-label">
                  {{ field.meta?.display_name || field.name || field.field }}
                  <span v-if="field.meta?.required" class="required">*</span>
                </label>
                <input
                  v-model="localContent[field.field]"
                  type="text"
                  :placeholder="field.meta?.note || `Enter ${field.field}...`"
                  class="form-input"
                  @input="updateContent"
                />
                <p v-if="field.meta?.note" class="field-help">{{ field.meta.note }}</p>
                <p class="text-xs text-amber-600">
                  Unknown field type: {{ field.type }} / {{ field.meta?.interface }}
                </p>
              </div>
            </template>

          </div>
        </div>

        <!-- MJML Preview (if enabled) -->
        <div v-if="showPreview && blockType?.mjml_template" class="block-preview">
          <div class="preview-header">
            <h5>MJML Preview</h5>
            <button @click="refreshPreview" :disabled="isRefreshing" class="refresh-btn">
              <Icon name="lucide:refresh-cw" :class="{ 'animate-spin': isRefreshing }" />
            </button>
          </div>
          <div class="preview-content" v-html="compiledHtml"></div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { BlockType, NewsletterBlock } from '../../types'

interface DirectusField {
  field: string
  name?: string
  type: string
  meta?: {
    interface?: string
    display_name?: string
    required?: boolean
    note?: string
    width?: string
    options?: Record<string, any>
  }
  schema?: {
    is_nullable?: boolean
  }
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
const fieldsLoading = ref(false)
const fieldsError = ref(false)
const directusFields = ref<DirectusField[]>([])

// Composables
const { fetchCollectionFields } = useDirectusNewsletter()
const { compileMjmlToHtml } = useMjmlCompiler()

// Helper functions to determine field types based on Directus schema
const isRichTextField = (field: DirectusField) => {
  return field.meta?.interface === 'wysiwyg' || 
         field.meta?.interface === 'rich-text-html' ||
         field.meta?.interface === 'input-rich-text-html' ||
         (field.type === 'text' && field.meta?.interface === 'input-rich-text-md')
}

const isTextField = (field: DirectusField) => {
  return field.meta?.interface === 'input' && field.type === 'string'
}

const isTextareaField = (field: DirectusField) => {
  return field.meta?.interface === 'input-multiline' || 
         (field.meta?.interface === 'textarea' && !isRichTextField(field))
}

const isNumberField = (field: DirectusField) => {
  return field.type === 'integer' || field.type === 'float' || field.type === 'decimal'
}

const isColorField = (field: DirectusField) => {
  return field.meta?.interface === 'select-color' || 
         field.meta?.interface === 'color'
}

const isBooleanField = (field: DirectusField) => {
  return field.type === 'boolean' || field.meta?.interface === 'boolean'
}

const isFileField = (field: DirectusField) => {
  return field.meta?.interface === 'file-image' || 
         field.meta?.interface === 'files' ||
         field.type === 'uuid' && field.field.includes('image')
}

const getFieldWidth = (field: DirectusField) => {
  const width = field.meta?.width
  switch (width) {
    case 'half': return 'w-1/2'
    case 'third': return 'w-1/3'
    case 'quarter': return 'w-1/4'
    case 'full': return 'w-full'
    default: return 'w-full'
  }
}

// Get dynamic fields based on block type configuration and actual Directus schema
const dynamicFields = computed(() => {
  if (!props.blockType?.field_visibility_config || directusFields.value.length === 0) {
    return []
  }
  
  return props.blockType.field_visibility_config
    .map(fieldKey => directusFields.value.find(f => f.field === fieldKey))
    .filter(Boolean) as DirectusField[]
})

// Load field schemas from Directus
const loadFieldSchemas = async () => {
  if (!props.blockType?.field_visibility_config) return

  fieldsLoading.value = true
  fieldsError.value = false

  try {
    // Fetch field schemas from the newsletter_blocks collection
    // This assumes your block content fields are defined in the newsletter_blocks collection
    const fields = await fetchCollectionFields('newsletter_blocks')
    directusFields.value = fields.filter(field => 
      props.blockType?.field_visibility_config?.includes(field.field)
    )
  } catch (error) {
    console.error('Failed to load field schemas:', error)
    fieldsError.value = true
  } finally {
    fieldsLoading.value = false
  }
}

const retryLoadFields = () => {
  loadFieldSchemas()
}

// Component methods
const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}

const togglePreview = () => {
  showPreview.value = !showPreview.value
  if (showPreview.value) {
    refreshPreview()
  }
}

const removeBlock = () => {
  emit('remove', props.block.id)
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

const refreshPreview = async () => {
  if (!props.blockType?.mjml_template) return

  isRefreshing.value = true
  try {
    // Simple template replacement - you might want more sophisticated templating
    let mjml = props.blockType.mjml_template
    Object.entries(localContent.value).forEach(([key, value]) => {
      mjml = mjml.replace(new RegExp(`{{${key}}}`, 'g'), String(value || ''))
    })

    const result = await compileMjmlToHtml(mjml)
    compiledHtml.value = result.html || ''
  } catch (error) {
    console.error('Preview compilation failed:', error)
  } finally {
    isRefreshing.value = false
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

// Watch for block type changes
watch(
  () => props.blockType,
  (newBlockType) => {
    if (newBlockType) {
      loadFieldSchemas()
    }
  },
  { immediate: true }
)

// Watch for content changes from parent
watch(
  () => props.block.content,
  (newContent) => {
    localContent.value = { ...newContent }
  },
  { deep: true }
)

// Load fields on mount
onMounted(() => {
  if (props.blockType) {
    loadFieldSchemas()
  }
})
</script>

<style scoped>
@reference 'tailwindcss';
/* Enhanced styles for the improved block editor */
.block-editor {
  @apply bg-white border border-slate-200 rounded-lg overflow-hidden mb-4;
}

.block-header {
  @apply flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors;
}

.block-title {
  @apply font-medium text-slate-900;
}

.block-description {
  @apply text-sm text-slate-600 mt-1;
}

.preview-toggle, .expand-toggle, .remove-button {
  @apply p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors;
}

.preview-toggle.active {
  @apply bg-blue-100 text-blue-700;
}

.remove-button:hover {
  @apply text-red-600 bg-red-50;
}

.block-content {
  @apply overflow-hidden transition-all duration-300;
}

.loading-state, .error-state {
  @apply flex items-center gap-2 p-4 text-slate-600;
}

.error-state {
  @apply text-red-600;
}

.retry-btn {
  @apply ml-2 px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors;
}

.block-fields {
  @apply p-4 space-y-4;
}

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

.form-input, .form-textarea {
  @apply block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all;
}

.color-picker-container {
  @apply flex gap-2;
}

.color-input {
  @apply w-12 h-10 border border-slate-300 rounded cursor-pointer;
}

.color-text-input {
  @apply flex-1 px-3 py-2 border border-slate-300 rounded shadow-sm;
}

.switch-container {
  @apply flex items-center gap-3 cursor-pointer;
}

.switch-input {
  @apply sr-only;
}

.switch-slider {
  @apply relative w-10 h-6 bg-slate-300 rounded-full transition-colors;
}

.switch-input:checked + .switch-slider {
  @apply bg-blue-600;
}

.switch-slider::before {
  @apply absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform;
  content: '';
}

.switch-input:checked + .switch-slider::before {
  @apply translate-x-4;
}

.field-help {
  @apply text-xs text-slate-500;
}

.block-preview {
  @apply border-t border-slate-200 bg-slate-50;
}

.preview-header {
  @apply flex items-center justify-between p-3 border-b border-slate-200;
}

.preview-header h5 {
  @apply font-medium text-slate-900;
}

.refresh-btn {
  @apply p-1 text-slate-600 hover:text-slate-900 rounded transition-colors;
}

.preview-content {
  @apply p-4 bg-white max-h-64 overflow-auto;
}

/* Collapse transition */
.collapse-enter-active, .collapse-leave-active {
  @apply transition-all duration-300;
}

.collapse-enter-from, .collapse-leave-to {
  @apply h-0;
}
</style>