<template>
  <div class="newsletter-setup-guide">
    <!-- Success State -->
    <div v-if="overallValidation.isValid && !overallValidation.hasWarnings" class="setup-card success">
      <div class="setup-header">
        <Icon name="lucide:check-circle" class="w-6 h-6 text-green-500" />
        <h3>Newsletter Module Ready!</h3>
      </div>
      <p>Your newsletter module is fully configured and ready to use.</p>
      <div class="setup-actions">
        <button @click="testConnection" :disabled="isChecking" class="btn btn-primary">
          <Icon name="lucide:refresh-cw" class="w-4 h-4" :class="{ 'animate-spin': isChecking }" />
          {{ isChecking ? 'Testing...' : 'Test Connection' }}
        </button>
      </div>
    </div>

    <!-- Setup Required State -->
    <div v-else class="setup-card">
      <div class="setup-header">
        <Icon name="lucide:settings" class="w-6 h-6 text-blue-500" />
        <h3>Newsletter Module Setup</h3>
      </div>
      
      <p class="setup-description">
        Let's get your newsletter module configured! Follow these steps to enable all features.
      </p>

      <!-- Validation Results -->
      <div class="validation-results">
        <!-- Directus -->
        <div class="validation-item" :class="directusValidation.severity">
          <div class="validation-icon">
            <Icon v-if="directusValidation.isValid" name="lucide:check" class="w-5 h-5" />
            <Icon v-else name="lucide:x" class="w-5 h-5" />
          </div>
          <div class="validation-content">
            <h4>Directus Configuration</h4>
            <p>{{ directusValidation.message }}</p>
            <p v-if="directusValidation.solution" class="validation-solution">
              {{ directusValidation.solution }}
            </p>
          </div>
        </div>

        <!-- SendGrid -->
        <div class="validation-item" :class="sendgridValidation.severity">
          <div class="validation-icon">
            <Icon v-if="sendgridValidation.isValid && sendgridValidation.severity !== 'warning'" name="lucide:check" class="w-5 h-5" />
            <Icon v-else-if="sendgridValidation.severity === 'warning'" name="lucide:alert-triangle" class="w-5 h-5" />
            <Icon v-else name="lucide:x" class="w-5 h-5" />
          </div>
          <div class="validation-content">
            <h4>SendGrid Configuration</h4>
            <p>{{ sendgridValidation.message }}</p>
            <p v-if="sendgridValidation.solution" class="validation-solution">
              {{ sendgridValidation.solution }}
            </p>
          </div>
        </div>

        <!-- MJML -->
        <div class="validation-item" :class="mjmlValidation.severity">
          <div class="validation-icon">
            <Icon v-if="mjmlValidation.severity === 'info'" name="lucide:check" class="w-5 h-5" />
            <Icon v-else name="lucide:alert-triangle" class="w-5 h-5" />
          </div>
          <div class="validation-content">
            <h4>MJML Configuration</h4>
            <p>{{ mjmlValidation.message }}</p>
            <p v-if="mjmlValidation.solution" class="validation-solution">
              {{ mjmlValidation.solution }}
            </p>
          </div>
        </div>
      </div>

      <!-- Setup Steps -->
      <div v-if="setupSteps.length > 0" class="setup-steps">
        <h4>Setup Steps</h4>
        <div class="steps-list">
          <div v-for="(step, index) in setupSteps" :key="index" class="setup-step" :class="step.priority">
            <div class="step-number">{{ index + 1 }}</div>
            <div class="step-content">
              <h5>{{ step.title }}</h5>
              <p>{{ step.description }}</p>
              <code class="step-action">{{ step.action }}</code>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Fixes -->
      <div v-if="quickFixes.length > 0" class="quick-fixes">
        <h4>Quick Fixes</h4>
        <div class="fixes-list">
          <div v-for="(fix, index) in quickFixes" :key="index" class="quick-fix">
            <div class="fix-content">
              <h5>{{ fix.issue }}</h5>
              <p>{{ fix.description }}</p>
              <div class="fix-command">
                <code>{{ fix.command }}</code>
                <button @click="copyToClipboard(fix.command)" class="copy-btn">
                  <Icon name="lucide:copy" class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="setup-actions">
        <button @click="testConnection" :disabled="isChecking" class="btn btn-primary">
          <Icon name="lucide:refresh-cw" class="w-4 h-4" :class="{ 'animate-spin': isChecking }" />
          {{ isChecking ? 'Testing...' : 'Test Connection' }}
        </button>
        
        <button @click="openDocs" class="btn btn-secondary">
          <Icon name="lucide:book-open" class="w-4 h-4" />
          Documentation
        </button>

        <button @click="runSetupWizard" class="btn btn-secondary">
          <Icon name="lucide:wand-2" class="w-4 h-4" />
          Setup Wizard
        </button>
      </div>

      <!-- Connection Test Results -->
      <div v-if="connectionTestResult" class="connection-test-result">
        <div class="test-header">
          <Icon :name="connectionTestResult.overall.success ? 'lucide:check-circle' : 'lucide:x-circle'" 
                class="w-5 h-5" 
                :class="connectionTestResult.overall.success ? 'text-green-500' : 'text-red-500'" />
          <h4>Connection Test Results</h4>
        </div>
        
        <div class="test-results">
          <div class="test-item" :class="connectionTestResult.directus.status">
            <strong>Directus:</strong> {{ connectionTestResult.directus.message }}
            <div v-if="connectionTestResult.directus.details" class="test-details">
              {{ typeof connectionTestResult.directus.details === 'string' 
                 ? connectionTestResult.directus.details 
                 : JSON.stringify(connectionTestResult.directus.details, null, 2) }}
            </div>
          </div>
          
          <div class="test-item" :class="connectionTestResult.sendgrid.status">
            <strong>SendGrid:</strong> {{ connectionTestResult.sendgrid.message }}
          </div>
        </div>

        <div v-if="connectionTestResult.recommendations?.length > 0" class="recommendations">
          <h5>Recommendations:</h5>
          <div v-for="(rec, index) in connectionTestResult.recommendations" :key="index" class="recommendation">
            <h6>{{ rec.title }}</h6>
            <ul>
              <li v-for="step in rec.steps" :key="step">{{ step }}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <div v-if="toast.show" class="toast" :class="toast.type">
      <Icon :name="toast.type === 'success' ? 'lucide:check' : 'lucide:x'" class="w-4 h-4" />
      {{ toast.message }}
    </div>
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
  testConnection,
  isChecking
} = useNewsletterSetup()

// Local state
const connectionTestResult = ref(null)
const toast = ref({
  show: false,
  message: '',
  type: 'success'
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
    await navigator.clipboard.writeText(text)
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

// Alias for template
// const testConnection = runConnectionTest
</script>

<style scoped>
.newsletter-setup-guide {
  max-width: 800px;
  margin: 0 auto;
  font-family: system-ui, -apple-system, sans-serif;
}

.setup-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.setup-card.success {
  border-color: #10b981;
  background: #f0fdf4;
}

.setup-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.setup-header h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
}

.setup-description {
  margin-bottom: 2rem;
  color: #6b7280;
  line-height: 1.6;
}

.validation-results {
  margin-bottom: 2rem;
}

.validation-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.validation-item.error {
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.validation-item.warning {
  background: #fffbeb;
  border: 1px solid #fed7aa;
}

.validation-item.info {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
}

.validation-icon {
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.validation-content h4 {
  margin: 0 0 0.5rem;
  font-weight: 600;
  color: #111827;
}

.validation-content p {
  margin: 0;
  color: #6b7280;
  font-size: 0.875rem;
}

.validation-solution {
  margin-top: 0.5rem !important;
  font-style: italic;
  color: #4b5563 !important;
}

.setup-steps, .quick-fixes {
  margin-bottom: 2rem;
}

.setup-steps h4, .quick-fixes h4 {
  margin: 0 0 1rem;
  font-weight: 600;
  color: #111827;
}

.steps-list, .fixes-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.setup-step, .quick-fix {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.setup-step.high {
  border-color: #ef4444;
  background: #fef2f2;
}

.setup-step.medium {
  border-color: #f59e0b;
  background: #fffbeb;
}

.setup-step.low {
  border-color: #3b82f6;
  background: #eff6ff;
}

.step-number {
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  background: #3b82f6;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
}

.step-content h5, .fix-content h5 {
  margin: 0 0 0.5rem;
  font-weight: 600;
  color: #111827;
}

.step-content p, .fix-content p {
  margin: 0 0 0.5rem;
  color: #6b7280;
  font-size: 0.875rem;
}

.step-action, .fix-command code {
  display: block;
  padding: 0.5rem;
  background: #111827;
  color: #f9fafb;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.75rem;
  overflow-x: auto;
}

.fix-command {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.fix-command code {
  flex: 1;
  margin: 0;
}

.copy-btn {
  padding: 0.5rem;
  background: #6b7280;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.copy-btn:hover {
  background: #4b5563;
}

.setup-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.connection-test-result {
  margin-top: 2rem;
  padding: 1.5rem;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.test-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.test-header h4 {
  margin: 0;
  font-weight: 600;
}

.test-results {
  margin-bottom: 1rem;
}

.test-item {
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  border-radius: 6px;
  font-size: 0.875rem;
}

.test-item.success {
  background: #d1fae5;
  color: #065f46;
}

.test-item.error {
  background: #fee2e2;
  color: #991b1b;
}

.test-item.warning {
  background: #fef3c7;
  color: #92400e;
}

.test-details {
  margin-top: 0.5rem;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.75rem;
  background: rgba(0, 0, 0, 0.1);
  padding: 0.5rem;
  border-radius: 4px;
  white-space: pre-wrap;
}

.recommendations h5 {
  margin: 0 0 0.5rem;
  font-weight: 600;
}

.recommendation {
  margin-bottom: 1rem;
}

.recommendation h6 {
  margin: 0 0 0.5rem;
  font-weight: 500;
  color: #374151;
}

.recommendation ul {
  margin: 0;
  padding-left: 1.5rem;
}

.recommendation li {
  margin-bottom: 0.25rem;
  color: #6b7280;
  font-size: 0.875rem;
}

.toast {
  position: fixed;
  top: 1rem;
  right: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  animation: slideIn 0.3s ease-out;
}

.toast.success {
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.toast.error {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.toast.info {
  background: #dbeafe;
  color: #1e40af;
  border: 1px solid #93c5fd;
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
@media (max-width: 640px) {
  .newsletter-setup-guide {
    padding: 1rem;
  }
  
  .setup-card {
    padding: 1rem;
  }
  
  .setup-actions {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>