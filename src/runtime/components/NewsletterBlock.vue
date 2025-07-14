<template>
  <div class="newsletter-block">
    <!-- Enhanced Block Preview (when not editing) -->
    <div
      v-if="!isEditing"
      class="group relative bg-white rounded-xl border border-slate-200/60 overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer"
      @click="toggleEdit"
    >
      <!-- Preview Content -->
      <div class="p-4">
        <div v-if="hasContent" class="space-y-3">
          <!-- Text Content Preview -->
          <div v-if="localContent.title" class="space-y-1">
            <h4 class="text-lg font-semibold text-slate-900 line-clamp-2">
              {{ localContent.title }}
            </h4>
          </div>
          
          <div v-if="localContent.subtitle" class="space-y-1">
            <p class="text-slate-600 line-clamp-2">
              {{ localContent.subtitle }}
            </p>
          </div>

          <div v-if="localContent.text_content" class="space-y-1">
            <div class="text-slate-700 line-clamp-3" v-html="localContent.text_content"></div>
          </div>

          <!-- CTA Preview -->
          <div v-if="localContent.button_text || localContent.primary_button_text" class="flex flex-wrap gap-2">
            <div
              v-if="localContent.button_text"
              class="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg"
              :style="{ 
                backgroundColor: localContent.button_color || '#3b82f6',
                color: getContrastColor(localContent.button_color || '#3b82f6')
              }"
            >
              {{ localContent.button_text }}
            </div>
            <div
              v-if="localContent.primary_button_text"
              class="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg"
              :style="{ 
                backgroundColor: localContent.primary_button_color || '#3b82f6',
                color: getContrastColor(localContent.primary_button_color || '#3b82f6')
              }"
            >
              {{ localContent.primary_button_text }}
            </div>
            <div
              v-if="localContent.secondary_button_text"
              class="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700"
            >
              {{ localContent.secondary_button_text }}
            </div>
          </div>

          <!-- Image Preview -->
          <div v-if="localContent.image_url" class="aspect-video bg-slate-100 rounded-lg overflow-hidden">
            <img
              :src="getImageUrl(localContent.image_url)"
              :alt="localContent.image_alt || 'Block image'"
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
            <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Icon name="lucide:edit-3" class="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-slate-900">Edit {{ blockType.name }}</h3>
              <p class="text-sm text-slate-600">{{ blockType.description || 'Customize your content block' }}</p>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <button
              @click="toggleEdit"
              class="inline-flex items-center px-4 py-2 border border-blue-300 text-sm font-medium rounded-lg text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-200"
            >
              <Icon name="lucide:check" class="w-4 h-4 mr-2" />
              Done
            </button>
          </div>
        </div>
      </div>

      <!-- Enhanced Form Fields -->
      <div class="p-6">
        <div class="space-y-6">
          <div
            v-for="field in getEditableFields(blockType)"
            :key="field"
            class="space-y-2"
          >
            <!-- Text Input -->
            <div v-if="isTextField(field)" class="space-y-2">
              <label :for="field" class="block text-sm font-medium text-slate-700">
                {{ formatFieldName(field) }}
                <span v-if="isRequiredField(field)" class="text-red-500">*</span>
              </label>
              <input
                :id="field"
                v-model="localContent[field]"
                type="text"
                :placeholder="getFieldPlaceholder(field)"
                class="block w-full px-4 py-3 text-sm border border-slate-300 rounded-xl shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                :class="getFieldClasses(field)"
              />
              <p v-if="getFieldHint(field)" class="text-xs text-slate-500">
                {{ getFieldHint(field) }}
              </p>
            </div>

            <!-- Email Input -->
            <div v-else-if="isEmailField(field)" class="space-y-2">
              <label :for="field" class="block text-sm font-medium text-slate-700">
                {{ formatFieldName(field) }}
                <span v-if="isRequiredField(field)" class="text-red-500">*</span>
              </label>
              <input
                :id="field"
                v-model="localContent[field]"
                type="email"
                :placeholder="getFieldPlaceholder(field)"
                class="block w-full px-4 py-3 text-sm border border-slate-300 rounded-xl shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
              />
            </div>

            <!-- URL Input -->
            <div v-else-if="isUrlField(field)" class="space-y-2">
              <label :for="field" class="block text-sm font-medium text-slate-700">
                {{ formatFieldName(field) }}
                <span v-if="isRequiredField(field)" class="text-red-500">*</span>
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Icon name="lucide:link" class="w-4 h-4 text-slate-400" />
                </div>
                <input
                  :id="field"
                  v-model="localContent[field]"
                  type="url"
                  :placeholder="getFieldPlaceholder(field)"
                  class="block w-full pl-10 pr-4 py-3 text-sm border border-slate-300 rounded-xl shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                />
              </div>
            </div>

            <!-- Textarea -->
            <div v-else-if="isTextareaField(field)" class="space-y-2">
              <label :for="field" class="block text-sm font-medium text-slate-700">
                {{ formatFieldName(field) }}
                <span v-if="isRequiredField(field)" class="text-red-500">*</span>
              </label>
              <textarea
                :id="field"
                v-model="localContent[field]"
                rows="4"
                :placeholder="getFieldPlaceholder(field)"
                class="block w-full px-4 py-3 text-sm border border-slate-300 rounded-xl shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 resize-none"
              ></textarea>
              <p v-if="field.includes('html')" class="text-xs text-slate-500">
                Supports HTML formatting: &lt;strong&gt;, &lt;em&gt;, &lt;a&gt;, etc.
              </p>
            </div>

            <!-- Color Picker -->
            <div v-else-if="isColorField(field)" class="space-y-2">
              <label :for="field" class="block text-sm font-medium text-slate-700">
                {{ formatFieldName(field) }}
              </label>
              <div class="flex items-center space-x-3">
                <div class="relative">
                  <input
                    :id="field"
                    v-model="localContent[field]"
                    type="color"
                    class="w-12 h-12 border border-slate-300 rounded-xl shadow-sm cursor-pointer"
                  />
                </div>
                <input
                  v-model="localContent[field]"
                  type="text"
                  :placeholder="getFieldPlaceholder(field)"
                  class="flex-1 px-4 py-3 text-sm border border-slate-300 rounded-xl shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                />
              </div>
            </div>

            <!-- Image Upload -->
            <ImageUpload
              v-else-if="isImageField(field)"
              v-model="localContent[field]"
              :label="formatFieldName(field)"
              @error="handleImageUploadError"
            />

            <!-- Number Input -->
            <div v-else-if="isNumberField(field)" class="space-y-2">
              <label :for="field" class="block text-sm font-medium text-slate-700">
                {{ formatFieldName(field) }}
              </label>
              <input
                :id="field"
                v-model.number="localContent[field]"
                type="number"
                :placeholder="getFieldPlaceholder(field)"
                class="block w-full px-4 py-3 text-sm border border-slate-300 rounded-xl shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
              />
            </div>

            <!-- Checkbox -->
            <div v-else-if="isBooleanField(field)" class="flex items-center space-x-3">
              <input
                :id="field"
                v-model="localContent[field]"
                type="checkbox"
                class="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label :for="field" class="text-sm font-medium text-slate-700">
                {{ formatFieldName(field) }}
              </label>
            </div>

            <!-- Select Dropdown -->
            <div v-else-if="isSelectField(field)" class="space-y-2">
              <label :for="field" class="block text-sm font-medium text-slate-700">
                {{ formatFieldName(field) }}
              </label>
              <select
                :id="field"
                v-model="localContent[field]"
                class="block w-full px-4 py-3 text-sm border border-slate-300 rounded-xl shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
              >
                <option value="">Select an option</option>
                <option v-for="option in getSelectOptions(field)" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </div>

            <!-- Fallback -->
            <div v-else class="space-y-2">
              <label :for="field" class="block text-sm font-medium text-slate-700">
                {{ formatFieldName(field) }}
              </label>
              <input
                :id="field"
                v-model="localContent[field]"
                type="text"
                :placeholder="getFieldPlaceholder(field)"
                class="block w-full px-4 py-3 text-sm border border-slate-300 rounded-xl shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import type { BlockType, NewsletterBlock as NewsletterBlockType } from '../../types';
import ImageUpload from './ImageUpload.vue';

interface Props {
  block: NewsletterBlockType
  blockType: BlockType
}

const props = defineProps<Props>()
const emit = defineEmits(['update'])

const isEditing = ref(false)
const localContent = ref<Record<string, any>>({})

// Initialize localContent from prop.block.content
onMounted(() => {
  localContent.value = { ...props.block.content }
})

// Watch for changes in prop.block.content and update localContent
watch(() => props.block.content, (newContent) => {
  localContent.value = { ...newContent }
}, { deep: true })

// Emit updates to parent when localContent changes
watch(localContent, (newVal) => {
  emit('update', { content: newVal })
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

// Enhanced field type detection
const getEditableFields = (blockType: BlockType) => {
  if (blockType.fields && Array.isArray(blockType.fields)) {
    return blockType.fields.map(field => field.field || field.name || field).filter(Boolean)
  }
  
  // Fallback to common fields based on block type
  const commonFields: Record<string, string[]> = {
    header: ['title', 'subtitle', 'button_text', 'button_url', 'background_color', 'text_color'],
    text: ['text_content', 'background_color', 'text_color'],
    image: ['image_url', 'image_alt', 'image_link', 'caption'],
    button: ['button_text', 'button_url', 'button_color', 'text_color'],
    'cta-section': ['cta_title', 'cta_subtitle', 'primary_button_text', 'primary_button_url', 'secondary_button_text', 'secondary_button_url'],
    'product-showcase': ['title', 'subtitle', 'price', 'image_url', 'button_text', 'button_url'],
    footer: ['company_name', 'address', 'unsubscribe_url', 'social_links']
  }
  
  return commonFields[blockType.slug] || Object.keys(localContent.value)
}

// Enhanced field type checks
const isTextField = (field: string) => {
  const textFields = ['title', 'subtitle', 'button_text', 'company_name', 'address', 'caption', 'image_alt']
  return textFields.includes(field) || (!isSpecialField(field) && !field.includes('_'))
}

const isTextareaField = (field: string) => {
  return field.includes('content') || field.includes('description') || field.includes('text_content')
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
  return field.includes('image') && !field.includes('alt')
}

const isNumberField = (field: string) => {
  return field.includes('price') || field.includes('quantity') || field.includes('number')
}

const isBooleanField = (field: string) => {
  return field.includes('enabled') || field.includes('visible') || field.includes('active')
}

const isSelectField = (field: string) => {
  return field.includes('type') || field.includes('style') || field.includes('alignment')
}

const isRequiredField = (field: string) => {
  const requiredFields = ['title', 'button_text', 'text_content', 'image_url']
  return requiredFields.includes(field)
}

const isSpecialField = (field: string) => {
  return isEmailField(field) || isUrlField(field) || isColorField(field) || 
         isImageField(field) || isNumberField(field) || isBooleanField(field) || 
         isSelectField(field) || isTextareaField(field)
}

// Enhanced utility functions
const formatFieldName = (field: string) => {
  return field
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim()
}

const getFieldPlaceholder = (field: string) => {
  const placeholders: Record<string, string> = {
    title: 'Enter a compelling title...',
    subtitle: 'Add a subtitle or description...',
    button_text: 'Call to Action',
    button_url: 'https://example.com',
    text_content: 'Enter your content here...',
    image_alt: 'Describe the image...',
    email: 'example@company.com',
    company_name: 'Your Company Name',
    address: '123 Main St, City, State 12345',
    price: '$99.99',
    cta_title: 'Ready to get started?',
    cta_subtitle: 'Join thousands of satisfied customers',
    background_color: '#ffffff',
    text_color: '#000000',
    button_color: '#3b82f6'
  }
  
  // Handle color fields specifically
  if (field.includes('color')) {
    if (field.includes('background')) return '#ffffff'
    if (field.includes('text')) return '#000000'
    return '#3b82f6'
  }
  
  return placeholders[field] || `Enter ${formatFieldName(field).toLowerCase()}...`
}

const getFieldHint = (field: string) => {
  const hints: Record<string, string> = {
    button_url: 'Use https:// for external links',
    image_alt: 'Helpful for accessibility and email clients that block images',
    text_content: 'You can use basic HTML formatting',
    price: 'Include currency symbol if needed'
  }
  
  return hints[field]
}

const getFieldClasses = (field: string) => {
  return {
    'border-red-300 focus:border-red-500 focus:ring-red-500/20': isRequiredField(field) && !localContent.value[field]
  }
}

const getSelectOptions = (field: string) => {
  const options: Record<string, Array<{value: string, label: string}>> = {
    alignment: [
      { value: 'left', label: 'Left' },
      { value: 'center', label: 'Center' },
      { value: 'right', label: 'Right' }
    ],
    style: [
      { value: 'default', label: 'Default' },
      { value: 'rounded', label: 'Rounded' },
      { value: 'outlined', label: 'Outlined' }
    ]
  }
  
  return options[field] || []
}

// Enhanced utility functions
const { directusUrl } = useNewsletter()

const getImageUrl = (imageId: string) => {
  if (!imageId) return ''
  if (imageId.startsWith('http')) return imageId
  return `${directusUrl.value}/assets/${imageId}`
}

const getContrastColor = (backgroundColor: string) => {
  if (!backgroundColor) return '#ffffff'
  
  // Simple contrast calculation
  const hex = backgroundColor.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  
  return brightness > 128 ? '#000000' : '#ffffff'
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}

const handleImageUploadError = (error: string) => {
  console.error('Image upload error:', error)
}
</script>

<style scoped>
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
</style>