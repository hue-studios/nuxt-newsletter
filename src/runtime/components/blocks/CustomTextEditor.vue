<!-- Example: Custom medium-weight text editor using Quill -->
<template>
  <div class="custom-text-block">
    <!-- Use any editor you prefer! -->
    <div ref="quillEditor" />
  </div>
</template>

<script setup>
// Example with Quill (lighter than Tiptap at ~120KB)
import { onBeforeUnmount, onMounted } from 'vue';

const props = defineProps(['block'])
const emit = defineEmits(['update'])

let quill = null
const quillEditor = ref()

onMounted(async () => {
  try {
    const Quill = await import('quill')
    
    quill = new Quill.default(quillEditor.value, {
      theme: 'snow',
      modules: {
        toolbar: [
          ['bold', 'italic', 'underline'],
          ['link'],
          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
          ['clean']
        ]
      }
    })
    
    // Set initial content
    quill.root.innerHTML = props.block.content?.html || ''
    
    // Listen for changes
    quill.on('text-change', () => {
      emit('update', {
        content: {
          html: quill.root.innerHTML,
          text: quill.getText()
        }
      })
    })
  } catch (error) {
    console.error('Failed to load Quill:', error)
  }
})

onBeforeUnmount(() => {
  if (quill) {
    quill = null
  }
})
</script>

<!-- Example: Using a simple contenteditable (0KB!) -->
<template>
  <div class="simple-rich-text">
    <div class="toolbar">
      <button @click="format('bold')">B</button>
      <button @click="format('italic')">I</button>
      <button @click="format('underline')">U</button>
      <button @click="insertLink()">Link</button>
    </div>
    <div
      ref="editor"
      contenteditable="true"
      @input="handleInput"
      @paste="handlePaste"
      class="content-area"
      v-html="content"
    />
  </div>
</template>

<script setup>
const props = defineProps(['block'])
const emit = defineEmits(['update'])

const editor = ref()
const content = ref(props.block.content?.html || '')

const format = (command) => {
  document.execCommand(command, false, null)
  editor.value.focus()
}

const insertLink = () => {
  const url = prompt('Enter URL:')
  if (url) {
    document.execCommand('createLink', false, url)
  }
}

const handleInput = () => {
  emit('update', {
    content: {
      html: editor.value.innerHTML,
      text: editor.value.innerText
    }
  })
}

const handlePaste = (e) => {
  // Clean paste to avoid messy formatting
  e.preventDefault()
  const text = e.clipboardData.getData('text/plain')
  document.execCommand('insertText', false, text)
}
</script>

<!-- Example: Integration with your preferred editor -->
<script>
// In your nuxt.config.ts
export default defineNuxtConfig({
  newsletter: {
    features: {
      richTextEditor: false // Keep this false
    }
  },
  
  // Register your custom block component
  hooks: {
    'newsletter:register-blocks': (blocks) => {
      blocks.text = defineAsyncComponent(() => 
        import('~/components/CustomTextBlock.vue')
      )
    }
  }
})
</script>