<template>
  <div class="max-w-4xl mx-auto p-6 font-sans antialiased">
    <!-- Success State -->
    <div v-if="overallValidation.isValid && !overallValidation.hasWarnings" class="bg-green-50 border border-green-300 rounded-xl p-8 shadow-md text-center">
      <Icon name="lucide:check-circle" class="w-12 h-12 text-green-600 mx-auto mb-4" />
      <h3 class="text-2xl font-bold text-green-800 mb-2">Newsletter Module Ready!</h3>
      <p class="text-green-700 text-lg mb-6">Your newsletter module is fully configured and ready to use.</p>
      <button @click="runConnectionTest" :disabled="isChecking" class="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors">
        <Icon name="lucide:refresh-cw" class="w-5 h-5 mr-2" :class="{ 'animate-spin': isChecking }" />
        {{ isChecking ? 'Testing...' : 'Test Connection' }}
      </button>
    </div>

    <!-- Setup Required State -->
    <div v-else class="bg-white border border-gray-200 rounded-xl p-8 shadow-md">
      <div class="flex items-center space-x-3 mb-4">
        <Icon name="lucide:settings" class="w-8 h-8 text-blue-600" />
        <h3 class="text-2xl font-bold text-gray-900">Newsletter Module Setup</h3>
      </div>

      <p class="text-gray-600 mb-8 leading-relaxed">
        Let's get your newsletter module configured! Follow these steps to enable all features.
      </p>

      <!-- Validation Results -->
      <div class="space-y-4 mb-8">
        <!-- Directus -->
        <div class="flex items-start p-4 rounded-lg" :class="{
          'bg-red-50 border border-red-300': directusValidation.severity === 'error',
          'bg-yellow-50 border border-yellow-300': directusValidation.severity === 'warning',
          'bg-blue-50 border border-blue-300': directusValidation.severity === 'info',
        }">
          <div class="flex-shrink-0 mr-3 mt-0.5">
            <Icon v-if="directusValidation.isValid" name="lucide:check-circle" class="w-6 h-6 text-green-500" />
            <Icon v-else-if="directusValidation.severity === 'warning'" name="lucide:alert-triangle" class="w-6 h-6 text-yellow-500" />
            <Icon v-else name="lucide:x-circle" class="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h4 class="text-lg font-semibold text-gray-900 mb-1">Directus Configuration</h4>
            <p class="text-gray-700 text-sm">{{ directusValidation.message }}</p>
            <p v-if="directusValidation.solution" class="text-gray-600 text-xs italic mt-1">
              {{ directusValidation.solution }}
            </p>
          </div>
        </div>

        <!-- SendGrid -->
        <div class="flex items-start p-4 rounded-lg" :class="{
          'bg-red-50 border border-red-300': sendgridValidation.severity === 'error',
          'bg-yellow-50 border border-yellow-300': sendgridValidation.severity === 'warning',
          'bg-blue-50 border border-blue-300': sendgridValidation.severity === 'info',
        }">
          <div class="flex-shrink-0 mr-3 mt-0.5">
            <Icon v-if="sendgridValidation.isValid && sendgridValidation.severity !== 'warning'" name="lucide:check-circle" class="w-6 h-6 text-green-500" />
            <Icon v-else-if="sendgridValidation.severity === 'warning'" name="lucide:alert-triangle" class="w-6 h-6 text-yellow-500" />
            <Icon v-else name="lucide:x-circle" class="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h4 class="text-lg font-semibold text-gray-900 mb-1">SendGrid Configuration</h4>
            <p class="text-gray-700 text-sm">{{ sendgridValidation.message }}</p>
            <p v-if="sendgridValidation.solution" class="text-gray-600 text-xs italic mt-1">
              {{ sendgridValidation.solution }}
            </p>
          </div>
        </div>

        <!-- MJML -->
        <div class="flex items-start p-4 rounded-lg" :class="{
          'bg-red-50 border border-red-300': mjmlValidation.severity === 'error',
          'bg-yellow-50 border border-yellow-300': mjmlValidation.severity === 'warning',
          'bg-blue-50 border border-blue-300': mjmlValidation.severity === 'info',
        }">
          <div class="flex-shrink-0 mr-3 mt-0.5">
            <Icon v-if="mjmlValidation.severity === 'info'" name="lucide:check-circle" class="w-6 h-6 text-green-500" />
            <Icon v-else name="lucide:alert-triangle" class="w-6 h-6 text-yellow-500" />
          </div>
          <div>
            <h4 class="text-lg font-semibold text-gray-900 mb-1">MJML Configuration</h4>
            <p class="text-gray-700 text-sm">{{ mjmlValidation.message }}</p>
            <p v-if="mjmlValidation.solution" class="text-gray-600 text-xs italic mt-1">
              {{ mjmlValidation.solution }}
            </p>
          </div>
        </div>
      </div>

      <!-- Setup Steps -->
      <div v-if="setupSteps.length > 0" class="mb-8">
        <h4 class="text-xl font-semibold text-gray-900 mb-4">Setup Steps</h4>
        <div class="space-y-4">
          <div v-for="(step, index) in setupSteps" :key="index" class="flex items-start p-4 rounded-lg border" :class="{
            'bg-red-50 border-red-300': step.priority === 'high',
            'bg-yellow-50 border-yellow-300': step.priority === 'medium',
            'bg-blue-50 border-blue-300': step.priority === 'low',
          }">
            <div class="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm mr-4">
              {{ index + 1 }}
            </div>
            <div>
              <h5 class="text-lg font-semibold text-gray-900 mb-1">{{ step.title }}</h5>
              <p class="text-gray-700 text-sm mb-2">{{ step.description }}</p>
              <code class="block bg-gray-900 text-white p-3 rounded-md text-xs overflow-x-auto font-mono">{{ step.action }}</code>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Fixes -->
      <div v-if="quickFixes.length > 0" class="mb-8">
        <h4 class="text-xl font-semibold text-gray-900 mb-4">Quick Fixes</h4>
        <div class="space-y-4">
          <div v-for="(fix, index) in quickFixes" :key="index" class="p-4 rounded-lg bg-gray-50 border border-gray-200">
            <h5 class="text-lg font-semibold text-gray-900 mb-1">{{ fix.issue }}</h5>
            <p class="text-gray-700 text-sm mb-2">{{ fix.description }}</p>
            <div class="flex items-center space-x-2">
              <code class="flex-1 bg-gray-900 text-white p-3 rounded-md text-xs overflow-x-auto font-mono">{{ fix.command }}</code>
              <button @click="copyToClipboard(fix.command)" class="p-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors">
                <Icon name="lucide:copy" class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
        <button @click="runConnectionTest" :disabled="isChecking" class="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
          <Icon name="lucide:refresh-cw" class="w-5 h-5 mr-2" :class="{ 'animate-spin': isChecking }" />
          {{ isChecking ? 'Testing...' : 'Test Connection' }}
        </button>

        <button @click="openDocs" class="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
          <Icon name="lucide:book-open" class="w-5 h-5 mr-2" />
          Documentation
        </button>

        <button @click="runSetupWizard" class="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
          <Icon name="lucide:wand-2" class="w-5 h-5 mr-2" />
          Setup Wizard
        </button>
      </div>

      <!-- Connection Test Results -->
      <div v-if="connectionTestResult" class="mt-8 p-6 bg-gray-50 border border-gray-200 rounded-xl shadow-inner">
        <div class="flex items-center space-x-2 mb-4">
          <Icon :name="connectionTestResult.overall.success ? 'lucide:check-circle' : 'lucide:x-circle'"
                class="w-6 h-6"
                :class="connectionTestResult.overall.success ? 'text-green-600' : 'text-red-600'" />
          <h4 class="text-xl font-semibold text-gray-900">Connection Test Results</h4>
        </div>

        <div class="space-y-3 mb-6">
          <div class="p-3 rounded-md" :class="{
            'bg-green-100 text-green-800': connectionTestResult.directus.status === 'success',
            'bg-red-100 text-red-800': connectionTestResult.directus.status === 'error',
            'bg-yellow-100 text-yellow-800': connectionTestResult.directus.status === 'warning',
          }">
            <strong class="font-medium">Directus:</strong> {{ connectionTestResult.directus.message }}
            <pre v-if="connectionTestResult.directus.details" class="mt-2 p-2 bg-gray-800 text-gray-100 rounded-md text-xs overflow-x-auto font-mono">{{ typeof connectionTestResult.directus.details === 'string' ? connectionTestResult.directus.details : JSON.stringify(connectionTestResult.directus.details, null, 2) }}</pre>
          </div>

          <div class="p-3 rounded-md" :class="{
            'bg-green-100 text-green-800': connectionTestResult.sendgrid.status === 'success',
            'bg-red-100 text-red-800': connectionTestResult.sendgrid.status === 'error',
            'bg-yellow-100 text-yellow-800': connectionTestResult.sendgrid.status === 'warning',
          }">
            <strong class="font-medium">SendGrid:</strong> {{ connectionTestResult.sendgrid.message }}
            <pre v-if="connectionTestResult.sendgrid.details" class="mt-2 p-2 bg-gray-800 text-gray-100 rounded-md text-xs overflow-x-auto font-mono">{{ typeof connectionTestResult.sendgrid.details === 'string' ? connectionTestResult.sendgrid.details : JSON.stringify(connectionTestResult.sendgrid.details, null, 2) }}</pre>
          </div>
        </div>

        <div v-if="connectionTestResult.recommendations?.length > 0" class="recommendations">
          <h5 class="text-lg font-semibold text-gray-900 mb-3">Recommendations:</h5>
          <div v-for="(rec, index) in connectionTestResult.recommendations" :key="index" class="mb-4">
            <h6 class="text-base font-semibold text-gray-800 mb-1">{{ rec.title }}</h6>
            <ul class="list-disc list-inside text-gray-700 text-sm space-y-1">
              <li v-for="step in rec.steps" :key="step">{{ step }}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <Transition
      enter-active-class="transform ease-out duration-300 transition"
      enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
      enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
      leave-active-class="transition ease-in duration-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="toast.show"
        class="fixed top-4 right-4 max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden z-50"
        :class="{
          'bg-green-50 border border-green-200 text-green-800': toast.type === 'success',
          'bg-red-50 border border-red-200 text-red-800': toast.type === 'error',
          'bg-blue-50 border border-blue-200 text-blue-800': toast.type === 'info'
        }"
      >
        <div class="p-4">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <Icon
                :name="toast.type === 'success' ? 'lucide:check-circle' : (toast.type === 'error' ? 'lucide:alert-circle' : 'lucide:info')"
                :class="{
                  'text-green-400': toast.type === 'success',
                  'text-red-400': toast.type === 'error',
                  'text-blue-400': toast.type === 'info'
                }"
                class="w-6 h-6"
              />
            </div>
            <div class="ml-3 w-0 flex-1 pt-0.5">
              <p class="text-sm font-medium">{{ toast.message }}</p>
            </div>
            <div class="ml-4 flex-shrink-0 flex">
              <button
                @click="toast.show = false"
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
import { computed, ref } from 'vue'
import { useNewsletterSetup } from '../composables/useNewsletterSetup'

const {
  directusValidation,
  sendgridValidation,
  mjmlValidation,
  overallValidation,
  getSetupSteps,
  getQuickFixes,
  testConnection, // This is the server-side test connection
  isChecking
} = useNewsletterSetup()

// Local state
const connectionTestResult = ref(null)
const toast = ref({
  show: false,
  message: '',
  type: 'success' as 'success' | 'error' | 'info'
})

// Computed
const setupSteps = computed(() => getSetupSteps())
const quickFixes = computed(() => getQuickFixes())

// Methods
const runConnectionTest = async () => {
  try {
    const result = await testConnection()
    connectionTestResult.value = result

    if (result?.overall.success) {
      showToast('Connection test successful!', 'success')
    } else {
      showToast('Connection test found issues', 'error')
    }
  } catch (error) {
    showToast('Connection test failed', 'error')
    console.error('Connection test error:', error)
  }
}

const copyToClipboard = async (text: string) => {
  try {
    // Use document.execCommand('copy') for better iframe compatibility
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);

    showToast('Copied to clipboard!', 'success')
  } catch (error) {
    showToast('Failed to copy', 'error')
  }
}

const openDocs = () => {
  window.open('https://github.com/hue-studios/nuxt-newsletter#setup', '_blank')
}

const runSetupWizard = () => {
  showToast('Run: npm run newsletter:setup-wizard in your terminal', 'info')
}

const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
  toast.value = { show: true, message, type }
  setTimeout(() => {
    toast.value.show = false
  }, 3000)
}

</script>

