<!-- TemplateSelector.vue - Modal for selecting newsletter templates -->
<template>
  <Teleport to="body">
    <div class="modal-overlay" @click="handleClose">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">Choose a Template</h2>
          <button @click="handleClose" class="close-button">
            <Icon name="lucide:x" class="w-5 h-5" />
          </button>
        </div>

        <div class="modal-content">
          <!-- Loading State -->
          <div v-if="loading" class="loading-state">
            <Icon name="lucide:loader-2" class="w-6 h-6 animate-spin" />
            <p>Loading templates...</p>
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="error-state">
            <Icon name="lucide:alert-circle" class="w-6 h-6 text-red-500" />
            <p>Failed to load templates</p>
            <button @click="retryLoad" class="retry-button">
              <Icon name="lucide:refresh-cw" class="w-4 h-4" />
              Retry
            </button>
          </div>

          <!-- Templates Grid -->
          <div v-else-if="templates.length > 0" class="templates-grid">
            <div
              v-for="template in templates"
              :key="template.id"
              @click="selectTemplate(template)"
              class="template-card"
              :class="{ 'selected': selectedTemplate?.id === template.id }"
            >
              <!-- Template Preview -->
              <div class="template-preview">
                <div v-if="template.preview_image" class="preview-image">
                  <img :src="template.preview_image" :alt="template.name" />
                </div>
                <div v-else class="preview-placeholder">
                  <Icon name="lucide:layout-template" class="w-12 h-12 text-gray-300" />
                </div>
              </div>

              <!-- Template Info -->
              <div class="template-info">
                <h3 class="template-name">{{ template.name }}</h3>
                <p v-if="template.description" class="template-description">
                  {{ template.description }}
                </p>
                
                <!-- Template Stats -->
                <div class="template-stats">
                  <span v-if="template.block_count" class="stat-item">
                    <Icon name="lucide:layers" class="w-3 h-3" />
                    {{ template.block_count }} blocks
                  </span>
                  <span v-if="template.category" class="stat-item">
                    <Icon name="lucide:tag" class="w-3 h-3" />
                    {{ template.category }}
                  </span>
                </div>
              </div>

              <!-- Selection Indicator -->
              <div v-if="selectedTemplate?.id === template.id" class="selection-indicator">
                <Icon name="lucide:check" class="w-4 h-4" />
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="empty-state">
            <Icon name="lucide:layout-template" class="w-12 h-12 text-gray-300" />
            <h3>No Templates Available</h3>
            <p>There are no newsletter templates available at the moment.</p>
            <button @click="handleClose" class="empty-close-button">
              Close
            </button>
          </div>
        </div>

        <!-- Modal Actions -->
        <div v-if="!loading && !error && templates.length > 0" class="modal-actions">
          <button @click="handleClose" class="cancel-button">
            Cancel
          </button>
          <button 
            @click="handleSelect"
            :disabled="!selectedTemplate"
            class="select-button"
          >
            <Icon name="lucide:check" class="w-4 h-4" />
            Use This Template
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

interface Template {
  id: string | number
  name: string
  description?: string
  preview_image?: string
  category?: string
  block_count?: number
  blocks_config?: any[]
  default_subject_pattern?: string
  created_at?: string
  updated_at?: string
}

interface Props {
  templates?: Template[]
  autoLoad?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  templates: () => [],
  autoLoad: true
})

const emit = defineEmits<{
  'select': [template: Template]
  'close': []
}>()

// State
const loading = ref(false)
const error = ref(false)
const templates = ref<Template[]>(props.templates)
const selectedTemplate = ref<Template | null>(null)

// Composables (assuming you have this)
const { fetchTemplates } = useDirectusNewsletter()

// Methods
const loadTemplates = async () => {
  if (templates.value.length > 0) return

  loading.value = true
  error.value = false

  try {
    const fetchedTemplates = await fetchTemplates()
    templates.value = fetchedTemplates.map(template => ({
      ...template,
      // Calculate block count if not provided
      block_count: template.block_count || calculateBlockCount(template.blocks_config)
    }))
  } catch (err) {
    console.error('Failed to load templates:', err)
    error.value = true
  } finally {
    loading.value = false
  }
}

const calculateBlockCount = (blocksConfig: any): number => {
  if (!blocksConfig) return 0
  
  try {
    const blocks = Array.isArray(blocksConfig) 
      ? blocksConfig 
      : JSON.parse(blocksConfig || '[]')
    return blocks.length
  } catch {
    return 0
  }
}

const selectTemplate = (template: Template) => {
  selectedTemplate.value = template
}

const handleSelect = () => {
  if (selectedTemplate.value) {
    emit('select', selectedTemplate.value)
  }
}

const handleClose = () => {
  emit('close')
}

const retryLoad = () => {
  loadTemplates()
}

// Keyboard shortcuts
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    handleClose()
  }
  
  if (e.key === 'Enter' && selectedTemplate.value) {
    handleSelect()
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  
  if (props.autoLoad && templates.value.length === 0) {
    loadTemplates()
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
@reference 'tailwindcss';
/* Modal Overlay */
.modal-overlay {
  @apply fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4;
}

.modal-container {
  @apply bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col;
}

.dark-mode .modal-container {
  @apply bg-gray-800;
}

/* Modal Header */
.modal-header {
  @apply flex items-center justify-between p-6 border-b border-gray-200;
}

.dark-mode .modal-header {
  @apply border-gray-700;
}

.modal-title {
  @apply text-2xl font-bold text-gray-900;
}

.dark-mode .modal-title {
  @apply text-white;
}

.close-button {
  @apply p-2 rounded-lg hover:bg-gray-100 transition-colors;
}

.dark-mode .close-button {
  @apply hover:bg-gray-700 text-gray-300;
}

/* Modal Content */
.modal-content {
  @apply flex-1 overflow-auto p-6;
}

/* Loading State */
.loading-state {
  @apply flex flex-col items-center justify-center py-12 text-gray-600;
}

.loading-state p {
  @apply mt-3 text-lg;
}

.dark-mode .loading-state {
  @apply text-gray-400;
}

/* Error State */
.error-state {
  @apply flex flex-col items-center justify-center py-12 text-gray-600;
}

.error-state p {
  @apply mt-3 text-lg mb-4;
}

.retry-button {
  @apply inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors;
}

.dark-mode .error-state {
  @apply text-gray-400;
}

.dark-mode .retry-button {
  @apply bg-blue-900 text-blue-400 hover:bg-blue-800;
}

/* Templates Grid */
.templates-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4;
}

.template-card {
  @apply relative border border-gray-200 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-blue-300;
}

.template-card.selected {
  @apply border-blue-500 ring-2 ring-blue-200;
}

.dark-mode .template-card {
  @apply border-gray-600 hover:border-blue-500;
}

.dark-mode .template-card.selected {
  @apply border-blue-400 ring-blue-800;
}

/* Template Preview */
.template-preview {
  @apply aspect-video bg-gray-100 flex items-center justify-center;
}

.dark-mode .template-preview {
  @apply bg-gray-700;
}

.preview-image img {
  @apply w-full h-full object-cover;
}

.preview-placeholder {
  @apply flex items-center justify-center w-full h-full;
}

/* Template Info */
.template-info {
  @apply p-4;
}

.template-name {
  @apply font-semibold text-gray-900 mb-2;
}

.dark-mode .template-name {
  @apply text-white;
}

.template-description {
  @apply text-sm text-gray-600 mb-3 line-clamp-2;
}

.dark-mode .template-description {
  @apply text-gray-400;
}

/* Template Stats */
.template-stats {
  @apply flex items-center gap-3 text-xs text-gray-500;
}

.dark-mode .template-stats {
  @apply text-gray-400;
}

.stat-item {
  @apply flex items-center gap-1;
}

/* Selection Indicator */
.selection-indicator {
  @apply absolute top-3 right-3 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center;
}

/* Empty State */
.empty-state {
  @apply flex flex-col items-center justify-center py-12 text-gray-500;
}

.empty-state h3 {
  @apply text-xl font-semibold mt-4 mb-2;
}

.empty-state p {
  @apply text-gray-600 mb-6;
}

.empty-close-button {
  @apply px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors;
}

.dark-mode .empty-state {
  @apply text-gray-400;
}

.dark-mode .empty-state p {
  @apply text-gray-500;
}

.dark-mode .empty-close-button {
  @apply bg-gray-700 text-gray-300 hover:bg-gray-600;
}

/* Modal Actions */
.modal-actions {
  @apply flex items-center justify-end gap-3 p-6 border-t border-gray-200;
}

.dark-mode .modal-actions {
  @apply border-gray-700;
}

.cancel-button {
  @apply px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors;
}

.select-button {
  @apply inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors;
}

.dark-mode .cancel-button {
  @apply bg-gray-700 text-gray-300 hover:bg-gray-600;
}

/* Utility Classes */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>