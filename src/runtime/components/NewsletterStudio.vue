<!-- NewsletterStudio.vue - Complete newsletter creation interface -->
<template>
  <div class="newsletter-studio" :class="[`layout-${layout}`, { 'dark-mode': darkMode }]">
    <!-- Header Bar -->
    <header v-if="showHeader" class="studio-header">
      <div class="header-content">
        <div class="header-title">
          <slot name="header-title">
            <h1>{{ title }}</h1>
          </slot>
        </div>
        
        <div class="header-actions">
          <slot name="header-actions">
            <button @click="handleNew" class="btn btn-secondary">
              <Icon name="lucide:plus" />
              New
            </button>
            <button @click="handleSave" class="btn btn-primary" :disabled="saving">
              <Icon name="lucide:save" />
              {{ saving ? 'Saving...' : 'Save' }}
            </button>
          </slot>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <div class="studio-content">
      <!-- Editor Panel -->
      <div 
        v-if="showEditor" 
        class="editor-panel"
        :style="{ width: layout === 'horizontal' ? editorWidth : '100%' }"
      >
        <NewsletterEditor
          v-model="newsletter"
          :disabled="saving"
          @save="handleSave"
        />
      </div>

      <!-- Divider (for resizing) -->
      <div 
        v-if="showEditor && showPreview && layout === 'horizontal' && resizable"
        class="panel-divider"
        @mousedown="startResize"
      />

      <!-- Preview Panel -->
      <div 
        v-if="showPreview" 
        class="preview-panel"
      >
        <div class="preview-controls">
          <div class="device-switcher">
            <button
              v-for="device in devices"
              :key="device"
              @click="currentDevice = device"
              :class="['device-btn', { active: currentDevice === device }]"
            >
              <Icon :name="device === 'mobile' ? 'lucide:smartphone' : 'lucide:tablet'" />
            </button>
          </div>
        </div>
        
        <NewsletterPreview
          ref="previewRef"
          :newsletter="newsletter"
          :block-types="blockTypes"
          :device="currentDevice"
          @error="handlePreviewError"
        />
      </div>
    </div>

    <!-- Status Bar -->
    <footer v-if="showStatusBar" class="studio-status">
      <div class="status-info">
        <slot name="status-left">
          <span v-if="newsletter.id" class="status-item">
            ID: {{ newsletter.id }}
          </span>
          <span class="status-item">
            {{ newsletter.blocks?.length || 0 }} blocks
          </span>
          <span v-if="lastSaved" class="status-item">
            Saved {{ formatRelativeTime(lastSaved) }}
          </span>
        </slot>
      </div>
      
      <div class="status-actions">
        <slot name="status-right">
          <button @click="toggleLayout" class="status-btn">
            <Icon :name="layout === 'horizontal' ? 'lucide:columns' : 'lucide:rows'" />
          </button>
        </slot>
      </div>
    </footer>

    <!-- Notifications -->
    <Teleport to="body">
      <Transition name="notification">
        <div
          v-if="notification.show"
          :class="['notification', `notification-${notification.type}`]"
        >
          <Icon :name="notificationIcon" />
          <span>{{ notification.message }}</span>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, provide, ref, watch } from 'vue'
import type { NewsletterData } from '../../types'

interface Props {
  // Initial newsletter data
  modelValue?: NewsletterData
  
  // UI Configuration
  title?: string
  layout?: 'horizontal' | 'vertical' | 'editor-only' | 'preview-only'
  showHeader?: boolean
  showStatusBar?: boolean
  showEditor?: boolean
  showPreview?: boolean
  resizable?: boolean
  darkMode?: boolean
  
  // Editor Configuration
  editorWidth?: string
  devices?: ('mobile' | 'tablet')[]
  defaultDevice?: 'mobile' | 'tablet'
  
  // API Configuration
  autoSave?: boolean
  autoSaveDelay?: number
  
  // Callbacks
  onSave?: (newsletter: NewsletterData) => Promise<any>
  onCreate?: (newsletter: NewsletterData) => Promise<any>
  onError?: (error: Error) => void
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Newsletter Studio',
  layout: 'horizontal',
  showHeader: true,
  showStatusBar: true,
  showEditor: true,
  showPreview: true,
  resizable: true,
  darkMode: false,
  editorWidth: '50%',
  devices: () => ['mobile', 'tablet'],
  defaultDevice: 'mobile',
  autoSave: false,
  autoSaveDelay: 30000 // 30 seconds
})

const emit = defineEmits<{
  'update:modelValue': [value: NewsletterData]
  'save': [value: NewsletterData]
  'create': [value: NewsletterData]
  'error': [error: Error]
}>()

// Composables
const { 
  fetchBlockTypes,
  createNewsletter,
  updateNewsletter
} = useDirectusNewsletter()

// State
const newsletter = ref<NewsletterData>(props.modelValue || {
  subject: '',
  preheader: '',
  blocks: [],
  status: 'draft'
})

const blockTypes = ref<any[]>([])
const currentDevice = ref<'mobile' | 'tablet'>(props.defaultDevice)
const saving = ref(false)
const lastSaved = ref<Date | null>(null)
const previewRef = ref()
const editorPanelWidth = ref(props.editorWidth)

// Notification state
const notification = ref({
  show: false,
  message: '',
  type: 'success' as 'success' | 'error' | 'info'
})

// Auto-save timer
let autoSaveTimer: any = null

// Computed
const notificationIcon = computed(() => {
  switch (notification.value.type) {
    case 'success': return 'lucide:check-circle'
    case 'error': return 'lucide:x-circle'
    default: return 'lucide:info'
  }
})

// Methods
const loadBlockTypes = async () => {
  try {
    blockTypes.value = await fetchBlockTypes()
  } catch (error) {
    console.error('Failed to load block types:', error)
    showNotification('Failed to load block types', 'error')
    emit('error', error as Error)
  }
}

const handleNew = () => {
  if (confirm('Create a new newsletter? Unsaved changes will be lost.')) {
    newsletter.value = {
      subject: '',
      preheader: '',
      blocks: [],
      status: 'draft'
    }
    lastSaved.value = null
    showNotification('New newsletter created', 'info')
  }
}

const handleSave = async () => {
  saving.value = true
  
  try {
    let result
    
    // Use custom save handler if provided
    if (props.onSave) {
      result = await props.onSave(newsletter.value)
    } else if (newsletter.value.id) {
      // Update existing
      result = await updateNewsletter(newsletter.value.id, newsletter.value)
      emit('save', result)
    } else {
      // Create new
      if (props.onCreate) {
        result = await props.onCreate(newsletter.value)
      } else {
        result = await createNewsletter(newsletter.value)
      }
      newsletter.value = result
      emit('create', result)
    }
    
    lastSaved.value = new Date()
    showNotification('Newsletter saved successfully', 'success')
  } catch (error) {
    console.error('Save error:', error)
    showNotification('Failed to save newsletter', 'error')
    emit('error', error as Error)
    
    if (props.onError) {
      props.onError(error as Error)
    }
  } finally {
    saving.value = false
  }
}

const handlePreviewError = (error: Error) => {
  console.error('Preview error:', error)
  showNotification('Preview error: ' + error.message, 'error')
}

const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
  notification.value = { show: true, message, type }
  setTimeout(() => {
    notification.value.show = false
  }, 3000)
}

const formatRelativeTime = (date: Date) => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  
  return date.toLocaleDateString()
}

const toggleLayout = () => {
  if (props.layout === 'horizontal') {
    emit('update:layout', 'vertical')
  } else {
    emit('update:layout', 'horizontal')
  }
}

// Panel resizing
const startResize = (e: MouseEvent) => {
  const startX = e.clientX
  const startWidth = parseInt(editorPanelWidth.value)
  
  const handleMouseMove = (e: MouseEvent) => {
    const diff = e.clientX - startX
    const newWidth = Math.max(300, Math.min(window.innerWidth - 300, startWidth + diff))
    editorPanelWidth.value = `${newWidth}px`
  }
  
  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

// Auto-save functionality
const setupAutoSave = () => {
  if (props.autoSave && props.autoSaveDelay > 0) {
    if (autoSaveTimer) clearTimeout(autoSaveTimer)
    
    autoSaveTimer = setTimeout(() => {
      if (newsletter.value.id) { // Only auto-save existing newsletters
        handleSave()
      }
    }, props.autoSaveDelay)
  }
}

// Watchers
watch(newsletter, (newVal) => {
  emit('update:modelValue', newVal)
  setupAutoSave()
}, { deep: true })

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    newsletter.value = newVal
  }
}, { deep: true })

// Lifecycle
onMounted(() => {
  loadBlockTypes()
})

// Provide newsletter context for child components
provide('newsletterStudio', {
  newsletter,
  blockTypes,
  saving,
  showNotification
})

// Expose methods for parent components
defineExpose({
  save: handleSave,
  refresh: () => previewRef.value?.refreshPreview(),
  getNewsletter: () => newsletter.value,
  showNotification
})
</script>

<style scoped>
@reference 'tailwindcss';
.newsletter-studio {
  @apply h-screen flex flex-col bg-gray-50;
}

.newsletter-studio.dark-mode {
  @apply bg-gray-900;
}

/* Header */
.studio-header {
  @apply bg-white border-b border-gray-200 px-6 py-4;
}

.dark-mode .studio-header {
  @apply bg-gray-800 border-gray-700;
}

.header-content {
  @apply flex items-center justify-between;
}

.header-title h1 {
  @apply text-2xl font-bold text-gray-900;
}

.dark-mode .header-title h1 {
  @apply text-white;
}

.header-actions {
  @apply flex items-center gap-3;
}

/* Main Content */
.studio-content {
  @apply flex-1 flex overflow-hidden;
}

.layout-vertical .studio-content {
  @apply flex-col;
}

.layout-editor-only .preview-panel {
  @apply hidden;
}

.layout-preview-only .editor-panel {
  @apply hidden;
}

/* Panels */
.editor-panel {
  @apply bg-white overflow-hidden;
}

.preview-panel {
  @apply flex-1 bg-white overflow-hidden flex flex-col;
}

.dark-mode .editor-panel,
.dark-mode .preview-panel {
  @apply bg-gray-800;
}

/* Panel Divider */
.panel-divider {
  @apply w-1 bg-gray-200 cursor-col-resize hover:bg-gray-300 transition-colors;
}

.dark-mode .panel-divider {
  @apply bg-gray-700 hover:bg-gray-600;
}

/* Preview Controls */
.preview-controls {
  @apply p-4 border-b border-gray-200 flex items-center justify-center;
}

.dark-mode .preview-controls {
  @apply border-gray-700;
}

.device-switcher {
  @apply flex gap-2;
}

.device-btn {
  @apply p-2 rounded transition-colors;
}

.device-btn:hover {
  @apply bg-gray-100;
}

.device-btn.active {
  @apply bg-blue-100 text-blue-600;
}

.dark-mode .device-btn:hover {
  @apply bg-gray-700;
}

.dark-mode .device-btn.active {
  @apply bg-blue-900 text-blue-400;
}

/* Status Bar */
.studio-status {
  @apply bg-white border-t border-gray-200 px-6 py-2 flex items-center justify-between text-sm;
}

.dark-mode .studio-status {
  @apply bg-gray-800 border-gray-700 text-gray-300;
}

.status-info {
  @apply flex items-center gap-4 text-gray-600;
}

.dark-mode .status-info {
  @apply text-gray-400;
}

.status-item {
  @apply flex items-center gap-1;
}

.status-btn {
  @apply p-1 rounded hover:bg-gray-100 transition-colors;
}

.dark-mode .status-btn {
  @apply hover:bg-gray-700;
}

/* Buttons */
.btn {
  @apply inline-flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors;
}

.btn-primary {
  @apply bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50;
}

.btn-secondary {
  @apply bg-gray-100 text-gray-700 hover:bg-gray-200;
}

.dark-mode .btn-secondary {
  @apply bg-gray-700 text-gray-200 hover:bg-gray-600;
}

/* Notifications */
.notification {
  @apply fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50;
}

.notification-success {
  @apply bg-green-50 text-green-800;
}

.notification-error {
  @apply bg-red-50 text-red-800;
}

.notification-info {
  @apply bg-blue-50 text-blue-800;
}

.notification-enter-active,
.notification-leave-active {
  @apply transition-all duration-300;
}

.notification-enter-from,
.notification-leave-to {
  @apply translate-x-full opacity-0;
}
</style>