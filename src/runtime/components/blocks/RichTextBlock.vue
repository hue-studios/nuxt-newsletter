<!-- src/runtime/components/blocks/RichTextBlock.vue -->
<template>
  <div class="rich-text-block" :class="containerClasses">
    <!-- Simple Editor (default) -->
    <component
      v-if="!useTiptap"
      :is="TextBlock"
      :block="block"
      :styling="styling"
      @update="$emit('update', $event)"
    />
    
    <!-- Tiptap Editor (optional) -->
    <div v-else-if="editor" class="tiptap-editor" :class="editorClasses">
      <div class="editor-toolbar" :class="toolbarClasses" v-if="editor">
        <button
          @click="editor.chain().focus().toggleBold().run()"
          :disabled="!editor.can().chain().focus().toggleBold().run()"
          :class="{ 'is-active': editor.isActive('bold') }"
          class="toolbar-btn"
        >
          <strong>B</strong>
        </button>
        <button
          @click="editor.chain().focus().toggleItalic().run()"
          :disabled="!editor.can().chain().focus().toggleItalic().run()"
          :class="{ 'is-active': editor.isActive('italic') }"
          class="toolbar-btn"
        >
          <em>I</em>
        </button>
        <button
          @click="setLink"
          :class="{ 'is-active': editor.isActive('link') }"
          class="toolbar-btn"
        >
          🔗
        </button>
        <span class="separator">|</span>
        <button
          @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
          :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }"
          class="toolbar-btn"
        >
          H2
        </button>
        <button
          @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
          :class="{ 'is-active': editor.isActive('heading', { level: 3 }) }"
          class="toolbar-btn"
        >
          H3
        </button>
        <span class="separator">|</span>
        <button
          @click="editor.chain().focus().toggleBulletList().run()"
          :class="{ 'is-active': editor.isActive('bulletList') }"
          class="toolbar-btn"
        >
          • List
        </button>
      </div>
      
      <EditorContent :editor="editor" class="editor-content" :class="contentClasses" />
    </div>
    
    <!-- Loading/Error State -->
    <div v-else-if="tiptapError" class="error-state">
      <p>Tiptap is not installed. Using simple editor instead.</p>
      <component
        :is="TextBlock"
        :block="block"
        :styling="styling"
        @update="$emit('update', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { NewsletterBlock } from '../../composables/useNewsletterEditor'
import TextBlock from './TextBlock.vue'

// Tiptap imports (will be dynamically imported)
let Editor: any
let EditorContent: any
let StarterKit: any
let Link: any

interface Props {
  block: NewsletterBlock
  styling?: 'tailwind' | 'unstyled' | 'custom'
  forceRichText?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  styling: 'unstyled',
  forceRichText: false
})

const emit = defineEmits<{
  update: [updates: Partial<NewsletterBlock>]
}>()

// Check if we should use Tiptap
const { features } = useNewsletter()
const useTiptap = computed(() => 
  props.forceRichText || features.value.richTextEditor
)

// Editor state
const editor = ref<any>(null)
const tiptapError = ref(false)

// Initialize Tiptap if needed
onMounted(async () => {
  if (!useTiptap.value) return
  
  try {
    // Dynamically import Tiptap
    const [
      { Editor: TiptapEditor },
      { EditorContent: TiptapContent },
      StarterKitModule,
      LinkModule
    ] = await Promise.all([
      import('@tiptap/vue-3'),
      import('@tiptap/vue-3'),
      import('@tiptap/starter-kit'),
      import('@tiptap/extension-link')
    ])
    
    Editor = TiptapEditor
    EditorContent = TiptapContent
    StarterKit = StarterKitModule.default
    Link = LinkModule.default
    
    // Create editor instance
    editor.value = new Editor({
      content: props.block.content?.html || props.block.content?.text || '',
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [2, 3]
          }
        }),
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            target: '_blank',
            rel: 'noopener noreferrer'
          }
        })
      ],
      onUpdate: ({ editor }) => {
        emit('update', {
          content: {
            html: editor.getHTML(),
            text: editor.getText()
          }
        })
      }
    })
  } catch (error) {
    console.warn('[Newsletter] Tiptap not available, falling back to simple editor')
    tiptapError.value = true
  }
})

// Cleanup
onBeforeUnmount(() => {
  if (editor.value) {
    editor.value.destroy()
  }
})

// Link handling
const setLink = () => {
  if (!editor.value) return
  
  const previousUrl = editor.value.getAttributes('link').href
  const url = window.prompt('URL', previousUrl)
  
  if (url === null) return
  
  if (url === '') {
    editor.value.chain().focus().unsetLink().run()
  } else {
    editor.value.chain().focus().setLink({ href: url }).run()
  }
}

// Styling
const containerClasses = computed(() => {
  if (props.styling === 'tailwind') {
    return 'relative'
  }
  return ''
})

const editorClasses = computed(() => {
  if (props.styling === 'tailwind') {
    return 'border rounded-lg overflow-hidden'
  }
  return ''
})

const toolbarClasses = computed(() => {
  if (props.styling === 'tailwind') {
    return 'flex items-center gap-1 p-2 bg-gray-50 border-b'
  }
  return ''
})

const contentClasses = computed(() => {
  if (props.styling === 'tailwind') {
    return 'p-4 min-h-[150px] prose prose-sm max-w-none'
  }
  return ''
})
</script>

<style scoped>
/* Base styles */
.tiptap-editor {
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  overflow: hidden;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem;
  background: #f9fafb;
  border-bottom: 1px solid #e5e5e5;
}

.toolbar-btn {
  padding: 0.25rem 0.5rem;
  border: 1px solid transparent;
  background: none;
  cursor: pointer;
  border-radius: 2px;
  font-size: 0.875rem;
}

.toolbar-btn:hover {
  background: #e5e5e5;
}

.toolbar-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toolbar-btn.is-active {
  background: #3b82f6;
  color: white;
}

.separator {
  color: #d1d5db;
  margin: 0 0.25rem;
}

/* Tiptap content styles */
.editor-content :deep(.ProseMirror) {
  padding: 1rem;
  min-height: 150px;
}

.editor-content :deep(.ProseMirror:focus) {
  outline: none;
}

.editor-content :deep(.ProseMirror p) {
  margin: 0 0 1rem 0;
}

.editor-content :deep(.ProseMirror p:last-child) {
  margin-bottom: 0;
}

.editor-content :deep(.ProseMirror h2) {
  font-size: 1.5rem;
  font-weight: bold;
  margin: 1.5rem 0 1rem 0;
}

.editor-content :deep(.ProseMirror h3) {
  font-size: 1.25rem;
  font-weight: bold;
  margin: 1.25rem 0 0.75rem 0;
}

.editor-content :deep(.ProseMirror ul) {
  list-style: disc;
  margin: 0 0 1rem 1.5rem;
}

.editor-content :deep(.ProseMirror a) {
  color: #3b82f6;
  text-decoration: underline;
}

.error-state {
  padding: 1rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.error-state p {
  color: #dc2626;
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
}
</style>