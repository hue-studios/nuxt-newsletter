<template>
  <div class="flex flex-col h-screen bg-gray-50 font-sans antialiased">
    <!-- Skip to main content for accessibility -->
    <a href="#editor-content" class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-blue-600 text-white px-3 py-1 rounded-md z-50">
      Skip to main content
    </a>

    <!-- Compact Toolbar -->
    <div class="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0 shadow-sm">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <h1 class="text-xl font-semibold text-gray-900">Newsletter Editor</h1>

          <!-- Template Selector -->
          <div v-if="templates.length > 0 && !loadingBlockTypes" class="relative">
            <select
              @change="loadTemplate($event.target.value)"
              class="px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <option value="">Choose template...</option>
              <option v-for="template in templates" :key="template.id" :value="template.id">
                {{ template.name }}
              </option>
            </select>
          </div>
          <div v-else-if="loadingBlockTypes" class="text-sm text-gray-500 flex items-center space-x-2">
            <Icon name="lucide:loader-2" class="w-4 h-4 animate-spin" />
            <span>Loading templates...</span>
          </div>
        </div>

        <!-- Progress Badge -->
        <div class="flex items-center space-x-3">
          <div class="flex items-center space-x-2">
            <div class="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300"
                :style="{ width: `${completionPercentage}%` }"
              ></div>
            </div>
            <span class="text-sm text-gray-600 font-medium">{{ completionPercentage }}%</span>
          </div>
        </div>
      </div>

      <!-- Compact Block Toolbar -->
      <div class="mt-3 border-t border-gray-100 pt-3">
        <div v-if="loadingBlockTypes" class="flex items-center space-x-2 text-gray-500">
          <Icon name="lucide:loader-2" class="w-4 h-4 animate-spin" />
          <span class="text-sm">Loading blocks...</span>
        </div>

        <div v-else class="space-y-3">
          <div v-for="category in blockCategories" :key="category" class="flex items-center space-x-2">
            <span class="text-xs font-medium text-gray-500 uppercase tracking-wide min-w-[70px]">
              {{ formatCategoryName(category) }}
            </span>
            <div class="flex items-center space-x-1 flex-wrap gap-1">
              <button
                v-for="blockType in getBlocksByCategory(category)"
                :key="blockType.id"
                @click="addBlockFromType(blockType)"
                class="inline-flex items-center space-x-1 px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                :title="blockType.description"
              >
                <Icon :name="getBlockIcon(blockType)" class="w-3.5 h-3.5" />
                <span>{{ blockType.name }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Editor Area -->
    <!-- Added min-h-0 to ensure flex item correctly constrains height for scrolling -->
    <div class="flex flex-1 overflow-hidden min-h-0">
      <!-- Editor Canvas -->
      <!-- Added min-h-0 to ensure flex item correctly constrains height for scrolling -->
      <div id="editor-content" class="flex-1 overflow-y-auto p-6 min-h-0">
        <div class="max-w-3xl mx-auto space-y-6">
          <!-- Newsletter Settings Card -->
          <div class="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Newsletter Settings</h2>

            <div class="grid grid-cols-1 gap-4">
              <!-- Subject Line -->
              <div>
                <label for="subject" class="block text-sm font-medium text-gray-700 mb-1">
                  Subject Line <span class="text-red-500">*</span>
                </label>
                <input
                  id="subject"
                  v-model="newsletter.subject_line"
                  type="text"
                  placeholder="Enter compelling subject line..."
                  class="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors"
                  :class="{ 'border-red-300 focus:border-red-500 focus:ring-red-500': errors.subject }"
                  @blur="validateField('subject')"
                />
                <p class="mt-1 text-xs text-gray-500">
                  {{ newsletter.subject_line?.length || 0 }}/78 characters
                </p>
                <p v-if="errors.subject" class="mt-1 text-sm text-red-600">{{ errors.subject }}</p>
              </div>

              <!-- Preview Text -->
              <div>
                <label for="preheader" class="block text-sm font-medium text-gray-700 mb-1">
                  Preview Text
                </label>
                <input
                  id="preheader"
                  v-model="newsletter.preview_text"
                  type="text"
                  placeholder="Appears in inbox preview..."
                  class="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors"
                />
                <p class="mt-1 text-xs text-gray-500">
                  {{ newsletter.preview_text?.length || 0 }}/140 characters
                </p>
              </div>

              <!-- Sender Info -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label for="from_name" class="block text-sm font-medium text-gray-700 mb-1">
                    From Name
                  </label>
                  <input
                    id="from_name"
                    v-model="newsletter.from_name"
                    type="text"
                    placeholder="Your Company"
                    class="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors"
                  />
                </div>
                <div>
                  <label for="from_email" class="block text-sm font-medium text-gray-700 mb-1">
                    From Email <span class="text-red-500">*</span>
                  </label>
                  <input
                    id="from_email"
                    v-model="newsletter.from_email"
                    type="email"
                    placeholder="newsletter@example.com"
                    class="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors"
                    :class="{ 'border-red-300 focus:border-red-500 focus:ring-red-500': errors.from_email }"
                    @blur="validateField('from_email')"
                  />
                  <p v-if="errors.from_email" class="mt-1 text-sm text-red-600">{{ errors.from_email }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Content Blocks -->
          <div class="bg-white rounded-xl shadow-md border border-gray-200">
            <div class="p-6 border-b border-gray-200">
              <h2 class="text-lg font-semibold text-gray-900">Content Blocks</h2>
              <p class="mt-1 text-sm text-gray-500">Drag to reorder blocks</p>
            </div>

            <div class="p-6">
              <!-- Empty State -->
              <div v-if="blocks.length === 0" class="text-center py-12">
                <Icon name="lucide:file-text" class="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 class="text-lg font-semibold text-gray-900 mb-2">No content blocks yet</h3>
                <p class="text-sm text-gray-500 mb-4">Add content blocks from the toolbar above to start building your newsletter.</p>
                <p class="text-xs text-gray-400">Try starting with a Hero Section!</p>
              </div>

              <!-- Draggable Blocks -->
              <div v-else class="space-y-4">
                <TransitionGroup name="block-list" tag="div">
                  <div
                    v-for="(block, index) in blocks"
                    :key="block.id"
                    class="group relative bg-gray-50 border border-gray-200 rounded-lg hover:border-gray-300 transition-all duration-200"
                    :class="{ 'ring-2 ring-blue-500 border-blue-500': draggedIndex === index }"
                    :draggable="true"
                    @dragstart="handleDragStart(index, $event)"
                    @dragover="handleDragOver(index, $event)"
                    @drop="handleDrop(index, $event)"
                    @dragend="handleDragEnd"
                    :data-block-id="block.id"
                  >
                    <!-- Drag Handle & Controls -->
                    <div class="flex items-center justify-between p-3 border-b border-gray-200 bg-white rounded-t-lg">
                      <div class="flex items-center space-x-3">
                        <Icon name="lucide:grip-vertical" class="w-4 h-4 text-gray-400 cursor-grab active:cursor-grabbing" />
                        <div class="flex items-center space-x-2">
                          <Icon :name="getBlockIcon(getBlockType(block.type))" class="w-4 h-4 text-gray-600" />
                          <span class="text-sm font-medium text-gray-900">
                            {{ getBlockType(block.type)?.name || 'Unknown Block' }}
                          </span>
                          <span class="text-xs text-gray-500">#{{ index + 1 }}</span>
                        </div>
                      </div>

                      <div class="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          @click="moveBlock(index, index - 1)"
                          :disabled="index === 0"
                          class="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move up"
                        >
                          <Icon name="lucide:chevron-up" class="w-4 h-4" />
                        </button>
                        <button
                          @click="moveBlock(index, index + 1)"
                          :disabled="index === blocks.length - 1"
                          class="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move down"
                        >
                          <Icon name="lucide:chevron-down" class="w-4 h-4" />
                        </button>
                        <button
                          @click="duplicateBlock(block.id)"
                          class="p-1 text-gray-400 hover:text-gray-600"
                          title="Duplicate"
                        >
                          <Icon name="lucide:copy" class="w-4 h-4" />
                        </button>
                        <button
                          @click="removeBlock(block.id)"
                          class="p-1 text-gray-400 hover:text-red-600"
                          title="Delete"
                        >
                          <Icon name="lucide:trash-2" class="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <!-- Block Content -->
                    <div class="p-3">
                      <NewsletterBlock
                        v-if="getBlockType(block.type)"
                        :block="block"
                        :block-type="getBlockType(block.type)"
                        @update="(updates: any) => updateBlock(block.id, updates)"
                      />
                      <div v-else class="text-center py-4 text-red-500">
                        <Icon name="lucide:alert-triangle" class="w-6 h-6 mx-auto mb-2" />
                        <p class="text-sm font-medium">Unknown Block Type: {{ block.type }}</p>
                        <p class="text-xs text-gray-500">Please ensure all block types are loaded or re-add this block.</p>
                      </div>
                    </div>
                  </div>
                </TransitionGroup>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Preview Panel -->
      <div v-if="showPreview" class="w-96 bg-white border-l border-gray-200 flex flex-col flex-shrink-0">
        <NewsletterPreview
          :newsletter="newsletter"
          :block-types="blockTypes"
          @update:compiled="handleCompiled"
        />
      </div>
    </div>

    <!-- Notification Toast (re-using the one from index.vue or similar pattern) -->
    <Transition
      enter-active-class="transform ease-out duration-300 transition"
      enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
      enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
      leave-active-class="transition ease-in duration-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="notification.show"
        class="fixed top-4 right-4 max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden z-50"
      >
        <div class="p-4">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <Icon
                :name="notification.type === 'success' ? 'lucide:check-circle' : 'lucide:alert-circle'"
                :class="notification.type === 'success' ? 'text-green-400' : 'text-red-400'"
                class="w-6 h-6"
              />
            </div>
            <div class="ml-3 w-0 flex-1 pt-0.5">
              <p class="text-sm font-medium text-gray-900">{{ notification.message }}</p>
            </div>
            <div class="ml-4 flex-shrink-0 flex">
              <button
                @click="notification.show = false"
                class="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Icon name="lucide:x" class="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import type { NewsletterData } from '../../types'; // Corrected import path for NewsletterData


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

// Core newsletter editing
const {
  newsletter,
  blocks,
  addBlock,
  removeBlock,
  updateBlock,
  moveBlock,
  duplicateBlock,
  loadFromTemplate
} = useNewsletterEditor(props.modelValue)

const { fetchBlockTypes, fetchTemplates, fetchTemplate } = useDirectusNewsletter()

// State management
const errors = ref<Record<string, string>>({})
const notification = ref({
  show: false,
  message: '',
  type: 'success' as 'success' | 'error'
})

const blockTypes = ref<any[]>([])
const templates = ref<any[]>([])
const loadingBlockTypes = ref(true)

// Drag and drop state
const draggedIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

// Computed properties
const completionPercentage = computed(() => {
  let completed = 0
  let total = 4

  // Using newsletter.subject_line directly
  if (newsletter.value.subject_line?.trim()) completed++
  if (newsletter.value.from_email?.trim()) completed++
  if (blocks.value.length > 0) completed++

  const blocksWithContent = blocks.value.filter(block =>
    Object.values(block.content || {}).some(value =>
      typeof value === 'string' && value.trim().length > 0
    )
  ).length

  if (blocksWithContent > 0) completed++

  return Math.round((completed / total) * 100)
})

const blockCategories = computed(() => {
  const categories = new Set(blockTypes.value.map(bt => bt.category))
  return Array.from(categories).sort()
})

// Icon mapping for block types
const getBlockIcon = (blockType: any) => {
  if (!blockType) return 'lucide:file-text'

  const iconMap: Record<string, string> = {
    'hero': 'lucide:layout-template',
    'text': 'lucide:align-left',
    'image': 'lucide:image',
    'button': 'lucide:mouse-pointer-click',
    'product-showcase': 'lucide:package',
    'team-member': 'lucide:users',
    'statistics': 'lucide:bar-chart-2',
    'social-links': 'lucide:share-2',
    'event-card': 'lucide:calendar',
    'feature-list': 'lucide:list-checks',
    'testimonial': 'lucide:quote',
    'three-column': 'lucide:columns-3',
    'cta-section': 'lucide:megaphone',
    'progress-bar': 'lucide:trending-up'
  }

  return iconMap[blockType.slug] || 'lucide:file-text'
}

// Utility functions
const formatCategoryName = (category: string) => {
  return category.charAt(0).toUpperCase() + category.slice(1)
}

const getBlocksByCategory = (category: string) => {
  return blockTypes.value.filter(bt => bt.category === category)
}

const getBlockType = (slug: string) => {
  return blockTypes.value.find(bt => bt.slug === slug)
}

const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
  notification.value = { show: true, message, type }
  setTimeout(() => {
    notification.value.show = false
  }, 4000)
}

// Validation
const validateField = (fieldName: string) => {
  switch (fieldName) {
    case 'subject': // Now refers to subject_line implicitly
      if (!newsletter.value.subject_line?.trim()) {
        errors.value.subject = 'Subject line is required'
      } else if (newsletter.value.subject_line.length > 78) {
        errors.value.subject = 'Subject line should be under 78 characters'
      } else {
        delete errors.value.subject
      }
      break

    case 'from_email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!newsletter.value.from_email?.trim()) {
        errors.value.from_email = 'From email is required'
      } else if (!emailRegex.test(newsletter.value.from_email)) {
        errors.value.from_email = 'Please enter a valid email address'
      } else {
        delete errors.value.from_email
      }
      break
  }
}

// Drag and drop handlers
const handleDragStart = (index: number, event: DragEvent) => {
  draggedIndex.value = index
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/html', index.toString())
  }
}

const handleDragOver = (index: number, event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
  dragOverIndex.value = index
}

const handleDrop = (toIndex: number, event: DragEvent) => {
  event.preventDefault()
  const fromIndex = draggedIndex.value

  if (fromIndex !== null && fromIndex !== toIndex) {
    moveBlock(fromIndex, toIndex)
    showNotification('Block moved successfully')
  }

  handleDragEnd()
}

const handleDragEnd = () => {
  draggedIndex.value = null
  dragOverIndex.value = null
}

// Block operations
const addBlockFromType = (blockType: any) => {
  const newBlock = addBlock(blockType.slug)

  if (blockType.field_visibility_config) {
    const defaultContent: any = getPlaceholderContent(blockType.slug)
    updateBlock(newBlock.id, { content: defaultContent })
  }

  showNotification(`Added ${blockType.name} block`)

  // Smooth scroll to new block
  setTimeout(() => {
    const blockElement = document.querySelector(`[data-block-id="${newBlock.id}"]`)
    if (blockElement) {
      blockElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, 100)
}

const getPlaceholderContent = (blockSlug: string) => {
  const placeholders: Record<string, any> = {
    hero: {
      title: 'Welcome to Our Newsletter!',
      subtitle: 'Stay updated with the latest news and insights',
      button_text: 'Learn More',
      button_url: 'https://example.com',
      background_color: '#f8fafc',
      text_color: '#1f2937'
    },
    text: {
      text_content: 'Add your main content here. You can use <strong>HTML formatting</strong> to make text <em>italic</em> or <a href="#">add links</a>.',
      background_color: '#ffffff',
      text_color: '#374151'
    },
    'cta-section': {
      cta_title: 'Ready to Get Started?',
      cta_subtitle: 'Join thousands of satisfied customers',
      primary_button_text: 'Get Started',
      primary_button_url: 'https://example.com/signup',
      secondary_button_text: 'Learn More',
      secondary_button_url: 'https://example.com/about'
    },
    'product-showcase': {
      title: 'Featured Product',
      subtitle: 'Perfect for your needs',
      price: '$99.99',
      button_text: 'Shop Now',
      button_url: 'https://example.com/product'
    }
  }
  
  return placeholders[blockSlug] || {}
}

// Template loading
const loadTemplate = async (templateId: string) => {
  if (!templateId) return

  try {
    const template = await fetchTemplate(templateId)
    loadFromTemplate(template)
    showNotification(`Loaded template: ${template.name}`)
  } catch (error) {
    showNotification('Failed to load template', 'error')
  }
}

// Handle compiled output
const handleCompiled = (compiled: { mjml: string, html: string }) => {
  newsletter.value.compiled_mjml = compiled.mjml
  newsletter.value.compiled_html = compiled.html
}

// Data loading
onMounted(async () => {
  try {
    const [blockTypesData, templatesData] = await Promise.all([
      fetchBlockTypes().catch(() => {
        showNotification('Could not load block types', 'error')
        return []
      }),
      fetchTemplates({ limit: 50 }).catch(() => [])
    ])

    blockTypes.value = blockTypesData
    templates.value = templatesData
  } finally {
    loadingBlockTypes.value = false
  }
})

// Emit changes
watch(newsletter, (value) => {
  // Validate fields using the correct properties
  if (value.subject_line) validateField('subject')
  if (value.from_email) validateField('from_email')
  emit('update:modelValue', value)
}, { deep: true })
</script>

<style scoped>
/* Drag and drop animations */
.block-list-move,
.block-list-enter-active,
.block-list-leave-active {
  transition: all 0.3s ease;
}

.block-list-enter-from,
.block-list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.block-list-leave-active {
  position: absolute;
  right: 0;
  left: 0;
}

/* Custom scrollbar for webkit browsers */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
