<template>
  <div class="newsletter-preview">
    <div class="preview-header">
      <h3>Preview</h3>
      <div class="preview-controls">
        <button 
          v-for="device in devices" 
          :key="device.type"
          @click="currentDevice = device.type"
          class="device-btn"
          :class="{ active: currentDevice === device.type }"
          :title="device.type"
        >
          {{ device.icon }}
        </button>
        <button 
          @click="refreshPreview" 
          class="refresh-btn"
          :disabled="isCompiling"
          title="Refresh preview"
        >
          🔄
        </button>
        <button 
          @click="showMjmlSource = !showMjmlSource" 
          class="source-btn"
          title="View MJML source"
        >
          &lt;/&gt;
        </button>
      </div>
    </div>

    <div class="preview-container">
      <div v-if="isCompiling" class="loading-state">
        <div class="spinner"></div>
        <p>Compiling newsletter...</p>
      </div>

      <div v-else-if="compilationError" class="error-state">
        <p>Error compiling preview:</p>
        <pre>{{ compilationError }}</pre>
        <button @click="refreshPreview" class="retry-btn">
          Try Again
        </button>
      </div>

      <div v-else class="device-frame" :class="`device-${currentDevice}`">
        <iframe
          ref="previewFrame"
          :srcdoc="compiledHtml"
          class="preview-iframe"
          sandbox="allow-same-origin"
        />
      </div>
    </div>

    <!-- MJML Source Modal -->
    <div v-if="showMjmlSource" class="mjml-source-modal" @click.self="showMjmlSource = false">
      <div class="modal-content">
        <div class="modal-header">
          <h4>MJML Source</h4>
          <button @click="showMjmlSource = false" class="close-btn">✕</button>
        </div>
        <div class="modal-body">
          <pre><code>{{ compiledMjml }}</code></pre>
        </div>
        <div class="modal-footer">
          <button @click="copyMjml" class="copy-btn">
            {{ copied ? '✓ Copied!' : 'Copy MJML' }}
          </button>
          <button @click="downloadMjml" class="download-btn">
            Download MJML
          </button>
          <button @click="downloadHtml" class="download-btn">
            Download HTML
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useMjmlCompiler } from '../composables/useMjmlCompiler'
import type { NewsletterData } from '../composables/useNewsletterEditor'

interface Props {
  newsletter: NewsletterData
  blockTypes: any[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:compiled': [compiled: { mjml: string, html: string }]
}>()

const { compileNewsletterToMjml, compileMjmlToHtml, isCompiling, compilationError } = useMjmlCompiler()

// State
const currentDevice = ref<'desktop' | 'mobile'>('desktop')
const compiledMjml = ref('')
const compiledHtml = ref('')
const showMjmlSource = ref(false)
const copied = ref(false)
const previewFrame = ref<HTMLIFrameElement>()

// Device preview options
const devices = [
  { type: 'desktop', icon: '💻' },
  { type: 'mobile', icon: '📱' }
]

// Compile newsletter on mount and changes
const compileNewsletter = async () => {
  try {
    // Compile to MJML
    compiledMjml.value = await compileNewsletterToMjml(props.newsletter, props.blockTypes)
    
    // Compile MJML to HTML
    const result = await compileMjmlToHtml(compiledMjml.value)
    compiledHtml.value = result.html
    
    // Emit compiled result
    emit('update:compiled', {
      mjml: compiledMjml.value,
      html: compiledHtml.value
    })
    
    // Log any MJML errors
    if (result.errors && result.errors.length > 0) {
      console.warn('MJML compilation warnings:', result.errors)
    }
  } catch (error) {
    console.error('Error compiling newsletter:', error)
    compiledHtml.value = `
      <div style="padding: 20px; color: #721c24; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px;">
        <h3>Compilation Error</h3>
        <p>${error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    `
  }
}

// Watch for newsletter changes with debounce
let compileTimeout: NodeJS.Timeout
watch(
  () => [props.newsletter, props.blockTypes],
  () => {
    clearTimeout(compileTimeout)
    compileTimeout = setTimeout(() => {
      compileNewsletter()
    }, 500)
  },
  { deep: true }
)

// Initial compilation
onMounted(() => {
  // Load MJML browser version if available
  if (typeof window !== 'undefined' && !window.mjml2html) {
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/mjml-browser@4.14.1/lib/index.js'
    script.onload = () => {
      console.log('MJML browser loaded')
      compileNewsletter()
    }
    document.head.appendChild(script)
  } else {
    compileNewsletter()
  }
})

// Methods
const refreshPreview = () => {
  compileNewsletter()
}

const copyMjml = async () => {
  try {
    await navigator.clipboard.writeText(compiledMjml.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (error) {
    console.error('Error copying MJML:', error)
  }
}

const downloadMjml = () => {
  const blob = new Blob([compiledMjml.value], { type: 'text/xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `newsletter-${Date.now()}.mjml`
  a.click()
  URL.revokeObjectURL(url)
}

const downloadHtml = () => {
  const blob = new Blob([compiledHtml.value], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `newsletter-${Date.now()}.html`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
/* Base styles */
.newsletter-preview {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.preview-header {
  background: white;
  padding: 1rem;
  border-bottom: 1px solid #e5e5e5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-header h3 {
  margin: 0;
  font-size: 1.125rem;
  color: #333;
}

.preview-controls {
  display: flex;
  gap: 0.5rem;
}

.device-btn,
.refresh-btn,
.source-btn {
  padding: 0.5rem;
  border: 1px solid #e5e5e5;
  background: white;
  cursor: pointer;
  border-radius: 4px;
  font-size: 1.25rem;
  transition: all 0.2s;
  line-height: 1;
}

.device-btn:hover,
.refresh-btn:hover,
.source-btn:hover {
  background: #f5f5f5;
  border-color: #999;
}

.device-btn.active {
  background: #007bff;
  border-color: #007bff;
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.source-btn {
  font-size: 0.875rem;
  font-family: 'Courier New', monospace;
  padding: 0.5rem 0.75rem;
}

.preview-container {
  flex: 1;
  overflow: auto;
  padding: 2rem;
  position: relative;
}

.loading-state,
.error-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 1rem;
  border: 3px solid #f3f4f6;
  border-top-color: #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-state pre {
  margin: 1rem 0;
  padding: 1rem;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 4px;
  text-align: left;
  font-size: 0.875rem;
  max-width: 500px;
  overflow-x: auto;
}

.retry-btn {
  padding: 0.5rem 1rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.retry-btn:hover {
  background: #0056b3;
}

.device-frame {
  height: 100%;
  background: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
  margin: 0 auto;
}

.device-frame.device-desktop {
  width: 100%;
  max-width: 700px;
}

.device-frame.device-mobile {
  width: 375px;
  max-width: 100%;
}

.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
  background: #f5f5f5;
}

/* MJML Source Modal */
.mjml-source-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e5e5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h4 {
  margin: 0;
  font-size: 1.25rem;
  color: #333;
}

.close-btn {
  padding: 0.5rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  line-height: 1;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  flex: 1;
  overflow: auto;
  padding: 1.5rem;
  background: #f5f5f5;
}

.modal-body pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-size: 0.875rem;
  line-height: 1.5;
  font-family: 'Courier New', monospace;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e5e5;
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.copy-btn,
.download-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
  font-weight: 500;
}

.copy-btn {
  background: #007bff;
  color: white;
}

.copy-btn:hover {
  background: #0056b3;
}

.download-btn {
  background: #6c757d;
  color: white;
}

.download-btn:hover {
  background: #545b62;
}

/* Responsive */
@media (max-width: 768px) {
  .preview-container {
    padding: 1rem;
  }
  
  .device-frame.device-mobile {
    width: 100%;
  }
}
</style>