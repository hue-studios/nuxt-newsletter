<template>
  <div class="newsletter-admin">
    <div class="admin-header">
      <h1>Newsletter Management</h1>
      <div class="header-actions">
        <button @click="createNew" class="btn btn-primary">
          Create Newsletter
        </button>
      </div>
    </div>

    <!-- Newsletter List -->
    <div v-if="!editingNewsletter" class="newsletter-list">
      <div v-if="loading" class="loading">
        Loading newsletters...
      </div>
      
      <div v-else-if="error" class="error">
        Error loading newsletters: {{ error }}
      </div>
      
      <div v-else-if="newsletters.length === 0" class="empty-state">
        <p>No newsletters yet. Create your first one!</p>
      </div>
      
      <div v-else class="newsletters-grid">
        <div 
          v-for="newsletter in newsletters" 
          :key="newsletter.id"
          class="newsletter-card"
        >
          <div class="card-header">
            <h3>{{ newsletter.title }}</h3>
            <span class="status" :class="`status-${newsletter.status}`">
              {{ newsletter.status }}
            </span>
          </div>
          
          <div class="card-body">
            <p class="subject">{{ newsletter.subject_line }}</p>
            <div class="meta">
              <span>{{ newsletter.blocks?.length || 0 }} blocks</span>
              <span>{{ formatDate(newsletter.date_created) }}</span>
            </div>
          </div>
          
          <div class="card-actions">
            <button @click="editNewsletter(newsletter)" class="btn btn-sm">
              Edit
            </button>
            <button @click="duplicateNewsletter(newsletter)" class="btn btn-sm">
              Duplicate
            </button>
            <button 
              v-if="newsletter.status === 'ready'"
              @click="sendNewsletter(newsletter)" 
              class="btn btn-sm btn-success"
            >
              Send
            </button>
            <button @click="deleteNewsletterConfirm(newsletter)" class="btn btn-sm btn-danger">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Newsletter Editor -->
    <div v-else class="newsletter-editor-wrapper">
      <div class="editor-header">
        <button @click="closeEditor" class="btn btn-secondary">
          ← Back to List
        </button>
        <div class="editor-actions">
          <button @click="saveNewsletter" :disabled="saving" class="btn btn-primary">
            {{ saving ? 'Saving...' : 'Save' }}
          </button>
          <button @click="sendTest" class="btn btn-secondary">
            Send Test
          </button>
          <select v-model="selectedMailingList" class="mailing-list-select">
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
            v-if="currentNewsletter.status === 'ready'"
            @click="sendToList" 
            class="btn btn-success"
            :disabled="!selectedMailingList"
          >
            Send to List
          </button>
        </div>
      </div>

      <NewsletterEditor 
        v-model="currentNewsletter" 
        :show-preview="true"
      />
    </div>

    <!-- Test Email Modal -->
    <div v-if="showTestModal" class="modal" @click.self="showTestModal = false">
      <div class="modal-content">
        <h3>Send Test Email</h3>
        <input 
          v-model="testEmail" 
          type="email" 
          placeholder="Enter email address"
          class="form-input"
          @keyup.enter="confirmSendTest"
        />
        <div class="modal-actions">
          <button @click="confirmSendTest" class="btn btn-primary">
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
          Send "{{ currentNewsletter.subject }}" to 
          <strong>{{ selectedList?.name }}</strong> 
          ({{ selectedList?.subscriber_count }} subscribers)?
        </p>
        <div class="send-options">
          <label>
            <input type="checkbox" v-model="sendOptions.sendNow" />
            Send immediately
          </label>
          <div v-if="!sendOptions.sendNow" class="schedule-input">
            <label>Schedule for:</label>
            <input 
              type="datetime-local" 
              v-model="sendOptions.scheduledDate"
              class="form-input"
            />
          </div>
        </div>
        <div class="modal-actions">
          <button @click="confirmSendToList" class="btn btn-primary">
            {{ sendOptions.sendNow ? 'Send Now' : 'Schedule' }}
          </button>
          <button @click="showSendModal = false" class="btn btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useDirectusNewsletter } from '#newsletter/composables/useDirectusNewsletter'
import { useMjmlCompiler } from '#newsletter/composables/useMjmlCompiler'
import { useNewsletterEditor } from '#newsletter/composables/useNewsletterEditor'
import { useSendGrid } from '#newsletter/composables/useSendGrid'
import { computed, onMounted, ref } from 'vue'

// State
const newsletters = ref([])
const mailingLists = ref([])
const loading = ref(true)
const error = ref(null)
const saving = ref(false)
const editingNewsletter = ref(false)
const currentNewsletter = ref(null)
const selectedMailingList = ref('')
const showTestModal = ref(false)
const showSendModal = ref(false)
const testEmail = ref('')
const sendOptions = ref({
  sendNow: true,
  scheduledDate: ''
})

// Composables
const { 
  fetchNewsletters, 
  fetchNewsletter,
  createNewsletter: createNewsletterInDirectus,
  updateNewsletter: updateNewsletterInDirectus,
  deleteNewsletter: deleteNewsletterFromDirectus,
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

// Load data
onMounted(async () => {
  try {
    const [newsletterData, listData] = await Promise.all([
      fetchNewsletters({ limit: 20 }),
      fetchMailingLists()
    ])
    newsletters.value = newsletterData
    mailingLists.value = listData
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
})

// Methods
const createNew = () => {
  const { newsletter } = useNewsletterEditor()
  currentNewsletter.value = newsletter.value
  editingNewsletter.value = true
}

const editNewsletter = async (newsletter) => {
  try {
    // Fetch full newsletter with blocks
    const fullNewsletter = await fetchNewsletter(newsletter.id)
    
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
        type: block.block_type.slug,
        content: block.content || {},
        sort: block.sort
      })) || [],
      status: fullNewsletter.status,
      mailing_list_id: fullNewsletter.mailing_list_id
    }
    
    const { newsletter } = useNewsletterEditor(editorData)
    currentNewsletter.value = newsletter.value
    editingNewsletter.value = true
    selectedMailingList.value = fullNewsletter.mailing_list_id || ''
  } catch (err) {
    alert('Error loading newsletter: ' + err.message)
  }
}

const duplicateNewsletter = async (newsletter) => {
  try {
    const copy = { ...newsletter }
    delete copy.id
    copy.title = `${copy.title} (Copy)`
    copy.subject_line = `${copy.subject_line} (Copy)`
    copy.status = 'draft'
    
    await createNewsletterInDirectus(copy)
    await refreshNewsletters()
  } catch (err) {
    alert('Error duplicating newsletter: ' + err.message)
  }
}

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
    } else {
      const created = await createNewsletterInDirectus(currentNewsletter.value)
      currentNewsletter.value.id = created.id
    }
    
    alert('Newsletter saved successfully!')
  } catch (err) {
    alert('Error saving newsletter: ' + err.message)
  } finally {
    saving.value = false
  }
}

const sendTest = () => {
  testEmail.value = ''
  showTestModal.value = true
}

const confirmSendTest = async () => {
  if (!testEmail.value) return
  
  try {
    await sendTestEmail(currentNewsletter.value, testEmail.value)
    alert('Test email sent to ' + testEmail.value)
    showTestModal.value = false
  } catch (err) {
    alert('Error sending test: ' + err.message)
  }
}

const sendToList = () => {
  if (!selectedMailingList.value) {
    alert('Please select a mailing list')
    return
  }
  showSendModal.value = true
}

const confirmSendToList = async () => {
  try {
    // Get subscribers from the selected list
    const subscribers = await fetchMailingListSubscribers(selectedMailingList.value)
    
    // Prepare recipients
    const recipients = subscribers.map(sub => ({
      email: sub.email,
      name: sub.name || sub.email
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
        sendAt: sendOptions.value.sendNow ? undefined : new Date(sendOptions.value.scheduledDate)
      }
    )
    
    // Update newsletter status
    await updateNewsletterInDirectus(currentNewsletter.value.id, {
      status: sendOptions.value.sendNow ? 'sent' : 'scheduled',
      scheduled_send_date: sendOptions.value.scheduledDate || undefined
    })
    
    alert(sendOptions.value.sendNow ? 'Newsletter sent!' : 'Newsletter scheduled!')
    showSendModal.value = false
    closeEditor()
  } catch (err) {
    alert('Error sending newsletter: ' + err.message)
  }
}

const deleteNewsletterConfirm = async (newsletter) => {
  if (confirm(`Delete "${newsletter.title}"? This cannot be undone.`)) {
    try {
      await deleteNewsletterFromDirectus(newsletter.id)
      await refreshNewsletters()
    } catch (err) {
      alert('Error deleting newsletter: ' + err.message)
    }
  }
}

const closeEditor = () => {
  editingNewsletter.value = false
  currentNewsletter.value = null
  refreshNewsletters()
}

const refreshNewsletters = async () => {
  try {
    newsletters.value = await fetchNewsletters({ limit: 20 })
  } catch (err) {
    console.error('Error refreshing newsletters:', err)
  }
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString()
}
</script>

<style scoped>
.newsletter-admin {
  min-height: 100vh;
  background: #f5f5f5;
}

.admin-header {
  background: white;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e5e5e5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.admin-header h1 {
  margin: 0;
  font-size: 2rem;
  color: #333;
}

/* Newsletter List */
.newsletter-list {
  padding: 2rem;
}

.newsletters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.newsletter-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  overflow: hidden;
  transition: box-shadow 0.2s;
}

.newsletter-card:hover {
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.card-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e5e5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #333;
}

.status {
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
}

.status-draft { background: #f3f4f6; color: #6b7280; }
.status-ready { background: #dbeafe; color: #2563eb; }
.status-scheduled { background: #f3e8ff; color: #7c3aed; }
.status-sent { background: #d1fae5; color: #059669; }

.card-body {
  padding: 1.5rem;
}

.subject {
  margin: 0 0 1rem;
  color: #555;
}

.meta {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: #999;
}

.card-actions {
  padding: 1rem 1.5rem;
  background: #f9fafb;
  display: flex;
  gap: 0.5rem;
}

/* Editor */
.newsletter-editor-wrapper {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.editor-header {
  background: white;
  padding: 1rem 2rem;
  border-bottom: 1px solid #e5e5e5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.editor-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.mailing-list-select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

/* Buttons */
.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
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

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
}

/* States */
.loading,
.error,
.empty-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.error {
  color: #ef4444;
}

/* Modal */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
}

.modal-content h3 {
  margin: 0 0 1rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  margin-bottom: 1rem;
}

.modal-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.send-options {
  margin: 1rem 0;
}

.send-options label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.schedule-input {
  margin-top: 1rem;
}

.schedule-input label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}
</style>