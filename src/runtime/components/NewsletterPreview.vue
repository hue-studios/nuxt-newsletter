<template>
  <div class="newsletter-preview">
    <!-- Preview Controls -->
    <div class="preview-controls">
      <div class="device-selector">
        <button
          v-for="device in devices"
          :key="device.type"
          @click="currentDevice = device.type"
          class="device-button"
          :class="{ 'active': currentDevice === device.type }"
        >
          <Icon :name="device.icon" />
          <span>{{ device.label }}</span>
        </button>
      </div>

      <div class="zoom-controls">
        <button @click="zoomOut" :disabled="zoom <= 0.5" class="zoom-button">
          <Icon name="lucide:zoom-out" />
        </button>
        <span class="zoom-display">{{ Math.round(zoom * 100) }}%</span>
        <button @click="zoomIn" :disabled="zoom >= 1.5" class="zoom-button">
          <Icon name="lucide:zoom-in" />
        </button>
      </div>

      <div class="preview-actions">
        <button @click="refreshPreview" class="action-button" :disabled="isCompiling">
          <Icon :name="isCompiling ? 'lucide:loader-2' : 'lucide:refresh-cw'" :class="{ 'animate-spin': isCompiling }" />
        </button>
        <button @click="showMjmlSource = true" class="action-button">
          <Icon name="lucide:code" />
        </button>
        <button @click="downloadHtml" class="action-button">
          <Icon name="lucide:download" />
        </button>
      </div>
    </div>

    <!-- Preview Frame Container -->
    <div class="preview-container" :class="containerClasses">
      <!-- Device Frame -->
      <div class="device-frame" :class="frameClasses" :style="frameStyles">
        <!-- Mobile Frame Chrome -->
        <template v-if="currentDevice === 'mobile'">
          <!-- Status Bar -->
          <div class="mobile-status-bar">
            <div class="status-left">
              <div class="signal-bars">
                <div class="bar" v-for="i in 4" :key="i" :class="{ 'active': i <= 3 }"></div>
              </div>
              <span class="carrier">Verizon</span>
              <Icon name="lucide:wifi" class="wifi-icon" />
            </div>
            <div class="status-center">
              <span class="time">{{ currentTime }}</span>
            </div>
            <div class="status-right">
              <span class="battery-percent">85%</span>
              <div class="battery-icon">
                <div class="battery-fill"></div>
              </div>
            </div>
          </div>

          <!-- Email App Header -->
          <div class="email-header">
            <div class="header-content">
              <button class="back-button">
                <Icon name="lucide:chevron-left" />
              </button>
              <div class="email-info">
                <h4>{{ newsletter.subject_line || 'Newsletter Subject' }}</h4>
                <p>from {{ newsletter.from_name || 'Your Company' }}</p>
              </div>
              <div class="header-actions">
                <button class="header-action">
                  <Icon name="lucide:star" />
                </button>
                <button class="header-action">
                  <Icon name="lucide:more-vertical" />
                </button>
              </div>
            </div>
          </div>
        </template>

        <!-- Desktop Frame Chrome -->
        <template v-else>
          <!-- Browser Chrome -->
          <div class="browser-chrome">
            <div class="chrome-controls">
              <div class="traffic-lights">
                <div class="traffic-light red"></div>
                <div class="traffic-light yellow"></div>
                <div class="traffic-light green"></div>
              </div>
              <div class="address-bar">
                <Icon name="lucide:lock" class="lock-icon" />
                <span>mail.google.com</span>
              </div>
              <div class="browser-actions">
                <Icon name="lucide:refresh-cw" />
                <Icon name="lucide:more-horizontal" />
              </div>
            </div>
          </div>

          <!-- Gmail Interface -->
          <div class="gmail-interface">
            <div class="gmail-header">
              <div class="email-sender">
                <div class="sender-avatar">
                  {{ (newsletter.from_name || 'C')[0].toUpperCase() }}
                </div>
                <div class="sender-info">
                  <div class="sender-name">{{ newsletter.from_name || 'Your Company' }}</div>
                  <div class="sender-email">&lt;{{ newsletter.from_email || 'newsletter@company.com' }}&gt;</div>
                </div>
              </div>
              <div class="email-meta">
                <span class="email-time">{{ formatTime() }}</span>
                <div class="email-actions">
                  <Icon name="lucide:reply" />
                  <Icon name="lucide:forward" />
                  <Icon name="lucide:more-vertical" />
                </div>
              </div>
            </div>
            <div class="email-subject">
              <h3>{{ newsletter.subject_line || 'Newsletter Subject Line' }}</h3>
              <div class="subject-meta">
                <span class="to-line">to me</span>
                <Icon name="lucide:chevron-down" class="details-toggle" />
              </div>
            </div>
          </div>
        </template>

        <!-- Email Content Area -->
        <div class="email-content" :style="contentStyles">
          <!-- Compilation Error -->
          <div v-if="compilationError" class="compilation-error">
            <Icon name="lucide:alert-triangle" />
            <div>
              <h4>Compilation Error</h4>
              <p>{{ compilationError }}</p>
              <button @click="refreshPreview" class="retry-button">
                <Icon name="lucide:refresh-cw" />
                Try Again
              </button>
            </div>
          </div>

          <!-- Loading State -->
          <div v-else-if="isCompiling" class="loading-state">
            <Icon name="lucide:loader-2" class="animate-spin" />
            <p>Compiling newsletter...</p>
          </div>

          <!-- Empty State -->
          <div v-else-if="!compiledHtml" class="empty-content">
            <Icon name="lucide:mail" />
            <h4>No Content Yet</h4>
            <p>Add some blocks to see your newsletter preview</p>
          </div>

          <!-- Compiled Newsletter -->
          <iframe
            v-else
            ref="previewFrame"
            :srcdoc="iframeContent"
            class="newsletter-iframe"
            @load="handleIframeLoad"
          ></iframe>
        </div>
      </div>
    </div>

    <!-- MJML Source Modal -->
    <Transition name="modal">
      <div v-if="showMjmlSource" class="modal-overlay" @click="showMjmlSource = false">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>MJML Source</h3>
            <button @click="showMjmlSource = false" class="modal-close">
              <Icon name="lucide:x" />
            </button>
          </div>
          <div class="modal-body">
            <div class="source-tabs">
              <button
                @click="sourceTab = 'mjml'"
                class="source-tab"
                :class="{ 'active': sourceTab === 'mjml' }"
              >
                MJML
              </button>
              <button
                @click="sourceTab = 'html'"
                class="source-tab"
                :class="{ 'active': sourceTab === 'html' }"
              >
                HTML
              </button>
            </div>
            <div class="source-container">
              <pre><code>{{ sourceTab === 'mjml' ? compiledMjml : compiledHtml }}</code></pre>
            </div>
            <div class="source-actions">
              <button @click="copySource" class="copy-button">
                <Icon :name="copied ? 'lucide:check' : 'lucide:copy'" />
                {{ copied ? 'Copied!' : 'Copy' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';

interface Props {
  newsletter: any
  blockTypes: any[]
  device?: 'mobile' | 'desktop'
}

const props = withDefaults(defineProps<Props>(), {
  device: 'mobile'
})

const emit = defineEmits<{
  'update:compiled': [compiled: { mjml: string, html: string }]
}>()

// Composables
const { compileNewsletterToMjml, compileMjmlToHtml, isCompiling, compilationError } = useMjmlCompiler()

// State
const currentDevice = ref(props.device)
const zoom = ref(1)
const compiledMjml = ref('')
const compiledHtml = ref('')
const showMjmlSource = ref(false)
const sourceTab = ref('mjml')
const copied = ref(false)
const previewFrame = ref<HTMLIFrameElement>()
const currentTime = ref('')

// Device configurations
const devices = [
  { type: 'mobile', icon: 'lucide:smartphone', label: 'Mobile' },
  { type: 'desktop', icon: 'lucide:monitor', label: 'Desktop' }
]

// Computed styles
const containerClasses = computed(() => ({
  'mobile-container': currentDevice.value === 'mobile',
  'desktop-container': currentDevice.value === 'desktop'
}))

const frameClasses = computed(() => ({
  'mobile-frame': currentDevice.value === 'mobile',
  'desktop-frame': currentDevice.value === 'desktop'
}))

const frameStyles = computed(() => ({
  transform: `scale(${zoom.value})`,
  transformOrigin: 'top center'
}))

const contentStyles = computed(() => ({
  height: currentDevice.value === 'mobile' ? 'calc(100vh - 120px)' : 'calc(100vh - 160px)'
}))

// Enhanced iframe content with proper scaling
const iframeContent = computed(() => {
  if (!compiledHtml.value) return ''
  
  const baseStyles = `
    <style>
      body {
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.5;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      
      /* Mobile optimizations */
      @media screen and (max-width: 600px) {
        .container {
          width: 100% !important;
          max-width: 100% !important;
        }
        
        table {
          width: 100% !important;
        }
        
        .mobile-hide {
          display: none !important;
        }
        
        .mobile-center {
          text-align: center !important;
        }
      }
      
      /* Prevent zooming on mobile */
      * {
        -webkit-text-size-adjust: 100%;
        -ms-text-size-adjust: 100%;
      }
    </style>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  `
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        ${baseStyles}
      </head>
      <body>
        ${compiledHtml.value}
      </body>
    </html>
  `
})

// Methods
const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: false 
  })
}

const formatTime = () => {
  return new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

const zoomIn = () => {
  zoom.value = Math.min(zoom.value + 0.1, 1.5)
}

const zoomOut = () => {
  zoom.value = Math.max(zoom.value - 0.1, 0.5)
}

const refreshPreview = async () => {
  await compileNewsletter()
}

const compileNewsletter = async () => {
  try {
    const mjml = await compileNewsletterToMjml(props.newsletter, props.blockTypes)
    const html = await compileMjmlToHtml(mjml)
    
    compiledMjml.value = mjml
    compiledHtml.value = html
    
    emit('update:compiled', { mjml, html })
  } catch (error) {
    console.error('Compilation failed:', error)
  }
}

const handleIframeLoad = async () => {
  await nextTick()
  
  if (previewFrame.value?.contentWindow) {
    // Apply mobile-specific styles if needed
    if (currentDevice.value === 'mobile') {
      const iframeDoc = previewFrame.value.contentDocument
      if (iframeDoc) {
        const body = iframeDoc.body
        if (body) {
          body.style.maxWidth = '375px'
          body.style.margin = '0 auto'
          body.style.overflow = 'visible'
        }
      }
    }
  }
}

const downloadHtml = () => {
  if (!compiledHtml.value) return
  
  const blob = new Blob([iframeContent.value], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${props.newsletter.title || 'newsletter'}.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const copySource = async () => {
  const content = sourceTab.value === 'mjml' ? compiledMjml.value : compiledHtml.value
  if (!content) return
  
  try {
    await navigator.clipboard.writeText(content)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch (error) {
    console.error('Failed to copy:', error)
  }
}

// Watchers
watch(() => props.newsletter, compileNewsletter, { deep: true })
watch(() => props.device, (newDevice) => {
  currentDevice.value = newDevice
})

// Lifecycle
onMounted(() => {
  updateTime()
  const timeInterval = setInterval(updateTime, 60000) // Update every minute
  
  compileNewsletter()
  
  onUnmounted(() => {
    clearInterval(timeInterval)
  })
})
</script>

<style scoped>
@reference 'tailwindcss';
.newsletter-preview {
  @apply h-full flex flex-col bg-slate-100;
}

/* Preview Controls */
.preview-controls {
  @apply flex items-center justify-between p-3 bg-white border-b border-slate-200 flex-wrap gap-3;
}

.device-selector {
  @apply flex items-center gap-1 bg-slate-100 rounded-lg p-1;
}

.device-button {
  @apply flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors;
}

.device-button.active {
  @apply bg-white shadow-sm text-blue-600;
}

.device-button:not(.active) {
  @apply text-slate-600 hover:text-slate-900;
}

.device-button svg {
  @apply w-4 h-4;
}

.zoom-controls {
  @apply flex items-center gap-2;
}

.zoom-button {
  @apply p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
}

.zoom-display {
  @apply text-sm font-medium text-slate-700 min-w-[3rem] text-center;
}

.preview-actions {
  @apply flex items-center gap-1;
}

.action-button {
  @apply p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors disabled:opacity-50;
}

/* Preview Container */
.preview-container {
  @apply flex-1 overflow-auto p-4 bg-gradient-to-br from-slate-100 to-slate-200;
}

.preview-container.mobile-container {
  @apply flex justify-center;
}

.preview-container.desktop-container {
  @apply flex justify-center;
}

/* Device Frames */
.device-frame {
  @apply bg-white rounded-xl shadow-2xl overflow-hidden transition-transform duration-300;
}

.mobile-frame {
  @apply w-[375px] h-[812px] relative;
}

.desktop-frame {
  @apply w-full max-w-4xl min-h-[600px] relative;
}

/* Mobile Chrome */
.mobile-status-bar {
  @apply h-11 bg-slate-900 flex items-center justify-between px-4 text-white text-sm;
}

.status-left {
  @apply flex items-center gap-2;
}

.signal-bars {
  @apply flex items-end gap-0.5;
}

.bar {
  @apply w-1 bg-slate-500 rounded-full;
}

.bar:nth-child(1) { @apply h-1; }
.bar:nth-child(2) { @apply h-2; }
.bar:nth-child(3) { @apply h-3; }
.bar:nth-child(4) { @apply h-4; }

.bar.active {
  @apply bg-white;
}

.carrier {
  @apply text-xs;
}

.wifi-icon {
  @apply w-4 h-4;
}

.status-center {
  @apply font-semibold;
}

.status-right {
  @apply flex items-center gap-1;
}

.battery-percent {
  @apply text-xs;
}

.battery-icon {
  @apply w-6 h-3 border border-white rounded-sm relative;
}

.battery-icon::after {
  content: '';
  @apply absolute -right-0.5 top-1/2 -translate-y-1/2 w-0.5 h-1.5 bg-white rounded-r-sm;
}

.battery-fill {
  @apply w-4 h-1.5 bg-green-400 rounded-sm m-0.5;
}

.email-header {
  @apply h-14 bg-white border-b border-slate-200 flex items-center;
}

.header-content {
  @apply flex items-center w-full px-4;
}

.back-button {
  @apply p-2 -ml-2 text-blue-600;
}

.email-info {
  @apply flex-1 mx-3 min-w-0;
}

.email-info h4 {
  @apply text-sm font-semibold text-slate-900 truncate;
}

.email-info p {
  @apply text-xs text-slate-600 truncate;
}

.header-actions {
  @apply flex items-center gap-2;
}

.header-action {
  @apply p-2 text-slate-400 hover:text-slate-600;
}

/* Desktop Chrome */
.browser-chrome {
  @apply h-12 bg-slate-200 border-b border-slate-300;
}

.chrome-controls {
  @apply h-full flex items-center px-4;
}

.traffic-lights {
  @apply flex items-center gap-2;
}

.traffic-light {
  @apply w-3 h-3 rounded-full;
}

.traffic-light.red {
  @apply bg-red-400;
}

.traffic-light.yellow {
  @apply bg-yellow-400;
}

.traffic-light.green {
  @apply bg-green-400;
}

.address-bar {
  @apply flex-1 mx-4 bg-white rounded-md px-3 py-1.5 flex items-center gap-2 text-sm text-slate-600;
}

.lock-icon {
  @apply w-4 h-4 text-green-600;
}

.browser-actions {
  @apply flex items-center gap-2 text-slate-500;
}

.gmail-interface {
  @apply bg-white border-b border-slate-200;
}

.gmail-header {
  @apply flex items-center justify-between p-4;
}

.email-sender {
  @apply flex items-center gap-3;
}

.sender-avatar {
  @apply w-10 h-10 rounded-full bg-blue-600 text-white font-semibold flex items-center justify-center text-sm;
}

.sender-info {
  @apply min-w-0;
}

.sender-name {
  @apply font-semibold text-slate-900;
}

.sender-email {
  @apply text-sm text-slate-600;
}

.email-meta {
  @apply flex items-center gap-4;
}

.email-time {
  @apply text-sm text-slate-600;
}

.email-actions {
  @apply flex items-center gap-2 text-slate-400;
}

.email-subject {
  @apply px-4 pb-4;
}

.email-subject h3 {
  @apply text-xl font-bold text-slate-900 mb-1;
}

.subject-meta {
  @apply flex items-center gap-2 text-sm text-slate-600;
}

.details-toggle {
  @apply w-4 h-4 cursor-pointer hover:text-slate-900;
}

/* Email Content */
.email-content {
  @apply flex-1 overflow-auto bg-white;
}

.compilation-error,
.loading-state,
.empty-content {
  @apply flex flex-col items-center justify-center h-64 text-center p-8;
}

.compilation-error {
  @apply text-red-600;
}

.compilation-error svg {
  @apply w-12 h-12 mb-4;
}

.compilation-error h4 {
  @apply text-lg font-semibold mb-2;
}

.compilation-error p {
  @apply mb-4 max-w-md;
}

.retry-button {
  @apply inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors;
}

.loading-state {
  @apply text-slate-600;
}

.loading-state svg {
  @apply w-8 h-8 mb-4;
}

.empty-content {
  @apply text-slate-400;
}

.empty-content svg {
  @apply w-16 h-16 mb-4;
}

.empty-content h4 {
  @apply text-lg font-semibold text-slate-600 mb-2;
}

.newsletter-iframe {
  @apply w-full h-full border-none;
}

/* Modal */
.modal-overlay {
  @apply fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4;
}

.modal-content {
  @apply bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden;
}

.modal-header {
  @apply flex items-center justify-between p-4 border-b border-slate-200;
}

.modal-header h3 {
  @apply text-lg font-semibold text-slate-900;
}

.modal-close {
  @apply p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors;
}

.modal-body {
  @apply flex flex-col h-full max-h-[70vh];
}

.source-tabs {
  @apply flex border-b border-slate-200;
}

.source-tab {
  @apply px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 border-b-2 border-transparent transition-colors;
}

.source-tab.active {
  @apply text-blue-600 border-blue-600;
}

.source-container {
  @apply flex-1 overflow-auto p-4 bg-slate-50;
}

.source-container pre {
  @apply text-sm font-mono bg-white rounded-lg p-4 overflow-auto;
}

.source-actions {
  @apply p-4 border-t border-slate-200 flex justify-end;
}

.copy-button {
  @apply inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors;
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  @apply transition-all duration-300;
}

.modal-enter-from,
.modal-leave-to {
  @apply opacity-0 scale-95;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .mobile-frame {
    @apply w-full max-w-sm;
  }
  
  .preview-controls {
    @apply flex-col items-stretch gap-2;
  }
  
  .device-selector,
  .zoom-controls,
  .preview-actions {
    @apply justify-center;
  }
}
</style>