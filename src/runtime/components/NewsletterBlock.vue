<template>
  <div class="newsletter-block-wrapper">
    <!-- View Mode -->
    <div
      v-if="!isEditing"
      @click="toggleEdit"
      class="newsletter-block-preview group cursor-pointer relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300"
    >
      <!-- Block Type Badge -->
      <div class="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm">
        <Icon :name="blockType.icon || 'lucide:square'" class="w-4 h-4 text-slate-600" />
        <span class="text-xs font-medium text-slate-700">{{ blockType.name }}</span>
      </div>

      <!-- Content Preview -->
      <div class="p-6 pt-14">
        <!-- Show actual content preview based on what's filled -->
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
          <div v-if="localContent.image || localContent.image_url" class="aspect-video bg-slate-100 rounded-lg overflow-hidden">
            <img
              :src="getImageUrl(localContent.image || localContent.image_url)"
              :alt="localContent.image_alt || localContent.image_alt_text || 'Block image'"
              class="w-full h-full object-cover"
              @error="handleImageError"
            />
          </div>

          <!-- Other content preview -->
          <div v-if="localContent.price" class="text-lg font-bold text-green-600">
            {{ localContent.price }}
          </div>
        </div>

        <!-- Empty state -->
        <div v-else class="text-center py-6">
          <div class="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
            <Icon name="lucide:edit-3" class="w-6 h-6 text-slate-400" />
          </div>
          <p class="text-sm font-medium text-slate-900 mb-1">{{ blockType.name }}</p>
          <p class="text-xs text-slate-500">Click to edit content</p>
        </div>
      </div>

      <!-- Edit Overlay -->
      <div class="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-blue-700/90 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center">
        <div class="text-center text-white">
          <Icon name="lucide:edit-3" class="w-6 h-6 mx-auto mb-2" />
          <p class="text-sm font-medium">Click to Edit</p>
        </div>
      </div>
    </div>

    <!-- Enhanced Editing Interface -->
    <div
      v-else
      class="bg-white rounded-xl border border-blue-300 shadow-lg overflow-hidden"
    >
      <!-- Enhanced Edit Header -->
      <div class="bg-gradient-to-r from-blue-50 to-blue-100/50 border-b border-blue-200/60 p-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
              <Icon :name="blockType.icon || 'lucide:square'" class="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 class="text-sm font-semibold text-slate-900">{{ blockType.name }}</h3>
              <p class="text-xs text-slate-600">{{ blockType.description }}</p>
            </div>
          </div>
          <button
            @click="toggleEdit"
            class="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <Icon name="lucide:check" class="w-5 h-5" />
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
            <div>Fields: {{ getEditableFields(blockType).map(f => f).join(', ') }}</div>
            <div>Current Content: <pre class="mt-1 p-2 bg-amber-100 rounded text-xs overflow-auto">{{ JSON.stringify(localContent, null, 2) }}</pre></div>
          </div>
        </div>
      </div>

      <!-- Enhanced Fields Editor -->
      <div class="p-6 space-y-6">
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
                >
                  <Icon name="lucide:bold" class="w-4 h-4" />
                </button>
                <button
                  @click="toggleItalic(field)"
                  :class="['toolbar-btn', { active: isEditorActive(field, 'italic') }]"
                  title="Italic"
                >
                  <Icon name="lucide:italic" class="w-4 h-4" />
                </button>
                <button
                  @click="toggleUnderline(field)"
                  :class="['toolbar-btn', { active: isEditorActive(field, 'underline') }]"
                  title="Underline"
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
                >
                  <Icon name="lucide:heading-2" class="w-4 h-4" />
                </button>
                <button
                  @click="toggleHeading(field, 3)"
                  :class="['toolbar-btn', { active: isEditorActive(field, 'heading', { level: 3 }) }]"
                  title="Heading 3"
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
                >
                  <Icon name="lucide:list" class="w-4 h-4" />
                </button>
                <button
                  @click="toggleOrderedList(field)"
                  :class="['toolbar-btn', { active: isEditorActive(field, 'orderedList') }]"
                  title="Numbered List"
                >
                  <Icon name="lucide:list-ordered" class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Editor Content Area -->
            <div 
              :ref="el => setEditorRef(field, el as HTMLElement)" 
              class="min-h-[150px] prose prose-sm max-w-none border border-slate-300 rounded-b-lg p-3 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500"
            />
          </div>

          <!-- Regular Text Input -->
          <input
            v-else-if="isTextField(field)"
            :id="`${block.id}-${field}`"
            v-model="localContent[field]"
            @input="updateContent"
            type="text"
            class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            :placeholder="getFieldPlaceholder(field)"
          />

          <!-- Textarea -->
          <textarea
            v-else-if="isTextareaField(field)"
            :id="`${block.id}-${field}`"
            v-model="localContent[field]"
            @input="updateContent"
            rows="4"
            class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-y"
            :placeholder="getFieldPlaceholder(field)"
          />

          <!-- Email Input -->
          <div v-else-if="isEmailField(field)" class="relative">
            <Icon name="lucide:mail" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              :id="`${block.id}-${field}`"
              v-model="localContent[field]"
              @input="updateContent"
              type="email"
              class="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              :placeholder="getFieldPlaceholder(field)"
            />
          </div>

          <!-- URL Input -->
          <div v-else-if="isUrlField(field)" class="relative">
            <Icon name="lucide:link" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              :id="`${block.id}-${field}`"
              v-model="localContent[field]"
              @input="updateContent"
              type="url"
              class="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              :placeholder="getFieldPlaceholder(field)"
            />
          </div>

          <!-- Color Picker -->
          <div v-else-if="isColorField(field)" class="flex items-center space-x-3">
            <input
              :id="`${block.id}-${field}`"
              v-model="localContent[field]"
              @input="updateContent"
              type="color"
              class="h-10 w-20 border border-slate-300 rounded cursor-pointer"
            />
            <input
              v-model="localContent[field]"
              @input="updateContent"
              type="text"
              class="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              placeholder="#000000"
            />
            <div class="w-10 h-10 rounded border border-slate-300 shadow-inner" :style="{ backgroundColor: localContent[field] || '#ffffff' }"></div>
          </div>

          <!-- Image Upload/Input -->
          <div v-else-if="isImageField(field)" class="space-y-3">
            <ImageUpload
              :model-value="localContent[field]"
              @update:model-value="(value) => updateFieldValue(field, value)"
              @error="handleImageUploadError"
            />
            <div v-if="localContent[field]" class="relative group">
              <img
                :src="getImageUrl(localContent[field])"
                alt="Preview"
                class="w-full h-48 object-cover rounded-lg border border-slate-200"
                @error="handleImageError"
              />
              <button
                @click="localContent[field] = ''"
                class="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Icon name="lucide:x" class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Number Input -->
          <input
            v-else-if="isNumberField(field)"
            :id="`${block.id}-${field}`"
            v-model.number="localContent[field]"
            @input="updateContent"
            type="number"
            class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            :placeholder="getFieldPlaceholder(field)"
          />

          <!-- Boolean/Checkbox -->
          <label v-else-if="isBooleanField(field)" class="flex items-center space-x-3 cursor-pointer">
            <input
              :id="`${block.id}-${field}`"
              v-model="localContent[field]"
              @change="updateContent"
              type="checkbox"
              class="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span class="text-sm text-slate-700">Enable {{ formatFieldName(field) }}</span>
          </label>

          <!-- Select/Dropdown -->
          <select
            v-else-if="isSelectField(field)"
            :id="`${block.id}-${field}`"
            v-model="localContent[field]"
            @change="updateContent"
            class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          >
            <option value="">Select {{ formatFieldName(field) }}</option>
            <option v-for="option in getFieldOptions(field)" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>

          <!-- Default fallback to text input -->
          <input
            v-else
            :id="`${block.id}-${field}`"
            v-model="localContent[field]"
            @input="updateContent"
            type="text"
            class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            :placeholder="getFieldPlaceholder(field)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { BlockType, NewsletterBlock as NewsletterBlockType } from '../../types'
import { useTiptapEditor } from '../composables/useTiptapEditor'
import ImageUpload from './ImageUpload.vue'

interface Props {
  block: NewsletterBlockType
  blockType: BlockType
  disabled?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits(['update'])

// Existing state
const isEditing = ref(false)
const localContent = ref<Record<string, any>>({})

// Tiptap editor state
const editors = ref<Record<string, any>>({})
const editorRefs = ref<Record<string, HTMLElement>>({})

// Debug mode (set to false in production)
const debugMode = ref(false) // Set to true for development

// Initialize content
onMounted(() => {
  console.log('=== NEWSLETTER BLOCK MOUNTED ===')
  console.log('📦 Block:', props.block)
  console.log('🔧 Block Type:', props.blockType)
  console.log('📝 Initial Content:', props.block.content)
  console.log('🏷️ Editable Fields:', getEditableFields(props.blockType))
  
  // Check which fields should be rich text
  const fields = getEditableFields(props.blockType)
  fields.forEach(field => {
    console.log(`🔍 Field "${field}":`, {
      isRichText: isRichTextField(field),
      isTextarea: isTextareaField(field),
      isText: isTextField(field),
      currentValue: props.block.content[field]
    })
  })
  
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
  
  console.log('===============================')
})

// Watch for changes in prop.block.content and update localContent
watch(() => props.block.content, (newContent) => {
  console.log('📦 Block content changed from parent:', newContent)
  localContent.value = { ...newContent }
  
  // Update all Tiptap editors with new content
  Object.keys(editors.value).forEach(fieldName => {
    const editor = editors.value[fieldName]
    const newFieldContent = newContent[fieldName] || ''
    if (editor && editor.getHTML() !== newFieldContent) {
      console.log(`🔄 Updating editor ${fieldName} with new content:`, newFieldContent)
      editor.commands.setContent(newFieldContent)
    }
  })
}, { deep: true })

// Emit updates to parent when localContent changes - FIXED TO INCLUDE ID
watch(localContent, (newVal) => {
  console.log('=== LOCAL CONTENT UPDATED ===')
  console.log('📝 New Content:', newVal)
  console.log('🚀 Emitting update to parent')
  // CRITICAL FIX: Include block ID in update
  emit('update', { 
    id: props.block.id,
    type: props.block.type,
    content: { ...newVal }
  })
  console.log('=============================')
}, { deep: true })

const toggleEdit = () => {
  isEditing.value = !isEditing.value
}

// Enhanced content detection
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

// Enhanced field type detection - FIXED to match your Directus field names
const getEditableFields = (blockType: BlockType): string[] => {
  console.log('=== GET EDITABLE FIELDS ===')
  console.log('📋 Block Type:', blockType)
  console.log('🔧 Block Type Fields:', blockType.fields)
  console.log('🏷️ Block Type Slug:', blockType.slug)
  
  // Use field_visibility_config if available
  if (blockType.field_visibility_config && Array.isArray(blockType.field_visibility_config)) {
    return blockType.field_visibility_config
  }
  
  // Fallback to fields array
  if (blockType.fields && Array.isArray(blockType.fields)) {
    const fields = blockType.fields.map(field => field.field || field.name || field).filter(Boolean)
    console.log('✅ Fields found:', fields)
    return fields
  }
  
  // Final fallback based on block type slug
  const fallbackFields = getDefaultFieldsForBlockType(blockType.slug)
  console.log('⚠️ Using fallback fields:', fallbackFields)
  return fallbackFields
}

// Default fields for block types without field_visibility_config
const getDefaultFieldsForBlockType = (slug: string): string[] => {
  const defaultFields: Record<string, string[]> = {
    'hero': ['title', 'subtitle', 'button_text', 'button_url', 'background_color', 'text_color', 'text_align', 'padding'],
    'text': ['text_content', 'background_color', 'text_color', 'text_align', 'padding', 'font_size'],
    'image': ['image', 'image_alt_text', 'image_caption', 'button_url', 'background_color', 'text_align', 'padding'],
    'button': ['button_text', 'button_url', 'background_color', 'text_align', 'padding']
  }
  
  return defaultFields[slug] || ['content']
}

// Field type detection functions
const isRichTextField = (field: string) => {
  return field === 'text_content' || field === 'body_content' || field === 'description_rich'
}

const isTextField = (field: string) => {
  return !isRichTextField(field) && !isTextareaField(field) && !isSpecialField(field)
}

const isTextareaField = (field: string) => {
  return (field.includes('description') || field.includes('excerpt') || field.includes('summary')) && !isRichTextField(field)
}

const isEmailField = (field: string) => {
  return field.includes('email')
}

const isUrlField = (field: string) => {
  return field.includes('url') || field.includes('link')
}

const isColorField = (field: string) => {
  return field.includes('color')
}

const isImageField = (field: string) => {
  return field === 'image' || field === 'author_avatar' || (field.includes('image') && !field.includes('alt') && !field.includes('caption'))
}

const isNumberField = (field: string) => {
  return field.includes('price') || field.includes('quantity') || field.includes('number') || field.includes('percentage')
}

const isBooleanField = (field: string) => {
  return field.includes('enabled') || field.includes('visible') || field.includes('active')
}

const isSelectField = (field: string) => {
  return field === 'text_align' || field.includes('type') || field.includes('style') || field.includes('alignment')
}

const isRequiredField = (field: string) => {
  const requiredFields = ['title', 'button_text', 'text_content', 'image', 'button_url']
  return requiredFields.includes(field)
}

const isSpecialField = (field: string) => {
  return isEmailField(field) || isUrlField(field) || isColorField(field) || 
         isImageField(field) || isNumberField(field) || isBooleanField(field) || 
         isSelectField(field) || isTextareaField(field) || isRichTextField(field)
}

// Tiptap editor management methods
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
  console.log(`📝 Initial content:`, localContent.value[fieldName])

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
  if (editor) {
    console.log(`🔤 Toggling bold for ${fieldName}`)
    editor.chain().focus().toggleBold().run()
  }
}

const toggleItalic = (fieldName: string) => {
  const editor = editors.value[fieldName]
  if (editor) editor.chain().focus().toggleItalic().run()
}

const toggleUnderline = (fieldName: string) => {
  const editor = editors.value[fieldName]
  if (editor) editor.chain().focus().toggleUnderline().run()
}

const toggleHeading = (fieldName: string, level: number) => {
  const editor = editors.value[fieldName]
  if (editor) editor.chain().focus().toggleHeading({ level }).run()
}

const toggleBulletList = (fieldName: string) => {
  const editor = editors.value[fieldName]
  if (editor) editor.chain().focus().toggleBulletList().run()
}

const toggleOrderedList = (fieldName: string) => {
  const editor = editors.value[fieldName]
  if (editor) editor.chain().focus().toggleOrderedList().run()
}

const isEditorActive = (fieldName: string, name: string, attributes?: Record<string, any>) => {
  const editor = editors.value[fieldName]
  return editor ? editor.isActive(name, attributes) : false
}

// Field value update
const updateFieldValue = (fieldName: string, value: any) => {
  localContent.value[fieldName] = value
  updateContent()
}

const updateContent = () => {
  // This will trigger the watch on localContent
}

// Utility functions
const formatFieldName = (field: string) => {
  return field
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
}

const getFieldPlaceholder = (field: string) => {
  const placeholders: Record<string, string> = {
    'title': 'Enter title...',
    'subtitle': 'Enter subtitle...',
    'text_content': 'Enter your content...',
    'button_text': 'Button Label',
    'button_url': 'https://example.com',
    'image': 'https://example.com/image.jpg',
    'image_url': 'https://example.com/image.jpg',
    'image_alt_text': 'Describe the image...',
    'image_caption': 'Optional caption...',
    'background_color': '#ffffff',
    'text_color': '#333333',
    'text_align': 'left',
    'padding': '20px',
    'font_size': '16px',
    'email': 'email@example.com',
    'price': '99.99',
    'quantity': '1'
  }
  
  return placeholders[field] || `Enter ${formatFieldName(field).toLowerCase()}...`
}

const getFieldOptions = (field: string): { value: string; label: string }[] => {
  if (field === 'text_align') {
    return [
      { value: 'left', label: 'Left' },
      { value: 'center', label: 'Center' },
      { value: 'right', label: 'Right' }
    ]
  }
  
  return []
}

const stripHtml = (html: string): string => {
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ''
}

const getImageUrl = (url: string): string => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  if (url.startsWith('/')) return url
  return `/${url}`
}

const getContrastColor = (bgColor: string): string => {
  if (!bgColor) return '#000000'
  const color = bgColor.substring(1)
  const rgb = parseInt(color, 16)
  const r = (rgb >> 16) & 0xff
  const g = (rgb >> 8) & 0xff
  const b = (rgb >> 0) & 0xff
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return luma < 128 ? '#ffffff' : '#000000'
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}

const handleImageUploadError = (error: string) => {
  console.error('Image upload error:', error)
}

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
.newsletter-block {
  position: relative;
}

/* Enhanced line clamping */
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

/* Enhanced color input styling */
input[type="color"] {
  -webkit-appearance: none;
  border: none;
  cursor: pointer;
}

input[type="color"]::-webkit-color-swatch-wrapper {
  padding: 0;
}

input[type="color"]::-webkit-color-swatch {
  border: none;
  border-radius: 8px;
}

/* Enhanced transition for all interactive elements */
button, input, textarea, select {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Focus styles */
.newsletter-block :focus {
  outline: none;
}

/* Hover animations */
.newsletter-block .group:hover .group-hover\:opacity-100 {
  opacity: 1;
}

/* Debug field info styling */
.debug-field-info {
  font-family: monospace;
  line-height: 1.3;
}

/* Tiptap editor styling */
.prose {
  max-width: none !important;
}

.prose p {
  margin: 0.5em 0;
}

.prose h2, .prose h3 {
  margin: 0.75em 0 0.25em 0;
}

.prose ul, .prose ol {
  margin: 0.5em 0;
  padding-left: 1.5em;
}
</style>