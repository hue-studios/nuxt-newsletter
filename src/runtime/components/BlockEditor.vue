<template>
  <div class="block-editor">
    <!-- Block Header -->
    <div class="block-header">
      <div class="block-info">
        <div class="block-icon">
          <Icon :name="blockType?.icon || 'lucide:square'" />
        </div>
        <div class="block-details">
          <h4 class="block-title">{{ blockType?.name || 'Unknown Block' }}</h4>
          <p class="block-description">{{ blockType?.description || 'Edit block content' }}</p>
        </div>
      </div>
      
      <div class="block-actions">
        <button @click="toggleCollapsed" class="action-button collapse-button">
          <Icon :name="collapsed ? 'lucide:chevron-down' : 'lucide:chevron-up'" />
        </button>
        <button @click="duplicateBlock" class="action-button">
          <Icon name="lucide:copy" />
        </button>
        <button @click="removeBlock" class="action-button delete-button">
          <Icon name="lucide:trash-2" />
        </button>
      </div>
    </div>

    <!-- Block Content (Collapsible) -->
    <Transition name="collapse" @enter="onEnter" @leave="onLeave">
      <div v-if="!collapsed" class="block-content">
        <!-- Dynamic Form Fields based on block type -->
        <div class="form-container">
          <div class="form-grid">
            <!-- Debug info (remove in production) -->
            <div v-if="showDebug" class="col-span-full p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
              <details>
                <summary>🐛 Debug Field Info</summary>
                <pre>{{ JSON.stringify(textFields, null, 2) }}</pre>
              </details>
            </div>

            <!-- Text Fields -->
            <template v-for="field in textFields" :key="field.key">
              <div class="form-group" :class="field.size || 'col-span-1'">
                <label :for="`${block.id}-${field.key}`" class="form-label">
                  {{ field.label }}
                  <span v-if="field.required" class="required">*</span>
                  <span v-if="showDebug" class="text-xs text-gray-500 ml-2">
                    ({{ field.type }}/{{ field.interface }})
                  </span>
                </label>
                
                <!-- Regular Input -->
                <input
                  v-if="field.type === 'text' || field.type === 'email' || field.type === 'url'"
                  :id="`${block.id}-${field.key}`"
                  v-model="localContent[field.key]"
                  :type="field.type"
                  :placeholder="field.placeholder"
                  :required="field.required"
                  class="form-input"
                  @input="updateContent"
                />
                
                <!-- TIPTAP RICH TEXT EDITOR -->
                <!-- This now checks for multiple conditions to detect rich text fields -->
                <div
                  v-else-if="isRichTextField(field)"
                  class="tiptap-editor"
                >
                  <!-- Enhanced Toolbar -->
                  <div v-if="editors[field.key]" class="tiptap-toolbar">
                    <!-- Basic Formatting -->
                    <div class="toolbar-group">
                      <button
                        @click="editors[field.key].chain().focus().toggleBold().run()"
                        :class="{ 'active': editors[field.key].isActive('bold') }"
                        class="toolbar-button"
                        type="button"
                        title="Bold (Ctrl+B)"
                      >
                        <Icon name="lucide:bold" />
                      </button>
                      <button
                        @click="editors[field.key].chain().focus().toggleItalic().run()"
                        :class="{ 'active': editors[field.key].isActive('italic') }"
                        class="toolbar-button"
                        type="button"
                        title="Italic (Ctrl+I)"
                      >
                        <Icon name="lucide:italic" />
                      </button>
                      <button
                        @click="editors[field.key].chain().focus().toggleUnderline().run()"
                        :class="{ 'active': editors[field.key].isActive('underline') }"
                        class="toolbar-button"
                        type="button"
                        title="Underline (Ctrl+U)"
                      >
                        <Icon name="lucide:underline" />
                      </button>
                      <button
                        @click="editors[field.key].chain().focus().toggleStrike().run()"
                        :class="{ 'active': editors[field.key].isActive('strike') }"
                        class="toolbar-button"
                        type="button"
                        title="Strikethrough"
                      >
                        <Icon name="lucide:strikethrough" />
                      </button>
                    </div>

                    <!-- Heading Levels -->
                    <div class="toolbar-separator"></div>
                    <div class="toolbar-group">
                      <select
                        @change="setHeading($event, field.key)"
                        class="heading-select"
                        title="Heading Level"
                      >
                        <option value="paragraph" :selected="editors[field.key].isActive('paragraph')">
                          Paragraph
                        </option>
                        <option value="1" :selected="editors[field.key].isActive('heading', { level: 1 })">
                          Heading 1
                        </option>
                        <option value="2" :selected="editors[field.key].isActive('heading', { level: 2 })">
                          Heading 2
                        </option>
                        <option value="3" :selected="editors[field.key].isActive('heading', { level: 3 })">
                          Heading 3
                        </option>
                      </select>
                    </div>

                    <!-- Lists -->
                    <div class="toolbar-separator"></div>
                    <div class="toolbar-group">
                      <button
                        @click="editors[field.key].chain().focus().toggleBulletList().run()"
                        :class="{ 'active': editors[field.key].isActive('bulletList') }"
                        class="toolbar-button"
                        type="button"
                        title="Bullet List"
                      >
                        <Icon name="lucide:list" />
                      </button>
                      <button
                        @click="editors[field.key].chain().focus().toggleOrderedList().run()"
                        :class="{ 'active': editors[field.key].isActive('orderedList') }"
                        class="toolbar-button"
                        type="button"
                        title="Numbered List"
                      >
                        <Icon name="lucide:list-ordered" />
                      </button>
                      <button
                        @click="editors[field.key].chain().focus().toggleBlockquote().run()"
                        :class="{ 'active': editors[field.key].isActive('blockquote') }"
                        class="toolbar-button"
                        type="button"
                        title="Quote"
                      >
                        <Icon name="lucide:quote" />
                      </button>
                    </div>

                    <!-- Links -->
                    <div class="toolbar-separator"></div>
                    <div class="toolbar-group">
                      <button
                        @click="toggleLink(field.key)"
                        :class="{ 'active': editors[field.key].isActive('link') }"
                        class="toolbar-button"
                        type="button"
                        title="Add Link"
                      >
                        <Icon name="lucide:link" />
                      </button>
                    </div>

                    <!-- Undo/Redo -->
                    <div class="toolbar-separator"></div>
                    <div class="toolbar-group">
                      <button
                        @click="editors[field.key].chain().focus().undo().run()"
                        :disabled="!editors[field.key].can().undo()"
                        class="toolbar-button"
                        type="button"
                        title="Undo (Ctrl+Z)"
                      >
                        <Icon name="lucide:undo" />
                      </button>
                      <button
                        @click="editors[field.key].chain().focus().redo().run()"
                        :disabled="!editors[field.key].can().redo()"
                        class="toolbar-button"
                        type="button"
                        title="Redo (Ctrl+Y)"
                      >
                        <Icon name="lucide:redo" />
                      </button>
                    </div>

                    <!-- Clear Formatting -->
                    <div class="toolbar-separator"></div>
                    <div class="toolbar-group">
                      <button
                        @click="editors[field.key].chain().focus().unsetAllMarks().run()"
                        class="toolbar-button"
                        type="button"
                        title="Clear Formatting"
                      >
                        <Icon name="lucide:eraser" />
                      </button>
                    </div>
                  </div>

                  <!-- Editor Content -->
                  <EditorContent
                    :editor="editors[field.key]"
                    :class="`tiptap-content ${field.key}-editor`"
                  />

                  <!-- Character/Word Count -->
                  <div v-if="showStats" class="editor-stats">
                    <span>{{ getWordCount(field.key) }} words</span>
                    <span>{{ getCharCount(field.key) }} characters</span>
                  </div>
                </div>
                
                <!-- Regular Textarea (fallback) -->
                <textarea
                  v-else-if="field.type === 'textarea' || field.type === 'text'"
                  :id="`${block.id}-${field.key}`"
                  v-model="localContent[field.key]"
                  :placeholder="field.placeholder"
                  :rows="field.rows || 3"
                  :required="field.required"
                  class="form-textarea"
                  @input="updateContent"
                ></textarea>
                
                <!-- Color Picker -->
                <div
                  v-else-if="field.type === 'color'"
                  class="color-picker-container"
                >
                  <input
                    :id="`${block.id}-${field.key}`"
                    v-model="localContent[field.key]"
                    type="color"
                    class="color-input"
                    @input="updateContent"
                  />
                  <input
                    v-model="localContent[field.key]"
                    type="text"
                    :placeholder="field.placeholder || '#000000'"
                    class="color-text-input"
                    @input="updateContent"
                  />
                </div>
                
                <!-- Switch/Toggle -->
                <div
                  v-else-if="field.type === 'boolean'"
                  class="switch-container"
                  @click="toggleSwitch(field.key)"
                >
                  <input
                    :id="`${block.id}-${field.key}`"
                    v-model="localContent[field.key]"
                    type="checkbox"
                    class="switch-input"
                    @change="updateContent"
                  />
                  <div class="switch-slider"></div>
                  <label :for="`${block.id}-${field.key}`" class="switch-label">
                    {{ field.label }}
                  </label>
                </div>
                
                <!-- Select Dropdown -->
                <select
                  v-else-if="field.type === 'select'"
                  :id="`${block.id}-${field.key}`"
                  v-model="localContent[field.key]"
                  :required="field.required"
                  class="form-select"
                  @change="updateContent"
                >
                  <option value="" disabled>{{ field.placeholder || 'Select an option' }}</option>
                  <option
                    v-for="option in field.options"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
                
                <p v-if="field.help" class="field-help">{{ field.help }}</p>
              </div>
            </template>
          </div>
        </div>

        <!-- Block Preview (if enabled) -->
        <div v-if="showPreview" class="block-preview">
          <div class="preview-header">
            <h5>Preview</h5>
            <button @click="refreshPreview" :disabled="isRefreshing" class="refresh-button">
              <Icon name="lucide:refresh-cw" :class="{ 'animate-spin': isRefreshing }" />
            </button>
          </div>
          <div class="preview-content">
            <iframe
              v-if="compiledHtml"
              :srcdoc="previewHtml"
              class="preview-iframe"
            ></iframe>
            <div v-else-if="isRefreshing" class="preview-loading">
              <Icon name="lucide:loader-2" class="animate-spin" />
              <span>Generating preview...</span>
            </div>
            <div v-else class="preview-empty">
              <Icon name="lucide:image" />
              <span>Preview will appear here</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import TextStyle from '@tiptap/extension-text-style'
import Underline from '@tiptap/extension-underline'
import StarterKit from '@tiptap/starter-kit'
import { Editor, EditorContent } from '@tiptap/vue-3'
import { debounce } from 'lodash-es'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

interface NewsletterBlock {
  id: string
  type: string
  content: Record<string, any>
  sort: number
}

interface BlockType {
  id: string
  name: string
  description?: string
  icon?: string
  field_visibility_config?: any[]
  fields?: any[]
  mjml_template?: string
}

interface Props {
  block: NewsletterBlock
  blockType?: BlockType
}

interface Emits {
  (e: 'update', blockId: string, updates: Partial<NewsletterBlock>): void
  (e: 'remove', blockId: string): void
  (e: 'duplicate', blockId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Reactive state
const localContent = ref<Record<string, any>>({ ...props.block.content })
const collapsed = ref(false)
const showPreview = ref(false)
const showDebug = ref(false) // Set to true for debugging
const showStats = ref(true)
const isRefreshing = ref(false)
const compiledHtml = ref('')
const editors = ref<Record<string, Editor>>({})

// Helper function to determine if a field should use rich text editor
const isRichTextField = (field: any) => {
  // Check multiple conditions to identify rich text fields
  return (
    field.type === 'richtext' ||
    field.interface === 'input-rich-text-html' ||
    field.interface === 'input-rich-text' ||
    field.interface === 'wysiwyg' ||
    (field.type === 'text' && field.interface === 'input-rich-text-html') ||
    (field.name && field.name.includes('content')) ||
    (field.name && field.name.includes('text')) ||
    (field.key && field.key.includes('content')) ||
    (field.key && field.key.includes('text'))
  )
}

// Computed properties
const textFields = computed(() => {
  const fields = props.blockType?.field_visibility_config || props.blockType?.fields || []
  
  return fields
    .filter(field => 
      ['text', 'email', 'url', 'textarea', 'richtext', 'color', 'boolean', 'select'].includes(field.type) ||
      field.interface === 'input-rich-text-html'
    )
    .map(field => ({
      ...field,
      key: field.name || field.key || field.field,
      label: field.label || field.name || field.key || field.field,
      type: field.type || 'text',
      interface: field.interface,
      size: field.grid_size || field.size || 'col-span-1'
    }))
})

const previewHtml = computed(() => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            overflow: hidden;
          }
        </style>
      </head>
      <body>
        <div class="container">
          ${compiledHtml.value}
        </div>
      </body>
    </html>
  `
})

// Tiptap editor setup
const setupEditor = (fieldKey: string, initialContent: string = '') => {
  const editor = new Editor({
    content: initialContent,
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color.configure({
        types: ['textStyle'],
      }),
      Highlight.configure({
        multicolor: true,
      }),
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[120px] p-4',
      },
    },
    onUpdate: debounce(({ editor }) => {
      localContent.value[fieldKey] = editor.getHTML()
      updateContent()
    }, 300),
  })

  editors.value[fieldKey] = editor
  return editor
}

// Toolbar methods
const setHeading = (event: Event, fieldKey: string) => {
  const target = event.target as HTMLSelectElement
  const level = target.value
  
  if (level === 'paragraph') {
    editors.value[fieldKey].chain().focus().setParagraph().run()
  } else {
    editors.value[fieldKey].chain().focus().toggleHeading({ level: parseInt(level) }).run()
  }
}

const toggleLink = (fieldKey: string) => {
  const editor = editors.value[fieldKey]
  const previousUrl = editor.getAttributes('link').href
  const url = window.prompt('URL', previousUrl)

  if (url === null) {
    return
  }

  if (url === '') {
    editor.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }

  editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
}

const getWordCount = (fieldKey: string) => {
  const editor = editors.value[fieldKey]
  if (!editor) return 0
  
  const text = editor.getText()
  return text.split(/\s+/).filter(word => word.length > 0).length
}

const getCharCount = (fieldKey: string) => {
  const editor = editors.value[fieldKey]
  if (!editor) return 0
  
  return editor.getText().length
}

// Content management
const updateContent = debounce(() => {
  emit('update', props.block.id, { content: localContent.value })
}, 300)

const toggleSwitch = (key: string) => {
  localContent.value[key] = !localContent.value[key]
  updateContent()
}

// Block management
const toggleCollapsed = () => {
  collapsed.value = !collapsed.value
}

const duplicateBlock = () => {
  emit('duplicate', props.block.id)
}

const removeBlock = () => {
  if (confirm('Are you sure you want to delete this block?')) {
    emit('remove', props.block.id)
  }
}

const refreshPreview = async () => {
  if (!props.blockType?.mjml_template) return
  
  try {
    isRefreshing.value = true
    // Placeholder for MJML compilation
    compiledHtml.value = '<div class="p-4">Preview will be generated here</div>'
  } catch (error) {
    console.error('Block preview compilation failed:', error)
  } finally {
    isRefreshing.value = false
  }
}

// Transition handlers
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
watch(() => props.block.content, (newContent) => {
  localContent.value = { ...newContent }
  
  // Update Tiptap editors with new content
  Object.keys(editors.value).forEach(fieldKey => {
    const editor = editors.value[fieldKey]
    const newFieldContent = newContent[fieldKey] || ''
    if (editor && editor.getHTML() !== newFieldContent) {
      editor.commands.setContent(newFieldContent)
    }
  })
}, { deep: true })

watch(localContent, () => {
  if (showPreview.value) {
    refreshPreview()
  }
}, { deep: true })

// Lifecycle
onMounted(() => {
  // Initialize Tiptap editors for rich text fields
  textFields.value.forEach(field => {
    if (isRichTextField(field)) {
      const initialContent = localContent.value[field.key] || field.default || ''
      setupEditor(field.key, initialContent)
      console.log(`🎨 Initialized Tiptap editor for field: ${field.key} (${field.type}/${field.interface})`)
    }
  })

  // Log field information for debugging
  if (showDebug.value) {
    console.log('=== BLOCK EDITOR DEBUG ===')
    console.log('Block Type:', props.blockType)
    console.log('Text Fields:', textFields.value)
    console.log('Rich Text Fields:', textFields.value.filter(isRichTextField))
  }
})

onBeforeUnmount(() => {
  // Cleanup all editors
  Object.values(editors.value).forEach(editor => {
    editor.destroy()
  })
})
</script>

<style scoped>
@reference 'tailwindcss';

/* Block Editor Layout */
.block-editor {
  @apply bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm;
}

/* Block Header */
.block-header {
  @apply flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200;
}

.block-info {
  @apply flex items-center gap-3;
}

.block-icon {
  @apply w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center;
}

.block-icon svg {
  @apply w-4 h-4 text-blue-600;
}

.block-details {
  @apply min-w-0;
}

.block-title {
  @apply text-sm font-semibold text-slate-900;
}

.block-description {
  @apply text-xs text-slate-600;
}

.block-actions {
  @apply flex items-center gap-1;
}

.action-button {
  @apply p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-md transition-colors;
}

.collapse-button {
  @apply mr-2;
}

.delete-button {
  @apply hover:text-red-600 hover:bg-red-50;
}

/* Form Styles */
.form-container {
  @apply p-4;
}

.form-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-4;
}

.form-group {
  @apply space-y-2;
}

.form-group.col-span-2 {
  @apply md:col-span-2;
}

.form-group.col-span-full {
  @apply col-span-full;
}

.form-label {
  @apply block text-sm font-medium text-slate-700;
}

.required {
  @apply text-red-500;
}

.form-input,
.form-textarea,
.form-select {
  @apply block w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors;
}

.form-textarea {
  @apply resize-vertical min-h-[80px];
}

.field-help {
  @apply text-xs text-slate-500;
}

/* Tiptap Editor Styles */
.tiptap-editor {
  @apply border border-slate-300 rounded-lg overflow-hidden bg-white;
}

.tiptap-toolbar {
  @apply flex items-center gap-1 p-2 bg-slate-50 border-b border-slate-200 flex-wrap;
}

.toolbar-group {
  @apply flex items-center gap-1;
}

.toolbar-separator {
  @apply w-px h-6 bg-slate-300 mx-2;
}

.toolbar-button {
  @apply p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
}

.toolbar-button.active {
  @apply bg-blue-100 text-blue-700;
}

.heading-select {
  @apply px-2 py-1 text-sm border border-slate-300 rounded bg-white focus:ring-2 focus:ring-blue-500;
}

.tiptap-content {
  @apply min-h-[120px] max-h-[400px] overflow-y-auto;
}

.editor-stats {
  @apply px-3 py-2 text-xs text-slate-500 bg-slate-50 border-t border-slate-200 flex gap-4;
}

/* Other Form Elements */
.color-picker-container {
  @apply flex items-center gap-2;
}

.color-input {
  @apply w-12 h-10 border border-slate-300 rounded-lg cursor-pointer;
}

.color-text-input {
  @apply flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
}

.switch-container {
  @apply flex items-center gap-3 cursor-pointer;
}

.switch-input {
  @apply sr-only;
}

.switch-slider {
  @apply relative w-11 h-6 bg-slate-300 rounded-full transition-colors;
}

.switch-slider::before {
  content: '';
  @apply absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform;
}

.switch-input:checked + .switch-slider {
  @apply bg-blue-600;
}

.switch-input:checked + .switch-slider::before {
  @apply translate-x-5;
}

.switch-label {
  @apply text-sm font-medium text-slate-700;
}

/* Preview Styles */
.block-preview {
  @apply border-t border-slate-200 bg-slate-50;
}

.preview-header {
  @apply flex items-center justify-between p-3 border-b border-slate-200;
}

.preview-header h5 {
  @apply text-sm font-semibold text-slate-900;
}

.refresh-button {
  @apply p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors disabled:opacity-50;
}

.preview-content {
  @apply h-64;
}

.preview-iframe {
  @apply w-full h-full border-none;
}

.preview-error,
.preview-loading,
.preview-empty {
  @apply h-full flex items-center justify-center gap-2 text-sm text-slate-600;
}

.preview-error {
  @apply text-red-600;
}

.preview-error svg,
.preview-loading svg,
.preview-empty svg {
  @apply w-5 h-5;
}

/* Transitions */
.collapse-enter-active,
.collapse-leave-active {
  @apply transition-all duration-300 ease-in-out;
}

.collapse-enter-from,
.collapse-leave-to {
  @apply opacity-0;
}

/* Tiptap specific prose overrides */
:deep(.ProseMirror) {
  @apply outline-none;
}

:deep(.ProseMirror p.is-editor-empty:first-child::before) {
  @apply text-slate-400;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

:deep(.ProseMirror blockquote) {
  @apply border-l-4 border-slate-300 pl-4 italic;
}
</style>