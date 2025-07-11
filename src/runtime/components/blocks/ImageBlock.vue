<template>
  <div class="image-block" :class="containerClasses">
    <div v-if="!imageUrl && !isEditing" @click="startEdit" class="empty-state" :class="emptyStateClasses">
      <div class="empty-icon">🖼️</div>
      <p>Click to add image</p>
    </div>

    <div v-else-if="imageUrl && !isEditing" class="image-preview" :class="previewClasses">
      <img 
        :src="imageUrl" 
        :alt="imageAlt"
        :style="imageStyles"
        @click="startEdit"
      />
    </div>

    <div v-if="isEditing" class="image-editor" :class="editorClasses">
      <div class="form-group">
        <label>Image URL</label>
        <input
          v-model="localUrl"
          type="url"
          placeholder="https://example.com/image.jpg"
          class="form-input"
          :class="inputClasses"
        />
      </div>

      <div class="form-group">
        <label>Alt Text (for accessibility)</label>
        <input
          v-model="localAlt"
          type="text"
          placeholder="Describe the image"
          class="form-input"
          :class="inputClasses"
        />
      </div>

      <div class="form-group">
        <label>Link URL (optional)</label>
        <input
          v-model="localLink"
          type="url"
          placeholder="https://example.com"
          class="form-input"
          :class="inputClasses"
        />
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Width</label>
          <input
            v-model="localWidth"
            type="text"
            placeholder="100%"
            class="form-input"
            :class="inputClasses"
          />
        </div>

        <div class="form-group">
          <label>Alignment</label>
          <select v-model="localAlign" class="form-input" :class="inputClasses">
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>
      </div>

      <div class="form-actions">
        <button @click="saveEdit" class="btn-save" :class="saveButtonClasses">
          Save
        </button>
        <button @click="cancelEdit" class="btn-cancel" :class="cancelButtonClasses">
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { NewsletterBlock } from '../../composables/useNewsletterEditor';

interface Props {
  block: NewsletterBlock
  styling?: 'tailwind' | 'unstyled' | 'custom'
}

const props = withDefaults(defineProps<Props>(), {
  styling: 'unstyled'
})

const emit = defineEmits<{
  update: [updates: Partial<NewsletterBlock>]
}>()

// State
const isEditing = ref(false)
const localUrl = ref('')
const localAlt = ref('')
const localLink = ref('')
const localWidth = ref('100%')
const localAlign = ref('center')

// Computed
const imageUrl = computed(() => props.block.content?.src || '')
const imageAlt = computed(() => props.block.content?.alt || '')
const imageLink = computed(() => props.block.content?.link || '')
const imageWidth = computed(() => props.block.content?.width || '100%')
const imageAlign = computed(() => props.block.content?.align || 'center')

const imageStyles = computed(() => ({
  width: imageWidth.value,
  maxWidth: '100%',
  height: 'auto',
  display: 'block',
  margin: imageAlign.value === 'center' ? '0 auto' : 
          imageAlign.value === 'right' ? '0 0 0 auto' : '0'
}))

// Methods
const startEdit = () => {
  localUrl.value = imageUrl.value
  localAlt.value = imageAlt.value
  localLink.value = imageLink.value
  localWidth.value = imageWidth.value
  localAlign.value = imageAlign.value
  isEditing.value = true
}

const saveEdit = () => {
  emit('update', {
    content: {
      src: localUrl.value,
      alt: localAlt.value,
      link: localLink.value,
      width: localWidth.value,
      align: localAlign.value
    }
  })
  isEditing.value = false
}

const cancelEdit = () => {
  isEditing.value = false
}

// Styling
const containerClasses = computed(() => {
  if (props.styling === 'tailwind') {
    return 'relative'
  }
  return ''
})

const emptyStateClasses = computed(() => {
  if (props.styling === 'tailwind') {
    return 'flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors'
  }
  return ''
})

const previewClasses = computed(() => {
  if (props.styling === 'tailwind') {
    return 'cursor-pointer group'
  }
  return ''
})

const editorClasses = computed(() => {
  if (props.styling === 'tailwind') {
    return 'p-4 bg-gray-50 rounded-lg'
  }
  return ''
})

const inputClasses = computed(() => {
  if (props.styling === 'tailwind') {
    return 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
  }
  return ''
})

const saveButtonClasses = computed(() => {
  if (props.styling === 'tailwind') {
    return 'px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors'
  }
  return ''
})

const cancelButtonClasses = computed(() => {
  if (props.styling === 'tailwind') {
    return 'px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors'
  }
  return ''
})
</script>

<style scoped>
/* Base styles */
.image-block {
  position: relative;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  border: 2px dashed #e5e5e5;
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.2s;
}

.empty-state:hover {
  border-color: #d1d5db;
}

.empty-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.empty-state p {
  margin: 0;
  color: #6b7280;
}

.image-preview {
  cursor: pointer;
  position: relative;
}

.image-preview img {
  max-width: 100%;
  height: auto;
  display: block;
}

.image-preview:hover::after {
  content: 'Click to edit';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.875rem;
  white-space: nowrap;
}

.image-editor {
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.25rem;
  font-weight: 500;
  font-size: 0.875rem;
}

.form-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.btn-save,
.btn-cancel {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-save {
  background: #3b82f6;
  color: white;
}

.btn-save:hover {
  background: #2563eb;
}

.btn-cancel {
  background: #e5e7eb;
  color: #374151;
}

.btn-cancel:hover {
  background: #d1d5db;
}
</style>