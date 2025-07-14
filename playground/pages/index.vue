<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
    <!-- Enhanced Loading State -->
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto shadow-lg">
          <Icon name="lucide:loader-2" class="w-8 h-8 text-white animate-spin" />
        </div>
        <h3 class="text-xl font-semibold text-slate-900 mb-2">{{ loadingMessage }}</h3>
        <p class="text-slate-600">Setting up your newsletter editor...</p>
        <div class="flex items-center justify-center space-x-1 mt-4">
          <div class="w-2 h-2 rounded-full bg-blue-500 animate-bounce"></div>
          <div class="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style="animation-delay: 0.1s"></div>
          <div class="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style="animation-delay: 0.2s"></div>
        </div>
      </div>
    </div>

    <!-- Enhanced Error State -->
    <div v-else-if="error" class="flex items-center justify-center min-h-screen p-4">
      <div class="text-center max-w-md">
        <div class="w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center mx-auto">
          <Icon name="lucide:alert-triangle" class="w-8 h-8 text-red-600" />
        </div>
        <h3 class="text-xl font-semibold text-slate-900 mb-2">Unable to Load Editor</h3>
        <p class="text-slate-600 mb-6">{{ error }}</p>
        <div class="space-y-3">
          <button 
            @click="initializeEditor" 
            class="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Icon name="lucide:refresh-cw" class="w-4 h-4 mr-2" />
            Try Again
          </button>
          <div class="text-sm text-slate-500">
            <p>Need help? Check the console for detailed error information.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Enhanced Main Editor Interface -->
    <div v-else-if="editorNewsletter" class="h-screen overflow-hidden">
      <!-- Enhanced Top Navigation -->
      <div class="bg-white/90 backdrop-blur-sm border-b border-slate-200/60 px-6 py-4 shadow-sm">
        <div class="flex items-center justify-between">
          <!-- Enhanced Logo/Brand -->
          <div class="flex items-center space-x-4">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
                <Icon name="lucide:mail" class="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 class="text-xl font-bold text-slate-900">Newsletter Studio</h1>
                <p class="text-sm text-slate-600">Create beautiful email campaigns</p>
              </div>
            </div>
          </div>

          <!-- Enhanced Action Buttons -->
          <div class="flex items-center space-x-3">
            <!-- Save Status Indicator -->
            <div v-if="saving" class="flex items-center space-x-2 text-sm text-slate-600">
              <Icon name="lucide:loader-2" class="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </div>
            <div v-else-if="lastSaved" class="flex items-center space-x-2 text-sm text-green-600">
              <Icon name="lucide:check-circle" class="w-4 h-4" />
              <span>Saved {{ formatTimeAgo(lastSaved) }}</span>
            </div>

            <!-- Test Email Button -->
            <button
              @click="showTestModal = true"
              :disabled="!editorNewsletter.subject_line || saving"
              class="inline-flex items-center px-4 py-2.5 border border-slate-300 text-sm font-medium rounded-xl text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow"
            >
              <Icon name="lucide:send" class="w-4 h-4 mr-2" />
              Test Email
            </button>

            <!-- Save Button -->
            <button
              @click="saveNewsletter"
              :disabled="saving || !editorNewsletter.subject_line"
              class="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Icon :name="saving ? 'lucide:loader-2' : 'lucide:save'" class="w-4 h-4 mr-2" :class="{ 'animate-spin': saving }" />
              {{ saving ? 'Saving...' : 'Save Draft' }}
            </button>

            <!-- Send Button -->
            <button
              v-if="isEditing && editorNewsletter.id"
              @click="showSendModal = true"
              :disabled="!editorNewsletter.subject_line || saving"
              class="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Icon name="lucide:mail" class="w-4 h-4 mr-2" />
              Send Newsletter
            </button>
          </div>
        </div>
      </div>

      <!-- Enhanced Newsletter Editor -->
      <div class="h-[calc(100vh-80px)]">
        <NewsletterEditor
          v-model="editorNewsletter"
          :show-preview="true"
          @update:compiled="handleCompiled"
          @save="saveNewsletter"
        />
      </div>
    </div>

    <!-- Enhanced Test Email Modal -->
    <Transition
      enter-active-class="transition ease-out duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showTestModal"
        class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        @click.self="showTestModal = false"
      >
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
          <!-- Modal Header -->
          <div class="bg-gradient-to-r from-blue-50 to-blue-100/50 p-6 border-b border-blue-200/60">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Icon name="lucide:send" class="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-slate-900">Send Test Email</h3>
                <p class="text-sm text-slate-600">Preview your newsletter in your inbox</p>
              </div>
            </div>
          </div>

          <!-- Modal Body -->
          <div class="p-6 space-y-4">
            <div>
              <label for="test-email" class="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>
              <input
                id="test-email"
                v-model="testEmail"
                type="email"
                placeholder="your.email@example.com"
                class="block w-full px-4 py-3 text-sm border border-slate-300 rounded-xl shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                @keyup.enter="sendTestEmail"
              />
            </div>

            <div class="bg-slate-50 rounded-xl p-4">
              <div class="flex items-start space-x-3">
                <Icon name="lucide:info" class="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div class="text-sm text-slate-700">
                  <p class="font-medium mb-1">Test Email Preview</p>
                  <p><strong>Subject:</strong> {{ editorNewsletter?.subject_line || 'No subject' }}</p>
                  <p><strong>From:</strong> {{ editorNewsletter?.from_name || 'Newsletter' }} &lt;{{ editorNewsletter?.from_email || 'newsletter@example.com' }}&gt;</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="flex items-center justify-end space-x-3 p-6 border-t border-slate-200 bg-slate-50">
            <button
              @click="showTestModal = false"
              class="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              @click="sendTestEmail"
              :disabled="!testEmail || sendingTest"
              class="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Icon :name="sendingTest ? 'lucide:loader-2' : 'lucide:send'" class="w-4 h-4 mr-2" :class="{ 'animate-spin': sendingTest }" />
              {{ sendingTest ? 'Sending...' : 'Send Test' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Enhanced Send Newsletter Modal -->
    <Transition
      enter-active-class="transition ease-out duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showSendModal"
        class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        @click.self="showSendModal = false"
      >
        <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
          <!-- Modal Header -->
          <div class="bg-gradient-to-r from-green-50 to-green-100/50 p-6 border-b border-green-200/60">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                <Icon name="lucide:mail" class="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-slate-900">Send Newsletter</h3>
                <p class="text-sm text-slate-600">Deliver to your mailing list</p>
              </div>
            </div>
          </div>

          <!-- Modal Body -->
          <div class="p-6 space-y-6">
            <!-- Mailing List Selection -->
            <div>
              <label for="mailing-list" class="block text-sm font-medium text-slate-700 mb-2">
                Select Mailing List
              </label>
              <select
                id="mailing-list"
                v-model="selectedMailingList"
                class="block w-full px-4 py-3 text-sm border border-slate-300 rounded-xl shadow-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-200"
              >
                <option value="">Choose a mailing list...</option>
                <option v-for="list in mailingLists" :key="list.id" :value="list.id">
                  {{ list.name }} ({{ list.subscriber_count || 0 }} subscribers)
                </option>
              </select>
            </div>

            <!-- Selected List Info -->
            <div v-if="selectedList" class="bg-green-50 rounded-xl p-4">
              <div class="flex items-start space-x-3">
                <Icon name="lucide:users" class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div class="text-sm text-green-800">
                  <p class="font-medium mb-1">{{ selectedList.name }}</p>
                  <p>{{ selectedList.subscriber_count || 0 }} active subscribers</p>
                  <p v-if="selectedList.description" class="text-green-700 mt-1">{{ selectedList.description }}</p>
                </div>
              </div>
            </div>

            <!-- Send Options -->
            <div class="space-y-4">
              <h4 class="text-sm font-medium text-slate-900">Send Options</h4>
              
              <div class="space-y-3">
                <label class="flex items-center space-x-3">
                  <input
                    v-model="sendOptions.sendNow"
                    type="radio"
                    :value="true"
                    name="sendTiming"
                    class="w-4 h-4 text-green-600 border-slate-300 focus:ring-green-500"
                  />
                  <div>
                    <span class="text-sm font-medium text-slate-900">Send Now</span>
                    <p class="text-xs text-slate-600">Newsletter will be sent immediately</p>
                  </div>
                </label>

                <label class="flex items-center space-x-3">
                  <input
                    v-model="sendOptions.sendNow"
                    type="radio"
                    :value="false"
                    name="sendTiming"
                    class="w-4 h-4 text-green-600 border-slate-300 focus:ring-green-500"
                  />
                  <div>
                    <span class="text-sm font-medium text-slate-900">Schedule for Later</span>
                    <p class="text-xs text-slate-600">Choose when to send your newsletter</p>
                  </div>
                </label>

                <div v-if="!sendOptions.sendNow" class="ml-7">
                  <input
                    v-model="sendOptions.scheduledDate"
                    type="datetime-local"
                    :min="minScheduleDate"
                    class="block w-full px-4 py-3 text-sm border border-slate-300 rounded-xl shadow-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            <!-- Newsletter Preview -->
            <div class="bg-slate-50 rounded-xl p-4">
              <h4 class="text-sm font-medium text-slate-900 mb-2">Newsletter Preview</h4>
              <div class="text-sm text-slate-700 space-y-1">
                <p><strong>Subject:</strong> {{ editorNewsletter?.subject_line }}</p>
                <p><strong>From:</strong> {{ editorNewsletter?.from_name }} &lt;{{ editorNewsletter?.from_email }}&gt;</p>
                <p v-if="editorNewsletter?.preview_text"><strong>Preview:</strong> {{ editorNewsletter.preview_text }}</p>
              </div>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="flex items-center justify-end space-x-3 p-6 border-t border-slate-200 bg-slate-50">
            <button
              @click="showSendModal = false"
              class="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              @click="sendToList"
              :disabled="!selectedMailingList || sendingToList || (!sendOptions.sendNow && !sendOptions.scheduledDate)"
              class="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Icon :name="sendingToList ? 'lucide:loader-2' : 'lucide:send'" class="w-4 h-4 mr-2" :class="{ 'animate-spin': sendingToList }" />
              {{ sendingToList ? 'Sending...' : (sendOptions.sendNow ? 'Send Now' : 'Schedule Send') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

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
        v-if="message.show"
        class="fixed top-6 right-6 max-w-sm w-full z-50"
      >
        <div class="bg-white rounded-xl shadow-xl ring-1 ring-black/5 overflow-hidden">
          <div class="p-4">
            <div class="flex items-start space-x-3">
              <div class="flex-shrink-0">
                <div 
                  class="w-8 h-8 rounded-lg flex items-center justify-center"
                  :class="message.type === 'success' ? 'bg-green-100' : 'bg-red-100'"
                >
                  <Icon
                    :name="message.type === 'success' ? 'lucide:check-circle' : 'lucide:alert-circle'"
                    :class="message.type === 'success' ? 'text-green-600' : 'text-red-600'"
                    class="w-5 h-5"
                  />
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-slate-900">{{ message.text }}</p>
              </div>
              <button
                @click="message.show = false"
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
import { navigateTo, useRoute } from '#app'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

// Page metadata
definePageMeta({
  title: 'Newsletter Studio - Create Beautiful Email Campaigns'
})

// URL parameters
const route = useRoute()
const editId = computed(() => route.query.edit)
const shouldShowSendModal = computed(() => route.query.send === 'true')

// Enhanced state management
const loading = ref(false)
const loadingMessage = ref('')
const error = ref(null)
const saving = ref(false)
const sendingTest = ref(false)
const sendingToList = ref(false)
const isEditing = ref(false)
const lastSaved = ref(null)

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

const { sendNewsletter: sendViaGrid, sendTestEmail: sendTestViaGrid } = useSendGrid()
const { compileNewsletterToMjml, compileMjmlToHtml } = useMjmlCompiler()

// Enhanced newsletter editor
const { 
  newsletter: editorNewsletter, 
  blocks, 
  addBlock, 
  removeBlock, 
  updateBlock, 
  moveBlock, 
  duplicateBlock, 
  loadFromTemplate, 
  subject, 
  preheader 
} = useNewsletterEditor()

// Enhanced computed properties
const selectedList = computed(() =>
  mailingLists.value.find(list => list.id === selectedMailingList.value)
)

const minScheduleDate = computed(() => {
  const now = new Date()
  now.setMinutes(now.getMinutes() + 30) // Minimum 30 minutes from now
  return now.toISOString().slice(0, 16)
})

// Enhanced utility functions
const formatTimeAgo = (date) => {
  const now = new Date()
  const diff = now - new Date(date)
  const minutes = Math.floor(diff / 60000)
  
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`
  return `${Math.floor(minutes / 1440)}d ago`
}

const showMessage = (text, type = 'success') => {
  message.value = { show: true, text, type }
  setTimeout(() => {
    message.value.show = false
  }, 5000)
}

// Enhanced initialization
const initializeEditor = async () => {
  loading.value = true
  error.value = null

  try {
    // Load mailing lists
    loadingMessage.value = 'Loading mailing lists...'
    mailingLists.value = await fetchMailingLists()

    // Load block types
    loadingMessage.value = 'Loading content blocks...'
    await fetchBlockTypes()

    // Check if editing existing newsletter
    if (editId.value) {
      loadingMessage.value = 'Loading newsletter...'
      const newsletter = await fetchNewsletter(editId.value)
      Object.assign(editorNewsletter.value, newsletter)
      isEditing.value = true
    } else {
      // Create new newsletter
      isEditing.value = false
    }

    // Handle send modal from URL
    if (shouldShowSendModal.value) {
      showSendModal.value = true
    }

  } catch (err) {
    console.error('Initialization error:', err)
    error.value = err.message || 'Failed to initialize newsletter editor'
  } finally {
    loading.value = false
  }
}

// Enhanced save functionality
const saveNewsletter = async () => {
  if (!editorNewsletter.value.subject_line?.trim()) {
    showMessage('Please add a subject line before saving', 'error')
    return
  }

  saving.value = true
  try {
    let result
    if (isEditing.value && editorNewsletter.value.id) {
      result = await updateNewsletterInDirectus(editorNewsletter.value.id, editorNewsletter.value)
    } else {
      result = await createNewsletterInDirectus(editorNewsletter.value)
      isEditing.value = true
      
      // Update URL to reflect editing state
      await navigateTo(`/?edit=${result.id}`)
    }
    
    lastSaved.value = new Date()
    showMessage('Newsletter saved successfully')
    
    // Update local newsletter data
    Object.assign(editorNewsletter.value, result)
  } catch (err) {
    console.error('Save error:', err)
    showMessage('Failed to save newsletter', 'error')
  } finally {
    saving.value = false
  }
}

// Enhanced test email
const sendTestEmail = async () => {
  if (!testEmail.value?.trim()) {
    showMessage('Please enter an email address', 'error')
    return
  }

  if (!editorNewsletter.value.subject_line?.trim()) {
    showMessage('Please add a subject line before sending', 'error')
    return
  }

  sendingTest.value = true
  try {
    await sendTestViaGrid(editorNewsletter.value, testEmail.value)
    showMessage(`Test email sent to ${testEmail.value}`)
    showTestModal.value = false
    testEmail.value = ''
  } catch (err) {
    console.error('Test email error:', err)
    showMessage('Failed to send test email', 'error')
  } finally {
    sendingTest.value = false
  }
}

// Enhanced send to list
const sendToList = async () => {
  if (!selectedMailingList.value) {
    showMessage('Please select a mailing list', 'error')
    return
  }

  sendingToList.value = true
  try {
    const subscribers = await fetchMailingListSubscribers(selectedMailingList.value)
    
    if (!subscribers.length) {
      showMessage('No active subscribers in selected list', 'error')
      return
    }

    const sendData = {
      newsletter: editorNewsletter.value,
      recipients: subscribers,
      sendNow: sendOptions.value.sendNow,
      scheduledDate: sendOptions.value.scheduledDate
    }

    await sendViaGrid(sendData)
    
    const listName = selectedList.value?.name || 'selected list'
    const successMessage = sendOptions.value.sendNow 
      ? `Newsletter sent to ${subscribers.length} subscribers in ${listName}`
      : `Newsletter scheduled for ${listName} (${subscribers.length} subscribers)`
      
    showMessage(successMessage)
    showSendModal.value = false
    
    // Reset send options
    sendOptions.value = { sendNow: true, scheduledDate: '' }
    selectedMailingList.value = ''
    
  } catch (err) {
    console.error('Send to list error:', err)
    showMessage('Failed to send newsletter', 'error')
  } finally {
    sendingToList.value = false
  }
}

// Handle compiled output
const handleCompiled = (compiled) => {
  if (editorNewsletter.value) {
    editorNewsletter.value.compiled_mjml = compiled.mjml
    editorNewsletter.value.compiled_html = compiled.html
  }
}

// Auto-save functionality
let autoSaveTimeout = null
watch(editorNewsletter, () => {
  if (autoSaveTimeout) clearTimeout(autoSaveTimeout)
  if (isEditing.value && editorNewsletter.value.id) {
    autoSaveTimeout = setTimeout(() => {
      saveNewsletter()
    }, 30000) // Auto-save every 30 seconds
  }
}, { deep: true })

// Keyboard shortcuts
const handleKeyDown = (e) => {
  // Ctrl/Cmd + S to save
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    saveNewsletter()
  }
}

// Lifecycle
onMounted(() => {
  initializeEditor()
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
  if (autoSaveTimeout) clearTimeout(autoSaveTimeout)
})
</script>

<style scoped>
/* Enhanced scrollbar styling */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
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

/* Enhanced bounce animation */
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

/* Enhanced backdrop blur fallback */
.backdrop-blur-sm {
  backdrop-filter: blur(4px);
}

@supports not (backdrop-filter: blur(4px)) {
  .backdrop-blur-sm {
    background-color: rgba(255, 255, 255, 0.9);
  }
}
</style>