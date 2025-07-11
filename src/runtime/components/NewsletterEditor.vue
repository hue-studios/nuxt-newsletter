<template>
  <div class="newsletter-editor" :class="containerClasses">
    <div class="newsletter-editor__toolbar" :class="toolbarClasses">
      <div class="toolbar-section">
        <h3>Newsletter Editor</h3>
      </div>
      <div class="toolbar-section">
        <button 
          v-for="blockType in availableBlocks" 
          :key="blockType.type"
          @click="addBlock(blockType.type)"
          class="toolbar-button"
          :class="buttonClasses"
        >
          <span class="icon">{{ blockType.icon }}</span>
          <span>{{ blockType.label }}</span>
        </button>
      </div>
    </div>

    <div class="newsletter-editor__canvas" :class="canvasClasses">
      <!-- Subject Line -->
      <div class="subject-wrapper" :class="subjectClasses">
        <label for="subject">Subject Line</label>
        <input
          id="subject"
          v-model="newsletter.subject"
          type="text"
          placeholder="Enter your newsletter subject..."
          class="subject-input"
        />
      </div>

      <!-- Blocks -->
      <div 
        ref="blocksContainer"
        class="blocks-container"
        :class="blocksContainerClasses"
      >
        <template v-if="blocks.length === 0">
          <div class="empty-state" :class="emptyStateClasses">
            <p>No blocks added yet. Click the buttons above to add content.</p>
          </div>
        </template>
        
        <component
          v-for="(block, index) in blocks"
          :key="block.id"
          :is="dragWrapper"
          v-bind="getDragProps(block, index)"
        >
          <div 
            class="block-wrapper"
            :class="getBlockClasses(block)"
            :data-block-id="block.id"
          >
            <div class="block-controls" :class="blockControlsClasses">
              <button @click="moveBlockUp(index)" :disabled="index === 0" class="control-btn">
                ↑
              </button>
              <button @click="moveBlockDown(index)" :disabled="index === blocks.length - 1" class="control-btn">
                ↓
              </button>
              <button @click="duplicateBlock(block.id)" class="control-btn">
                ⧉
              </button>
              <button @click="removeBlock(block.id)" class="control-btn danger">
                ×
              </button>
            </div>
            
            <NewsletterBlock
              :block="block"
              @update="(updates) => updateBlock(block.id, updates)"
            />
          </div>
        </component>
      </div>
    </div>

    <!-- Preview Panel -->
    <div v-if="showPreview" class="newsletter-editor__preview" :class="previewClasses">
      <NewsletterPreview :newsletter="newsletter" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, ref } from 'vue'
import { useNewsletter } from '../composables/useNewsletter'
import type { NewsletterBlock as NewsletterBlockType, NewsletterData } from '../composables/useNewsletterEditor'
import { useNewsletterEditor } from '../composables/useNewsletterEditor'

interface Props {
  modelValue?: NewsletterData
  showPreview?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showPreview: true
})

const emit = defineEmits<{
  'update:modelValue': [value: NewsletterData]
}>()

const { newsletter, blocks, addBlock, removeBlock, updateBlock, moveBlock, duplicateBlock } = useNewsletterEditor(props.modelValue)
const { isDragDropEnabled, stylingMode, config } = useNewsletter()

// Dynamic component loading
const NewsletterBlock = defineAsyncComponent(() => import('./NewsletterBlock.vue'))
const NewsletterPreview = defineAsyncComponent(() => import('./NewsletterPreview.vue'))

// Drag and drop setup
const blocksContainer = ref<HTMLElement>()
const dragWrapper = ref<any>('div') // Default to div if no drag provider

// Available block types
const availableBlocks = [
  { type: 'text', label: 'Text', icon: 'T' },
  { type: 'image', label: 'Image', icon: '🖼' },
  { type: 'button', label: 'Button', icon: '🔘' },
  { type: 'divider', label: 'Divider', icon: '—' },
  { type: 'columns', label: 'Columns', icon: '⊞' }
] as const

// Initialize drag and drop based on provider
onMounted(async () => {
  if (!isDragDropEnabled.value) return

  const provider = config.dragProvider

  try {
    if (provider === 'sortablejs' || provider === 'auto') {
      // Try to use SortableJS
      const { Sortable } = await import('sortablejs').catch(() => ({ Sortable: null }))
      if (Sortable && blocksContainer.value) {
        new Sortable(blocksContainer.value, {
          animation: 150,
          ghostClass: 'sortable-ghost',
          chosenClass: 'sortable-chosen',
          dragClass: 'sortable-drag',
          onEnd: (evt) => {
            if (evt.oldIndex !== undefined && evt.newIndex !== undefined) {
              moveBlock(evt.oldIndex, evt.newIndex)
            }
          }
        })
        console.log('[Newsletter] SortableJS drag and drop initialized')
        return
      }
    }

    if (provider === 'draggable-plus' || provider === 'auto') {
      // Try to use Vue Draggable Plus
      const VueDraggablePlus = await import('vue-draggable-plus').catch(() => null)
      if (VueDraggablePlus) {
        dragWrapper.value = VueDraggablePlus.VueDraggable
        console.log('[Newsletter] Vue Draggable Plus initialized')
        return
      }
    }

    if (provider === 'auto') {
      console.warn('[Newsletter] No drag and drop library found. Install sortablejs or vue-draggable-plus')
    }
  } catch (error) {
    console.error('[Newsletter] Error initializing drag and drop:', error)
  }
})

// Get drag props based on provider
const getDragProps = (block: NewsletterBlockType, index: number) => {
  if (dragWrapper.value?.name === 'VueDraggable') {
    return {
      modelValue: blocks.value,
      'onUpdate:modelValue': (value: NewsletterBlockType[]) => {
        blocks.value = value
      },
      itemKey: 'id'
    }
  }
  return {}
}

// Manual move functions (fallback when no drag library)
const moveBlockUp = (index: number) => {
  if (index > 0) {
    moveBlock(index, index - 1)
  }
}

const moveBlockDown = (index: number) => {
  if (index < blocks.value.length - 1) {
    moveBlock(index, index + 1)
  }
}

// Styling classes based on config
const containerClasses = computed(() => {
  if (stylingMode.value === 'tailwind') {
    return 'flex h-screen bg-gray-50'
  }
  return ''
})

const toolbarClasses = computed(() => {
  if (stylingMode.value === 'tailwind') {
    return 'bg-white border-b border-gray-200 p-4 flex justify-between items-center'
  }
  return ''
})

const buttonClasses = computed(() => {
  if (stylingMode.value === 'tailwind') {
    return 'px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-2'
  }
  return ''
})

const canvasClasses = computed(() => {
  if (stylingMode.value === 'tailwind') {
    return 'flex-1 overflow-y-auto p-6'
  }
  return ''
})

const subjectClasses = computed(() => {
  if (stylingMode.value === 'tailwind') {
    return 'mb-6 bg-white p-4 rounded-lg shadow-sm'
  }
  return ''
})

const blocksContainerClasses = computed(() => {
  if (stylingMode.value === 'tailwind') {
    return 'space-y-4'
  }
  return ''
})

const emptyStateClasses = computed(() => {
  if (stylingMode.value === 'tailwind') {
    return 'text-center py-12 text-gray-500'
  }
  return ''
})

const getBlockClasses = (block: NewsletterBlockType) => {
  if (stylingMode.value === 'tailwind') {
    return 'bg-white rounded-lg shadow-sm p-4 relative group hover:shadow-md transition-shadow'
  }
  return ''
}

const blockControlsClasses = computed(() => {
  if (stylingMode.value === 'tailwind') {
    return 'absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity'
  }
  return ''
})

const previewClasses = computed(() => {
  if (stylingMode.value === 'tailwind') {
    return 'w-96 border-l border-gray-200 bg-white p-6 overflow-y-auto'
  }
  return ''
})

// Watch for changes and emit
watch(newsletter, (value) => {
  emit('update:modelValue', value)
}, { deep: true })
</script>

<style scoped>
/* Base styles for unstyled mode */
.newsletter-editor {
  display: flex;
  height: 100vh;
}

.newsletter-editor__toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e5e5e5;
}

.toolbar-section {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.toolbar-button {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.toolbar-button:hover {
  background: #f5f5f5;
}

.newsletter-editor__canvas {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.subject-wrapper {
  margin-bottom: 1.5rem;
}

.subject-wrapper label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.subject-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.blocks-container {
  min-height: 200px;
}

.block-wrapper {
  position: relative;
  margin-bottom: 1rem;
  padding: 1rem;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
}

.block-controls {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  display: flex;
  gap: 0.25rem;
}

.control-btn {
  padding: 0.25rem 0.5rem;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
  border-radius: 2px;
  font-size: 0.875rem;
}

.control-btn:hover {
  background: #f5f5f5;
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.control-btn.danger {
  color: #dc2626;
}

.newsletter-editor__preview {
  width: 400px;
  border-left: 1px solid #e5e5e5;
  padding: 1.5rem;
  overflow-y: auto;
}

/* Sortable.js styles */
.sortable-ghost {
  opacity: 0.4;
}

.sortable-chosen {
  cursor: move;
}

.sortable-drag {
  cursor: move;
}
</style>