<!-- src/runtime/components/RichTextInput.vue - Enhanced with Progressive Enhancement -->
<template>
  <div class="rich-text-input" :class="{ 'has-error': error, 'has-toolbar': showToolbar }">
    <!-- Label -->
    <label v-if="label" :for="id" class="rich-text-label">
      {{ label }}
      <span v-if="required" class="required">*</span>
    </label>

    <!-- Toolbar (conditionally rendered based on capabilities) -->
    <div v-if="showToolbar && isReady" class="rich-text-toolbar">
      <!-- Basic formatting (always available) -->
      <div class="toolbar-group">
        <button
          @click="toggleBold"
          :class="{ active: isBold() }"
          class="toolbar-btn"
          type="button"
          title="Bold"
        >
          <Icon :name="getIconName('bold')" />
        </button>
        <button
          @click="toggleItalic"
          :class="{ active: isItalic() }"
          class="toolbar-btn"
          type="button"
          title="Italic"
        >
          <Icon :name="getIconName('italic')" />
        </button>
        <button
          @click="toggleUnderline"
          :class="{ active: isUnderline() }"
          class="toolbar-btn"
          type="button"
          title="Underline"
        >
          <Icon :name="getIconName('underline')" />
        </button>
      </div>

      <!-- Headings (conditionally shown) -->
      <template v-if="enhancedFeatures.headings">
        <div class="toolbar-separator"></div>
        <div class="toolbar-group">
          <select 
            @change="handleHeadingChange" 
            class="heading-dropdown"
            :class="{ 'mobile-friendly': isMobile }"
          >
            <option value="paragraph" :selected="isParagraph()">Paragraph</option>
            <option value="1" :selected="isHeading(1)">Heading 1</option>
            <option value="2" :selected="isHeading(2)">Heading 2</option>
            <option value="3" :selected="isHeading(3)">Heading 3</option>
            <!-- Only show H4-H6 on desktop -->
            <template v-if="!isMobile">
              <option value="4" :selected="isHeading(4)">Heading 4</option>
              <option value="5" :selected="isHeading(5)">Heading 5</option>
              <option value="6" :selected="isHeading(6)">Heading 6</option>
            </template>
          </select>
        </div>
      </template>

      <!-- Lists (conditionally shown) -->
      <template v-if="enhancedFeatures.lists">
        <div class="toolbar-separator"></div>
        <div class="toolbar-group">
          <button
            @click="toggleBulletList"
            :class="{ active: isBulletList() }"
            class="toolbar-btn"
            type="button"
            title="Bullet List"
          >
            <Icon :name="getIconName('list')" />
          </button>
          <button
            @click="toggleOrderedList"
            :class="{ active: isOrderedList() }"
            class="toolbar-btn"
            type="button"
            title="Numbered List"
          >
            <Icon :name="getIconName('list-ordered')" />
          </button>
        </div>
      </template>

      <!-- Links (conditionally shown) -->
      <template v-if="enhancedFeatures.links">
        <div class="toolbar-separator"></div>
        <div class="toolbar-group">
          <button
            @click="handleLinkToggle"
            :class="{ active: isLink() }"
            class="toolbar-btn"
            type="button"
            title="Link"
          >
            <Icon :name="getIconName('link')" />
          </button>
        </div>
      </template>

      <!-- Alignment (desktop only) -->
      <template v-if="enhancedFeatures.alignment && !isMobile">
        <div class="toolbar-separator"></div>
        <div class="toolbar-group">
          <button
            @click="setTextAlign('left')"
            :class="{ active: isActive('textAlign', { textAlign: 'left' }) }"
            class="toolbar-btn"
            type="button"
            title="Align Left"
          >
            <Icon :name="getIconName('align-left')" />
          </button>
          <button
            @click="setTextAlign('center')"
            :class="{ active: isActive('textAlign', { textAlign: 'center' }) }"
            class="toolbar-btn"
            type="button"
            title="Align Center"
          >
            <Icon :name="getIconName('align-center')" />
          </button>
          <button
            @click="setTextAlign('right')"
            :class="{ active: isActive('textAlign', { textAlign: 'right' }) }"
            class="toolbar-btn"
            type="button"
            title="Align Right"
          >
            <Icon :name="getIconName('align-right')" />
          </button>
        </div>
      </template>

      <!-- Colors (high-performance devices only) -->
      <template v-if="enhancedFeatures.colors && !isMobile && !isSlowConnection">
        <div class="toolbar-separator"></div>
        <div class="toolbar-group">
          <input
            type="color"
            @change="handleColorChange"
            class="color-picker-btn"
            title="Text Color"
          />
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
          <Icon :name="getIconName('eraser')" />
        </button>
      </div>

      <!-- Auto-save indicator (if enabled) -->
      <div v-if="autoSaveEnabled" class="toolbar-group ml-auto">
        <div class="auto-save-indicator" :class="autoSaveStatus">
          <Icon 
            :name="getAutoSaveIcon()" 
            class="w-4 h-4"
          />
          <span class="text-xs">{{ autoSaveText }}</span>
        </div>
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
          'is-empty': isEmpty(),
          'mobile-optimized': isMobile,
          'reduced-motion': !animationsEnabled
        }"
        @focus="handleFocus"
        @blur="handleBlur"
      />
      
      <!-- Loading overlay for slow connections -->
      <div v-if="isSlowConnection && isLoading" class="loading-overlay">
        <Icon :name="getIconName('loader-2')" class="animate-spin" />
        <span>Loading editor...</span>
      </div>
    </div>

    <!-- Footer -->
    <div v-if="showStats || error || hint" class="rich-text-footer">
      <!-- Error message -->
      <div v-if="error" class="error-message">
        <Icon :name="getIconName('alert-circle')" />
        {{ error }}
      </div>
      
      <!-- Hint -->
      <div v-else-if="hint" class="hint-message">
        {{ hint }}
      </div>

      <!-- Stats (performance permitting) -->
      <div v-if="showStats && isReady && !isSlowConnection" class="editor-stats">
        <span>{{ getWordCount() }} words</span>
        <span>{{ getCharacterCount() }} chars</span>
      </div>

      <!-- Mobile hint -->
      <div v-if="isMobile && isReady" class="mobile-hint">
        Tap to edit
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { EditorContent } from '@tiptap/vue-3'
import { computed, onMounted, ref, watch } from 'vue'
import { useProgressiveEnhancement } from '../composables/useProgressiveEnhancement'
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
    tables?: boolean
    images?: boolean
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
    tables: false,
    images: false,
  }),
})

const emit = defineEmits<Emits>()

// Progressive Enhancement
const { 
  capabilities, 
  features,
  shouldEnableFeature 
} = useProgressiveEnhancement()

// Enhanced feature detection
const enhancedFeatures = computed(() => {
  const userFeatures = props.features
  const autoFeatures = features.value.richTextFeatures
  
  return {
    headings: userFeatures.headings !== false && autoFeatures.headings,
    lists: userFeatures.lists !== false && autoFeatures.lists,
    links: userFeatures.links !== false && autoFeatures.links,
    alignment: userFeatures.alignment !== false && autoFeatures.alignment,
    colors: userFeatures.colors === true && autoFeatures.colors,
    tables: userFeatures.tables === true && autoFeatures.tables,
    images: userFeatures.images === true && autoFeatures.images,
  }
})

// Device and performance detection
const isMobile = computed(() => capabilities.value.deviceType === 'mobile')
const isSlowConnection = computed(() => capabilities.value.connectionSpeed === 'slow')
const animationsEnabled = computed(() => features.value.animations)
const autoSaveEnabled = computed(() => features.value.autoSave)

// Component state
const isFocused = ref(false)
const isLoading = ref(true)
const autoSaveStatus = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')

// Show toolbar logic
const showToolbar = computed(() => 
  !props.hideToolbar && 
  (enhancedFeatures.value.headings || 
   enhancedFeatures.value.lists || 
   enhancedFeatures.value.links)
)

// Icon name mapping based on available icon library
const getIconName = (icon: string) => {
  const iconSet = capabilities.value.preferredIconSet
  
  // Map to different icon libraries if needed
  const iconMap: Record<string, Record<string, string>> = {
    lucide: {
      'bold': 'lucide:bold',
      'italic': 'lucide:italic',
      'underline': 'lucide:underline',
      'list': 'lucide:list',
      'list-ordered': 'lucide:list-ordered',
      'link': 'lucide:link',
      'align-left': 'lucide:align-left',
      'align-center': 'lucide:align-center',
      'align-right': 'lucide:align-right',
      'eraser': 'lucide:eraser',
      'alert-circle': 'lucide:alert-circle',
      'loader-2': 'lucide:loader-2',
      'check': 'lucide:check',
      'x': 'lucide:x'
    },
    heroicons: {
      'bold': 'heroicons:bold',
      'italic': 'heroicons:italic',
      // ... map to heroicons equivalents
    }
  }
  
  return iconMap[iconSet]?.[icon] || `lucide:${icon}`
}

// Auto-save functionality
const autoSaveText = computed(() => {
  switch (autoSaveStatus.value) {
    case 'saving': return 'Saving...'
    case 'saved': return 'Saved'
    case 'error': return 'Error'
    default: return 'Auto-save'
  }
})

const getAutoSaveIcon = () => {
  switch (autoSaveStatus.value) {
    case 'saving': return getIconName('loader-2')
    case 'saved': return getIconName('check')
    case 'error': return getIconName('x')
    default: return getIconName('check')
  }
}

// Create editor with enhanced features
const {
  editor,
  isReady,
  createEditor,
  setContent,
  getContent,
  getText,
  isEmpty,
  toggleBold,
  toggleItalic,
  toggleUnderline,
  setHeading,
  setParagraph,
  toggleBulletList,
  toggleOrderedList,
  setTextAlign,
  toggleLink,
  unsetAllMarks,
  isActive,
  isBold,
  isItalic,
  isUnderline,
  isBulletList,
  isOrderedList,
  isLink,
  isHeading,
  isParagraph,
  getWordCount,
  getCharacterCount,
  setColor,
} = useTiptapEditor({
  content: props.modelValue,
  placeholder: props.placeholder,
  features: enhancedFeatures.value,
  onUpdate: (content: string) => {
    emit('update:modelValue', content)
    emit('change', content)
    
    // Trigger auto-save if enabled
    if (autoSaveEnabled.value) {
      triggerAutoSave(content)
    }
  },
  editorProps: {
    attributes: {
      class: 'rich-text-content',
      style: `min-height: ${props.minHeight}; max-height: ${props.maxHeight}; overflow-y: auto;`,
    },
  },
})

// Auto-save implementation
let autoSaveTimeout: NodeJS.Timeout | null = null

const triggerAutoSave = (content: string) => {
  if (autoSaveTimeout) {
    clearTimeout(autoSaveTimeout)
  }
  
  autoSaveStatus.value = 'saving'
  
  const delay = isSlowConnection.value ? 2000 : 1000 // Longer delay on slow connections
  
  autoSaveTimeout = setTimeout(async () => {
    try {
      // Simulate auto-save - in real app, this would save to backend
      await new Promise(resolve => setTimeout(resolve, isSlowConnection.value ? 1000 : 300))
      
      autoSaveStatus.value = 'saved'
      
      // Reset to idle after showing success
      setTimeout(() => {
        autoSaveStatus.value = 'idle'
      }, 2000)
      
    } catch (error) {
      autoSaveStatus.value = 'error'
      console.error('Auto-save failed:', error)
    }
  }, delay)
}

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

const handleColorChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  setColor(target.value)
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
    setContent(newValue || '')
  }
})

// Initialize editor
onMounted(async () => {
  // Add delay on slow connections to improve perceived performance
  if (isSlowConnection.value) {
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  createEditor()
  isLoading.value = false
})
</script>

<style scoped>
/* Enhanced styles with progressive enhancement considerations */

/* Base styles (always applied) */
.rich-text-input {
  @apply space-y-2;
}

/* Mobile-optimized styles */
.rich-text-input .mobile-friendly {
  @apply text-base; /* Larger text on mobile */
}

.rich-text-editor.mobile-optimized {
  @apply text-base leading-relaxed; /* Better readability on mobile */
}

.mobile-hint {
  @apply text-xs text-slate-500 lg:hidden;
}

/* Performance-based styles */
.rich-text-input.reduced-motion * {
  @apply transition-none; /* Disable animations for performance */
}

/* Auto-save indicator */
.auto-save-indicator {
  @apply flex items-center gap-1 px-2 py-1 rounded text-xs;
}

.auto-save-indicator.idle {
  @apply text-slate-500;
}

.auto-save-indicator.saving {
  @apply text-blue-600;
}

.auto-save-indicator.saved {
  @apply text-green-600;
}

.auto-save-indicator.error {
  @apply text-red-600;
}

/* Loading overlay */
.loading-overlay {
  @apply absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center gap-2 text-sm text-slate-600;
}

/* Color picker button */
.color-picker-btn {
  @apply w-8 h-8 rounded border border-slate-300 cursor-pointer;
}

/* Responsive toolbar */
@media (max-width: 640px) {
  .rich-text-toolbar {
    @apply flex-wrap gap-1;
  }
  
  .toolbar-group {
    @apply flex-wrap;
  }
}

/* All other existing styles from the previous component... */
.rich-text-input.has-error .rich-text-editor-container {
  @apply border-red-300;
}

.rich-text-label {
  @apply block text-sm font-medium text-slate-700;
}

.required {
  @apply text-red-500;
}

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

.heading-dropdown {
  @apply px-2 py-1 text-sm border border-slate-300 rounded bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
}

.rich-text-editor-container {
  @apply border border-slate-300 rounded-b-lg overflow-hidden bg-white relative;
}

.rich-text-input:not(.has-toolbar) .rich-text-editor-container {
  @apply rounded-lg;
}

.rich-text-editor {
  @apply w-full;
}

:deep(.rich-text-content) {
  @apply p-3 prose prose-sm max-w-none focus:outline-none;
}

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
</style>