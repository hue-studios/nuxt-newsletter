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
            rows="4"
          />
          
          <!-- URL Input -->
          <input
            v-else-if="isUrlField(field)"
            v-model="localContent[field]"
            type="url"
            :placeholder="getFieldPlaceholder(field)"
            class="form-input"
          />
          
          <!-- Color Input -->
          <div v-else-if="isColorField(field)" class="color-input-wrapper">
            <input
              v-model="localContent[field]"
              type="color"
              class="color-input"
            />
            <input
              v-model="localContent[field]"
              type="text"
              class="form-input color-text"
              :placeholder="getFieldPlaceholder(field)"
            />
          </div>
          
          <!-- Select Dropdown -->
          <select
            v-else-if="isSelectField(field)"
            v-model="localContent[field]"
            class="form-input"
          >
            <option 
              v-for="option in getFieldOptions(field)" 
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
          
          <!-- Number Input -->
          <input
            v-else-if="isNumberField(field)"
            v-model.number="localContent[field]"
            type="number"
            :placeholder="getFieldPlaceholder(field)"
            class="form-input"
          />
          
          <!-- Default Text Input -->
          <input
            v-else
            v-model="localContent[field]"
            type="text"
            :placeholder="getFieldPlaceholder(field)"
            class="form-input"
          />
        </div>
      </div>

      <div class="form-actions">
        <button @click="saveEdit" class="btn-save">
          Save
        </button>
        <button @click="cancelEdit" class="btn-cancel">
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { NewsletterBlock } from '../composables/useNewsletterEditor';

interface Props {
  block: NewsletterBlock
  blockType?: any
}

const props = defineProps<Props>()

const emit = defineEmits<{
  update: [updates: Partial<NewsletterBlock>]
}>()

// State
const isEditing = ref(false)
const localContent = ref<Record<string, any>>({})

// Get visible fields from block type configuration
const visibleFields = computed(() => {
  return props.blockType?.field_visibility_config || []
})

// Preview fields (first 3-4 important fields)
const previewFields = computed(() => {
  const important = ['title', 'text_content', 'button_text', 'image_url']
  return visibleFields.value
    .filter((field: string) => important.includes(field))
    .slice(0, 3)
})

// Check if block has any content
const hasContent = computed(() => {
  return Object.values(props.block.content || {}).some(value => value)
})

// Field type detection
const isTextField = (field: string) => {
  return ['title', 'subtitle', 'button_text', 'image_alt_text', 
          'event_date', 'event_time', 'event_location', 'price',
          'testimonial_author', 'author_title', 'author_company'].includes(field)
}

const isTextareaField = (field: string) => {
  return ['text_content', 'testimonial_text', 'column1_content', 
          'column2_content', 'column3_content', 'cta_subtitle'].includes(field)
}

const isUrlField = (field: string) => {
  return field.includes('_url') || field === 'url'
}

const isColorField = (field: string) => {
  return field.includes('_color') || field === 'color'
}

const isSelectField = (field: string) => {
  return ['text_align', 'font_size', 'padding'].includes(field)
}

const isNumberField = (field: string) => {
  return ['progress_percentage', 'rating_value', 'rating_max', 'columns'].includes(field)
}

// Field utilities
const formatFieldName = (field: string) => {
  return field
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
}

const getFieldValue = (field: string) => {
  const value = props.block.content?.[field]
  if (typeof value === 'string' && value.length > 50) {
    return value.substring(0, 50) + '...'
  }
  return value
}

const getFieldPlaceholder = (field: string) => {
  const placeholders: Record<string, string> = {
    title: 'Enter title',
    subtitle: 'Enter subtitle',
    text_content: 'Enter your text content...',
    button_text: 'Button label',
    button_url: 'https://example.com',
    image_url: 'https://example.com/image.jpg',
    image_alt_text: 'Describe the image',
    padding: '20px 0',
    background_color: '#ffffff',
    text_color: '#333333'
  }
  return placeholders[field] || `Enter ${formatFieldName(field).toLowerCase()}`
}

const getFieldOptions = (field: string) => {
  const options: Record<string, Array<{value: string, label: string}>> = {
    text_align: [
      { value: 'left', label: 'Left' },
      { value: 'center', label: 'Center' },
      { value: 'right', label: 'Right' }
    ],
    font_size: [
      { value: '12px', label: 'Small (12px)' },
      { value: '14px', label: 'Normal (14px)' },
      { value: '16px', label: 'Large (16px)' },
      { value: '18px', label: 'Extra Large (18px)' }
    ],
    padding: [
      { value: '10px 0', label: 'Small' },
      { value: '20px 0', label: 'Medium' },
      { value: '30px 0', label: 'Large' },
      { value: '40px 0', label: 'Extra Large' }
    ]
  }
  return options[field] || []
}

const getFieldClass = (field: string) => {
  // Full width for textareas and certain fields
  if (isTextareaField(field) || ['text_content', 'testimonial_text', 'mjml_template'].includes(field)) {
    return 'full-width'
  }
  // Half width for most fields
  return 'half-width'
}

// Edit functions
const toggleEdit = () => {
  if (!isEditing.value) {
    // Initialize local content with current values
    localContent.value = { ...props.block.content }
    
    // Set defaults for empty fields
    visibleFields.value.forEach((field: string) => {
      if (!localContent.value[field]) {
        // Set default values based on field type
        if (isColorField(field)) {
          if (field.includes('background')) {
            localContent.value[field] = '#ffffff'
          } else if (field.includes('text')) {
            localContent.value[field] = '#333333'
          } else {
            localContent.value[field] = '#000000'
          }
        } else if (field === 'text_align') {
          localContent.value[field] = 'left'
        } else if (field === 'padding') {
          localContent.value[field] = '20px 0'
        } else if (field === 'font_size') {
          localContent.value[field] = '14px'
        }
      }
    })
  }
  isEditing.value = !isEditing.value
}

const saveEdit = () => {
  emit('update', {
    content: { ...localContent.value }
  })
  isEditing.value = false
}

const cancelEdit = () => {
  localContent.value = {}
  isEditing.value = false
}
</script>

<style scoped>
/* Base styles */
.newsletter-block {
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  overflow: hidden;
}

.block-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #f9fafb;
  border-bottom: 1px solid #e5e5e5;
}

.block-header h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 500;
  color: #333;
}

.edit-toggle {
  padding: 0.375rem 0.75rem;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.edit-toggle:hover {
  background: #f5f5f5;
  border-color: #999;
}

.block-preview {
  padding: 1rem;
}

.preview-field {
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  color: #555;
}

.preview-field strong {
  font-weight: 500;
  margin-right: 0.5rem;
  color: #333;
}

.empty-block {
  padding: 2rem;
  text-align: center;
  color: #999;
  font-style: italic;
}

.block-editor {
  padding: 1rem;
}

.fields-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  display: block;
  margin-bottom: 0.375rem;
  font-weight: 500;
  font-size: 0.875rem;
  color: #333;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
}

.color-input-wrapper {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.color-input {
  width: 50px;
  height: 38px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  padding: 2px;
}

.color-text {
  flex: 1;
}

.form-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e5e5;
}

.btn-save,
.btn-cancel {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.btn-save {
  background: #007bff;
  color: white;
}

.btn-save:hover {
  background: #0056b3;
}

.btn-cancel {
  background: #e5e5e5;
  color: #333;
}

.btn-cancel:hover {
  background: #ddd;
}

/* Responsive */
@media (max-width: 768px) {
  .fields-grid {
    grid-template-columns: 1fr;
  }
  
  .form-group.half-width {
    grid-column: 1;
  }
}
</style>