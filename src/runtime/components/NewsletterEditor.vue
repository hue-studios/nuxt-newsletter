<template>
  <div class="newsletter-editor">
    <!-- Header Section -->
    <div class="header-section">
      <div class="header-content">
        <h1 class="editor-title">Newsletter Editor</h1>
        <p class="editor-subtitle">Create and design your newsletter with drag-and-drop blocks</p>
      </div>
      
      <!-- Header Actions -->
      <div class="header-actions">
        <button
          @click="showTemplateSelector = !showTemplateSelector"
          class="secondary-button"
          :disabled="loadingBlockTypes"
        >
          <Icon name="lucide:layout-template" class="w-4 h-4" />
          Templates
        </button>
        
        <button
          @click="$emit('save')"
          class="primary-button"
          :disabled="Object.keys(errors).length > 0"
        >
          <Icon name="lucide:save" class="w-4 h-4" />
          Save Newsletter
        </button>
      </div>
    </div>

    <!-- Template Selector Modal -->
    <Transition name="modal">
      <div v-if="showTemplateSelector" class="modal-overlay" @click="showTemplateSelector = false">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h2 class="modal-title">Choose Template</h2>
            <button
              @click="showTemplateSelector = false"
              class="modal-close"
            >
              <Icon name="lucide:x" class="w-5 h-5" />
            </button>
          </div>
          
          <div class="modal-body">
            <div class="template-grid">
              <div
                v-for="template in templates"
                :key="template.id"
                class="template-card"
                @click="loadTemplate(template.id)"
              >
                <div class="template-preview">
                  <Icon name="lucide:layout-template" class="w-8 h-8 text-slate-400" />
                </div>
                <div class="template-info">
                  <h3 class="template-name">{{ template.name }}</h3>
                  <p class="template-description">{{ template.description || 'No description' }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Main Layout -->
    <div class="main-content">
      <!-- Settings Panel -->
      <div class="settings-panel">
        <div class="settings-header">
          <h2 class="settings-title">Newsletter Settings</h2>
          <Icon name="lucide:settings" class="w-5 h-5 text-slate-500" />
        </div>
        
        <div class="settings-content">
          <!-- Subject Line -->
          <div class="form-group">
            <label class="form-label" for="subject">Subject Line</label>
            <input
              id="subject"
              v-model="newsletter.subject_line"
              type="text"
              class="form-input"
              :class="{ 'error': errors.subject }"
              placeholder="Enter newsletter subject..."
              @blur="validateField('subject')"
            />
            <div v-if="errors.subject" class="error-message">
              {{ errors.subject }}
            </div>
          </div>

          <!-- From Email -->
          <div class="form-group">
            <label class="form-label" for="from_email">From Email</label>
            <input
              id="from_email"
              v-model="newsletter.from_email"
              type="email"
              class="form-input"
              :class="{ 'error': errors.from_email }"
              placeholder="newsletter@example.com"
              @blur="validateField('from_email')"
            />
            <div v-if="errors.from_email" class="error-message">
              {{ errors.from_email }}
            </div>
          </div>

          <!-- From Name -->
          <div class="form-group">
            <label class="form-label" for="from_name">From Name</label>
            <input
              id="from_name"
              v-model="newsletter.from_name"
              type="text"
              class="form-input"
              placeholder="Your Company"
            />
          </div>

          <!-- Preheader -->
          <div class="form-group">
            <label class="form-label" for="preheader">Preheader Text</label>
            <textarea
              id="preheader"
              v-model="newsletter.preheader"
              class="form-textarea"
              rows="2"
              placeholder="Preview text that appears after the subject line..."
            />
          </div>
        </div>
      </div>

      <!-- Content Panel -->
      <div class="content-panel">
        <!-- Block Types Toolbar -->
        <div class="block-types-toolbar">
          <div class="toolbar-header">
            <h3 class="toolbar-title">Content Blocks</h3>
            <span class="toolbar-subtitle">Drag to add • Click to insert</span>
          </div>

          <div v-if="loadingBlockTypes" class="loading-state">
            <Icon name="lucide:loader-2" class="w-5 h-5 text-blue-500 animate-spin mr-2" />
            <span class="text-sm text-slate-600">Loading blocks...</span>
          </div>

          <div v-else class="block-types-grid">
            <div v-for="category in blockCategories" :key="category" class="block-category">
              <h4 class="category-title">{{ formatCategoryName(category) }}</h4>
              <div class="category-blocks">
                <button
                  v-for="blockType in getBlocksByCategory(category)"
                  :key="blockType.id"
                  @click="addBlockFromType(blockType)"
                  class="block-type-button"
                  :title="blockType.description"
                >
                  <Icon :name="getBlockIcon(blockType)" class="block-type-icon" />
                  <span class="block-type-name">{{ blockType.name }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Block List Component -->
        <div class="blocks-container">
          <BlockList
            v-model:blocks="blocks"
            :block-types="blockTypes"
            :disabled="props.disabled"
            @block:update="handleBlockUpdate"
            @block:duplicate="handleBlockDuplicate"
            @block:delete="handleBlockDelete"
          />
        </div>
      </div>

      <!-- Preview Panel -->
      <div v-if="props.showPreview" class="preview-panel">
        <div class="preview-header">
          <h2 class="preview-title">Live Preview</h2>
          <div class="preview-controls">
            <button
              @click="previewDevice = 'desktop'"
              class="preview-device-button"
              :class="{ active: previewDevice === 'desktop' }"
            >
              <Icon name="lucide:monitor" class="w-4 h-4" />
            </button>
            <button
              @click="previewDevice = 'mobile'"
              class="preview-device-button"
              :class="{ active: previewDevice === 'mobile' }"
            >
              <Icon name="lucide:smartphone" class="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div class="preview-container">
          <div class="preview-frame" :class="previewDevice">
            <NewsletterPreview
              :newsletter="newsletter"
              :device="previewDevice"
              @compiled="handleCompiled"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Notifications -->
    <Transition name="notification">
      <div v-if="notification.show" class="notification-container">
        <div class="notification" :class="notification.type">
          <div class="notification-content">
            <div class="notification-icon">
              <div
                class="notification-icon-wrapper"
                :class="notification.type === 'success' ? 'bg-green-100' : 'bg-red-100'"
              >
                <Icon
                  :name="notification.type === 'success' ? 'lucide:check-circle' : 'lucide:alert-circle'"
                  :class="notification.type === 'success' ? 'text-green-600' : 'text-red-600'"
                  class="w-5 h-5"
                />
              </div>
            </div>
            <div class="notification-message">
              <p class="notification-text">{{ notification.message }}</p>
            </div>
            <button
              @click="notification.show = false"
              class="notification-close"
            >
              <Icon name="lucide:x" class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { NewsletterData } from '../../types'
import BlockList from './BlockList.vue'
import NewsletterPreview from './NewsletterPreview.vue'

interface Props {
  modelValue?: NewsletterData
  showPreview?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showPreview: true,
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: NewsletterData]
  'save': []
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

// Directus integration
const { fetchBlockTypes, fetchTemplates, fetchTemplate } = useDirectusNewsletter()

// State
const errors = ref<Record<string, string>>({})
const notification = ref({
  show: false,
  message: '',
  type: 'success' as 'success' | 'error'
})

const blockTypes = ref<any[]>([])
const templates = ref<any[]>([])
const loadingBlockTypes = ref(true)
const showTemplateSelector = ref(false)
const previewDevice = ref<'desktop' | 'mobile'>('desktop')

// Computed properties
const blockCategories = computed(() => {
  const categories = [...new Set(blockTypes.value.map(bt => bt.category))]
  return categories.sort()
})

// Methods
const handleBlockUpdate = (index: number, updates: any) => {
  const block = blocks.value[index]
  if (block) {
    updateBlock(block.id, updates)
  }
}

const handleBlockDuplicate = (index: number) => {
  const block = blocks.value[index]
  if (block) {
    duplicateBlock(block.id)
    showNotification(`Duplicated ${getBlockName(block.type)} block`)
  }
}

const handleBlockDelete = (index: number) => {
  const block = blocks.value[index]
  if (block) {
    removeBlock(block.id)
    showNotification(`Deleted ${getBlockName(block.type)} block`)
  }
}

const addBlockFromType = (blockType: any) => {
  const placeholderContent = getPlaceholderContent(blockType.slug)
  addBlock(blockType.slug, placeholderContent)
  showNotification(`Added ${blockType.name} block`)
}

const getBlocksByCategory = (category: string) => {
  return blockTypes.value.filter(bt => bt.category === category)
}

const formatCategoryName = (category: string) => {
  return category.charAt(0).toUpperCase() + category.slice(1).replace(/[-_]/g, ' ')
}

const getBlockIcon = (blockType: any) => {
  const iconMap: Record<string, string> = {
    header: 'lucide:header',
    text: 'lucide:type',
    image: 'lucide:image',
    button: 'lucide:mouse-pointer-click',
    divider: 'lucide:minus',
    spacer: 'lucide:space',
    'cta-section': 'lucide:megaphone',
    'product-showcase': 'lucide:shopping-bag',
    'social-links': 'lucide:share-2',
    footer: 'lucide:footer'
  }
  return iconMap[blockType.slug] || 'lucide:square'
}

const getBlockName = (type: string) => {
  const blockType = blockTypes.value.find(bt => bt.slug === type)
  return blockType?.name || type
}

// Form validation
const validateField = (field: string) => {
  switch (field) {
    case 'subject':
      if (!newsletter.value.subject_line?.trim()) {
        errors.value.subject = 'Subject line is required'
      } else if (newsletter.value.subject_line.length > 100) {
        errors.value.subject = 'Subject line must be less than 100 characters'
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

const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
  notification.value = { show: true, message, type }
  setTimeout(() => {
    notification.value.show = false
  }, 3000)
}

const getPlaceholderContent = (blockSlug: string) => {
  const placeholders: Record<string, any> = {
    header: {
      title: 'Welcome to Our Newsletter',
      subtitle: 'Stay updated with the latest news and insights',
      button_text: 'Learn More',
      button_url: 'https://example.com'
    },
    text: {
      text_content: 'Add your main content here. You can use <strong>HTML formatting</strong> to make text <em>italic</em> or <a href="#">add links</a>.'
    },
    image: {
      image_url: 'https://via.placeholder.com/600x300?text=Add+Your+Image',
      alt_text: 'Description of your image'
    },
    button: {
      text: 'Click Here',
      url: 'https://example.com'
    }
  }
  return placeholders[blockSlug] || {}
}

const loadTemplate = async (templateId: string) => {
  try {
    const template = await fetchTemplate(templateId)
    loadFromTemplate(template)
    showTemplateSelector.value = false
    showNotification(`Loaded template: ${template.name}`)
  } catch (error) {
    showNotification('Failed to load template', 'error')
  }
}

const handleCompiled = (compiled: { mjml: string, html: string }) => {
  newsletter.value.compiled_mjml = compiled.mjml
  newsletter.value.compiled_html = compiled.html
}

// Data loading
onMounted(async () => {
  try {
    const [blockTypesData, templatesData] = await Promise.all([
      fetchBlockTypes().catch(() => []),
      fetchTemplates({ limit: 50 }).catch(() => [])
    ])

    blockTypes.value = blockTypesData
    templates.value = templatesData
  } finally {
    loadingBlockTypes.value = false
  }
})

// Watch for changes
watch(newsletter, (value) => {
  if (value.subject_line) validateField('subject')
  if (value.from_email) validateField('from_email')
  emit('update:modelValue', value)
}, { deep: true })
</script>

<style scoped>
@reference 'tailwindcss';
/* Import the global drag-drop styles */
@import '../assets/css/drag-drop.css';

/* Component-specific styles */
.newsletter-editor {
  @apply min-h-screen bg-slate-50;
}

.header-section {
  @apply bg-white border-b border-slate-200 px-6 py-4;
}

.header-content {
  @apply flex items-center justify-between mb-4;
}

.editor-title {
  @apply text-2xl font-bold text-slate-900;
}

.editor-subtitle {
  @apply text-slate-600;
}

.header-actions {
  @apply flex items-center gap-3;
}

.primary-button {
  @apply bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50;
}

.secondary-button {
  @apply bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2 disabled:opacity-50;
}

.main-content {
  @apply grid grid-cols-1 lg:grid-cols-12 gap-6 p-6;
}

.settings-panel {
  @apply lg:col-span-3 bg-white rounded-xl border border-slate-200 p-6 h-fit;
}

.content-panel {
  @apply lg:col-span-6 space-y-6;
}

.preview-panel {
  @apply lg:col-span-3 bg-white rounded-xl border border-slate-200 p-6;
}

.settings-header {
  @apply flex items-center justify-between mb-6;
}

.settings-title {
  @apply text-lg font-semibold text-slate-900;
}

.form-group {
  @apply mb-4;
}

.form-label {
  @apply block text-sm font-medium text-slate-700 mb-2;
}

.form-input {
  @apply w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.form-input.error {
  @apply border-red-300 focus:ring-red-500;
}

.form-textarea {
  @apply w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none;
}

.error-message {
  @apply text-red-600 text-sm mt-1;
}

.block-types-toolbar {
  @apply bg-white rounded-xl border border-slate-200 p-6;
}

.toolbar-header {
  @apply flex items-center justify-between mb-4;
}

.toolbar-title {
  @apply text-lg font-semibold text-slate-900;
}

.toolbar-subtitle {
  @apply text-sm text-slate-500;
}

.loading-state {
  @apply flex items-center justify-center py-8;
}

.block-types-grid {
  @apply space-y-6;
}

.block-category {
  @apply space-y-3;
}

.category-title {
  @apply text-sm font-medium text-slate-700 uppercase tracking-wide;
}

.category-blocks {
  @apply grid grid-cols-2 gap-2;
}

.block-type-button {
  @apply flex items-center gap-2 p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors;
}

.block-type-icon {
  @apply w-4 h-4 text-slate-600;
}

.block-type-name {
  @apply text-sm font-medium text-slate-700;
}

.blocks-container {
  @apply bg-white rounded-xl border border-slate-200 p-6;
}

.preview-header {
  @apply flex items-center justify-between mb-6;
}

.preview-title {
  @apply text-lg font-semibold text-slate-900;
}

.preview-controls {
  @apply flex items-center gap-1;
}

.preview-device-button {
  @apply p-2 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors;
}

.preview-device-button.active {
  @apply bg-blue-100 text-blue-600;
}

.preview-container {
  @apply border border-slate-200 rounded-lg overflow-hidden;
}

.preview-frame {
  @apply w-full transition-all duration-300;
}

.preview-frame.desktop {
  @apply min-h-96;
}

.preview-frame.mobile {
  @apply max-w-sm mx-auto;
}

/* Modal and notification styles... (same as before) */
.modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4;
}

.modal-content {
  @apply bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden;
}

.notification-container {
  @apply fixed top-4 right-4 z-50;
}

.notification {
  @apply bg-white border border-slate-200 rounded-lg shadow-xl p-4 max-w-md;
}

/* Responsive */
@media (max-width: 768px) {
  .main-content {
    @apply grid-cols-1 gap-4;
  }
  
  .category-blocks {
    @apply grid-cols-1;
  }
}
</style>