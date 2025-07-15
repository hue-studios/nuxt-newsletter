<template>
  <div class="newsletter-app">
    <!-- Loading State -->
    <div v-if="loading" class="loading-screen">
      <div class="loading-content">
        <div class="loading-spinner">
          <Icon name="lucide:loader-2" class="animate-spin" />
        </div>
        <h3>{{ loadingMessage }}</h3>
        <p>Setting up your newsletter editor...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-screen">
      <div class="error-content">
        <Icon name="lucide:alert-triangle" class="error-icon" />
        <h3>Unable to Load Editor</h3>
        <p>{{ error }}</p>
        <button @click="initializeEditor" class="retry-button">
          <Icon name="lucide:refresh-cw" />
          Try Again
        </button>
      </div>
    </div>

    <!-- Main Editor Interface -->
    <div v-else class="editor-interface">
      <!-- Mobile-first Top Bar -->
      <div class="top-bar">
        <div class="top-bar-content">
          <div class="newsletter-info">
            <h1 class="newsletter-title">
              {{ newsletter.title || 'Untitled Newsletter' }}
            </h1>
            <span class="status-badge" :class="statusClass">
              {{ newsletter.status || 'draft' }}
            </span>
          </div>

          <div class="top-actions">
            <!-- Template Selector -->
            <div class="template-selector" ref="templateDropdown">
              <button 
                @click="toggleTemplateSelector"
                class="template-button"
                :class="{ 'active': showTemplateSelector }"
              >
                <Icon name="lucide:layout" />
                <span class="hidden sm:inline">Templates</span>
                <Icon name="lucide:chevron-down" class="chevron" />
              </button>

              <!-- Dropdown Menu -->
              <Transition name="dropdown">
                <div v-if="showTemplateSelector" class="template-dropdown">
                  <div class="dropdown-header">
                    <h4>Choose Template</h4>
                    <p>Start with a pre-designed template</p>
                  </div>
                  <div class="template-list">
                    <button
                      v-for="template in templates"
                      :key="template.id"
                      @click="selectTemplate(template)"
                      class="template-item"
                    >
                      <div class="template-icon">
                        <Icon name="lucide:layout" />
                      </div>
                      <div class="template-details">
                        <span class="template-name">{{ template.name }}</span>
                        <span class="template-description">{{ template.description }}</span>
                      </div>
                    </button>
                  </div>
                </div>
              </Transition>
            </div>

            <!-- Preview Toggle -->
            <button @click="togglePreview" class="preview-toggle" :class="{ 'active': showPreview }">
              <Icon name="lucide:eye" />
              <span class="hidden sm:inline">Preview</span>
            </button>

            <!-- Save Button -->
            <button @click="saveNewsletter" class="save-button" :disabled="saving">
              <Icon :name="saving ? 'lucide:loader-2' : 'lucide:save'" :class="{ 'animate-spin': saving }" />
              <span class="hidden sm:inline">{{ saving ? 'Saving...' : 'Save' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Main Content Area -->
      <div class="main-content">
        <!-- Editor Panel -->
        <div class="editor-panel" :class="{ 'hidden-mobile': showPreview && isMobile }">
          <!-- Newsletter Settings (Collapsible) -->
          <div class="settings-section">
            <button @click="toggleSettings" class="settings-toggle">
              <Icon name="lucide:settings" />
              <span>Newsletter Settings</span>
              <Icon name="lucide:chevron-down" class="chevron" :class="{ 'rotated': showSettings }" />
            </button>

            <Transition name="slide-down">
              <div v-if="showSettings" class="settings-form">
                <div class="form-grid">
                  <div class="form-group">
                    <label for="subject">Subject Line</label>
                    <input
                      id="subject"
                      v-model="newsletter.subject_line"
                      type="text"
                      placeholder="Enter email subject"
                      class="form-input"
                    />
                  </div>

                  <div class="form-group">
                    <label for="preview">Preview Text</label>
                    <input
                      id="preview"
                      v-model="newsletter.preview_text"
                      type="text"
                      placeholder="Preview text shown in inbox"
                      class="form-input"
                    />
                  </div>

                  <div class="form-group">
                    <label for="from-name">From Name</label>
                    <input
                      id="from-name"
                      v-model="newsletter.from_name"
                      type="text"
                      placeholder="Your Company"
                      class="form-input"
                    />
                  </div>

                  <div class="form-group">
                    <label for="from-email">From Email</label>
                    <input
                      id="from-email"
                      v-model="newsletter.from_email"
                      type="email"
                      placeholder="newsletter@yourcompany.com"
                      class="form-input"
                    />
                  </div>
                </div>
              </div>
            </Transition>
          </div>

          <!-- Block Toolbar -->
          <div class="block-toolbar">
            <h3>Add Content Blocks</h3>
            <div class="block-types-grid">
              <button
                v-for="blockType in blockTypes"
                :key="blockType.id"
                @click="addBlock(blockType.slug)"
                class="block-type-button"
              >
                <Icon :name="blockType.icon || 'lucide:square'" />
                <span>{{ blockType.name }}</span>
              </button>
            </div>
          </div>

          <!-- Newsletter Blocks -->
          <div class="blocks-container">
            <h3>Newsletter Content</h3>
            
            <div v-if="newsletter.blocks.length === 0" class="empty-state">
              <Icon name="lucide:layout" class="empty-icon" />
              <h4>Start Building Your Newsletter</h4>
              <p>Add content blocks from the toolbar above to begin creating your newsletter.</p>
            </div>

            <div v-else class="blocks-list">
              <TransitionGroup name="block-list" tag="div">
                <div
                  v-for="(block, index) in newsletter.blocks"
                  :key="block.id"
                  class="block-item"
                >
                  <div class="block-header">
                    <div class="block-info">
                      <Icon :name="getBlockIcon(block.type)" class="block-icon" />
                      <span class="block-name">{{ getBlockName(block.type) }}</span>
                    </div>
                    <div class="block-actions">
                      <button @click="moveBlockUp(index)" :disabled="index === 0" class="block-action">
                        <Icon name="lucide:chevron-up" />
                      </button>
                      <button @click="moveBlockDown(index)" :disabled="index === newsletter.blocks.length - 1" class="block-action">
                        <Icon name="lucide:chevron-down" />
                      </button>
                      <button @click="duplicateBlock(block.id)" class="block-action">
                        <Icon name="lucide:copy" />
                      </button>
                      <button @click="removeBlock(block.id)" class="block-action delete">
                        <Icon name="lucide:trash-2" />
                      </button>
                    </div>
                  </div>

                  <div class="block-content">
                    <NewsletterBlock
                      :block="block"
                      :block-type="getBlockType(block.type)"
                      @update="updateBlock"
                    />
                  </div>
                </div>
              </TransitionGroup>
            </div>
          </div>
        </div>

        <!-- Preview Panel -->
        <div class="preview-panel" :class="{ 'hidden-mobile': !showPreview && isMobile }">
          <div class="preview-header">
            <h3>Live Preview</h3>
            <div class="device-selector">
              <button
                v-for="device in devices"
                :key="device.type"
                @click="currentDevice = device.type"
                class="device-button"
                :class="{ 'active': currentDevice === device.type }"
              >
                <Icon :name="device.icon" />
                <span class="sr-only">{{ device.label }}</span>
              </button>
            </div>
          </div>

          <div class="preview-container">
            <NewsletterPreview
              :newsletter="newsletter"
              :block-types="blockTypes"
              :device="currentDevice"
              @update:compiled="handleCompiled"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile Navigation -->
    <div v-if="isMobile" class="mobile-nav">
      <button @click="showPreview = false" class="nav-button" :class="{ 'active': !showPreview }">
        <Icon name="lucide:edit" />
        <span>Edit</span>
      </button>
      <button @click="showPreview = true" class="nav-button" :class="{ 'active': showPreview }">
        <Icon name="lucide:eye" />
        <span>Preview</span>
      </button>
    </div>

    <!-- Notification System -->
    <Transition name="notification">
      <div v-if="notification.show" class="notification" :class="notification.type">
        <Icon :name="notification.type === 'success' ? 'lucide:check-circle' : 'lucide:alert-circle'" />
        <span>{{ notification.message }}</span>
        <button @click="hideNotification" class="notification-close">
          <Icon name="lucide:x" />
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

// Composables
const { 
  newsletter, 
  addBlock, 
  removeBlock, 
  updateBlock, 
  moveBlock, 
  duplicateBlock,
  loadFromTemplate 
} = useNewsletterEditor()

const { fetchBlockTypes, fetchTemplates } = useDirectusNewsletter()

// Reactive state
const loading = ref(true)
const loadingMessage = ref('Loading editor...')
const error = ref('')
const saving = ref(false)

const blockTypes = ref([])
const templates = ref([])

const showTemplateSelector = ref(false)
const showPreview = ref(false)
const showSettings = ref(true)
const currentDevice = ref('mobile')

const templateDropdown = ref(null)

// Notification system
const notification = ref({
  show: false,
  type: 'success',
  message: ''
})

// Mobile detection
const isMobile = ref(false)

// Device options
const devices = [
  { type: 'mobile', icon: 'lucide:smartphone', label: 'Mobile' },
  { type: 'desktop', icon: 'lucide:monitor', label: 'Desktop' }
]

// Computed
const statusClass = computed(() => {
  const status = newsletter.value.status || 'draft'
  return `status-${status}`
})

// Methods
const initializeEditor = async () => {
  try {
    loading.value = true
    loadingMessage.value = 'Loading block types...'
    
    const [blockTypesData, templatesData] = await Promise.all([
      fetchBlockTypes(),
      fetchTemplates({ limit: 50 })
    ])

    blockTypes.value = blockTypesData
    templates.value = templatesData

    loading.value = false
  } catch (err) {
    error.value = err.message || 'Failed to initialize editor'
    loading.value = false
  }
}

const toggleTemplateSelector = (e) => {
  e.stopPropagation()
  showTemplateSelector.value = !showTemplateSelector.value
}

const selectTemplate = async (template) => {
  try {
    await loadFromTemplate(template)
    showTemplateSelector.value = false
    showNotification(`Loaded template: ${template.name}`, 'success')
  } catch (err) {
    showNotification('Failed to load template', 'error')
  }
}

const togglePreview = () => {
  showPreview.value = !showPreview.value
}

const toggleSettings = () => {
  showSettings.value = !showSettings.value
}

const saveNewsletter = async () => {
  saving.value = true
  try {
    // Implement save logic here
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate save
    showNotification('Newsletter saved successfully!', 'success')
  } catch (err) {
    showNotification('Failed to save newsletter', 'error')
  }
  saving.value = false
}

const moveBlockUp = (index) => {
  if (index > 0) {
    moveBlock(index, index - 1)
  }
}

const moveBlockDown = (index) => {
  if (index < newsletter.value.blocks.length - 1) {
    moveBlock(index, index + 1)
  }
}

const getBlockType = (slug) => {
  return blockTypes.value.find(bt => bt.slug === slug)
}

const getBlockIcon = (slug) => {
  const blockType = getBlockType(slug)
  return blockType?.icon || 'lucide:square'
}

const getBlockName = (slug) => {
  const blockType = getBlockType(slug)
  return blockType?.name || slug
}

const handleCompiled = (compiled) => {
  newsletter.value.compiled_mjml = compiled.mjml
  newsletter.value.compiled_html = compiled.html
}

const showNotification = (message, type = 'success') => {
  notification.value = {
    show: true,
    type,
    message
  }
  setTimeout(() => {
    notification.value.show = false
  }, 5000)
}

const hideNotification = () => {
  notification.value.show = false
}

const handleResize = () => {
  isMobile.value = window.innerWidth < 768
}

const handleClickOutside = (event) => {
  if (templateDropdown.value && !templateDropdown.value.contains(event.target)) {
    showTemplateSelector.value = false
  }
}

// Lifecycle
onMounted(async () => {
  handleResize()
  window.addEventListener('resize', handleResize)
  document.addEventListener('click', handleClickOutside)
  
  await initializeEditor()
  
  // Auto-show preview on desktop
  if (!isMobile.value) {
    showPreview.value = true
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
@reference 'tailwindcss';
.newsletter-app {
  @apply min-h-screen bg-slate-50;
}

/* Loading Screen */
.loading-screen {
  @apply min-h-screen flex items-center justify-center;
}

.loading-content {
  @apply text-center;
}

.loading-spinner {
  @apply w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto shadow-lg;
}

.loading-spinner svg {
  @apply w-8 h-8 text-white;
}

.loading-content h3 {
  @apply text-xl font-semibold text-slate-900 mb-2;
}

.loading-content p {
  @apply text-slate-600;
}

/* Error Screen */
.error-screen {
  @apply min-h-screen flex items-center justify-center p-4;
}

.error-content {
  @apply text-center max-w-md;
}

.error-icon {
  @apply w-16 h-16 mb-6 text-red-500 mx-auto;
}

.error-content h3 {
  @apply text-xl font-semibold text-slate-900 mb-2;
}

.error-content p {
  @apply text-slate-600 mb-6;
}

.retry-button {
  @apply inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors;
}

/* Editor Interface */
.editor-interface {
  @apply min-h-screen flex flex-col;
}

/* Top Bar */
.top-bar {
  @apply bg-white border-b border-slate-200 sticky top-0 z-40;
}

.top-bar-content {
  @apply px-4 py-3 flex items-center justify-between;
}

.newsletter-info {
  @apply flex items-center gap-3;
}

.newsletter-title {
  @apply text-lg font-semibold text-slate-900 truncate;
}

.status-badge {
  @apply px-2 py-1 text-xs font-medium rounded-full;
}

.status-draft {
  @apply bg-gray-100 text-gray-700;
}

.status-ready {
  @apply bg-blue-100 text-blue-700;
}

.status-sent {
  @apply bg-green-100 text-green-700;
}

.top-actions {
  @apply flex items-center gap-2;
}

/* Template Selector */
.template-selector {
  @apply relative;
}

.template-button {
  @apply flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors;
}

.template-button.active {
  @apply bg-blue-50 border-blue-300 text-blue-700;
}

.chevron {
  @apply w-4 h-4 transition-transform;
}

.template-button.active .chevron {
  @apply rotate-180;
}

.template-dropdown {
  @apply absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-xl ring-1 ring-black/5 z-50 max-h-96 overflow-hidden;
}

.dropdown-header {
  @apply p-4 border-b border-slate-100;
}

.dropdown-header h4 {
  @apply text-sm font-semibold text-slate-900;
}

.dropdown-header p {
  @apply text-xs text-slate-600 mt-1;
}

.template-list {
  @apply max-h-64 overflow-y-auto p-2;
}

.template-item {
  @apply flex items-center gap-3 w-full p-3 rounded-lg hover:bg-slate-50 transition-colors text-left;
}

.template-icon {
  @apply w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center;
}

.template-icon svg {
  @apply w-4 h-4 text-blue-600;
}

.template-details {
  @apply flex-1 min-w-0;
}

.template-name {
  @apply block text-sm font-medium text-slate-900;
}

.template-description {
  @apply block text-xs text-slate-600 truncate;
}

/* Action Buttons */
.preview-toggle,
.save-button {
  @apply flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors;
}

.preview-toggle {
  @apply text-slate-700 bg-white border border-slate-300 hover:bg-slate-50;
}

.preview-toggle.active {
  @apply bg-blue-50 border-blue-300 text-blue-700;
}

.save-button {
  @apply text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed;
}

/* Main Content */
.main-content {
  @apply flex-1 flex overflow-hidden;
}

.editor-panel,
.preview-panel {
  @apply flex-1 overflow-y-auto;
}

.editor-panel {
  @apply border-r border-slate-200 bg-white;
}

.preview-panel {
  @apply bg-slate-50;
}

@media (max-width: 767px) {
  .hidden-mobile {
    @apply hidden;
  }
}

/* Settings Section */
.settings-section {
  @apply border-b border-slate-200;
}

.settings-toggle {
  @apply w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 transition-colors;
}

.settings-toggle svg:first-child {
  @apply w-5 h-5 text-slate-500;
}

.settings-toggle span {
  @apply flex-1 font-medium text-slate-900;
}

.settings-toggle .chevron {
  @apply w-4 h-4 text-slate-400 transition-transform;
}

.settings-toggle .chevron.rotated {
  @apply rotate-180;
}

.settings-form {
  @apply p-4 bg-slate-50 border-t border-slate-200;
}

.form-grid {
  @apply grid gap-4 sm:grid-cols-2;
}

.form-group {
  @apply space-y-1;
}

.form-group label {
  @apply block text-sm font-medium text-slate-700;
}

.form-input {
  @apply block w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors;
}

/* Block Toolbar */
.block-toolbar {
  @apply p-4 border-b border-slate-200;
}

.block-toolbar h3 {
  @apply text-sm font-semibold text-slate-900 mb-3;
}

.block-types-grid {
  @apply grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2;
}

.block-type-button {
  @apply flex flex-col items-center gap-2 p-3 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 hover:border-slate-300 transition-colors;
}

.block-type-button svg {
  @apply w-5 h-5;
}

/* Blocks Container */
.blocks-container {
  @apply p-4;
}

.blocks-container h3 {
  @apply text-sm font-semibold text-slate-900 mb-4;
}

.empty-state {
  @apply text-center py-12;
}

.empty-icon {
  @apply w-12 h-12 text-slate-300 mx-auto mb-4;
}

.empty-state h4 {
  @apply text-sm font-semibold text-slate-900 mb-2;
}

.empty-state p {
  @apply text-sm text-slate-600;
}

/* Block List */
.blocks-list {
  @apply space-y-4;
}

.block-item {
  @apply bg-white border border-slate-200 rounded-lg overflow-hidden;
}

.block-header {
  @apply flex items-center justify-between p-3 bg-slate-50 border-b border-slate-200;
}

.block-info {
  @apply flex items-center gap-2;
}

.block-icon {
  @apply w-4 h-4 text-slate-500;
}

.block-name {
  @apply text-sm font-medium text-slate-900;
}

.block-actions {
  @apply flex items-center gap-1;
}

.block-action {
  @apply p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded transition-colors;
}

.block-action:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.block-action.delete {
  @apply hover:text-red-600 hover:bg-red-50;
}

.block-content {
  @apply p-4;
}

/* Preview Panel */
.preview-header {
  @apply flex items-center justify-between p-4 bg-white border-b border-slate-200;
}

.preview-header h3 {
  @apply text-sm font-semibold text-slate-900;
}

.device-selector {
  @apply flex items-center gap-1 bg-slate-100 rounded-lg p-1;
}

.device-button {
  @apply p-2 rounded-md transition-colors;
}

.device-button.active {
  @apply bg-white shadow-sm;
}

.device-button svg {
  @apply w-4 h-4;
}

.preview-container {
  @apply p-4 flex justify-center;
}

/* Mobile Navigation */
.mobile-nav {
  @apply fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex z-30;
}

.nav-button {
  @apply flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors;
}

.nav-button.active {
  @apply text-blue-600;
}

.nav-button svg {
  @apply w-5 h-5;
}

/* Notification */
.notification {
  @apply fixed top-4 right-4 flex items-center gap-3 px-4 py-3 bg-white border rounded-lg shadow-lg z-50;
}

.notification.success {
  @apply border-green-200 bg-green-50;
}

.notification.error {
  @apply border-red-200 bg-red-50;
}

.notification svg:first-child {
  @apply w-5 h-5;
}

.notification.success svg:first-child {
  @apply text-green-600;
}

.notification.error svg:first-child {
  @apply text-red-600;
}

.notification span {
  @apply text-sm font-medium text-slate-900;
}

.notification-close {
  @apply p-1 text-slate-400 hover:text-slate-600 transition-colors;
}

.notification-close svg {
  @apply w-4 h-4;
}

/* Transitions */
.dropdown-enter-active,
.dropdown-leave-active {
  @apply transition-all duration-200;
}

.dropdown-enter-from,
.dropdown-leave-to {
  @apply opacity-0 scale-95 translate-y-1;
}

.slide-down-enter-active,
.slide-down-leave-active {
  @apply transition-all duration-300;
}

.slide-down-enter-from,
.slide-down-leave-to {
  @apply opacity-0 -translate-y-2;
}

.block-list-move,
.block-list-enter-active,
.block-list-leave-active {
  @apply transition-all duration-300;
}

.block-list-enter-from,
.block-list-leave-to {
  @apply opacity-0 scale-95;
}

.notification-enter-active,
.notification-leave-active {
  @apply transition-all duration-300;
}

.notification-enter-from,
.notification-leave-to {
  @apply opacity-0 translate-x-full;
}

/* Screen reader only */
.sr-only {
  @apply sr-only;
}
</style>