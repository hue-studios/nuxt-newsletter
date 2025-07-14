<template>
  <div class="flex flex-col h-full bg-white font-sans antialiased">
    <!-- Preview Header -->
    <div class="flex-shrink-0 border-b border-gray-200 p-4 shadow-sm">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-lg font-semibold text-gray-900">Preview</h3>
        <div class="flex items-center space-x-2">
          <!-- Device Toggle -->
          <div class="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              v-for="device in devices"
              :key="device.type"
              @click="currentDevice = device.type"
              class="flex items-center justify-center w-8 h-8 rounded-md transition-colors"
              :class="currentDevice === device.type
                ? 'bg-white shadow-sm text-gray-900'
                : 'text-gray-500 hover:text-gray-700'"
              :title="device.label"
            >
              <Icon :name="device.icon" class="w-4 h-4" />
            </button>
          </div>

          <!-- Refresh Button -->
          <button
            @click="refreshPreview"
            :disabled="isCompiling"
            class="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-300 bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            title="Refresh preview"
          >
            <Icon
              name="lucide:refresh-cw"
              class="w-4 h-4"
              :class="{ 'animate-spin': isCompiling }"
            />
          </button>

          <!-- Actions Menu -->
          <div class="relative">
            <button
              @click="showActionsMenu = !showActionsMenu"
              class="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-300 bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
              title="More actions"
            >
              <Icon name="lucide:more-horizontal" class="w-4 h-4" />
            </button>

            <!-- Dropdown Menu -->
            <Transition
              enter-active-class="transition ease-out duration-100"
              enter-from-class="transform opacity-0 scale-95"
              enter-to-class="transform opacity-100 scale-100"
              leave-active-class="transition ease-in duration-75"
              leave-from-class="transform opacity-100 scale-100"
              leave-to-class="transform opacity-0 scale-95"
            >
              <div
                v-if="showActionsMenu"
                class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-10 origin-top-right"
                @click="showActionsMenu = false"
              >
                <div class="py-1">
                  <button
                    @click="showMjmlSource = true"
                    class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Icon name="lucide:code" class="w-4 h-4 mr-3" />
                    View MJML Source
                  </button>
                  <button
                    @click="copyMjml"
                    class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Icon name="lucide:copy" class="w-4 h-4 mr-3" />
                    Copy MJML
                  </button>
                  <button
                    @click="downloadHtml"
                    class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Icon name="lucide:download" class="w-4 h-4 mr-3" />
                    Download HTML
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </div>

      <!-- Compilation Status -->
      <div v-if="isCompiling" class="flex items-center space-x-2 text-sm text-blue-600 px-4 pb-2">
        <Icon name="lucide:loader-2" class="w-4 h-4 animate-spin" />
        <span>Compiling newsletter...</span>
      </div>

      <div v-else-if="compilationError" class="flex items-center space-x-2 text-sm text-red-600 px-4 pb-2">
        <Icon name="lucide:alert-circle" class="w-4 h-4" />
        <span>Compilation failed</span>
      </div>

      <div v-else-if="compiledHtml" class="flex items-center space-x-2 text-sm text-green-600 px-4 pb-2">
        <Icon name="lucide:check-circle" class="w-4 h-4" />
        <span>Ready to send</span>
      </div>
    </div>

    <!-- Preview Content -->
    <div class="flex-1 overflow-hidden bg-gray-100 p-4 flex items-center justify-center">
      <!-- Loading State -->
      <div v-if="isCompiling" class="flex flex-col items-center justify-center h-full">
        <div class="text-center">
          <Icon name="lucide:loader-2" class="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
          <p class="text-sm text-gray-600">Compiling newsletter...</p>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="compilationError" class="flex flex-col items-center justify-center h-full">
        <div class="text-center max-w-sm">
          <Icon name="lucide:alert-triangle" class="w-8 h-8 text-red-500 mx-auto mb-2" />
          <h4 class="text-sm font-medium text-gray-900 mb-1">Compilation Error</h4>
          <p class="text-xs text-gray-600 mb-3">{{ compilationError }}</p>
          <button
            @click="refreshPreview"
            class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>

      <!-- Device Frame -->
      <div
        v-else
        class="h-full w-full flex items-center justify-center"
      >
        <div
          class="bg-white rounded-xl shadow-xl overflow-hidden transition-all duration-300 border border-gray-200 flex-shrink-0"
          :class="deviceFrameClasses"
        >
          <!-- Device Frame Header (for mobile view) -->
          <div v-if="currentDevice === 'mobile'" class="bg-gray-900 h-6 rounded-t-xl flex items-center justify-center">
            <div class="flex space-x-1">
              <div class="w-1 h-1 bg-gray-600 rounded-full"></div>
              <div class="w-1 h-1 bg-gray-600 rounded-full"></div>
              <div class="w-1 h-1 bg-gray-600 rounded-full"></div>
            </div>
          </div>

          <!-- Email Preview -->
          <iframe
            ref="previewFrame"
            :srcdoc="iframeContent"
            class="w-full h-full border-0 bg-white"
            :class="iframeClasses"
            sandbox="allow-same-origin allow-scripts"
            @load="handleIframeLoad"
          />
          <!-- Alternative approach if sandboxing still causes issues -->
          <!-- You can also use this alternative without srcdoc -->
          <!--
          <iframe
            ref="previewFrame"
            :src="iframeSrc"
            class="w-full h-full border-0 bg-white"
            :class="iframeClasses"
            @load="handleIframeLoad"
          /> -->
        </div>
      </div>
    </div>

    <!-- MJML Source Modal -->
    <Transition
      enter-active-class="transition ease-out duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showMjmlSource"
        class="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50"
        @click.self="showMjmlSource = false"
      >
        <div class="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
          <!-- Modal Header -->
          <div class="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">MJML Source</h3>
            <button
              @click="showMjmlSource = false"
              class="text-gray-400 hover:text-gray-500 p-1 rounded-md hover:bg-gray-100 transition-colors"
            >
              <Icon name="lucide:x" class="w-6 h-6" />
            </button>
          </div>

          <!-- Modal Body -->
          <div class="flex-1 overflow-auto p-6 bg-gray-50">
            <pre class="text-sm text-gray-800 whitespace-pre-wrap font-mono leading-relaxed bg-gray-100 p-4 rounded-md">{{ compiledMjml }}</pre>
          </div>

          <!-- Modal Footer -->
          <div class="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              @click="copyMjml"
              class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <Icon name="lucide:copy" class="w-4 h-4 mr-2" />
              {{ copied ? 'Copied!' : 'Copy MJML' }}
            </button>
            <button
              @click="downloadMjml"
              class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <Icon name="lucide:download" class="w-4 h-4 mr-2" />
              Download MJML
            </button>
            <button
              @click="downloadHtml"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <Icon name="lucide:download" class="w-4 h-4 mr-2" />
              Download HTML
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Copy Success Toast -->
    <Transition
      enter-active-class="transform ease-out duration-300 transition"
      enter-from-class="translate-y-2 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition ease-in duration-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showCopySuccess"
        class="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 z-50"
      >
        <Icon name="lucide:check" class="w-4 h-4" />
        <span class="text-sm font-medium">Copied to clipboard!</span>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
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

// Core functionality
const { compileNewsletterToMjml, compileMjmlToHtml, isCompiling, compilationError } = useMjmlCompiler()

// State
const currentDevice = ref<'desktop' | 'mobile'>('desktop')
const compiledMjml = ref('')
const compiledHtml = ref('')
const showMjmlSource = ref(false)
const showActionsMenu = ref(false)
const copied = ref(false)
const showCopySuccess = ref(false)
const previewFrame = ref<HTMLIFrameElement>()

// Device configurations
const devices = [
  { type: 'desktop', icon: 'lucide:monitor', label: 'Desktop' },
  { type: 'mobile', icon: 'lucide:smartphone', label: 'Mobile' }
] as const

// Computed styles
const deviceFrameClasses = computed(() => {
  return {
    'w-full max-w-2xl h-full': currentDevice.value === 'desktop',
    'w-80 h-[600px]': currentDevice.value === 'mobile'
  }
})

const iframeClasses = computed(() => {
  return {
    'min-h-[500px]': currentDevice.value === 'desktop',
    'h-[570px]': currentDevice.value === 'mobile'
  }
})

// Create iframe content with proper email structure
const iframeContent = computed(() => {
  if (!compiledHtml.value) {
    return `
      <html>
        <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background: #f5f5f5;">
          <div style="text-align: center; color: #666;">
            <h3>Newsletter Preview</h3>
            <p>Add content blocks to see your newsletter here</p>
          </div>
        </body>
      </html>
    `
  }

  // Wrap the compiled HTML in a proper email structure
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Newsletter Preview</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
          }
          table {
            border-collapse: collapse;
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
          }
          img {
            border: 0;
            height: auto;
            line-height: 100%;
            outline: none;
            text-decoration: none;
            -ms-interpolation-mode: bicubic;
          }
        </style>
      </head>
      <body>
        ${compiledHtml.value}
      </body>
    </html>
  `
})

// Newsletter compilation
const compileNewsletter = async () => {
  try {
    compiledMjml.value = await compileNewsletterToMjml(props.newsletter, props.blockTypes)

    const result = await compileMjmlToHtml(compiledMjml.value)
    compiledHtml.value = result.html

    emit('update:compiled', {
      mjml: compiledMjml.value,
      html: compiledHtml.value
    })

    if (result.errors && result.errors.length > 0) {
      console.warn('MJML compilation warnings:', result.errors)
    }
  } catch (error) {
    console.error('Error compiling newsletter:', error)
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

// Actions
const refreshPreview = () => {
  compileNewsletter()
}

const copyMjml = async () => {
  try {
    // Use document.execCommand('copy') for better iframe compatibility
    const textarea = document.createElement('textarea');
    textarea.value = compiledMjml.value;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);

    copied.value = true
    showCopySuccess.value = true

    setTimeout(() => {
      copied.value = false
      showCopySuccess.value = false
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
  const blob = new Blob([iframeContent.value], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `newsletter-${Date.now()}.html`
  a.click()
  URL.revokeObjectURL(url)
}

const handleIframeLoad = () => {
  // Iframe loaded successfully
  nextTick(() => {
    if (previewFrame.value?.contentWindow) {
      // Optional: Add any post-load processing
    }
  })
}

// Initial compilation
onMounted(() => {
  // Load MJML browser version if available and in client mode
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

// Close menus when clicking outside
onMounted(() => {
  const handleClickOutside = (event: Event) => {
    if (!event.target) return

    const target = event.target as HTMLElement
    // Check if the click is outside the actions menu button and the menu itself
    if (showActionsMenu.value && !target.closest('.relative')) {
      showActionsMenu.value = false
    }
  }

  document.addEventListener('click', handleClickOutside)

  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
  })
})
</script>

