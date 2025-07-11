<template>
  <div class="columns-block" :class="containerClasses">
    <div v-if="!isEditing" class="columns-preview" :style="columnsStyles">
      <div
        v-for="(column, index) in columns"
        :key="index"
        class="column"
        :style="columnStyles"
        @click="editColumn(index)"
      >
        <div v-if="column.content" class="column-content" v-html="column.content" />
        <div v-else class="column-placeholder">
          Click to add content
        </div>
      </div>
    </div>

    <div v-if="isEditing" class="columns-editor" :class="editorClasses">
      <div class="editor-header">
        <h4>Column Layout</h4>
        <button @click="isEditing = false" class="close-btn">✕</button>
      </div>

      <div class="form-group">
        <label>Number of Columns</label>
        <select v-model.number="localColumns" @change="updateColumnCount" class="form-input" :class="inputClasses">
          <option :value="2">2 Columns</option>
          <option :value="3">3 Columns</option>
          <option :value="4">4 Columns</option>
        </select>
      </div>

      <div class="form-group">
        <label>Gap Between Columns</label>
        <input
          v-model.number="localGap"
          type="number"
          min="0"
          max="50"
          step="5"
          class="form-input"
          :class="inputClasses"
        />
        <span class="input-suffix">px</span>
      </div>

      <div class="form-group">
        <label>Mobile Behavior</label>
        <select v-model="localMobileStack" class="form-input" :class="inputClasses">
          <option value="stack">Stack Vertically</option>
          <option value="scroll">Horizontal Scroll</option>
          <option value="keep">Keep Columns</option>
        </select>
      </div>

      <div class="columns-content-editor">
        <h5>Column Content</h5>
        <div class="column-tabs">
          <button
            v-for="(column, index) in localContent"
            :key="index"
            @click="activeColumn = index"
            class="column-tab"
            :class="{ active: activeColumn === index }"
          >
            Column {{ index + 1 }}
          </button>
        </div>

        <div v-if="localContent[activeColumn]" class="column-editor">
          <textarea
            v-model="localContent[activeColumn].content"
            placeholder="Enter column content (HTML supported)"
            class="content-textarea"
            :class="textareaClasses"
            rows="6"
          />
          <div class="content-tips">
            <small>Tips: Use &lt;strong&gt; for bold, &lt;em&gt; for italic, &lt;a href=""&gt; for links</small>
          </div>
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
import { computed, ref } from 'vue'
import type { NewsletterBlock } from '../../composables/useNewsletterEditor'

interface ColumnContent {
  content: string
}

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
const activeColumn = ref(0)
const localColumns = ref(2)
const localGap = ref(20)
const localMobileStack = ref('stack')
const localContent = ref<ColumnContent[]>([])

// Computed
const columnCount = computed(() => props.block.content?.columns || 2)
const gap = computed(() => props.block.content?.gap || 20)
const mobileStack = computed(() => props.block.content?.mobileStack || 'stack')
const columns = computed(() => {
  const content = props.block.content?.content || []
  const count = columnCount.value
  
  // Ensure we always have the right number of columns
  const result: ColumnContent[] = []
  for (let i = 0; i < count; i++) {
    result.push(content[i] || { content: '' })
  }
  return result
})

// Styles
const columnsStyles = computed(() => ({
  display: 'flex',
  gap: `${gap.value}px`,
  alignItems: 'flex-start'
}))

const columnStyles = computed(() => ({
  flex: 1,
  minHeight: '100px',
  padding: '1rem',
  backgroundColor: '#f9fafb',
  borderRadius: '4px',
  cursor: 'pointer',
  transition: 'background-color 0.2s'
}))

// Methods
const editColumn = (index: number) => {
  startEdit()
  activeColumn.value = index
}

const startEdit = () => {
  localColumns.value = columnCount.value
  localGap.value = gap.value
  localMobileStack.value = mobileStack.value
  localContent.value = columns.value.map(col => ({ ...col }))
  isEditing.value = true
}

const updateColumnCount = () => {
  const currentLength = localContent.value.length
  const newCount = localColumns.value
  
  if (newCount > currentLength) {
    // Add empty columns
    for (let i = currentLength; i < newCount; i++) {
      localContent.value.push({ content: '' })
    }
  } else if (newCount < currentLength) {
    // Remove extra columns
    localContent.value = localContent.value.slice(0, newCount)
    // Adjust active column if necessary
    if (activeColumn.value >= newCount) {
      activeColumn.value = newCount - 1
    }
  }
}

const saveEdit = () => {
  emit('update', {
    content: {
      columns: localColumns.value,
      gap: localGap.value,
      mobileStack: localMobileStack.value,
      content: localContent.value
    }
  })
  isEditing.value = false
}

const cancelEdit = () => {
  isEditing.value = false
  activeColumn.value = 0
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
    return 'p-4 bg-white border border-gray-200 rounded-lg shadow-sm'
  }
  return ''
})

const inputClasses = computed(() => {
  if (props.styling === 'tailwind') {
    return 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
  }
  return ''
})

const textareaClasses = computed(() => {
  if (props.styling === 'tailwind') {
    return 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm'
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
.columns-block {
  position: relative;
}

.columns-preview {
  min-height: 100px;
}

.column {
  background: #f9fafb;
  padding: 1rem;
  border-radius: 4px;
  min-height: 100px;
  transition: background-color 0.2s;
}

.column:hover {
  background: #f3f4f6;
}

.column-placeholder {
  color: #9ca3af;
  text-align: center;
  padding: 2rem 1rem;
}

.columns-editor {
  padding: 1rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.editor-header h4 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.form-group {
  margin-bottom: 1rem;
  position: relative;
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

.input-suffix {
  position: absolute;
  right: 0.75rem;
  top: 2rem;
  color: #6b7280;
  font-size: 0.875rem;
}

.columns-content-editor {
  margin: 1.5rem 0;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 4px;
}

.columns-content-editor h5 {
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
  font-weight: 600;
}

.column-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.column-tab {
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.column-tab:hover {
  background: #f3f4f6;
}

.column-tab.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.content-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  resize: vertical;
}

.content-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.content-tips {
  margin-top: 0.5rem;
  color: #6b7280;
  font-size: 0.75rem;
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

/* Mobile responsiveness */
@media (max-width: 640px) {
  .columns-preview[data-mobile="stack"] {
    flex-direction: column;
  }
  
  .columns-preview[data-mobile="scroll"] {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  .columns-preview[data-mobile="scroll"] .column {
    min-width: 200px;
    flex-shrink: 0;
  }
}
</style>