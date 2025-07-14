<template>
  <div class="newsletter-block">
    <div class="block-header">
      <h4>{{ blockType?.name || 'Block' }}</h4>
      <button @click="toggleEdit" class="edit-toggle">
        {{ isEditing ? 'Close' : 'Edit' }}
      </button>
    </div>

    <div v-if="!isEditing && hasContent" class="block-preview">
      <div class="preview-content">
        <div v-for="field in previewFields" :key="field" class="preview-field">
          <strong>{{ formatFieldName(field) }}:</strong>
          {{ getFieldValue(field) || '(empty)' }}
        </div>
      </div>
    </div>

    <div v-if="!isEditing && !hasContent" class="empty-block">
      Click Edit to add content
    </div>

    <div v-if="isEditing" class="block-editor">
      <div class="fields-grid">
        <div
          v-for="field in visibleFields"
          :key="field"
          class="form-group"
          :class="getFieldClass(field)"
        >
          <label>{{ formatFieldName(field) }}</label>

          <!-- Text Input -->
          <input
            v-if="isTextField(field)"
            v-model="localContent[field]"
            type="text"
            :placeholder="getFieldPlaceholder(field)"
            class="form-input"
          />

          <!-- Textarea -->
          <textarea
            v-else-if="isTextareaField(field)"
            v-model="localContent[field]"
            :placeholder="getFieldPlaceholder(field)"
            class="form-textarea"
          ></textarea>

          <!-- Color Input -->
          <div v-else-if="isColorField(field)" class="color-input-wrapper">
            <input
              type="color"
              v-model="localContent[field]"
              class="color-input"
            />
            <input
              type="text"
              v-model="localContent[field]"
              :placeholder="getFieldPlaceholder(field)"
              class="form-input flex-grow"
            />
          </div>

          <!-- Image Upload Component -->
          <ImageUpload
            v-else-if="isImageField(field)"
            v-model="localContent[field]"
            :label="formatFieldName(field)"
            @error="handleImageUploadError"
          />

          <!-- Fallback for unknown field type -->
          <div v-else class="text-red-500 text-sm">
            Unknown field type for '{{ field }}'
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import type { BlockType, NewsletterBlock as NewsletterBlockType } from '../../types';
import ImageUpload from './ImageUpload.vue';

interface Props {
  block: NewsletterBlockType
  blockType: BlockType
}

const props = defineProps<Props>()
const emit = defineEmits(['update'])

const isEditing = ref(false)
const localContent = ref<Record<string, any>>({})

// Initialize localContent from prop.block.content
onMounted(() => {
  localContent.value = { ...props.block.content }
})

// Watch for changes in prop.block.content and update localContent
watch(() => props.block.content, (newContent) => {
  localContent.value = { ...newContent }
}, { deep: true })

// Emit updates to parent when localContent changes
watch(localContent, (newVal) => {
  emit('update', { content: newVal })
}, { deep: true })

const toggleEdit = () => {
  isEditing.value = !isEditing.value
}

// FIXED: Add the missing hasContent computed property
const hasContent = computed(() => {
  if (!localContent.value || typeof localContent.value !== 'object') {
    return false
  }
  
  return Object.values(localContent.value).some(value => {
    if (typeof value === 'string') {
      return value.trim().length > 0
    }
    if (typeof value === 'number') {
      return true
    }
    if (Array.isArray(value)) {
      return value.length > 0
    }
    return value != null && value !== ''
  })
})

// Determine which fields to show in the editor based on blockType.field_visibility_config
const visibleFields = computed(() => {
  return props.blockType?.field_visibility_config || []
})

// Determine which fields to show in the preview
const previewFields = computed(() => {
  return visibleFields.value
})

const formatFieldName = (field: string) => {
  return field.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

const getFieldValue = (field: string) => {
  if (field === 'image_url' && localContent.value[field]) {
    return `Image ID: ${localContent.value[field].substring(0, 8)}...`;
  }
  return localContent.value[field]
}

const getFieldPlaceholder = (field: string) => {
  const placeholders: Record<string, string> = {
    title: 'Enter title',
    subtitle: 'Enter subtitle',
    text_content: 'Enter text content',
    button_text: 'Button text',
    button_url: 'https://example.com',
    background_color: '#FFFFFF',
    text_color: '#000000',
    image_url: 'Directus File ID'
  }
  return placeholders[field] || `Enter ${formatFieldName(field).toLowerCase()}`
}

const getFieldClass = (field: string) => {
  if (field === 'text_content' || field === 'mjml_output') {
    return 'full-width'
  }
  return ''
}

const isTextField = (field: string) => {
  return ![
    'text_content',
    'background_color',
    'text_color',
    'image_url'
  ].includes(field) && (
    typeof localContent.value[field] === 'string' || 
    field.includes('_url') || 
    field.includes('_text') || 
    field.includes('title') || 
    field.includes('subtitle')
  )
}

const isTextareaField = (field: string) => {
  return field === 'text_content' || field === 'mjml_output'
}

const isColorField = (field: string) => {
  return field === 'background_color' || field === 'text_color'
}

const isImageField = (field: string) => {
  return field === 'image_url'
}

const handleImageUploadError = (message: string) => {
  console.error('Image upload error in block:', message)
}
</script>

<style scoped>
@reference 'tailwindcss';
/* Your existing styles */
.newsletter-block {
  @apply bg-white rounded-lg shadow-sm border border-gray-200 mb-4;
}

.block-header {
  @apply flex justify-between items-center p-3 border-b border-gray-200 bg-gray-50 rounded-t-lg;
}

.block-header h4 {
  @apply text-sm font-semibold text-gray-800 m-0;
}

.edit-toggle {
  @apply px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors;
}

.block-preview {
  @apply p-4 text-sm text-gray-700;
}

.preview-content {
  @apply space-y-2;
}

.preview-field {
  @apply flex items-start;
}

.preview-field strong {
  @apply min-w-[80px] text-gray-600 mr-2;
}

.empty-block {
  @apply text-center text-sm text-gray-500 py-6;
}

.block-editor {
  @apply p-4;
}

.fields-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-4;
}

.form-group {
  @apply mb-1;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  @apply block text-sm font-medium text-gray-700 mb-1;
}

.form-input,
.form-textarea {
  @apply block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors;
}

.form-textarea {
  @apply resize-y min-h-[80px];
}

.color-input-wrapper {
  @apply flex items-center space-x-2;
}

.color-input {
  @apply w-10 h-10 p-1 border border-gray-300 rounded-md cursor-pointer;
}
</style>