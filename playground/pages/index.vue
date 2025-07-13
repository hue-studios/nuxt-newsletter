<!-- playground/pages/index.vue -->
<template>
  <div class="newsletter-editor-page">
    <div class="editor-header">
      <div class="header-left">
        <NuxtLink to="/list" class="btn btn-secondary">
          ← Back to List
        </NuxtLink>
        <div class="editor-title">
          <h1>{{ isEditing ? 'Edit Newsletter' : 'Create Newsletter' }}</h1>
          <p v-if="currentNewsletter?.subject" class="current-subject">
            {{ currentNewsletter.subject }}
          </p>
        </div>
      </div>
      <div class="header-actions">
        <button @click="saveNewsletter" :disabled="saving" class="btn btn-primary">
          {{ saving ? 'Saving...' : 'Save' }}
        </button>
        <button 
          v-if="currentNewsletter?.id && currentNewsletter?.compiled_html"
          @click="sendTest" 
          class="btn btn-secondary"
        >
          Send Test
        </button>
        <select 
          v-if="mailingLists.length > 0"
          v-model="selectedMailingList" 
          class="mailing-list-select"
        >
          <option value="">Select Mailing List</option>
          <option 
            v-for="list in mailingLists" 
            :key="list.id"
            :value="list.id"
          >
            {{ list.name }} ({{ list.subscriber_count }} subscribers)
          </option>
        </select>
        <button 
          v-if="currentNewsletter?.status === 'ready' && selectedMailingList"
          @click="sendToList" 
          class="btn btn-success"
        >
          Send to List
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>{{ loadingMessage }}</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <h3>Error Loading Newsletter</h3>
      <p>{{ error }}</p>
      <button @click="initializeEditor" class="btn btn-primary">
        Try Again
      </button>
    </div>

    <!-- Newsletter Editor -->
    <div v-else-if="currentNewsletter" class="editor-wrapper">
      <NewsletterEditor 
        v-model="currentNewsletter" 
        :show-preview="true"
        @update:compiled="handleCompiled"
      />
    </div>

    <!-- Test Email Modal -->
    <div v-if="showTestModal" class="modal" @click.self="showTestModal = false">
      <div class="modal-content">
        <h3>Send Test Email</h3>
        <p>Send test email for "{{ currentNewsletter?.subject || 'Newsletter' }}"</p>
        <input 
          v-model="testEmail" 
          type="email" 
          placeholder="Enter email address"
          class="form-input"
          @keyup.enter="confirmSendTest"
        />
        <div class="modal-actions">
          <button @click="confirmSendTest" class="btn btn-primary" :disabled="!testEmail">
            Send Test
          </button>
          <button @click="showTestModal = false" class="btn btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Send to List Modal -->
    <div v-if="showSendModal" class="modal" @click.self="showSendModal = false">
      <div class="modal-content">
        <h3>Send Newsletter</h3>
        <p>
          Send "{{ currentNewsletter?.subject || 'Newsletter' }}" to 
          <strong>{{ selectedList?.name }}</strong> 
          ({{ selectedList?.subscriber_count }} subscribers)?
        </p>
        <div class="send-options">
          <label class="checkbox-label">
            <input type="checkbox" v-model="sendOptions.sendNow" />
            <span>Send immediately</span>
          </label>
          <div v-if="!sendOptions.sendNow" class="schedule-section">
            <label class="field-label">Schedule for:</label>
            <input 
              type="datetime-local" 
              v-model="sendOptions.scheduledDate"
              class="form-input"
              :min="minScheduleDate"
            />
          </div>
        </div>
        <div class="modal-actions">
          <button @click="confirmSendToList" class="btn btn-primary" :disabled="sendingToList">
            {{ sendingToList ? 'Sending...' : (sendOptions.sendNow ? 'Send Now' : 'Schedule') }}
          </button>
          <button @click="showSendModal = false" class="btn btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Success/Error Messages -->
    <div v-if="message.show" class="message-toast" :class="message.type">
      {{ message.text }}
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'

// Page metadata
definePageMeta({
  title: 'Newsletter Editor'
})

// URL parameters
const route = useRoute()
const editId = computed(() => route.query.edit)
const shouldShowSendModal = computed(() => route.query.send === 'true')

// State
const loading = ref(false)
const loadingMessage = ref('')
const error = ref(null)
const saving = ref(false)
const sendingToList = ref(false)
const isEditing = ref(false)
const currentNewsletter = ref({
  subject: '',
  preheader: '',
  blocks: [],
  settings: {
    backgroundColor: '#f5f5f5',
    textColor: '#333333',
    fontFamily: 'Arial, sans-serif'
  },
  status: 'draft'
})
const mailingLists = ref([])
const selectedMailingList = ref('')
const showTestModal = ref(false)
const showSendModal = ref(false)
const testEmail = ref('')
const sendOptions = ref({
  sendNow: true,
  scheduledDate: ''
})
const message = ref({
  show: false,
  text: '',
  type: 'success'
})

// Composables
const { 
  fetchNewsletter,
  createNewsletter: createNewsletterInDirectus,
  updateNewsletter: updateNewsletterInDirectus,
  fetchMailingLists,
  fetchMailingListSubscribers,
  fetchBlockTypes
} = useDirectusNewsletter()

const { sendNewsletter: sendViaGrid, sendTestEmail } = useSendGrid()
const { compileNewsletterToMjml, compileMjmlToHtml } = useMjmlCompiler()

// Computed
const selectedList = computed(() => 
  mailingLists.value.find(list => list.id === selectedMailingList.value)
)

const minScheduleDate = computed(() => {
  const now = new Date()
  now.setMinutes(now.getMinutes() + 30) // Minimum 30 minutes from now
  return now.toISOString().slice(0, 16)
})

// Initialize editor
const initializeEditor = async () => {
  loading.value = true
  error.value = null

  try {
    // Load mailing lists
    loadingMessage.value = 'Loading mailing lists...'
    mailingLists.value = await fetchMailingLists()

    // Check if we're editing an existing newsletter
    if (editId.value) {
      loadingMessage.value = 'Loading newsletter...'
      isEditing.value = true
      
      const fullNewsletter = await fetchNewsletter(editId.value)
      
      // Convert to editor format
      const editorData = {
        id: fullNewsletter.id,
        subject: fullNewsletter.subject_line,
        preheader: fullNewsletter.preview_text,
        from_name: fullNewsletter.from_name,
        from_email: fullNewsletter.from_email,
        reply_to: fullNewsletter.reply_to,
        blocks: fullNewsletter.blocks?.map(block => ({
          id: block.id,
          type: typeof block.block_type === 'object' ? block.block_type.slug : block.block_type,
          content: block.content || {},
          sort: block.sort
        })) || [],
        status: fullNewsletter.status,
        mailing_list_id: fullNewsletter.mailing_list_id,
        compiled_mjml: fullNewsletter.compiled_mjml,
        compiled_html: fullNewsletter.compiled_html
      }
      
      // Load into editor
      const { newsletter: editorNewsletter } = useNewsletterEditor(editorData)
      Object.assign(currentNewsletter.value, editorNewsletter.value)
      selectedMailingList.value = fullNewsletter.mailing_list_id || ''
      
      // Show send modal if requested
      if (shouldShowSendModal.value && fullNewsletter.status === 'ready') {
        showSendModal.value = true
      }
    } else {
      // Create new newsletter - currentNewsletter is already initialized with defaults
      isEditing.value = false
    }
  } catch (err) {
    error.value = err.message
    console.error('Error initializing editor:', err)
  } finally {
    loading.value = false
    loadingMessage.value = ''
  }
}

// Save newsletter
const saveNewsletter = async () => {
  saving.value = true
  try {
    // Compile MJML first
    const blockTypes = await fetchBlockTypes()
    const mjml = await compileNewsletterToMjml(currentNewsletter.value, blockTypes)
    const { html } = await compileMjmlToHtml(mjml)
    
    currentNewsletter.value.compiled_mjml = mjml
    currentNewsletter.value.compiled_html = html
    currentNewsletter.value.mailing_list_id = selectedMailingList.value
    
    if (currentNewsletter.value.id) {
      await updateNewsletterInDirectus(currentNewsletter.value.id, currentNewsletter.value)
      showMessage('Newsletter updated successfully!', 'success')
    } else {
      const created = await createNewsletterInDirectus(currentNewsletter.value)
      currentNewsletter.value.id = created.id
      isEditing.value = true
      showMessage('Newsletter created successfully!', 'success')
      
      // Update URL to show we're now editing
      await navigateTo(`/?edit=${created.id}`, { replace: true })
    }
  } catch (err) {
    showMessage('Error saving newsletter: ' + err.message, 'error')
    console.error('Save error:', err)
  } finally {
    saving.value = false
  }
}

// Test email functions
const sendTest = () => {
  testEmail.value = ''
  showTestModal.value = true
}

const confirmSendTest = async () => {
  if (!testEmail.value || !currentNewsletter.value.compiled_html) return
  
  try {
    await sendTestEmail(currentNewsletter.value, testEmail.value)
    showMessage('Test email sent to ' + testEmail.value, 'success')
    showTestModal.value = false
  } catch (err) {
    showMessage('Error sending test: ' + err.message, 'error')
  }
}

// Send to list functions
const sendToList = () => {
  if (!selectedMailingList.value) {
    showMessage('Please select a mailing list', 'error')
    return
  }
  
  // Set default schedule time to 30 minutes from now
  const defaultSchedule = new Date()
  defaultSchedule.setMinutes(defaultSchedule.getMinutes() + 30)
  sendOptions.value.scheduledDate = defaultSchedule.toISOString().slice(0, 16)
  
  showSendModal.value = true
}

const confirmSendToList = async () => {
  sendingToList.value = true
  
  try {
    // Get subscribers from the selected list
    const subscribers = await fetchMailingListSubscribers(selectedMailingList.value)
    
    // Prepare recipients
    const recipients = subscribers.map(sub => ({
      email: sub.email,
      name: sub.name || sub.email,
      custom_args: {
        subscriber_id: sub.id,
        newsletter_id: currentNewsletter.value.id,
        send_record_id: `send_${Date.now()}`
      }
    }))
    
    // Send via SendGrid
    await sendViaGrid(
      currentNewsletter.value,
      recipients,
      {
        fromEmail: currentNewsletter.value.from_email,
        fromName: currentNewsletter.value.from_name,
        replyTo: currentNewsletter.value.reply_to,
        categories: ['newsletter', currentNewsletter.value.category || 'general'],
        sendAt: sendOptions.value.sendNow ? undefined : new Date(sendOptions.value.scheduledDate),
        customArgs: {
          newsletter_id: currentNewsletter.value.id,
          mailing_list_id: selectedMailingList.value
        }
      }
    )
    
    // Update newsletter status
    await updateNewsletterInDirectus(currentNewsletter.value.id, {
      status: sendOptions.value.sendNow ? 'sent' : 'scheduled',
      scheduled_send_date: sendOptions.value.scheduledDate || undefined
    })
    
    const message = sendOptions.value.sendNow 
      ? `Newsletter sent to ${recipients.length} subscribers!`
      : `Newsletter scheduled for ${new Date(sendOptions.value.scheduledDate).toLocaleString()}!`
    
    showMessage(message, 'success')
    showSendModal.value = false
    
    // Navigate back to list after successful send
    setTimeout(() => {
      navigateTo('/list')
    }, 2000)
  } catch (err) {
    showMessage('Error sending newsletter: ' + err.message, 'error')
    console.error('Send error:', err)
  } finally {
    sendingToList.value = false
  }
}

// Handle compiled newsletter from editor
const handleCompiled = (compiled) => {
  if (currentNewsletter.value) {
    currentNewsletter.value.compiled_mjml = compiled.mjml
    currentNewsletter.value.compiled_html = compiled.html
  }
}

// Utility functions
const showMessage = (text, type = 'success') => {
  message.value = { show: true, text, type }
  setTimeout(() => {
    message.value.show = false
  }, 4000)
}

// Watch for route changes
watch(() => route.query.edit, () => {
  initializeEditor()
})

// Initialize on mount
onMounted(() => {
  initializeEditor()
})

// Auto-save every 30 seconds if there are changes
let autoSaveInterval
onMounted(() => {
  autoSaveInterval = setInterval(() => {
    if (currentNewsletter.value?.id && !saving.value) {
      saveNewsletter()
    }
  }, 30000)
})

onUnmounted(() => {
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval)
  }
})
</script>

<style scoped>
.newsletter-editor-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
}

.editor-header {
  background: white;
  padding: 1rem 2rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.editor-title h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
}

.current-subject {
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
  color: #64748b;
  font-style: italic;
}

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.mailing-list-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
  min-width: 200px;
}

.editor-wrapper {
  flex: 1;
  overflow: hidden;
}

/* Loading and Error States */
.loading-state,
.error-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
}

.spinner {
  width: 40px;
  height: 40px;
  margin-bottom: 1rem;
  border: 3px solid #f3f4f6;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-state h3 {
  margin: 0 0 0.5rem;
  color: #1f2937;
}

.error-state p {
  color: #6b7280;
  margin-bottom: 1rem;
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
  white-space: nowrap;
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
  background: #6b7280;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #4b5563;
}

.btn-success {
  background: #10b981;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #059669;
}

/* Modal Styles */
.modal {
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
  padding: 2rem;
  border-radius: 12px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
}

.modal-content h3 {
  margin: 0 0 1rem;
  font-size: 1.25rem;
  color: #1f2937;
}

.modal-content p {
  margin: 0.5rem 0 1rem;
  color: #6b7280;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
  margin-bottom: 1rem;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

/* Send Options */
.send-options {
  margin: 1rem 0;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
  margin: 0;
}

.schedule-section {
  margin-top: 1rem;
}

.field-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
}

/* Message Toast */
.message-toast {
  position: fixed;
  top: 2rem;
  right: 2rem;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  animation: slideIn 0.3s ease-out;
  max-width: 400px;
}

.message-toast.success {
  background: #d1fae5;
  color: #047857;
  border: 1px solid #a7f3d0;
}

.message-toast.error {
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
  .editor-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
    padding: 1rem;
  }
  
  .header-left {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }
  
  .header-actions {
    flex-wrap: wrap;
    justify-content: space-between;
  }
  
  .mailing-list-select {
    min-width: auto;
    flex: 1;
  }
  
  .modal {
    padding: 1rem;
  }
  
  .modal-actions {
    flex-direction: column-reverse;
  }
}
</style>