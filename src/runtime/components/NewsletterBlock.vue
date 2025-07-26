<!-- Enhanced NewsletterBlock.vue - Preserving Tiptap with better UI -->
<template>
  <div class="newsletter-block-wrapper">
    <!-- Collapsed/Preview Mode -->
    <div
      v-if="!isExpanded"
      @click="toggleExpanded"
      class="newsletter-block-preview group cursor-pointer relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300"
    >
      <!-- Block Type Badge -->
      <div class="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm">
        <Icon :name="blockType.icon || 'lucide:square'" class="w-4 h-4 text-slate-600" />
        <span class="text-xs font-medium text-slate-700">{{ blockType.name }}</span>
      </div>

      <!-- Quick Actions -->
      <div class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <slot name="actions" />
      </div>

      <!-- Content Preview -->
      <div class="p-6 pt-14">
        <div v-if="hasContent" class="space-y-3">
          <!-- Title/Heading Preview -->
          <div v-if="localContent.title || localContent.heading" class="text-lg font-semibold text-slate-900 line-clamp-2">
            {{ localContent.title || localContent.heading }}
          </div>

          <!-- Subtitle Preview -->
          <div v-if="localContent.subtitle" class="text-sm text-slate-600 line-clamp-2">
            {{ localContent.subtitle }}
          </div>

          <!-- Text Content Preview -->
          <div v-if="localContent.text_content" class="text-sm text-slate-700 line-clamp-3" v-html="stripHtml(localContent.text_content)"></div>

          <!-- Button Preview -->
          <div v-if="localContent.button_text" class="flex flex-wrap gap-2 mt-3">
            <div class="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white">
              {{ localContent.button_text }}
            </div>
            <div v-if="localContent.secondary_button_text" class="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700">
              {{ localContent.secondary_button_text }}
            </div>
          </div>

          <!-- Image Preview -->
          <div v-if="localContent.image || localContent.image_url" class="aspect-video bg-slate-100 rounded-lg flex items-center justify-center">
            <Icon name="lucide:image" class="w-8 h-8 text-slate-400" />
          </div>
        </div>
        
        <!-- Empty State -->
        <div v-else class="text-center py-8">
          <Icon name="lucide:edit-3" class="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p class="text-sm text-slate-500">Click to add content</p>
        </div>
      </div>
    </div>

    <!-- Expanded/Edit Mode -->
    <div v-else class="newsletter-block-editor bg-white border border-slate-200 rounded-xl shadow-sm">
      <!-- Editor Header -->
      <div class="editor-header flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
        <div class="flex items-center gap-3">
          <Icon :name="blockType.icon || 'lucide:square'" class="w-5 h-5 text-slate-600" />
          <div>
            <h3 class="font-medium text-slate-900">{{ blockType.name }}</h3>
            <p v-if="blockType.description" class="text-sm text-slate-600">{{ blockType.description }}</p>
          </div>
        </div>
        
        <div class="flex items-center gap-2">
          <slot name="actions" />
          
          <div class="h-4 w-px bg-slate-300"></div>
          
          <button @click="toggleExpanded" class="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors">
            <Icon name="lucide:chevron-up" class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Debug Info (if debug mode is enabled) -->
      <div v-if="debugMode" class="debug-field-info">
        <div class="bg-amber-50 border-b border-amber-200 p-3">
          <h4 class="text-xs font-semibold text-amber-800 mb-2">Debug Info:</h4>
          <div class="text-xs space-y-1 text-amber-700">
            <div>Block ID: {{ block.id }}</div>
            <div>Block Type: {{ blockType.slug }}</div>
            <div>Fields: {{ getEditableFields(blockType).join(', ') }}</div>
            <div>Current Content: <pre class="mt-1 p-2 bg-amber-100 rounded text-xs overflow-auto">{{ JSON.stringify(localContent, null, 2) }}</pre></div>
          </div>
        </div>
      </div>

      <!-- Enhanced Fields Editor -->
      <div class="editor-content p-6 space-y-6">
        <div v-for="field in getEditableFields(blockType)" :key="field" class="field-group">
          <label :for="`${block.id}-${field}`" class="block text-sm font-medium text-slate-700 mb-2">
            {{ formatFieldName(field) }}
            <span v-if="isRequiredField(field)" class="text-red-500 ml-1">*</span>
          </label>

          <!-- Rich Text Editor (Tiptap) -->
          <div v-if="isRichTextField(field)" class="rich-text-editor">
            <!-- Editor Toolbar -->
            <div class="editor-toolbar" v-if="editors[field]">
              <div class="toolbar-group">
                <button
                  @click="toggleBold(field)"
                  :class="['toolbar-btn', { active: isEditorActive(field, 'bold') }]"
                  title="Bold"
                  type="button"
                >
                  <Icon name="lucide:bold" class="w-4 h-4" />
                </button>
                <button
                  @click="toggleItalic(field)"
                  :class="['toolbar-btn', { active: isEditorActive(field, 'italic') }]"
                  title="Italic"
                  type="button"
                >
                  <Icon name="lucide:italic" class="w-4 h-4" />
                </button>
                <button
                  @click="toggleUnderline(field)"
                  :class="['toolbar-btn', { active: isEditorActive(field, 'underline') }]"
                  title="Underline"
                  type="button"
                >
                  <Icon name="lucide:underline" class="w-4 h-4" />
                </button>
              </div>
              
              <div class="toolbar-divider"></div>
              
              <div class="toolbar-group">
                <button
                  @click="toggleHeading(field, 2)"
                  :class="['toolbar-btn', { active: isEditorActive(field, 'heading', { level: 2 }) }]"
                  title="Heading 2"
                  type="button"
                >
                  <Icon name="lucide:heading-2" class="w-4 h-4" />
                </button>
                <button
                  @click="toggleHeading(field, 3)"
                  :class="['toolbar-btn', { active: isEditorActive(field, 'heading', { level: 3 }) }]"
                  title="Heading 3"
                  type="button"
                >
                  <Icon name="lucide:heading-3" class="w-4 h-4" />
                </button>
              </div>
              
              <div class="toolbar-divider"></div>
              
              <div class="toolbar-group">
                <button
                  @click="toggleBulletList(field)"
                  :class="['toolbar-btn', { active: isEditorActive(field, 'bulletList') }]"
                  title="Bullet List"
                  type="button"
                >
                  <Icon name="lucide:list" class="w-4 h-4" />
                </button>
                <button
                  @click="toggleOrderedList(field)"
                  :class="['toolbar-btn', { active: isEditorActive(field, 'orderedList') }]"
                  title="Numbered List"
                  type="button"
                >
                  <Icon name="lucide:list-ordered" class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Tiptap Editor Container -->
            <div 
              :ref="(el) => setEditorRef(field, el)"
              class="tiptap-editor prose prose-sm max-w-none p-3 border border-slate-300 rounded-b-lg focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 min-h-[120px]"
              :class="{ 'border-t-0 rounded-t-none': editors[field] }"
            ></div>
          </div>

          <!-- Regular textarea for non-rich text fields -->
          <textarea
            v-else-if="isTextareaField(field)"
            :id="`${block.id}-${field}`"
            v-model="localContent[field]"
            :placeholder="getFieldPlaceholder(field)"
            class="field-textarea"
            :rows="getFieldRows(field)"
            @input="debouncedUpdate"
          />

          <!-- URL Input -->
          <input
            v-else-if="isUrlField(field) || isEmailField(field)"
            :id="`${block.id}-${field}`"
            v-model="localContent[field]"
            :type="isEmailField(field) ? 'email' : 'url'"
            :placeholder="getFieldPlaceholder(field)"
            class="field-input"
            @input="debouncedUpdate"
          />

          <!-- Color Input -->
          <div v-else-if="isColorField(field)" class="flex gap-2">
            <input
              v-model="localContent[field]"
              type="color"
              class="w-12 h-10 border border-slate-300 rounded cursor-pointer"
              @input="debouncedUpdate"
            />
            <input
              v-model="localContent[field]"
              type="text"
              :placeholder="getFieldPlaceholder(field)"
              class="field-input flex-1"
              @input="debouncedUpdate"
            />
          </div>

          <!-- Number Input -->
          <input
            v-else-if="isNumberField(field)"
            :id="`${block.id}-${field}`"
            v-model.number="localContent[field]"
            type="number"
            :placeholder="getFieldPlaceholder(field)"
            class="field-input"
            @input="debouncedUpdate"
          />

          <!-- Boolean Checkbox -->
          <label v-else-if="isBooleanField(field)" class="flex items-center gap-2 cursor-pointer">
            <input
              v-model="localContent[field]"
              type="checkbox"
              class="rounded"
              @change="debouncedUpdate"
            />
            <span class="text-sm text-slate-700">{{ formatFieldName(field) }}</span>
          </label>

          <!-- Select Field -->
          <select
            v-else-if="isSelectField(field)"
            :id="`${block.id}-${field}`"
            v-model="localContent[field]"
            class="field-select"
            @change="debouncedUpdate"
          >
            <option value="">Choose...</option>
            <option v-for="option in getSelectOptions(field)" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>

          <!-- Default text input -->
          <input
            v-else
            :id="`${block.id}-${field}`"
            v-model="localContent[field]"
            type="text"
            :placeholder="getFieldPlaceholder(field)"
            class="field-input"
            @input="debouncedUpdate"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { debounce } from 'lodash-es';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

interface Props {
  block: any
  blockType: any
}

const props = defineProps<Props>()
const emit = defineEmits(['update'])

// State
const isExpanded = ref(false)
const localContent = ref<Record<string, any>>({})

// Tiptap editor state
const editors = ref<Record<string, any>>({})
const editorRefs = ref<Record<string, HTMLElement>>({})

// Debug mode (set to false in production)
const debugMode = ref(false)

// Initialize content
onMounted(() => {
  console.log('=== NEWSLETTER BLOCK MOUNTED ===')
  console.log('📦 Block:', props.block)
  console.log('🔧 Block Type:', props.blockType)
  console.log('📝 Initial Content:', props.block.content)
  console.log('🏷️ Editable Fields:', getEditableFields(props.blockType))
  
  localContent.value = { ...props.block.content }
  console.log('💾 Local content initialized:', localContent.value)
  
  // Test Tiptap availability
  try {
    const testTiptap = useTiptapEditor({
      content: '<p>Test</p>',
      placeholder: 'Test...'
    })
    console.log('✅ Tiptap composable is available:', !!testTiptap.createEditor)
  } catch (error) {
    console.error('❌ Tiptap composable error:', error)
  }
})

// Computed
const hasContent = computed(() => {
  if (!localContent.value || typeof localContent.value !== 'object') {
    return false
  }
  
  return Object.values(localContent.value).some(value => {
    if (typeof value === 'string') {
      return value.trim().length > 0
    }
    return value !== null && value !== undefined
  })
})

// Methods
const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}

const updateContent = () => {
  emit('update', {
    id: props.block.id,
    type: props.block.type,
    content: { ...localContent.value }
  })
}

const debouncedUpdate = debounce(updateContent, 300)

const stripHtml = (html: string): string => {
  return html.replace(/<[^>]*>/g, '')
}

// Field type detection methods
const getEditableFields = (blockType: any): string[] => {
  if (!blockType) return []
  
  // Try to get from block type configuration
  if (blockType.fields && Array.isArray(blockType.fields)) {
    return blockType.fields.map((f: any) => f.field || f.name || f)
  }
  
  if (blockType.field_visibility_config && Array.isArray(blockType.field_visibility_config)) {
    return blockType.field_visibility_config
  }
  
  // Fallback: get from current content
  if (localContent.value && typeof localContent.value === 'object') {
    return Object.keys(localContent.value)
  }
  
  // Default fields based on block type
  return getDefaultFieldsByType(blockType.slug || blockType.type)
}

const getDefaultFieldsByType = (blockType: string): string[] => {
  const defaults: Record<string, string[]> = {
    hero: ['title', 'subtitle', 'button_text', 'button_url', 'background_color'],
    text: ['text_content'],
    button: ['button_text', 'button_url', 'button_color'],
    image: ['image_url', 'image_alt_text', 'caption'],
    'cta-section': ['cta_title', 'cta_subtitle', 'primary_button_text', 'primary_button_url', 'secondary_button_text', 'secondary_button_url']
  }
  
  return defaults[blockType] || ['content']
}

const formatFieldName = (field: string): string => {
  return field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const isRichTextField = (field: string): boolean => {
  return field.includes('text_content') || field.includes('description') || field === 'content'
}

const isTextareaField = (field: string): boolean => {
  return field.includes('subtitle') || field.includes('note') || field.includes('caption') || 
         field.includes('description') && !isRichTextField(field)
}

const isUrlField = (field: string): boolean => {
  return field.includes('url') || field.includes('link')
}

const isEmailField = (field: string): boolean => {
  return field.includes('email')
}

const isColorField = (field: string): boolean => {
  return field.includes('color')
}

const isNumberField = (field: string): boolean => {
  return field.includes('price') || field.includes('quantity') || field.includes('number') || field.includes('percentage')
}

const isBooleanField = (field: string): boolean => {
  return field.includes('enabled') || field.includes('visible') || field.includes('active')
}

const isSelectField = (field: string): boolean => {
  return field === 'text_align' || field.includes('type') || field.includes('style') || field.includes('alignment')
}

const isRequiredField = (field: string): boolean => {
  const requiredFields = ['title', 'button_text', 'text_content', 'image', 'button_url']
  return requiredFields.includes(field)
}

const getFieldPlaceholder = (field: string): string => {
  const placeholders: Record<string, string> = {
    title: 'Enter title...',
    subtitle: 'Enter subtitle...',
    text_content: 'Enter your content here...',
    button_text: 'Button Text',
    button_url: 'https://',
    background_color: '#ffffff',
    image_url: 'https://...',
    image_alt_text: 'Describe the image'
  }
  
  return placeholders[field] || `Enter ${formatFieldName(field).toLowerCase()}...`
}

const getFieldRows = (field: string): number => {
  if (field.includes('subtitle') || field.includes('caption')) return 2
  if (field.includes('description')) return 4
  return 3
}

const getSelectOptions = (field: string) => {
  const options: Record<string, Array<{value: string, label: string}>> = {
    text_align: [
      { value: 'left', label: 'Left' },
      { value: 'center', label: 'Center' },
      { value: 'right', label: 'Right' }
    ]
  }
  
  return options[field] || []
}

// Tiptap editor management
const setEditorRef = (fieldName: string, el: HTMLElement | null) => {
  if (el) {
    editorRefs.value[fieldName] = el
    nextTick(() => initializeEditor(fieldName))
  }
}

const initializeEditor = (fieldName: string) => {
  const element = editorRefs.value[fieldName]
  if (!element || editors.value[fieldName]) return

  console.log(`🎨 Initializing Tiptap editor for field: ${fieldName}`)

  try {
    const { createEditor } = useTiptapEditor({
      content: localContent.value[fieldName] || '',
      placeholder: getFieldPlaceholder(fieldName),
      onUpdate: (content: string) => {
        console.log(`📝 Tiptap content updated for ${fieldName}:`, content)
        localContent.value[fieldName] = content
        // The existing watch on localContent will emit the update
      },
      features: {
        headings: true,
        lists: true,
        links: true,
        alignment: false,
        colors: false,
        tables: false,
        images: false
      }
    })

    const editor = createEditor()
    if (editor && element) {
      // Mount editor to DOM
      if (typeof editor.mount === 'function') {
        editor.mount(element)
      } else if (editor.options?.element) {
        element.appendChild(editor.options.element)
      }
      
      editors.value[fieldName] = editor
      console.log(`✅ Editor successfully initialized for ${fieldName}`)
    } else {
      console.error(`❌ Failed to initialize editor for ${fieldName}`)
    }
  } catch (error) {
    console.error(`💥 Error initializing Tiptap for ${fieldName}:`, error)
  }
}

// Toolbar command methods
const toggleBold = (fieldName: string) => {
  const editor = editors.value[fieldName]
  if (editor && editor.chain) {
    editor.chain().focus().toggleBold().run()
  }
}

const toggleItalic = (fieldName: string) => {
  const editor = editors.value[fieldName]
  if (editor && editor.chain) {
    editor.chain().focus().toggleItalic().run()
  }
}

const toggleUnderline = (fieldName: string) => {
  const editor = editors.value[fieldName]
  if (editor && editor.chain) {
    editor.chain().focus().toggleUnderline().run()
  }
}

const toggleHeading = (fieldName: string, level: number) => {
  const editor = editors.value[fieldName]
  if (editor && editor.chain) {
    editor.chain().focus().toggleHeading({ level }).run()
  }
}

const toggleBulletList = (fieldName: string) => {
  const editor = editors.value[fieldName]
  if (editor && editor.chain) {
    editor.chain().focus().toggleBulletList().run()
  }
}

const toggleOrderedList = (fieldName: string) => {
  const editor = editors.value[fieldName]
  if (editor && editor.chain) {
    editor.chain().focus().toggleOrderedList().run()
  }
}

const isEditorActive = (fieldName: string, name: string, attributes?: Record<string, any>) => {
  const editor = editors.value[fieldName]
  return editor && editor.isActive ? editor.isActive(name, attributes) : false
}

// Watchers
watch(() => props.block.content, (newContent) => {
  console.log('📦 Block content changed from parent:', newContent)
  localContent.value = { ...newContent }
  
  // Update all Tiptap editors with new content
  Object.keys(editors.value).forEach(fieldName => {
    const editor = editors.value[fieldName]
    const newFieldContent = newContent[fieldName] || ''
    if (editor && editor.commands && editor.getHTML() !== newFieldContent) {
      console.log(`🔄 Updating editor ${fieldName} with new content:`, newFieldContent)
      editor.commands.setContent(newFieldContent)
    }
  })
}, { deep: true })

watch(localContent, (newVal) => {
  console.log('=== LOCAL CONTENT UPDATED ===')
  console.log('📝 New Content:', newVal)
  console.log('🚀 Emitting update to parent')
  updateContent()
}, { deep: true })

// Clean up editors when component unmounts
onBeforeUnmount(() => {
  console.log('🧹 Cleaning up Tiptap editors')
  Object.values(editors.value).forEach(editor => {
    if (editor && typeof editor.destroy === 'function') {
      editor.destroy()
    }
  })
  editors.value = {}
  editorRefs.value = {}
})
</script>

<style scoped>
@reference 'tailwindcss';
/* Block Wrapper */
.newsletter-block-wrapper {
  @apply mb-4;
}

/* Preview Mode */
.newsletter-block-preview {
  @apply min-h-[120px];
}

/* Content Preview */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Editor Mode */
.newsletter-block-editor {
  @apply transition-all duration-200;
}

.editor-header {
  @apply bg-slate-50;
}

.editor-content {
  @apply bg-white;
}

/* Form Elements */
.field-group {
  @apply space-y-2;
}

.field-input, .field-textarea, .field-select {
  @apply w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent;
}

/* .field-textarea {
  @apply resize-vertical;
} */

/* Rich Text Editor */
.rich-text-editor {
  @apply space-y-0;
}

/* Editor Toolbar */
.editor-toolbar {
  @apply flex items-center gap-1 p-2 bg-slate-50 border border-slate-300 border-b-0 rounded-t-lg;
}

.toolbar-group {
  @apply flex items-center gap-1;
}

.toolbar-btn {
  @apply p-1.5 text-slate-600 hover:bg-slate-200 rounded transition-colors;
}

.toolbar-btn.active {
  @apply bg-slate-200 text-blue-600;
}

.toolbar-divider {
  @apply w-px h-6 bg-slate-300 mx-1;
}

/* Tiptap Editor Styling */
.tiptap-editor {
  @apply transition-all duration-200;
}

.tiptap-editor.prose {
  @apply text-sm leading-relaxed;
}

.tiptap-editor.prose p {
  @apply my-2;
}

.tiptap-editor.prose h2,
.tiptap-editor.prose h3 {
  @apply mt-4 mb-2 font-semibold;
}

.tiptap-editor.prose ul,
.tiptap-editor.prose ol {
  @apply my-2 pl-6;
}

.tiptap-editor.prose li {
  @apply my-1;
}

/* Debug Info */
.debug-field-info {
  font-family: monospace;
  line-height: 1.3;
}

/* Dark mode support */
.dark-mode .newsletter-block-preview {
  @apply from-gray-800 to-gray-900 border-gray-600;
}

.dark-mode .newsletter-block-editor {
  @apply bg-gray-800 border-gray-700;
}

.dark-mode .editor-header {
  @apply bg-gray-700 border-gray-600;
}

.dark-mode .editor-content {
  @apply bg-gray-800;
}

.dark-mode .field-input,
.dark-mode .field-textarea,
.dark-mode .field-select {
  @apply bg-gray-700 border-gray-600 text-white placeholder-gray-400;
}

.dark-mode .editor-toolbar {
  @apply bg-gray-700 border-gray-600;
}

.dark-mode .toolbar-btn {
  @apply text-gray-400 hover:bg-gray-600;
}

.dark-mode .toolbar-btn.active {
  @apply bg-gray-600 text-blue-400;
}

.dark-mode .tiptap-editor {
  @apply bg-gray-700 border-gray-600 text-white;
}
</style>