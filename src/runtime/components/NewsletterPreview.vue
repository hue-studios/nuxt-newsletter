<template>
  <div class="flex flex-col h-full bg-white">
    <!-- Enhanced Preview Header -->
    <div class="flex-shrink-0 bg-gradient-to-r from-slate-50 to-blue-50/30 border-b border-slate-200/60 p-4">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
            <Icon name="lucide:eye" class="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-slate-900">Live Preview</h3>
            <p class="text-sm text-slate-600">See how your newsletter looks</p>
          </div>
        </div>

        <!-- Preview Actions -->
        <div class="flex items-center space-x-2">
          <!-- Refresh Button -->
          <button
            @click="refreshPreview"
            :disabled="isCompiling"
            class="flex items-center justify-center w-9 h-9 rounded-lg border border-slate-300 bg-white text-slate-500 hover:text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow"
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
              class="flex items-center justify-center w-9 h-9 rounded-lg border border-slate-300 bg-white text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow"
              title="More actions"
            >
              <Icon name="lucide:more-horizontal" class="w-4 h-4" />
            </button>

            <!-- Enhanced Dropdown Menu -->
            <Transition
              enter-active-class="transition ease-out duration-100"
              enter-from-class="transform opacity-0 scale-95 translate-y-1"
              enter-to-class="transform opacity-100 scale-100 translate-y-0"
              leave-active-class="transition ease-in duration-75"
              leave-from-class="transform opacity-100 scale-100 translate-y-0"
              leave-to-class="transform opacity-0 scale-95 translate-y-1"
            >
              <div
                v-if="showActionsMenu"
                class="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl ring-1 ring-black/5 z-20 overflow-hidden"
              >
                <div class="py-2">
                  <button
                    @click="showMjmlSource = true; showActionsMenu = false"
                    class="flex items-center w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Icon name="lucide:code" class="w-4 h-4 mr-3 text-slate-500" />
                    View MJML Source
                  </button>
                  <button
                    @click="copyMjml; showActionsMenu = false"
                    class="flex items-center w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Icon name="lucide:copy" class="w-4 h-4 mr-3 text-slate-500" />
                    Copy MJML
                  </button>
                  <div class="border-t border-slate-100 my-1"></div>
                  <button
                    @click="downloadMjml; showActionsMenu = false"
                    class="flex items-center w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Icon name="lucide:download" class="w-4 h-4 mr-3 text-slate-500" />
                    Download MJML
                  </button>
                  <button
                    @click="downloadHtml; showActionsMenu = false"
                    class="flex items-center w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Icon name="lucide:file-text" class="w-4 h-4 mr-3 text-slate-500" />
                    Download HTML
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </div>

      <!-- Enhanced Device Toggle -->
      <div class="flex items-center justify-center">
        <div class="inline-flex items-center bg-white rounded-xl p-1 shadow-sm border border-slate-200">
          <button
            v-for="device in devices"
            :key="device.type"
            @click="currentDevice = device.type"
            class="flex items-center justify-center px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium"
            :class="currentDevice === device.type
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'"
            :title="device.label"
          >
            <Icon :name="device.icon" class="w-4 h-4 mr-2" />
            {{ device.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- Enhanced Preview Content Area -->
    <div class="flex-1 overflow-hidden bg-gradient-to-br from-slate-100 to-blue-100/30 p-6">
      <!-- Loading State -->
      <div v-if="isCompiling" class="flex flex-col items-center justify-center h-full">
        <div class="text-center">
          <div class="w-12 h-12 mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto">
            <Icon name="lucide:loader-2" class="w-6 h-6 text-white animate-spin" />
          </div>
          <h4 class="text-lg font-medium text-slate-900 mb-2">Compiling Newsletter</h4>
          <p class="text-slate-600">Generating your beautiful email...</p>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="compilationError" class="flex flex-col items-center justify-center h-full">
        <div class="text-center max-w-md">
          <div class="w-12 h-12 mb-4 rounded-2xl bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center mx-auto">
            <Icon name="lucide:alert-triangle" class="w-6 h-6 text-red-600" />
          </div>
          <h4 class="text-lg font-medium text-slate-900 mb-2">Compilation Error</h4>
          <p class="text-slate-600 mb-4">{{ compilationError }}</p>
          <button
            @click="refreshPreview"
            class="inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Icon name="lucide:refresh-cw" class="w-4 h-4 mr-2" />
            Try Again
          </button>
        </div>
      </div>

      <!-- Enhanced Device Frame -->
      <div v-else class="h-full flex items-center justify-center">
        <div
          class="bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-500 ease-out border border-slate-300/50"
          :class="deviceFrameClasses"
        >
          <!-- Enhanced Mobile Frame Header -->
          <div v-if="currentDevice === 'mobile'" class="bg-slate-900 h-8 flex items-center justify-center relative">
            <!-- Phone notch -->
            <div class="absolute left-1/2 transform -translate-x-1/2 top-1 w-20 h-1 bg-slate-700 rounded-full"></div>
            <!-- Status indicators -->
            <div class="absolute left-4 flex items-center space-x-1">
              <div class="flex space-x-1">
                <div class="w-1 h-1 bg-slate-500 rounded-full"></div>
                <div class="w-1 h-1 bg-slate-500 rounded-full"></div>
                <div class="w-1 h-1 bg-slate-400 rounded-full"></div>
              </div>
            </div>
            <!-- Time -->
            <div class="text-white text-xs font-medium">
              {{ new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) }}
            </div>
            <!-- Battery -->
            <div class="absolute right-4 flex items-center space-x-1">
              <div class="w-6 h-3 border border-slate-500 rounded-sm relative">
                <div class="absolute right-0 top-1/2 transform -translate-y-1/2 w-0.5 h-1.5 bg-slate-500 rounded-r-sm translate-x-full"></div>
                <div class="w-4 h-1.5 bg-green-500 rounded-sm m-0.5"></div>
              </div>
            </div>
          </div>

          <!-- Enhanced Desktop Frame Header -->
          <div v-if="currentDevice === 'desktop'" class="bg-slate-200 h-8 flex items-center px-4 border-b border-slate-300">
            <div class="flex space-x-2">
              <div class="w-3 h-3 rounded-full bg-red-400"></div>
              <div class="w-3 h-3 rounded-full bg-yellow-400"></div>
              <div class="w-3 h-3 rounded-full bg-green-400"></div>
            </div>
            <div class="flex-1 flex justify-center">
              <div class="bg-white rounded-md px-4 py-1 text-xs text-slate-600 max-w-xs truncate">
                inbox.gmail.com
              </div>
            </div>
          </div>

          <!-- Email Client Header (simulated) -->
          <div class="bg-slate-50 border-b border-slate-200 p-3">
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                {{ (newsletter.from_name || 'Newsletter')[0] }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <p class="text-sm font-medium text-slate-900 truncate">
                    {{ newsletter.from_name || 'Newsletter' }}
                  </p>
                  <span class="text-xs text-slate-500">now</span>
                </div>
                <p class="text-sm text-slate-600 truncate">
                  {{ newsletter.subject_line || 'Newsletter Subject' }}
                </p>
                <p v-if="newsletter.preview_text" class="text-xs text-slate-500 truncate">
                  {{ newsletter.preview_text }}
                </p>
              </div>
            </div>
          </div>

          <!-- Email Preview Content -->
          <div class="flex-1 overflow-hidden">
            <iframe
              ref="previewFrame"
              :srcdoc="iframeContent"
              class="w-full h-full border-0 bg-white"
              :class="iframeClasses"
              sandbox="allow-same-origin allow-scripts"
              @load="handleIframeLoad"
            />
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!isCompiling && !compilationError && !compiledHtml" class="flex flex-col items-center justify-center h-full">
        <div class="text-center max-w-md">
          <div class="w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center mx-auto">
            <Icon name="lucide:mail" class="w-8 h-8 text-slate-500" />
          </div>
          <h4 class="text-xl font-medium text-slate-900 mb-2">Newsletter Preview</h4>
          <p class="text-slate-600 mb-6">
            Add content blocks to see your newsletter come to life
          </p>
          <div class="flex items-center justify-center space-x-2 text-sm text-slate-500">
            <div class="w-2 h-2 rounded-full bg-slate-300 animate-bounce"></div>
            <div class="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style="animation-delay: 0.1s"></div>
            <div class="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style="animation-delay: 0.2s"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Enhanced Copy Success Notification -->
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="transform opacity-0 translate-y-2"
      enter-to-class="transform opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="transform opacity-100 translate-y-0"
      leave-to-class="transform opacity-0 translate-y-2"
    >
      <div
        v-if="showCopySuccess"
        class="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium"
      >
        <div class="flex items-center space-x-2">
          <Icon name="lucide:check" class="w-4 h-4 text-green-400" />
          <span>MJML copied to clipboard!</span>
        </div>
      </div>
    </Transition>

    <!-- Enhanced MJML Source Modal -->
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
        class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        @click.self="showMjmlSource = false"
      >
        <div class="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
          <!-- Enhanced Modal Header -->
          <div class="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50/30">
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                <Icon name="lucide:code" class="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-slate-900">MJML Source Code</h3>
                <p class="text-sm text-slate-600">Raw MJML markup for your newsletter</p>
              </div>
            </div>
            <button
              @click="showMjmlSource = false"
              class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Icon name="lucide:x" class="w-5 h-5" />
            </button>
          </div>

          <!-- Enhanced Modal Body -->
          <div class="flex-1 overflow-auto p-6 bg-slate-50">
            <div class="bg-slate-900 rounded-xl overflow-hidden">
              <div class="flex items-center justify-between p-4 border-b border-slate-700">
                <div class="flex items-center space-x-2">
                  <div class="flex space-x-1">
                    <div class="w-3 h-3 rounded-full bg-red-500"></div>
                    <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div class="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <span class="text-sm text-slate-400 ml-4">newsletter.mjml</span>
                </div>
                <button
                  @click="copyMjml"
                  class="inline-flex items-center px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
                >
                  <Icon name="lucide:copy" class="w-3 h-3 mr-1" />
                  Copy
                </button>
              </div>
              <pre class="p-4 text-sm text-slate-300 overflow-auto"><code>{{ compiledMjml || '<!-- No MJML generated yet -->' }}</code></pre>
            </div>
          </div>

          <!-- Enhanced Modal Footer -->
          <div class="flex items-center justify-end space-x-3 p-6 border-t border-slate-200 bg-slate-50">
            <button
              @click="downloadMjml"
              class="inline-flex items-center px-4 py-2.5 border border-slate-300 shadow-sm text-sm font-medium rounded-xl text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            >
              <Icon name="lucide:download" class="w-4 h-4 mr-2" />
              Download MJML
            </button>
            <button
              @click="downloadHtml"
              class="inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Icon name="lucide:file-text" class="w-4 h-4 mr-2" />
              Download HTML
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import type { NewsletterData } from '../../types';

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

// Enhanced state
const currentDevice = ref<'desktop' | 'mobile'>('desktop')
const compiledMjml = ref('')
const compiledHtml = ref('')
const showMjmlSource = ref(false)
const showActionsMenu = ref(false)
const copied = ref(false)
const showCopySuccess = ref(false)
const previewFrame = ref<HTMLIFrameElement>()

// Enhanced device configurations
const devices = [
  { type: 'desktop', icon: 'lucide:monitor', label: 'Desktop' },
  { type: 'mobile', icon: 'lucide:smartphone', label: 'Mobile' }
] as const

// Enhanced computed styles
const deviceFrameClasses = computed(() => {
  return {
    'w-full max-w-3xl': currentDevice.value === 'desktop',
    'w-80': currentDevice.value === 'mobile'
  }
})

const iframeClasses = computed(() => {
  return {
    'min-h-[600px]': currentDevice.value === 'desktop',
    'h-[640px]': currentDevice.value === 'mobile'
  }
})

// Enhanced iframe content
const iframeContent = computed(() => {
  if (!compiledHtml.value) {
    return `
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              margin: 0;
              padding: 40px 20px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .placeholder {
              text-align: center;
              max-width: 400px;
              padding: 40px;
              background: white;
              border-radius: 16px;
              box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            }
            .icon {
              width: 64px;
              height: 64px;
              background: linear-gradient(135deg, #3b82f6, #1d4ed8);
              border-radius: 16px;
              margin: 0 auto 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 24px;
            }
            h3 { color: #1e293b; margin: 0 0 8px; font-size: 18px; }
            p { color: #64748b; margin: 0; line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="placeholder">
            <div class="icon">✉</div>
            <h3>Newsletter Preview</h3>
            <p>Add content blocks to see your beautiful newsletter here</p>
          </div>
        </body>
      </html>
    `
  }

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
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8fafc;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
          }
          @media (max-width: 600px) {
            .email-container {
              width: 100% !important;
              max-width: 100% !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          ${compiledHtml.value}
        </div>
      </body>
    </html>
  `
})

// Enhanced compilation function
const compileNewsletter = async () => {
  if (!props.newsletter || !props.blockTypes.length) return

  try {
    const mjml = await compileNewsletterToMjml(props.newsletter, props.blockTypes)
    compiledMjml.value = mjml

    const html = await compileMjmlToHtml(mjml)
    compiledHtml.value = html

    emit('update:compiled', { mjml, html })
  } catch (error) {
    console.error('Preview compilation error:', error)
  }
}

// Enhanced refresh function
const refreshPreview = () => {
  compileNewsletter()
}

// Enhanced copy function
const copyMjml = async () => {
  if (!compiledMjml.value) return

  try {
    await navigator.clipboard.writeText(compiledMjml.value)
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

// Enhanced download functions
const downloadMjml = () => {
  if (!compiledMjml.value) return
  
  const blob = new Blob([compiledMjml.value], { type: 'text/xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `newsletter-${Date.now()}.mjml`
  a.click()
  URL.revokeObjectURL(url)
}

const downloadHtml = () => {
  if (!iframeContent.value) return
  
  const blob = new Blob([iframeContent.value], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `newsletter-${Date.now()}.html`
  a.click()
  URL.revokeObjectURL(url)
}

const handleIframeLoad = () => {
  nextTick(() => {
    if (previewFrame.value?.contentWindow) {
      // Optional: Add any post-load processing
    }
  })
}

// Watch for changes and recompile
watch(
  () => [props.newsletter, props.blockTypes],
  () => {
    compileNewsletter()
  },
  { deep: true }
)

// Initial compilation
onMounted(() => {
  compileNewsletter()
})

// Enhanced click outside handler
onMounted(() => {
  const handleClickOutside = (event: Event) => {
    if (!event.target) return

    const target = event.target as HTMLElement
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

<style scoped>
/* Enhanced animations */
@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}

.animate-bounce {
  animation: bounce 1s infinite;
}

/* Scrollbar styling for modal */
pre::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

pre::-webkit-scrollbar-track {
  background: #1e293b;
}

pre::-webkit-scrollbar-thumb {
  background: #475569;
  border-radius: 4px;
}

pre::-webkit-scrollbar-thumb:hover {
  background: #64748b;
}
</style>