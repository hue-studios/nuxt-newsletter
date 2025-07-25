<template>
  <div class="rich-text-input" :class="{ 'has-error': error }">
    <!-- Label -->
    <label v-if="label" :for="id" class="rich-text-label">
      {{ label }}
      <span v-if="required" class="required">*</span>
    </label>

    <!-- Toolbar -->
    <div v-if="editor && !hideToolbar" class="rich-text-toolbar">
      <!-- Basic formatting -->
      <div class="toolbar-group">
        <button
          @click="toggleBold"
          :class="{ active: isBold }"
          class="toolbar-btn"
          type="button"
          title="Bold (Ctrl+B)"
        >
          <Icon name="lucide:bold" />
        </button>
        <button
          @click="toggleItalic"
          :class="{ active: isItalic }"
          class="toolbar-btn"
          type="button"
          title="Italic (Ctrl+I)"
        >
          <Icon name="lucide:italic" />
        </button>
        <button
          @click="toggleUnderline"
          :class="{ active: isUnderline }"
          class="toolbar-btn"
          type="button"
          title="Underline (Ctrl+U)"
        >
          <Icon name="lucide:underline" />
        </button>
      </div>

      <!-- Headings (if enabled) -->
      <template v-if="features.headings">
        <div class="toolbar-separator"></div>
        <div class="toolbar-group">
          <select @change="handleHeadingChange" class="heading-dropdown" title="Text Style">
            <option value="paragraph" :selected="isParagraph">Paragraph</option>
            <option value="1" :selected="isHeading(1)">Heading 1</option>
            <option value="2" :selected="isHeading(2)">Heading 2</option>
            <option value="3" :selected="isHeading(3)">Heading 3</option>
          </select>
        </div>
      </template>

      <!-- Lists (if enabled) -->
      <template v-if="features.lists">
        <div class="toolbar-separator"></div>
        <div class="toolbar-group">
          <button
            @click="toggleBulletList"
            :class="{ active: isBulletList }"
            class="toolbar-btn"
            type="button"
            title="Bullet List"
          >
            <Icon name="lucide:list" />
          </button>
          <button
            @click="toggleOrderedList"
            :class="{ active: isOrderedList }"
            class="toolbar-btn"
            type="button"
            title="Numbered List"
          >
            <Icon name="lucide:list-ordered" />
          </button>
        </div>
      </template>

      <!-- Links (if enabled) -->
      <template v-if="features.links">
        <div class="toolbar-separator"></div>
        <div class="toolbar-group">
          <button
            @click="handleLinkToggle"
            :class="{ active: isLink }"
            class="toolbar-btn"
            type="button"
            title="Add Link"
          >
            <Icon name="lucide:link" />
          </button>
        </div>
      </template>

      <!-- Alignment (if enabled) -->
      <template v-if="features.alignment">
        <div class="toolbar-separator"></div>
        <div class="toolbar-group">
          <button
            @click="setTextAlign('left')"
            :class="{ active: isActive('textAlign', { textAlign: 'left' }) }"
            class="toolbar-btn"
            type="button"
            title="Align Left"
          >
            <Icon name="lucide:align-left" />
          </button>
          <button
            @click="setTextAlign('center')"
            :class="{ active: isActive('textAlign', { textAlign: 'center' }) }"
            class="toolbar-btn"
            type="button"
            title="Align Center"
          >
            <Icon name="lucide:align-center" />
          </button>
          <button
            @click="setTextAlign('right')"
            :class="{ active: isActive('textAlign', { textAlign: 'right' }) }"
            class="toolbar-btn"
            type="button"
            title="Align Right"
          >
            <Icon name="lucide:align-right" />
          </button>
        </div>
      </template>

      <!-- Clear formatting -->
      <div class="toolbar-separator"></div>
      <div class="toolbar-group">
        <button
          @click="unsetAllMarks"
          class="toolbar-btn"
          type="button"
          title="Clear Formatting"
        >
          <Icon name="lucide:eraser" />
        </button>
      </div>
    </div>

    <!-- Editor -->
    <div class="rich-text-editor-container">
      <EditorContent
        :editor="editor"
        :id="id"
        class="rich-text-editor"
        :class="{
          'is-focused': isFocused,
          'is-empty': isEmpty
        }"
      />
    </div>

    <!-- Footer -->
    <div v-if="showStats || error || hint" class="rich-text-footer">
      <!-- Error message -->
      <div v-if="error" class="error-message">
        <Icon name="lucide:alert-circle" />
        {{ error }}
      </div>
      
      <!-- Hint -->
      <div v-else-if="hint" class="hint-message">
        {{ hint }}
      </div>

      <!-- Stats -->
      <div v-if="showStats" class="editor-stats">
        <span>{{ getWordCount() }} words</span>
        <span>{{ getCharacterCount() }} chars</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { EditorContent } from '@tiptap/vue-3'
import { onMounted, ref, watch } from 'vue'
import { useTiptapEditor } from '../composables/useTiptapEditor'

interface Props {
  modelValue?: string
  id?: string
  label?: string
  placeholder?: string
  required?: boolean
  error?: string
  hint?: string
  hideToolbar?: boolean
  showStats?: boolean
  minHeight?: string
  maxHeight?: string
  features?: {
    headings?: boolean
    lists?: boolean
    links?: boolean
    alignment?: boolean
    colors?: boolean
  }
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'focus'): void
  (e: 'blur'): void
  (e: 'change', value: string): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  id: () => `rich-text-${Math.random().toString(36).substr(2, 9)}`,
  placeholder: 'Start typing...',
  required: false,
  hideToolbar: false,
  showStats: false,
  minHeight: '120px',
  maxHeight: '400px',
  features: () => ({
    headings: true,
    lists: true,
    links: true,
    alignment: true,
    colors: false,
  }),
})

const emit = defineEmits<Emits>()

// Editor state
const isFocused = ref(false)

// Create editor with Tiptap composable
const {
  editor,
  isReady,
  createEditor,
  // Content methods
  setContent,
  getContent,
  getText,
  isEmpty,
  // Formatting methods
  toggleBold,
  toggleItalic,
  toggleUnderline,
  toggleStrike,
  setHeading,
  setParagraph,
  toggleBulletList,
  toggleOrderedList,
  setTextAlign,
  toggleLink,
  unsetAllMarks,
  // State methods
  isActive,
  isBold,
  isItalic,
  isUnderline,
  isBulletList,
  isOrderedList,
  isLink,
  isHeading,
  isParagraph,
  // Stats
  getWordCount,
  getCharacterCount,
  // Focus
  focus,
  blur,
} = useTiptapEditor({
  content: props.modelValue,
  placeholder: props.placeholder,
  onUpdate: (content: string) => {
    emit('update:modelValue', content)
    emit('change', content)
  },
  editorProps: {
    attributes: {
      class: 'rich-text-content',
      style: `min-height: ${props.minHeight}; max-height: ${props.maxHeight};`,
    },
  },
})

// Toolbar handlers
const handleHeadingChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const value = target.value
  
  if (value === 'paragraph') {
    setParagraph()
  } else {
    setHeading(parseInt(value) as 1 | 2 | 3 | 4 | 5 | 6)
  }
}

const handleLinkToggle = () => {
  if (isLink()) {
    toggleLink()
  } else {
    const url = window.prompt('Enter URL:', 'https://')
    if (url && url !== 'https://') {
      toggleLink(url)
    }
  }
}

// Focus handlers
const handleFocus = () => {
  isFocused.value = true
  emit('focus')
}

const handleBlur = () => {
  isFocused.value = false
  emit('blur')
}

// Watch for external content changes
watch(() => props.modelValue, (newValue) => {
  if (editor.value && getContent() !== newValue) {
    setContent(newValue)
  }
})

// Initialize editor
onMounted(() => {
  const editorInstance = createEditor()
  
  if (editorInstance) {
    // Add focus/blur listeners
    editorInstance.on('focus', handleFocus)
    editorInstance.on('blur', handleBlur)
  }
})
</script>

<style scoped>
@reference 'tailwindcss';

/* Main container */
.rich-text-input {
  @apply space-y-2;
}

.rich-text-input.has-error .rich-text-editor-container {
  @apply border-red-300;
}

.rich-text-input.has-error .rich-text-editor {
  @apply border-red-300;
}

/* Label */
.rich-text-label {
  @apply block text-sm font-medium text-slate-700;
}

.required {
  @apply text-red-500;
}

/* Toolbar */
.rich-text-toolbar {
  @apply flex items-center gap-1 p-2 bg-slate-50 border border-slate-300 border-b-0 rounded-t-lg flex-wrap;
}

.toolbar-group {
  @apply flex items-center gap-1;
}

.toolbar-separator {
  @apply w-px h-6 bg-slate-300 mx-2;
}

.toolbar-btn {
  @apply p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors;
}

.toolbar-btn.active {
  @apply bg-blue-100 text-blue-700;
}

.toolbar-btn:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.heading-dropdown {
  @apply px-2 py-1 text-sm border border-slate-300 rounded bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
}

/* Editor container */
.rich-text-editor-container {
  @apply border border-slate-300 rounded-b-lg overflow-hidden bg-white;
}

.rich-text-input:not(.has-toolbar) .rich-text-editor-container {
  @apply rounded-lg;
}

/* Editor content */
.rich-text-editor {
  @apply w-full overflow-y-auto;
}

.rich-text-editor.is-focused {
  @apply ring-2 ring-blue-500 border-blue-500;
}

:deep(.rich-text-content) {
  @apply p-3 prose prose-sm max-w-none focus:outline-none;
  overflow-y: auto;
}

:deep(.rich-text-content p.is-editor-empty:first-child::before) {
  @apply text-slate-400;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

/* Footer */
.rich-text-footer {
  @apply flex items-center justify-between gap-2 px-3 py-2 text-xs bg-slate-50 border border-slate-300 border-t-0 rounded-b-lg;
}

.error-message {
  @apply flex items-center gap-1 text-red-600;
}

.hint-message {
  @apply text-slate-500;
}

.editor-stats {
  @apply flex gap-3 text-slate-500 ml-auto;
}

/* Prose customizations */
:deep(.rich-text-content h1) {
  @apply text-2xl font-bold mb-4;
}

:deep(.rich-text-content h2) {
  @apply text-xl font-bold mb-3;
}

:deep(.rich-text-content h3) {
  @apply text-lg font-bold mb-2;
}

:deep(.rich-text-content ul) {
  @apply list-disc pl-6 mb-4;
}

:deep(.rich-text-content ol) {
  @apply list-decimal pl-6 mb-4;
}

:deep(.rich-text-content blockquote) {
  @apply border-l-4 border-slate-300 pl-4 italic my-4;
}

:deep(.rich-text-content a) {
  @apply text-blue-600 underline hover:text-blue-800;
}

:deep(.rich-text-content p) {
  @apply mb-3;
}

:deep(.rich-text-content p:last-child) {
  @apply mb-0;
}
</style>