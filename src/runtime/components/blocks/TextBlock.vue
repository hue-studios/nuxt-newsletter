<template>
  <div class="text-block" :class="containerClasses">
    <div v-if="!isEditing" @click="startEdit" class="text-content" :class="contentClasses">
      <div v-html="formattedContent" />
    </div>
    <div v-else class="text-editor" :class="editorClasses">
      <textarea
        ref="textareaRef"
        v-model="localContent"
        @blur="saveEdit"
        @keydown.escape="cancelEdit"
        class="text-input"
        :class="inputClasses"
        placeholder="Enter your text..."
      />
      <div class="editor-toolbar" :class="toolbarClasses">
        <button @click="toggleBold" class="toolbar-btn" title="Bold">
          <strong>B</strong>
        </button>
        <button @click="toggleItalic" class="toolbar-btn" title="Italic">
          <em>I</em>
        </button>
        <button @click="insertLink" class="toolbar-btn" title="Link">
          🔗
        </button>
        <div class="toolbar-spacer" />
        <button @click="saveEdit" class="toolbar-btn save">
          ✓
        </button>
        <button @click="cancelEdit" class="toolbar-btn cancel">
          ✕
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
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

// Local state
const isEditing = ref(false)
const localContent = ref(props.block.content?.text || '')
const textareaRef = ref<HTMLTextAreaElement>()

// Computed content with basic formatting
const formattedContent = computed(() => {
  let text = props.block.content?.text || 'Click to edit text...'
  
  // Basic markdown-like formatting
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>')
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
  text = text.replace(/\n/g, '<br>')
  
  return text
})

// Edit functions
const startEdit = async () => {
  localContent.value = props.block.content?.text || ''
  isEditing.value = true
  await nextTick()
  textareaRef.value?.focus()
  textareaRef.value?.select()
}

const saveEdit = () => {
  emit('update', {
    content: { text: localContent.value }
  })
  isEditing.value = false
}

const cancelEdit = () => {
  localContent.value = props.block.content?.text || ''
  isEditing.value = false
}

// Formatting helpers
const toggleBold = () => {
  if (!textareaRef.value) return
  
  const start = textareaRef.value.selectionStart
  const end = textareaRef.value.selectionEnd
  const selectedText = localContent.value.substring(start, end)
  
  if (selectedText) {
    const replacement = `**${selectedText}**`
    localContent.value = 
      localContent.value.substring(0, start) + 
      replacement + 
      localContent.value.substring(end)
  }
}

const toggleItalic = () => {
  if (!textareaRef.value) return
  
  const start = textareaRef.value.selectionStart
  const end = textareaRef.value.selectionEnd
  const selectedText = localContent.value.substring(start, end)
  
  if (selectedText) {
    const replacement = `*${selectedText}*`
    localContent.value = 
      localContent.value.substring(0, start) + 
      replacement + 
      localContent.value.substring(end)
  }
}

const insertLink = () => {
  const url = prompt('Enter URL:')
  if (!url) return
  
  if (!textareaRef.value) return
  
  const start = textareaRef.value.selectionStart
  const end = textareaRef.value.selectionEnd
  const selectedText = localContent.value.substring(start, end) || 'link text'
  
  const replacement = `[${selectedText}](${url})`
  localContent.value = 
    localContent.value.substring(0, start) + 
    replacement + 
    localContent.value.substring(end)
}

// Styling classes
const containerClasses = computed(() => {
  if (props.styling === 'tailwind') {
    return 'relative'
  }
  return ''
})

const contentClasses = computed(() => {
  if (props.styling === 'tailwind') {
    return 'p-2 cursor-pointer hover:bg-gray-50 rounded transition-colors min-h-[3rem]'
  }
  return ''
})

const editorClasses = computed(() => {
  if (props.styling === 'tailwind') {
    return 'relative'
  }
  return ''
})

const inputClasses = computed(() => {
  if (props.styling === 'tailwind') {
    return 'w-full p-2 border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] resize-y'
  }
  return ''
})

const toolbarClasses = computed(() => {
  if (props.styling === 'tailwind') {
    return 'flex gap-1 mt-2 p-2 bg-gray-100 rounded'
  }
  return ''
})
</script>

<style scoped>
/* Base styles for unstyled mode */
.text-block {
  position: relative;
}

.text-content {
  padding: 0.5rem;
  cursor: pointer;
  min-height: 3rem;
  border-radius: 4px;
}

.text-content:hover {
  background-color: #f5f5f5;
}

.text-editor {
  position: relative;
}

.text-input {
  width: 100%;
  padding: 0.5rem;
  border: 2px solid #3b82f6;
  border-radius: 4px;
  min-height: 100px;
  resize: vertical;
  font-family: inherit;
  font-size: inherit;
}

.text-input:focus {
  outline: none;
  border-color: #2563eb;
}

.editor-toolbar {
  display: flex;
  gap: 0.25rem;
  margin-top: 0.5rem;
  padding: 0.5rem;
  background-color: #f3f4f6;
  border-radius: 4px;
}

.toolbar-btn {
  padding: 0.25rem 0.5rem;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 2px;
  cursor: pointer;
  font-size: 0.875rem;
}

.toolbar-btn:hover {
  background-color: #f3f4f6;
}

.toolbar-btn.save {
  color: #10b981;
  margin-left: auto;
}

.toolbar-btn.cancel {
  color: #ef4444;
}

.toolbar-spacer {
  flex: 1;
}

/* Rendered content styles */
.text-content :deep(strong) {
  font-weight: bold;
}

.text-content :deep(em) {
  font-style: italic;
}

.text-content :deep(a) {
  color: #3b82f6;
  text-decoration: underline;
}

.text-content :deep(a:hover) {
  color: #2563eb;
}
</style>