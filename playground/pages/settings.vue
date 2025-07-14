<!-- playground/pages/settings.vue -->
<template>
  <div class="settings-page">
    <div class="settings-header">
      <h1>Newsletter Settings</h1>
      <p class="subtitle">Configure and monitor your newsletter module</p>
    </div>

    <div class="settings-grid">
      <!-- Module Information -->
      <div class="settings-card">
        <div class="card-header">
          <h2>📦 Module Information</h2>
        </div>
        <div class="card-content">
          <div class="info-item">
            <span class="label">Module Version:</span>
            <span class="value">{{ moduleInfo.version }}</span>
          </div>
          <div class="info-item">
            <span class="label">Initialization:</span>
            <span class="value" :class="moduleInfo.initialized ? 'success' : 'error'">
              {{ moduleInfo.initialized ? '✅ Initialized' : '❌ Not Initialized' }}
            </span>
          </div>
          <div class="info-item">
            <span class="label">MJML Mode:</span>
            <span class="value">{{ mjmlMode.value || 'client' }}</span>
          </div>
          <div class="info-item">
            <span class="label">Component Prefix:</span>
            <span class="value">{{ moduleConfig.value?.prefix || 'Newsletter' }}</span>
          </div>
        </div>
      </div>

      <!-- Directus Configuration -->
      <div class="settings-card">
        <div class="card-header">
          <h2>🗄️ Directus Configuration</h2>
          <button @click="testDirectusConnection" :disabled="testing.directus" class="btn btn-sm btn-secondary">
            {{ testing.directus ? 'Testing...' : 'Test Connection' }}
          </button>
        </div>
        <div class="card-content">
          <div class="info-item">
            <span class="label">URL:</span>
            <span class="value">{{ directusUrl.value || 'Not configured' }}</span>
          </div>
          <div class="info-item">
            <span class="label">Auth Type:</span>
            <span class="value">{{ authType.value || 'static' }}</span>
          </div>
          <div class="info-item">
            <span class="label">Connection Status:</span>
            <span class="value" :class="directusStatus.class">
              {{ directusStatus.text }}
            </span>
          </div>
          <div v-if="directusStatus.error" class="error-details">
            <strong>Error:</strong> {{ directusStatus.error }}
          </div>
          <div class="info-item">
            <span class="label">Collections:</span>
            <span class="value">{{ collectionsInfo.installed }}/{{ collectionsInfo.total }} installed</span>
          </div>
        </div>
      </div>

      <!-- SendGrid Configuration -->
      <div class="settings-card">
        <div class="card-header">
          <h2>📧 SendGrid Configuration</h2>
          <button @click="testSendGridConnection" :disabled="testing.sendgrid" class="btn btn-sm btn-secondary">
            {{ testing.sendgrid ? 'Testing...' : 'Test API Key' }}
          </button>
        </div>
        <div class="card-content">
          <div class="info-item">
            <span class="label">API Key:</span>
            <span class="value" :class="sendgridConfig.apiKey ? 'success' : 'error'">
              {{ sendgridConfig.apiKey ? '✅ Configured' : '❌ Not configured' }}
            </span>
          </div>
          <div class="info-item">
            <span class="label">Webhook Secret:</span>
            <span class="value" :class="sendgridConfig.webhookSecret ? 'success' : 'warning'">
              {{ sendgridConfig.webhookSecret ? '✅ Configured' : '⚠️ Not configured' }}
            </span>
          </div>
          <div class="info-item">
            <span class="label">Default From Email:</span>
            <span class="value">{{ defaultFromEmail.value || 'newsletter@example.com' }}</span>
          </div>
          <div class="info-item">
            <span class="label">Default From Name:</span>
            <span class="value">{{ defaultFromName.value || 'Newsletter' }}</span>
          </div>
          <div class="info-item">
            <span class="label">Connection Status:</span>
            <span class="value" :class="sendgridStatus.class">
              {{ sendgridStatus.text }}
            </span>
          </div>
          <div v-if="sendgridStatus.error" class="error-details">
            <strong>Error:</strong> {{ sendgridStatus.error }}
          </div>
        </div>
      </div>

      <!-- Environment Variables -->
      <div class="settings-card">
        <div class="card-header">
          <h2>🔐 Environment Variables</h2>
        </div>
        <div class="card-content">
          <div class="env-grid">
            <div v-for="envVar in environmentVariables" :key="envVar.name" class="env-item">
              <div class="env-name">{{ envVar.name }}</div>
              <div class="env-status" :class="envVar.status">
                {{ envVar.configured ? '✅ Set' : '❌ Missing' }}
              </div>
              <div class="env-description">{{ envVar.description }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Health Checks -->
      <div class="settings-card">
        <div class="card-header">
          <h2>🏥 Health Checks</h2>
          <button @click="runHealthChecks" :disabled="testing.health" class="btn btn-sm btn-primary">
            {{ testing.health ? 'Running...' : 'Run All Checks' }}
          </button>
        </div>
        <div class="card-content">
          <div v-for="check in healthChecks" :key="check.name" class="health-check">
            <div class="check-name">{{ check.name }}</div>
            <div class="check-status" :class="check.status">
              {{ check.icon }} {{ check.message }}
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Setup -->
      <div class="settings-card">
        <div class="card-header">
          <h2>🚀 Quick Setup</h2>
        </div>
        <div class="card-content">
          <div class="setup-actions">
            <div class="setup-item">
              <h4>Install Directus Collections</h4>
              <p>Set up required database collections and relationships</p>
              <div class="setup-code">
                <code>node scripts/install-directus-collections.js [url] [email] [password]</code>
                <button @click="copyToClipboard('node scripts/install-directus-collections.js')" class="copy-btn">
                  📋
                </button>
              </div>
            </div>

            <div class="setup-item">
              <h4>Install Advanced Block Types</h4>
              <p>Add additional MJML block types for more design options</p>
              <div class="setup-code">
                <code>node scripts/create-advanced-blocks.js [url] [email] [password]</code>
                <button @click="copyToClipboard('node scripts/create-advanced-blocks.js')" class="copy-btn">
                  📋
                </button>
              </div>
            </div>

            <div class="setup-item">
              <h4>Verify Setup</h4>
              <p>Check if everything is configured correctly</p>
              <div class="setup-code">
                <code>node scripts/verify-setup.js</code>
                <button @click="copyToClipboard('node scripts/verify-setup.js')" class="copy-btn">
                  📋
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- API Endpoints -->
      <div class="settings-card">
        <div class="card-header">
          <h2>🔗 API Endpoints</h2>
        </div>
        <div class="card-content">
          <div class="endpoint-list">
            <div class="endpoint-item">
              <span class="method post">POST</span>
              <span class="url">/api/newsletter/sendgrid-webhook</span>
              <span class="description">SendGrid event webhook</span>
            </div>
            <div v-if="mjmlMode.value === 'server'" class="endpoint-item">
              <span class="method post">POST</span>
              <span class="url">/api/newsletter/compile-mjml</span>
              <span class="description">Server-side MJML compilation</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Notification Toast -->
    <div v-if="notification.show" class="notification" :class="notification.type">
      {{ notification.message }}
    </div>
  </div>
</template>

<script setup>
import { useNuxtApp } from '#app'
import { computed, onMounted, ref } from 'vue'

// Page metadata
definePageMeta({
  title: 'Settings'
})

// State
const testing = ref({
  directus: false,
  sendgrid: false,
  health: false
})

const directusStatus = ref({
  text: 'Not tested',
  class: 'pending',
  error: null
})

const sendgridStatus = ref({
  text: 'Not tested',
  class: 'pending',
  error: null
})

const collectionsInfo = ref({
  installed: 0,
  total: 10 // Assuming a total of 10 collections for now (basic + advanced)
})

const healthChecks = ref([
  { name: 'Module Initialization', status: 'pending', icon: '⏳', message: 'Not checked' },
  { name: 'Directus Connection', status: 'pending', icon: '⏳', message: 'Not checked' },
  { name: 'SendGrid API', status: 'pending', icon: '⏳', message: 'Not checked' },
  { name: 'MJML Compilation', status: 'pending', icon: '⏳', message: 'Not checked' },
  { name: 'Required Collections', status: 'pending', icon: '⏳', message: 'Not checked' }
])

const notification = ref({
  show: false,
  message: '',
  type: 'success'
})

// Composables
const { config, isInitialized, directusUrl, mjmlMode, authType, defaultFromEmail, defaultFromName, connectionStatus } = useNewsletter()
const { fetchNewsletters, fetchBlockTypes } = useDirectusNewsletter()
const { sendTestEmail } = useSendGrid()
const { compileMjmlToHtml } = useMjmlCompiler()

// Module info
const moduleInfo = computed(() => ({
  version: '1.0.1', // Hardcoded for now, but could be dynamic from module options
  initialized: isInitialized.value
}))

// Get module config (this would normally come from nuxt.config)
const moduleConfig = computed(() => {
  try {
    const nuxtApp = useNuxtApp()
    return nuxtApp.$newsletter?.config || {}
  } catch {
    return {}
  }
})

// SendGrid configuration status - now derived from connectionStatus
const sendgridConfig = computed(() => {
  return {
    apiKey: connectionStatus.value.sendgrid.configured,
    webhookSecret: connectionStatus.value.sendgrid.hasWebhook
  }
})

// Environment variables checklist - now derived from connectionStatus
const environmentVariables = computed(() => {
  return [
    {
      name: 'DIRECTUS_URL',
      configured: connectionStatus.value.directus.configured,
      status: connectionStatus.value.directus.configured ? 'success' : 'error',
      description: 'Your Directus instance URL'
    },
    {
      name: 'DIRECTUS_TOKEN',
      configured: connectionStatus.value.directus.authConfigured,
      status: connectionStatus.value.directus.authConfigured ? 'success' : 'error',
      description: 'Directus authentication token'
    },
    {
      name: 'SENDGRID_API_KEY',
      configured: connectionStatus.value.sendgrid.configured,
      status: connectionStatus.value.sendgrid.configured ? 'success' : 'error',
      description: 'SendGrid API key for sending emails'
    },
    {
      name: 'SENDGRID_WEBHOOK_SECRET',
      configured: connectionStatus.value.sendgrid.hasWebhook,
      status: connectionStatus.value.sendgrid.hasWebhook ? 'success' : 'warning',
      description: 'SendGrid webhook verification secret (optional)'
    },
    {
      name: 'DIRECTUS_ADMIN_TOKEN',
      configured: connectionStatus.value.directusAdminTokenConfigured,
      status: connectionStatus.value.directusAdminTokenConfigured ? 'success' : 'warning',
      description: 'Admin token for system operations (optional)'
    }
  ]
})

// Methods
const testDirectusConnection = async () => {
  testing.value.directus = true
  directusStatus.value = { text: 'Testing...', class: 'pending', error: null }

  try {
    // Attempt to fetch something simple to test connection
    await fetchNewsletters({ limit: 1 })
    directusStatus.value = {
      text: '✅ Connected',
      class: 'success',
      error: null
    }

    // Check collections by fetching block types
    try {
      const blockTypes = await fetchBlockTypes({ limit: 1 })
      collectionsInfo.value.installed = blockTypes.length > 0 ? 8 : 6 // Rough estimate, improve if needed
    } catch {
      collectionsInfo.value.installed = 0
    }

    showNotification('Directus connection successful!', 'success')
  } catch (error) {
    directusStatus.value = {
      text: '❌ Failed',
      class: 'error',
      error: error.message
    }
    showNotification('Directus connection failed: ' + error.message, 'error')
  } finally {
    testing.value.directus = false
  }
}

const testSendGridConnection = async () => {
  testing.value.sendgrid = true
  sendgridStatus.value = { text: 'Testing...', class: 'pending', error: null }

  try {
    // This test uses a minimal newsletter object.
    // The `sendTestEmail` function in useSendGrid will handle the API call.
    const testNewsletter = {
      subject: 'SendGrid Connection Test',
      compiled_html: '<html><body>This is a test email from your Nuxt Newsletter module.</body></html>',
      from_email: defaultFromEmail.value, // Use the configured default from email
      from_name: defaultFromName.value,
      blocks: [] // Empty blocks for a test newsletter
    }

    await sendTestEmail(testNewsletter, 'test@example.com') // Send to a dummy email

    sendgridStatus.value = {
      text: '✅ API Key Valid (Test Email Sent)',
      class: 'success',
      error: null
    }
    showNotification('SendGrid API key is valid! Test email sent to test@example.com.', 'success')
  } catch (error) {
    let errorMessage = 'Failed to send test email.'
    let errorClass = 'error'

    if (error.message.includes('API key not configured')) {
      errorMessage = 'SendGrid API key is missing.'
    } else if (error.message.includes('Forbidden') || error.message.includes('401')) {
      errorMessage = 'SendGrid API key is invalid or unauthorized.'
    } else if (error.message.includes('email address is not verified')) {
      errorMessage = 'Sender email is not verified in SendGrid.'
      errorClass = 'warning'
    } else {
      errorMessage = `SendGrid test failed: ${error.message}`
    }

    sendgridStatus.value = {
      text: `❌ ${errorMessage}`,
      class: errorClass,
      error: errorMessage
    }
    showNotification(`SendGrid test failed: ${errorMessage}`, 'error')
  } finally {
    testing.value.sendgrid = false
  }
}

const runHealthChecks = async () => {
  testing.value.health = true

  // Reset all checks
  healthChecks.value.forEach(check => {
    check.status = 'pending'
    check.icon = '⏳'
    check.message = 'Checking...'
  })

  // Check 1: Module Initialization
  await new Promise(resolve => setTimeout(resolve, 500)) // Simulate delay
  const initCheck = healthChecks.value.find(c => c.name === 'Module Initialization')
  if (isInitialized.value) {
    initCheck.status = 'success'
    initCheck.icon = '✅'
    initCheck.message = 'Module properly initialized'
  } else {
    initCheck.status = 'error'
    initCheck.icon = '❌'
    initCheck.message = 'Module not initialized'
  }

  // Check 2: Directus Connection
  const directusCheck = healthChecks.value.find(c => c.name === 'Directus Connection')
  try {
    await fetchNewsletters({ limit: 1 })
    directusCheck.status = 'success'
    directusCheck.icon = '✅'
    directusCheck.message = 'Can connect to Directus'
  } catch (error) {
    directusCheck.status = 'error'
    directusCheck.icon = '❌'
    directusCheck.message = 'Cannot connect to Directus'
  }

  // Check 3: SendGrid API
  const sendgridCheck = healthChecks.value.find(c => c.name === 'SendGrid API')
  if (sendgridConfig.value.apiKey) {
    sendgridCheck.status = 'success'
    sendgridCheck.icon = '✅'
    sendgridCheck.message = 'SendGrid API key configured'
  } else {
    sendgridCheck.status = 'error'
    sendgridCheck.icon = '❌'
    sendgridCheck.message = 'SendGrid API key missing'
  }

  // Check 4: MJML Compilation
  const mjmlCheck = healthChecks.value.find(c => c.name === 'MJML Compilation')
  try {
    const testMjml = '<mjml><mj-body><mj-section><mj-column><mj-text>Test</mj-text></mj-column></mj-section></mj-body></mjml>'
    await compileMjmlToHtml(testMjml)
    mjmlCheck.status = 'success'
    mjmlCheck.icon = '✅'
    mjmlCheck.message = `MJML compilation working (${mjmlMode.value || 'client'} mode)`
  } catch (error) {
    mjmlCheck.status = 'error'
    mjmlCheck.icon = '❌'
    mjmlCheck.message = 'MJML compilation failed'
  }

  // Check 5: Required Collections
  const collectionsCheck = healthChecks.value.find(c => c.name === 'Required Collections')
  try {
    const blockTypes = await fetchBlockTypes({ limit: 1 })
    if (blockTypes.length > 0) {
      collectionsCheck.status = 'success'
      collectionsCheck.icon = '✅'
      collectionsCheck.message = 'Required collections found'
    } else {
      collectionsCheck.status = 'warning'
      collectionsCheck.icon = '⚠️'
      collectionsCheck.message = 'Some collections may be missing'
    }
  } catch (error) {
    collectionsCheck.status = 'error'
    collectionsCheck.icon = '❌'
    collectionsCheck.message = 'Collections not accessible'
  }

  testing.value.health = false
  showNotification('Health checks completed!', 'success')
}

const copyToClipboard = async (text) => {
  try {
    // Use document.execCommand('copy') for better iframe compatibility
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showNotification('Copied to clipboard!', 'success');
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    showNotification('Failed to copy to clipboard', 'error');
  }
}

const showNotification = (message, type = 'success') => {
  notification.value = { show: true, message, type }
  setTimeout(() => {
    notification.value.show = false
  }, 3000)
}

// Auto-run basic checks on mount
onMounted(() => {
  // Update Directus status based on connectionStatus
  if (connectionStatus.value.directus.configured) {
    directusStatus.value = {
      text: '✅ Configured',
      class: 'success',
      error: null
    };
  } else {
    directusStatus.value = {
      text: '❌ Not Configured',
      class: 'error',
      error: 'Directus URL is missing or default'
    };
  }

  // Update SendGrid status based on connectionStatus
  if (connectionStatus.value.sendgrid.configured) {
    sendgridStatus.value = {
      text: '✅ API Key Configured',
      class: 'success',
      error: null
    };
  } else {
    sendgridStatus.value = {
      text: '❌ API Key Missing',
      class: 'error',
      error: 'SendGrid API Key is not set'
    };
  }

  // Initial check for collections info
  fetchBlockTypes({ limit: 1 }).then(blockTypes => {
    collectionsInfo.value.installed = blockTypes.length > 0 ? 8 : 6 // Rough estimate
  }).catch(() => {
    collectionsInfo.value.installed = 0
  })
})
</script>

<style scoped>
.settings-page {
  min-height: 100vh;
  background: #f8fafc;
  padding: 2rem;
}

.settings-header {
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.settings-header h1 {
  margin: 0;
  font-size: 2.5rem;
  font-weight: 700;
  color: #1e293b;
}

.subtitle {
  margin: 0.5rem 0 0;
  color: #64748b;
  font-size: 1.125rem;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
}

.settings-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.card-header {
  padding: 1.5rem;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
}

.card-content {
  padding: 1.5rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f8fafc;
}

.info-item:last-child {
  border-bottom: none;
}

.label {
  font-weight: 500;
  color: #374151;
}

.value {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  color: #6b7280;
}

.value.success {
  color: #059669;
  font-weight: 500;
}

.value.error {
  color: #dc2626;
  font-weight: 500;
}

.value.warning {
  color: #d97706;
  font-weight: 500;
}

.value.pending {
  color: #6366f1;
  font-style: italic;
}

.error-details {
  margin-top: 0.5rem;
  padding: 0.75rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  color: #991b1b;
  font-size: 0.875rem;
}

/* Environment Variables */
.env-grid {
  display: grid;
  gap: 1rem;
}

.env-item {
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.env-name {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

.env-status {
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.env-status.success {
  color: #059669;
}

.env-status.error {
  color: #dc2626;
}

.env-status.warning {
  color: #d97706;
}

.env-description {
  font-size: 0.875rem;
  color: #6b7280;
}

/* Health Checks */
.health-check {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f8fafc;
}

.health-check:last-child {
  border-bottom: none;
}

.check-name {
  font-weight: 500;
  color: #374151;
}

.check-status {
  font-size: 0.875rem;
  font-weight: 500;
}

.check-status.success {
  color: #059669;
}

.check-status.error {
  color: #dc2626;
}

.check-status.warning {
  color: #d97706;
}

.check-status.pending {
  color: #6366f1;
}

/* Setup Actions */
.setup-actions {
  display: grid;
  gap: 1.5rem;
}

.setup-item h4 {
  margin: 0 0 0.5rem;
  color: #1e293b;
  font-size: 1rem;
}

.setup-item p {
  margin: 0 0 1rem;
  color: #6b7280;
  font-size: 0.875rem;
}

.setup-code {
  display: flex;
  align-items: center;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 0.75rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
}

.setup-code code {
  flex: 1;
  background: none;
  color: #1e293b;
}

.copy-btn {
  padding: 0.25rem 0.5rem;
  margin-left: 0.5rem;
  border: none;
  background: #e2e8f0;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.copy-btn:hover {
  background: #cbd5e1;
}

/* API Endpoints */
.endpoint-list {
  display: grid;
  gap: 0.75rem;
}

.endpoint-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.method {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  min-width: 50px;
  text-align: center;
}

.method.post {
  background: #fef3c7;
  color: #92400e;
}

.url {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  color: #1e293b;
  flex: 1;
}

.description {
  font-size: 0.875rem;
  color: #6b7280;
}

/* Buttons */
.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #4b5563;
}

/* Notification */
.notification {
  position: fixed;
  top: 2rem;
  right: 2rem;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  animation: slideIn 0.3s ease-out;
}

.notification.success {
  background: #d1fae5;
  color: #047857;
  border: 1px solid #a7f3d0;
}

.notification.error {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .settings-page {
    padding: 1rem;
  }

  .settings-grid {
    grid-template-columns: 1fr;
  }

  .card-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }

  .endpoint-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>
