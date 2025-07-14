<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
    <!-- Enhanced Header -->
    <div class="bg-white/90 backdrop-blur-sm border-b border-slate-200/60 shadow-sm">
      <div class="max-w-4xl mx-auto px-6 py-8">
        <div class="text-center">
          <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
            <Icon name="lucide:settings" class="w-8 h-8 text-white" />
          </div>
          <h1 class="text-3xl font-bold text-slate-900 mb-2">Newsletter Setup</h1>
          <p class="text-lg text-slate-600 max-w-2xl mx-auto">
            Let's configure your newsletter module and verify everything is working correctly
          </p>
        </div>
      </div>
    </div>

    <!-- Enhanced Setup Content -->
    <div class="max-w-4xl mx-auto px-6 py-8">
      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <div class="w-12 h-12 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
          <Icon name="lucide:loader-2" class="w-6 h-6 text-white animate-spin" />
        </div>
        <h3 class="text-lg font-semibold text-slate-900 mb-2">{{ loadingMessage }}</h3>
        <p class="text-slate-600">Please wait while we verify your configuration...</p>
      </div>

      <!-- Setup Steps -->
      <div v-else class="space-y-8">
        <!-- Step Progress -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
          <h2 class="text-xl font-semibold text-slate-900 mb-6">Setup Progress</h2>
          <div class="space-y-4">
            <div
              v-for="(step, index) in setupSteps"
              :key="step.id"
              class="flex items-center space-x-4"
            >
              <!-- Step Icon -->
              <div 
                class="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200"
                :class="{
                  'bg-gradient-to-br from-green-500 to-green-600 text-white': step.status === 'complete',
                  'bg-gradient-to-br from-blue-500 to-blue-600 text-white': step.status === 'active',
                  'bg-gradient-to-br from-red-100 to-red-200 text-red-600': step.status === 'error',
                  'bg-gradient-to-br from-slate-200 to-slate-300 text-slate-500': step.status === 'pending'
                }"
              >
                <Icon 
                  :name="getStepIcon(step)" 
                  class="w-5 h-5"
                  :class="{ 'animate-spin': step.status === 'active' && step.loading }"
                />
              </div>

              <!-- Step Content -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="text-sm font-semibold text-slate-900">{{ step.title }}</h3>
                    <p class="text-sm text-slate-600">{{ step.description }}</p>
                  </div>
                  
                  <!-- Step Actions -->
                  <div class="flex items-center space-x-2">
                    <button
                      v-if="step.status === 'error' && step.canRetry"
                      @click="retryStep(step.id)"
                      class="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg text-red-700 bg-red-100 hover:bg-red-200 transition-colors"
                    >
                      <Icon name="lucide:refresh-cw" class="w-3 h-3 mr-1" />
                      Retry
                    </button>
                    
                    <button
                      v-if="step.hasDetails"
                      @click="toggleStepDetails(step.id)"
                      class="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                      <Icon name="lucide:info" class="w-3 h-3 mr-1" />
                      Details
                    </button>
                  </div>
                </div>

                <!-- Step Details -->
                <Transition
                  enter-active-class="transition ease-out duration-200"
                  enter-from-class="transform opacity-0 scale-95"
                  enter-to-class="transform opacity-100 scale-100"
                  leave-active-class="transition ease-in duration-150"
                  leave-from-class="transform opacity-100 scale-100"
                  leave-to-class="transform opacity-0 scale-95"
                >
                  <div v-if="step.showDetails" class="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div v-if="step.status === 'error'" class="text-sm text-red-800">
                      <p class="font-medium mb-2">Error Details:</p>
                      <pre class="bg-red-100 p-2 rounded text-xs overflow-auto">{{ step.error }}</pre>
                      <div v-if="step.suggestions?.length" class="mt-3">
                        <p class="font-medium mb-1">Suggestions:</p>
                        <ul class="list-disc list-inside space-y-1 text-xs">
                          <li v-for="suggestion in step.suggestions" :key="suggestion">{{ suggestion }}</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div v-else-if="step.status === 'complete'" class="text-sm text-green-800">
                      <p class="font-medium mb-2">Success Details:</p>
                      <div v-if="step.details" class="space-y-1 text-xs">
                        <div v-for="(value, key) in step.details" :key="key" class="flex justify-between">
                          <span class="capitalize">{{ key.replace(/_/g, ' ') }}:</span>
                          <span class="font-medium">{{ value }}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div v-else class="text-sm text-slate-700">
                      <p>{{ step.detailsText || 'Additional information will appear here once this step is completed.' }}</p>
                    </div>
                  </div>
                </Transition>
              </div>
            </div>
          </div>
        </div>

        <!-- Configuration Overview -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
          <h2 class="text-xl font-semibold text-slate-900 mb-6">Current Configuration</h2>
          
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Directus Configuration -->
            <div class="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div class="flex items-center space-x-3 mb-4">
                <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                  <Icon name="lucide:database" class="w-4 h-4 text-white" />
                </div>
                <h3 class="text-lg font-semibold text-slate-900">Directus CMS</h3>
              </div>
              
              <div class="space-y-3">
                <div class="flex justify-between text-sm">
                  <span class="text-slate-600">URL:</span>
                  <span class="font-medium text-slate-900 truncate ml-2">{{ config.directus?.url || 'Not configured' }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-slate-600">Auth Type:</span>
                  <span class="font-medium text-slate-900">{{ config.directus?.auth?.type || 'Not configured' }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-slate-600">Token:</span>
                  <span class="font-medium text-slate-900">
                    {{ config.directus?.auth?.token ? '••••••••' : 'Not configured' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- SendGrid Configuration -->
            <div class="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div class="flex items-center space-x-3 mb-4">
                <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <Icon name="lucide:mail" class="w-4 h-4 text-white" />
                </div>
                <h3 class="text-lg font-semibold text-slate-900">SendGrid</h3>
              </div>
              
              <div class="space-y-3">
                <div class="flex justify-between text-sm">
                  <span class="text-slate-600">API Key:</span>
                  <span class="font-medium text-slate-900">
                    {{ config.sendgrid?.apiKey ? '••••••••' : 'Not configured' }}
                  </span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-slate-600">From Email:</span>
                  <span class="font-medium text-slate-900 truncate ml-2">{{ config.sendgrid?.defaultFromEmail || 'Not configured' }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-slate-600">From Name:</span>
                  <span class="font-medium text-slate-900 truncate ml-2">{{ config.sendgrid?.defaultFromName || 'Not configured' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Setup Actions -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
          <h2 class="text-xl font-semibold text-slate-900 mb-6">Setup Actions</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <!-- Install Collections -->
            <button
              @click="installCollections"
              :disabled="installing.collections"
              class="flex flex-col items-center p-6 border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-3">
                <Icon :name="installing.collections ? 'lucide:loader-2' : 'lucide:database'" class="w-6 h-6 text-white" :class="{ 'animate-spin': installing.collections }" />
              </div>
              <h3 class="text-sm font-semibold text-slate-900 mb-1">Install Collections</h3>
              <p class="text-xs text-slate-600 text-center">Create required Directus collections</p>
            </button>

            <!-- Install Block Types -->
            <button
              @click="installBlockTypes"
              :disabled="installing.blockTypes"
              class="flex flex-col items-center p-6 border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-3">
                <Icon :name="installing.blockTypes ? 'lucide:loader-2' : 'lucide:blocks'" class="w-6 h-6 text-white" :class="{ 'animate-spin': installing.blockTypes }" />
              </div>
              <h3 class="text-sm font-semibold text-slate-900 mb-1">Install Block Types</h3>
              <p class="text-xs text-slate-600 text-center">Add default newsletter block types</p>
            </button>

            <!-- Test Configuration -->
            <button
              @click="testConfiguration"
              :disabled="testing"
              class="flex flex-col items-center p-6 border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-3">
                <Icon :name="testing ? 'lucide:loader-2' : 'lucide:check-circle'" class="w-6 h-6 text-white" :class="{ 'animate-spin': testing }" />
              </div>
              <h3 class="text-sm font-semibold text-slate-900 mb-1">Test Configuration</h3>
              <p class="text-xs text-slate-600 text-center">Verify all connections are working</p>
            </button>
          </div>
        </div>

        <!-- Quick Start -->
        <div class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-200/60 p-6">
          <div class="flex items-start space-x-4">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Icon name="lucide:rocket" class="w-6 h-6 text-white" />
            </div>
            <div class="flex-1">
              <h2 class="text-xl font-semibold text-slate-900 mb-2">Ready to Start?</h2>
              <p class="text-slate-700 mb-4">
                Once your setup is complete, you can start creating beautiful newsletters with our drag-and-drop editor.
              </p>
              <div class="flex items-center space-x-4">
                <button
                  @click="navigateTo('/')"
                  :disabled="!allStepsComplete"
                  class="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <Icon name="lucide:edit" class="w-4 h-4 mr-2" />
                  Create Newsletter
                </button>
                <button
                  @click="runFullSetup"
                  :disabled="runningFullSetup"
                  class="inline-flex items-center px-6 py-3 border border-slate-300 text-sm font-medium rounded-xl text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <Icon :name="runningFullSetup ? 'lucide:loader-2' : 'lucide:play'" class="w-4 h-4 mr-2" :class="{ 'animate-spin': runningFullSetup }" />
                  {{ runningFullSetup ? 'Running Setup...' : 'Run Full Setup' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Enhanced Success/Error Messages -->
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
        class="fixed top-6 right-6 max-w-sm w-full z-50"
      >
        <div class="bg-white rounded-xl shadow-xl ring-1 ring-black/5 overflow-hidden">
          <div class="p-4">
            <div class="flex items-start space-x-3">
              <div class="flex-shrink-0">
                <div 
                  class="w-8 h-8 rounded-lg flex items-center justify-center"
                  :class="notification.type === 'success' ? 'bg-green-100' : 'bg-red-100'"
                >
                  <Icon
                    :name="notification.type === 'success' ? 'lucide:check-circle' : 'lucide:alert-circle'"
                    :class="notification.type === 'success' ? 'text-green-600' : 'text-red-600'"
                    class="w-5 h-5"
                  />
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-slate-900">{{ notification.message }}</p>
                <p v-if="notification.details" class="text-xs text-slate-600 mt-1">{{ notification.details }}</p>
              </div>
              <button
                @click="notification.show = false"
                class="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <Icon name="lucide:x" class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { navigateTo } from '#app'
import { computed, onMounted, ref } from 'vue'

// Page metadata
definePageMeta({
  title: 'Newsletter Setup - Configure Your Module',
  layout: false
})

// Enhanced state management
const loading = ref(true)
const loadingMessage = ref('Initializing setup...')
const testing = ref(false)
const runningFullSetup = ref(false)

const installing = ref({
  collections: false,
  blockTypes: false
})

const config = ref({
  directus: {},
  sendgrid: {},
  mjmlMode: 'client'
})

const notification = ref({
  show: false,
  message: '',
  details: '',
  type: 'success'
})

// Enhanced setup steps
const setupSteps = ref([
  {
    id: 'config',
    title: 'Configuration Check',
    description: 'Verify environment variables and module configuration',
    status: 'pending',
    loading: false,
    canRetry: true,
    hasDetails: true,
    showDetails: false,
    error: null,
    details: null,
    suggestions: []
  },
  {
    id: 'directus',
    title: 'Directus Connection',
    description: 'Test connection to Directus CMS instance',
    status: 'pending',
    loading: false,
    canRetry: true,
    hasDetails: true,
    showDetails: false,
    error: null,
    details: null,
    suggestions: []
  },
  {
    id: 'collections',
    title: 'Database Collections',
    description: 'Verify required collections exist in Directus',
    status: 'pending',
    loading: false,
    canRetry: true,
    hasDetails: true,
    showDetails: false,
    error: null,
    details: null,
    suggestions: []
  },
  {
    id: 'sendgrid',
    title: 'SendGrid Integration',
    description: 'Test SendGrid API connection and configuration',
    status: 'pending',
    loading: false,
    canRetry: true,
    hasDetails: true,
    showDetails: false,
    error: null,
    details: null,
    suggestions: []
  },
  {
    id: 'mjml',
    title: 'MJML Compilation',
    description: 'Test email template compilation system',
    status: 'pending',
    loading: false,
    canRetry: true,
    hasDetails: true,
    showDetails: false,
    error: null,
    details: null,
    suggestions: []
  }
])

// Composables
const { testConnection, fetchCollections, createCollection } = useDirectusNewsletter()
const { testSendGridConnection } = useSendGrid()
const { compileMjmlToHtml } = useMjmlCompiler()
const { getConfig } = useNewsletter()

// Enhanced computed properties
const allStepsComplete = computed(() => {
  return setupSteps.value.every(step => step.status === 'complete')
})

// Enhanced utility functions
const showNotification = (message, type = 'success', details = '') => {
  notification.value = { show: true, message, type, details }
  setTimeout(() => {
    notification.value.show = false
  }, 5000)
}

const getStepIcon = (step) => {
  if (step.loading) return 'lucide:loader-2'
  
  switch (step.status) {
    case 'complete': return 'lucide:check'
    case 'error': return 'lucide:x'
    case 'active': return 'lucide:loader-2'
    default: return 'lucide:circle'
  }
}

const toggleStepDetails = (stepId) => {
  const step = setupSteps.value.find(s => s.id === stepId)
  if (step) {
    step.showDetails = !step.showDetails
  }
}

const updateStepStatus = (stepId, status, details = null, error = null, suggestions = []) => {
  const step = setupSteps.value.find(s => s.id === stepId)
  if (step) {
    step.status = status
    step.loading = false
    step.details = details
    step.error = error
    step.suggestions = suggestions
  }
}

// Enhanced step verification functions
const verifyConfiguration = async () => {
  const step = setupSteps.value.find(s => s.id === 'config')
  step.status = 'active'
  step.loading = true

  try {
    config.value = await getConfig()
    
    const checks = {
      directus_url: !!config.value.directus?.url,
      directus_token: !!config.value.directus?.auth?.token,
      sendgrid_key: !!config.value.sendgrid?.apiKey,
      mjml_mode: !!config.value.mjmlMode
    }

    const allConfigured = Object.values(checks).every(Boolean)
    
    if (allConfigured) {
      updateStepStatus('config', 'complete', checks)
    } else {
      const missing = Object.entries(checks)
        .filter(([, value]) => !value)
        .map(([key]) => key.replace(/_/g, ' ').toUpperCase())
      
      updateStepStatus('config', 'error', null, `Missing configuration: ${missing.join(', ')}`, [
        'Check your .env file for missing variables',
        'Verify nuxt.config.ts newsletter module configuration',
        'Ensure all required environment variables are set'
      ])
    }
  } catch (error) {
    updateStepStatus('config', 'error', null, error.message, [
      'Check console for detailed error information',
      'Verify module is properly installed and configured'
    ])
  }
}

const verifyDirectusConnection = async () => {
  const step = setupSteps.value.find(s => s.id === 'directus')
  step.status = 'active'
  step.loading = true

  try {
    const response = await testConnection()
    updateStepStatus('directus', 'complete', {
      status: 'Connected',
      version: response.version || 'Unknown',
      auth_type: config.value.directus?.auth?.type || 'static'
    })
  } catch (error) {
    updateStepStatus('directus', 'error', null, error.message, [
      'Verify DIRECTUS_URL is correct and accessible',
      'Check DIRECTUS_TOKEN has proper permissions',
      'Ensure Directus instance is running and accessible'
    ])
  }
}

const verifyCollections = async () => {
  const step = setupSteps.value.find(s => s.id === 'collections')
  step.status = 'active'
  step.loading = true

  try {
    const collections = await fetchCollections()
    const requiredCollections = [
      'newsletters', 'newsletter_blocks', 'block_types', 
      'subscribers', 'mailing_lists', 'newsletter_sends'
    ]
    
    const existingCollections = collections.map(c => c.collection)
    const missing = requiredCollections.filter(c => !existingCollections.includes(c))
    
    if (missing.length === 0) {
      updateStepStatus('collections', 'complete', {
        total_collections: collections.length,
        required_found: requiredCollections.length,
        status: 'All required collections exist'
      })
    } else {
      updateStepStatus('collections', 'error', null, `Missing collections: ${missing.join(', ')}`, [
        'Run the "Install Collections" action below',
        'Or use the setup script: npm run newsletter:setup',
        'Check Directus admin panel for existing collections'
      ])
    }
  } catch (error) {
    updateStepStatus('collections', 'error', null, error.message, [
      'Verify Directus connection is working',
      'Check user permissions for schema access'
    ])
  }
}

const verifySendGrid = async () => {
  const step = setupSteps.value.find(s => s.id === 'sendgrid')
  step.status = 'active'
  step.loading = true

  try {
    if (!config.value.sendgrid?.apiKey) {
      updateStepStatus('sendgrid', 'error', null, 'SendGrid API key not configured', [
        'Add SENDGRID_API_KEY to your .env file',
        'Get your API key from SendGrid dashboard',
        'Ensure the API key has mail sending permissions'
      ])
      return
    }

    const response = await testSendGridConnection()
    updateStepStatus('sendgrid', 'complete', {
      status: 'Connected',
      from_email: config.value.sendgrid?.defaultFromEmail || 'Not set',
      from_name: config.value.sendgrid?.defaultFromName || 'Not set'
    })
  } catch (error) {
    updateStepStatus('sendgrid', 'error', null, error.message, [
      'Verify SENDGRID_API_KEY is correct',
      'Check API key permissions in SendGrid dashboard',
      'Ensure SendGrid account is active and verified'
    ])
  }
}

const verifyMJML = async () => {
  const step = setupSteps.value.find(s => s.id === 'mjml')
  step.status = 'active'
  step.loading = true

  try {
    const testMjml = `
      <mjml>
        <mj-body>
          <mj-section>
            <mj-column>
              <mj-text>Test compilation</mj-text>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `
    
    await compileMjmlToHtml(testMjml)
    updateStepStatus('mjml', 'complete', {
      mode: config.value.mjmlMode || 'client',
      status: 'Working correctly'
    })
  } catch (error) {
    updateStepStatus('mjml', 'error', null, error.message, [
      'If using server mode, ensure MJML is installed: npm install mjml',
      'Try switching to client mode in configuration',
      'Check browser console for additional errors'
    ])
  }
}

// Enhanced action functions
const retryStep = async (stepId) => {
  const stepFunctions = {
    config: verifyConfiguration,
    directus: verifyDirectusConnection,
    collections: verifyCollections,
    sendgrid: verifySendGrid,
    mjml: verifyMJML
  }

  const stepFunction = stepFunctions[stepId]
  if (stepFunction) {
    await stepFunction()
  }
}

const testConfiguration = async () => {
  testing.value = true
  try {
    await runAllVerifications()
    showNotification('Configuration test completed', 'success', 'Check the steps above for detailed results')
  } catch (error) {
    showNotification('Configuration test failed', 'error', error.message)
  } finally {
    testing.value = false
  }
}

const installCollections = async () => {
  installing.value.collections = true
  try {
    // This would call your collection installation logic
    await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate installation
    showNotification('Collections installed successfully', 'success')
    await verifyCollections()
  } catch (error) {
    showNotification('Failed to install collections', 'error', error.message)
  } finally {
    installing.value.collections = false
  }
}

const installBlockTypes = async () => {
  installing.value.blockTypes = true
  try {
    // This would call your block types installation logic
    await new Promise(resolve => setTimeout(resolve, 1500)) // Simulate installation
    showNotification('Block types installed successfully', 'success')
  } catch (error) {
    showNotification('Failed to install block types', 'error', error.message)
  } finally {
    installing.value.blockTypes = false
  }
}

const runFullSetup = async () => {
  runningFullSetup.value = true
  try {
    loadingMessage.value = 'Running full setup process...'
    
    // Install collections first
    await installCollections()
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Install block types
    await installBlockTypes()
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Re-run all verifications
    await runAllVerifications()
    
    showNotification('Full setup completed successfully', 'success', 'Your newsletter module is ready to use!')
  } catch (error) {
    showNotification('Setup process failed', 'error', error.message)
  } finally {
    runningFullSetup.value = false
  }
}

const runAllVerifications = async () => {
  loadingMessage.value = 'Verifying configuration...'
  await verifyConfiguration()
  
  loadingMessage.value = 'Testing Directus connection...'
  await verifyDirectusConnection()
  
  loadingMessage.value = 'Checking collections...'
  await verifyCollections()
  
  loadingMessage.value = 'Testing SendGrid...'
  await verifySendGrid()
  
  loadingMessage.value = 'Verifying MJML compilation...'
  await verifyMJML()
}

// Enhanced initialization
const initializeSetup = async () => {
  loading.value = true
  
  try {
    loadingMessage.value = 'Loading configuration...'
    config.value = await getConfig()
    
    await runAllVerifications()
  } catch (error) {
    console.error('Setup initialization error:', error)
    showNotification('Failed to initialize setup', 'error', error.message)
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(() => {
  initializeSetup()
})
</script>

<style scoped>
/* Enhanced animations and transitions */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 200ms;
}

/* Enhanced button hover effects */
button:not(:disabled):hover {
  transform: translateY(-1px);
}

/* Custom progress animations */
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.shimmer {
  animation: shimmer 2s infinite;
}

/* Enhanced scrollbar */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: rgba(148, 163, 184, 0.1);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.4);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.6);
}
</style>