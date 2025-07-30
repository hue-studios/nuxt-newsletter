<!-- Fixed NewsletterBlock.vue -->
<template>
  <div class="newsletter-block-wrapper">
    <!-- Preview Mode (Collapsed) -->
    <div v-if="!isExpanded" class="newsletter-block-preview" @click="toggleExpanded">
      <div class="bg-white rounded-lg shadow-sm border border-slate-200 hover:border-slate-300 cursor-pointer transition-all duration-200">
        <div class="p-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="flex items-center justify-center w-10 h-10 bg-slate-100 rounded-lg">
              <Icon v-if="blockType?.icon" :name="blockType.icon" class="w-5 h-5 text-slate-600" />
              <Icon v-else name="lucide:layout" class="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <h4 class="font-medium text-slate-900">{{ blockType?.name || 'Unknown Block' }}</h4>
              <p v-if="hasContent" class="text-sm text-slate-500 line-clamp-1">
                {{ contentPreview.title || contentPreview.text || 'Click to edit' }}
              </p>
              <p v-else class="text-sm text-slate-400 italic">Click to add content</p>
            </div>
          </div>
          <Icon name="lucide:chevron-down" class="w-5 h-5 text-slate-400" />
        </div>
      </div>
    </div>

    <!-- Editor Mode (Expanded) -->
    <Transition name="expand">
      <div v-if="isExpanded" class="newsletter-block-editor">
        <div class="bg-white rounded-lg shadow-sm border border-blue-200 overflow-hidden">
          <!-- Header -->
          <div class="editor-header px-4 py-3 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg">
                <Icon v-if="blockType?.icon" :name="blockType.icon" class="w-4 h-4 text-blue-600" />
                <Icon v-else name="lucide:layout" class="w-4 h-4 text-blue-600" />
              </div>
              <h4 class="font-medium text-slate-900">{{ blockType?.name || 'Unknown Block' }}</h4>
            </div>
            <button @click="toggleExpanded" class="p-1 hover:bg-slate-100 rounded-md transition-colors">
              <Icon name="lucide:chevron-up" class="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <!-- Content Editor -->
          <div class="editor-content p-4 space-y-4">
            <div v-for="fieldName in getEditableFields(blockType)" :key="fieldName" class="field-group">
              <label :for="`field-${block.id}-${fieldName}`" class="block text-sm font-medium text-slate-700 mb-1">
                {{ getFieldLabel(fieldName) }}
              </label>
              
              <!-- Different input types based on field -->
              <component
                :is="getFieldComponent(fieldName)"
                :id="`field-${block.id}-${fieldName}`"
                v-model="localContent[fieldName]"
                :placeholder="getFieldPlaceholder(fieldName)"
                :rows="getFieldRows(fieldName)"
                @input="handleFieldUpdate"
                class="field-input"
              />
            </div>
          </div>

          <!-- Actions -->
          <div class="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <button @click="$emit('move-up')" :disabled="!canMoveUp" class="action-btn">
                <Icon name="lucide:arrow-up" class="w-4 h-4" />
              </button>
              <button @click="$emit('move-down')" :disabled="!canMoveDown" class="action-btn">
                <Icon name="lucide:arrow-down" class="w-4 h-4" />
              </button>
              <button @click="$emit('duplicate', block.id)" class="action-btn">
                <Icon name="lucide:copy" class="w-4 h-4" />
              </button>
            </div>
            <button @click="$emit('remove', block.id)" class="action-btn text-red-600 hover:bg-red-50">
              <Icon name="lucide:trash-2" class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { debounce } from 'lodash-es'
import { computed, nextTick, ref, watch } from 'vue'

interface Props {
  block: any
  blockType?: any
  index?: number
  totalBlocks?: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update': [block: any]
  'remove': [blockId: string]
  'move-up': []
  'move-down': []
  'duplicate': [blockId: string]
}>()

// State
const isExpanded = ref(false)
const localContent = ref({ ...props.block.content })
const isUpdating = ref(false) // Flag to prevent recursive updates

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

const contentPreview = computed(() => {
  const content = localContent.value
  return {
    title: content.title || content.heading || content.subject,
    text: stripHtml(content.text_content || content.text || content.description || content.subtitle || '')
  }
})

const canMoveUp = computed(() => props.index !== undefined && props.index > 0)
const canMoveDown = computed(() => props.index !== undefined && props.totalBlocks !== undefined && props.index < props.totalBlocks - 1)

// Methods
const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}

const stripHtml = (html: string): string => {
  return html.replace(/<[^>]*>/g, '')
}

// FIXED: Immediate update without causing loops
const handleFieldUpdate = () => {
  debouncedUpdate()
}

// FIXED: Emit update with flag to prevent loops
const updateContent = () => {
  if (isUpdating.value) return // Prevent recursive updates
  
  emit('update', {
    id: props.block.id,
    type: props.block.type,
    content: { ...localContent.value }
  })
}

const debouncedUpdate = debounce(updateContent, 300)

// Field helper methods
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
    hero: ['title', 'subtitle', 'button_text', 'button_url'],
    text: ['text_content'],
    button: ['button_text', 'button_url'],
    image: ['image_url', 'image_alt_text', 'caption'],
    divider: [],
    spacer: ['height'],
    columns: ['column_1_content', 'column_2_content'],
    social: ['facebook_url', 'twitter_url', 'instagram_url', 'linkedin_url']
  }
  
  return defaults[blockType] || ['content']
}

const getFieldLabel = (fieldName: string): string => {
  return fieldName
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
}

const getFieldPlaceholder = (fieldName: string): string => {
  const placeholders: Record<string, string> = {
    title: 'Enter title...',
    subtitle: 'Enter subtitle...',
    text_content: 'Enter your text content...',
    button_text: 'Button text',
    button_url: 'https://example.com',
    image_url: 'https://example.com/image.jpg',
    image_alt_text: 'Image description'
  }
  
  return placeholders[fieldName] || `Enter ${getFieldLabel(fieldName).toLowerCase()}...`
}

const getFieldComponent = (fieldName: string): string => {
  if (fieldName.includes('url') || fieldName.includes('link')) {
    return 'input'
  }
  if (fieldName.includes('content') || fieldName.includes('text') && !fieldName.includes('button')) {
    return 'textarea'
  }
  return 'input'
}

const getFieldRows = (fieldName: string): number => {
  if (fieldName.includes('content')) return 4
  if (fieldName.includes('text') && !fieldName.includes('button')) return 3
  return 1
}

// FIXED: Watch for external changes with update flag
watch(() => props.block.content, (newContent) => {
  if (!isUpdating.value && JSON.stringify(newContent) !== JSON.stringify(localContent.value)) {
    isUpdating.value = true
    localContent.value = { ...newContent }
    nextTick(() => {
      isUpdating.value = false
    })
  }
}, { deep: true })

// FIXED: Prevent watch on localContent to avoid loops
// Updates are now handled explicitly through handleFieldUpdate
</script>

<style scoped>
@reference 'tailwindcss';
/* Styles remain the same */
.newsletter-block-wrapper {
  @apply mb-4;
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.field-input, textarea {
  @apply w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent;
}

/* textarea {
  @apply resize-vertical;
} */

.action-btn {
  @apply p-1.5 text-slate-600 hover:bg-slate-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
}

/* Expand transition */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>