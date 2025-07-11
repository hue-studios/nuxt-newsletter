<template>
  <div class="button-block" :class="containerClasses">
    <div v-if="!isEditing" class="button-preview" :style="wrapperStyles">
      <a 
        :href="buttonUrl || '#'"
        @click.prevent="startEdit"
        class="newsletter-button"
        :style="buttonStyles"
      >
        {{ buttonText || 'Click to edit button' }}
      </a>
    </div>

    <div v-if="isEditing" class="button-editor" :class="editorClasses">
      <div class="form-group">
        <label>Button Text</label>
        <input
          v-model="localText"
          type="text"
          placeholder="Click me!"
          class="form-input"
          :class="inputClasses"
        />
      </div>

      <div class="form-group">
        <label>Link URL</label>
        <input
          v-model="localUrl"
          type="url"
          placeholder="https://example.com"
          class="form-input"
          :class="inputClasses"
        />
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Style</label>
          <select v-model="localStyle" class="form-input" :class="inputClasses">
            <option value="primary">Primary</option>
            <option value="secondary">Secondary</option>
            <option value="outline">Outline</option>
            <option value="ghost">Ghost</option>
          </select>
        </div>

        <div class="form-group">
          <label>Size</label>
          <select v-model="localSize" class="form-input" :class="inputClasses">
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Alignment</label>
          <select v-model="localAlign" class="form-input" :class="inputClasses">
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
            <option value="full">Full Width</option>
          </select>
        </div>

        <div class="form-group">
          <label>Corners</label>
          <select v-model="localCorners" class="form-input" :class="inputClasses">
            <option value="square">Square</option>
            <option value="rounded">Rounded</option>
            <option value="pill">Pill</option>
          </select>
        </div>
      </div>

      <details class="advanced-section">
        <summary>Advanced Options</summary>
        <div class="form-row">
          <div class="form-group">
            <label>Background Color</label>
            <input
              v-model="localBgColor"
              type="color"
              class="color-input"
            />
          </div>
          <div class="form-group">
            <label>Text Color</label>
            <input
              v-model="localTextColor"
              type="color"
              class="color-input"
            />
          </div>
        </div>
      </details>

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
const localText = ref('')
const localUrl = ref('')
const localStyle = ref('primary')
const localSize = ref('medium')
const localAlign = ref('center')
const localCorners = ref('rounded')
const localBgColor = ref('#3b82f6')
const localTextColor = ref('#ffffff')

// Computed values from block
const buttonText = computed(() => props.block.content?.text || '')
const buttonUrl = computed(() => props.block.content?.url || '#')
const buttonStyle = computed(() => props.block.content?.style || 'primary')
const buttonSize = computed(() => props.block.content?.size || 'medium')
const buttonAlign = computed(() => props.block.content?.align || 'center')
const buttonCorners = computed(() => props.block.content?.corners || 'rounded')
const buttonBgColor = computed(() => props.block.content?.bgColor || '#3b82f6')
const buttonTextColor = computed(() => props.block.content?.textColor || '#ffffff')

// Button styles
const buttonStyles = computed(() => {
  const baseStyles = {
    display: 'inline-block',
    textDecoration: 'none',
    fontWeight: '500',
    textAlign: 'center' as const,
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: '2px solid transparent'
  }

  // Size styles
  const sizeStyles = {
    small: { padding: '0.5rem 1rem', fontSize: '0.875rem' },
    medium: { padding: '0.75rem 1.5rem', fontSize: '1rem' },
    large: { padding: '1rem 2rem', fontSize: '1.125rem' }
  }

  // Corner styles
  const cornerStyles = {
    square: { borderRadius: '0' },
    rounded: { borderRadius: '0.375rem' },
    pill: { borderRadius: '9999px' }
  }

  // Style variants
  const styleVariants = {
    primary: {
      backgroundColor: buttonBgColor.value,
      color: buttonTextColor.value,
      border: `2px solid ${buttonBgColor.value}`
    },
    secondary: {
      backgroundColor: '#6b7280',
      color: '#ffffff',
      border: '2px solid #6b7280'
    },
    outline: {
      backgroundColor: 'transparent',
      color: buttonBgColor.value,
      border: `2px solid ${buttonBgColor.value}`
    },
    ghost: {
      backgroundColor: 'transparent',
      color: buttonBgColor.value,
      border: '2px solid transparent'
    }
  }

  return {
    ...baseStyles,
    ...sizeStyles[buttonSize.value as keyof typeof sizeStyles],
    ...cornerStyles[buttonCorners.value as keyof typeof cornerStyles],
    ...styleVariants[buttonStyle.value as keyof typeof styleVariants]
  }
})

const wrapperStyles = computed(() => {
  const alignments = {
    left: { textAlign: 'left' },
    center: { textAlign: 'center' },
    right: { textAlign: 'right' },
    full: { textAlign: 'center' }
  }

  const base = alignments[buttonAlign.value as keyof typeof alignments] || alignments.center

  if (buttonAlign.value === 'full') {
    return {
      ...base,
      '& .newsletter-button': {
        width: '100%'
      }
    }
  }

  return base
})

// Methods
const startEdit = () => {
  localText.value = buttonText.value
  localUrl.value = buttonUrl.value
  localStyle.value = buttonStyle.value
  localSize.value = buttonSize.value
  localAlign.value = buttonAlign.value
  localCorners.value = buttonCorners.value
  localBgColor.value = buttonBgColor.value
  localTextColor.value = buttonTextColor.value
  isEditing.value = true
}

const saveEdit = () => {
  emit('update', {
    content: {
      text: localText.value,
      url: localUrl.value,
      style: localStyle.value,
      size: localSize.value,
      align: localAlign.value,
      corners: localCorners.value,
      bgColor: localBgColor.value,
      textColor: localTextColor.value
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
.button-block {
  position: relative;
}

.button-preview {
  padding: 1rem 0;
}

.newsletter-button {
  /* Styles applied via computed property */
}

.newsletter-button:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.button-editor {
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

.advanced-section {
  margin: 1rem 0;
  padding: 1rem;
  background: white;
  border-radius: 4px;
}

.advanced-section summary {
  cursor: pointer;
  font-weight: 500;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
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

/* Full width button style */
.button-preview[style*="text-align: center"] .newsletter-button {
  width: 100%;
}
</style>