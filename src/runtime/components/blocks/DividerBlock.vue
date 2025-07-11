<template>
  <div class="divider-block" :class="containerClasses">
    <div 
      class="divider-line" 
      :style="dividerStyles"
      @click="toggleEdit"
    />
    
    <div v-if="isEditing" class="divider-editor" :class="editorClasses">
      <div class="form-row">
        <div class="form-group">
          <label>Style</label>
          <select v-model="localStyle" class="form-input" :class="inputClasses">
            <option value="solid">Solid</option>
            <option value="dashed">Dashed</option>
            <option value="dotted">Dotted</option>
            <option value="double">Double</option>
          </select>
        </div>

        <div class="form-group">
          <label>Thickness</label>
          <input
            v-model.number="localHeight"
            type="number"
            min="1"
            max="10"
            class="form-input"
            :class="inputClasses"
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Width</label>
          <select v-model="localWidth" class="form-input" :class="inputClasses">
            <option value="100%">Full Width</option>
            <option value="75%">75%</option>
            <option value="50%">50%</option>
            <option value="25%">25%</option>
          </select>
        </div>

        <div class="form-group">
          <label>Alignment</label>
          <select v-model="localAlign" class="form-input" :class="inputClasses">
            <option value="center">Center</option>
            <option value="left">Left</option>
            <option value="right">Right</option>
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Color</label>
          <input
            v-model="localColor"
            type="color"
            class="color-input"
          />
        </div>

        <div class="form-group">
          <label>Margin</label>
          <select v-model="localMargin" class="form-input" :class="inputClasses">
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
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
const localStyle = ref('solid')
const localHeight = ref(1)
const localColor = ref('#e5e7eb')
const localWidth = ref('100%')
const localAlign = ref('center')
const localMargin = ref('medium')

// Computed values
const dividerStyle = computed(() => props.block.content?.style || 'solid')
const dividerHeight = computed(() => props.block.content?.height || 1)
const dividerColor = computed(() => props.block.content?.color || '#e5e7eb')
const dividerWidth = computed(() => props.block.content?.width || '100%')
const dividerAlign = computed(() => props.block.content?.align || 'center')
const dividerMargin = computed(() => props.block.content?.margin || 'medium')

// Margin sizes
const marginSizes = {
  small: '1rem',
  medium: '2rem',
  large: '3rem'
}

// Divider styles
const dividerStyles = computed(() => {
  const alignmentMargin = dividerAlign.value === 'center' ? '0 auto' :
                          dividerAlign.value === 'right' ? '0 0 0 auto' : '0'
  
  return {
    borderTop: `${dividerHeight.value}px ${dividerStyle.value} ${dividerColor.value}`,
    width: dividerWidth.value,
    margin: `${marginSizes[dividerMargin.value as keyof typeof marginSizes]} ${alignmentMargin} ${marginSizes[dividerMargin.value as keyof typeof marginSizes]}`,
    cursor: 'pointer'
  }
})

// Methods
const toggleEdit = () => {
  if (!isEditing.value) {
    localStyle.value = dividerStyle.value
    localHeight.value = dividerHeight.value
    localColor.value = dividerColor.value
    localWidth.value = dividerWidth.value
    localAlign.value = dividerAlign.value
    localMargin.value = dividerMargin.value
  }
  isEditing.value = !isEditing.value
}

const saveEdit = () => {
  emit('update', {
    content: {
      style: localStyle.value,
      height: localHeight.value,
      color: localColor.value,
      width: localWidth.value,
      align: localAlign.value,
      margin: localMargin.value
    }
  })
  isEditing.value = false
}

const cancelEdit = () => {
  isEditing.value = false
}

// Styling classes
const containerClasses = computed(() => {
  if (props.styling === 'tailwind') {
    return 'relative'
  }
  return ''
})

const editorClasses = computed(() => {
  if (props.styling === 'tailwind') {
    return 'mt-4 p-4 bg-gray-50 rounded-lg'
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
.divider-block {
  position: relative;
}

.divider-line {
  transition: opacity 0.2s;
}

.divider-line:hover {
  opacity: 0.7;
}

.divider-editor {
  margin-top: 1rem;
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

.color-input {
  width: 100%;
  height: 40px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  cursor: pointer;
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