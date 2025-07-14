<!-- playground/pages/index.vue -->
<template>
  <div class="flex flex-col h-screen bg-gray-100 font-sans antialiased">
    <!-- Editor Header -->
    <div class="flex items-center justify-between bg-white px-4 py-3 border-b border-gray-200 shadow-sm flex-shrink-0">
      <div class="flex items-center space-x-4">
        <NuxtLink to="/list" class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
          <Icon name="lucide:arrow-left" class="w-4 h-4 mr-2" />
          Back to List
        </NuxtLink>
        <div class="flex flex-col">
          <h1 class="text-xl font-semibold text-gray-900">{{ isEditing ? 'Edit Newsletter' : 'Create Newsletter' }}</h1>
          <p v-if="editorNewsletter?.subject_line" class="text-sm text-gray-500 italic mt-0.5">
            {{ editorNewsletter.subject_line }}
          </p>
        </div>
      </div>
      <div class="flex items-center space-x-3">
        <button @click="saveNewsletter" :disabled="saving" class="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
          <Icon name="lucide:save" class="w-4 h-4 mr-2" :class="{ 'animate-spin': saving }" />
          {{ saving ? 'Saving...' : 'Save' }}
        </button>
        <button
          v-if="editorNewsletter?.id && editorNewsletter?.compiled_html"
          @click="sendTest"
          class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <Icon name="lucide:mail" class="w-4 h-4 mr-2" />
          Send Test
        </button>
        <select
          v-if="mailingLists.length > 0"
          v-model="selectedMailingList"
          class="px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors min-w-[180px]"
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
          v-if="editorNewsletter?.status === 'ready' && selectedMailingList"
          @click="sendToList"
          class="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
        >
          <Icon name="lucide:send" class="w-4 h-4 mr-2" />
          Send to List
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50">
      <Icon name="lucide:loader-2" class="w-12 h-12 text-blue-500 animate-spin mb-4" />
      <p class="text-lg text-gray-700 font-medium">{{ loadingMessage }}</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50">
      <Icon name="lucide:alert-triangle" class="w-12 h-12 text-red-500 mb-4" />
      <h3 class="text-xl font-semibold text-gray-900 mb-2">Error Loading Newsletter</h3>
      <p class="text-gray-600 mb-6">{{ error }}</p>
      <button @click="initializeEditor" class="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
        <Icon name="lucide:refresh-cw" class="w-5 h-5 mr-2" />
        Try Again
      </button>
    </div>

    <!-- Newsletter Editor -->
    <div v-else-if="editorNewsletter" class="flex-1 overflow-hidden">
      <NewsletterEditor
        v-model="editorNewsletter"
        :show-preview="true"
        @update:compiled="handleCompiled"
      />
    </div>

    <!-- Test Email Modal -->
    <div v-if="showTestModal" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50 transition-opacity duration-300">
      <div class="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 sm:p-8 transform scale-100 opacity-100 transition-all duration-300">
        <h3 class="text-xl font-semibold text-gray-900 mb-4">Send Test Email</h3>
        <p class="text-gray-600 mb-6">Send test email for "<span class="font-medium">{{ editorNewsletter?.subject_line || 'Newsletter' }}</span>"</p>
        <input
          v-model="testEmail"
          type="email"
          placeholder="Enter recipient email address"
          class="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
          @keyup.enter="confirmSendTest"
        />
        <div class="flex justify-end space-x-3 mt-6">
          <button @click="showTestModal = false" class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
            Cancel
          </button>
          <button @click="confirmSendTest" class="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors" :disabled="!testEmail">
            Send Test
          </button>
        </div>
      </div>
    </div>

    <!-- Send to List Modal -->
    <div v-if="showSendModal" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50 transition-opacity duration-300">
      <div class="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 sm:p-8 transform scale-100 opacity-100 transition-all duration-300">
        <h3 class="text-xl font-semibold text-gray-900 mb-4">Send Newsletter</h3>
        <p class="text-gray-600 mb-6">
          Send "<span class="font-medium">{{ editorNewsletter?.subject_line || 'Newsletter' }}</span>" to
          <strong class="text-blue-600">{{ selectedList?.name }}</strong>
          (<span class="font-medium">{{ selectedList?.subscriber_count }}</span> subscribers)?
        </p>
        <div class="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-6">
          <label class="flex items-center space-x-2 cursor-pointer mb-4">
            <input type="checkbox" v-model="sendOptions.sendNow" class="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500 transition-colors" />
            <span class="text-gray-700 font-medium">Send immediately</span>
          </label>
          <div v-if="!sendOptions.sendNow" class="mt-4 pt-4 border-t border-gray-200">
            <label for="scheduledDate" class="block text-sm font-medium text-gray-700 mb-2">Schedule for:</label>
            <input
              id="scheduledDate"
              type="datetime-local"
              v-model="sendOptions.scheduledDate"
              class="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
              :min="minScheduleDate"
            />
          </div>
        </div>
        <div class="flex justify-end space-x-3 mt-6">
          <button @click="showSendModal = false" class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
            Cancel
          </button>
          <button @click="confirmSendToList" class="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors" :disabled="sendingToList">
            <Icon v-if="sendingToList" name="lucide:loader-2" class="w-4 h-4 mr-2 animate-spin" />
            {{ sendingToList ? 'Sending...' : (sendOptions.sendNow ? 'Send Now' : 'Schedule') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Success/Error Messages (Toast) -->
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
        class="fixed top-4 right-4 max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden z-50"
        :class="{
          'bg-green-50 border border-green-200 text-green-800': message.type === 'success',
          'bg-red-50 border border-red-200 text-red-800': message.type === 'error'
        }"
      >
        <div class="p-4">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <Icon
                :name="message.type === 'success' ? 'lucide:check-circle' : 'lucide:alert-circle'"
                :class="message.type === 'success' ? 'text-green-400' : 'text-red-400'"
                class="w-6 h-6"
              />
            </div>
            <div class="ml-3 w-0 flex-1 pt-0.5">
              <p class="text-sm font-medium">{{ message.text }}</p>
            </div>
            <div class="ml-4 flex-shrink-0 flex">
              <button
                @click="message.show = false"
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

<script setup>
import { navigateTo, useRoute } from '#app'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

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
// Use the NewsletterEditor composable, which now manages the newsletter data structure
const { newsletter: editorNewsletter, blocks, addBlock, removeBlock, updateBlock, moveBlock, duplicateBlock, loadFromTemplate, subject, preheader } = useNewsletterEditor()


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

      // Map Directus fields to NewsletterData structure
      editorNewsletter.value.id = fullNewsletter.id;
      editorNewsletter.value.title = fullNewsletter.title; // Map Directus title
      editorNewsletter.value.subject_line = fullNewsletter.subject_line; // Map Directus subject_line
      editorNewsletter.value.preview_text = fullNewsletter.preview_text; // Map Directus preview_text
      editorNewsletter.value.from_name = fullNewsletter.from_name;
      editorNewsletter.value.from_email = fullNewsletter.from_email;
      editorNewsletter.value.reply_to = fullNewsletter.reply_to;
      editorNewsletter.value.status = fullNewsletter.status;
      editorNewsletter.value.mailing_list_id = fullNewsletter.mailing_list_id;
      editorNewsletter.value.compiled_mjml = fullNewsletter.compiled_mjml;
      editorNewsletter.value.compiled_html = fullNewsletter.compiled_html;
      editorNewsletter.value.category = fullNewsletter.category; // Ensure category is mapped

      // Transform blocks for editor: Directus block_type object to slug string
      editorNewsletter.value.blocks = fullNewsletter.blocks?.map(block => ({
        id: block.id,
        type: typeof block.block_type === 'object' ? block.block_type.slug : block.block_type,
        content: block.content || {},
        sort: block.sort
      })) || [];


      selectedMailingList.value = fullNewsletter.mailing_list_id || ''

      // Show send modal if requested
      if (shouldShowSendModal.value && fullNewsletter.status === 'ready') {
        showSendModal.value = true
      }
    } else {
      // Create new newsletter - editorNewsletter is already initialized with defaults
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
    // 1. Fetch block types if not already loaded (important for mapping slugs to IDs)
    // This is managed by NewsletterEditor.vue now, but we need the data here.
    // Assuming blockTypes in NewsletterEditor.vue is already populated.
    // If not, we'd need to fetch it here or pass it from NewsletterEditor.vue.
    // For simplicity, let's re-fetch block types here to ensure we have the latest.
    const blockTypesData = await fetchBlockTypes();


    // 2. Compile MJML first using the editor's newsletter data
    const mjml = await compileNewsletterToMjml(editorNewsletter.value, blockTypesData);
    const { html } = await compileMjmlToHtml(mjml);

    editorNewsletter.value.compiled_mjml = mjml;
    editorNewsletter.value.compiled_html = html;
    editorNewsletter.value.mailing_list_id = selectedMailingList.value;

    // 3. Transform blocks for Directus: map block.type (slug) to block_type ID
    const blocksForDirectus = editorNewsletter.value.blocks.map(block => {
      const foundBlockType = blockTypesData.find(bt => bt.slug === block.type);
      if (!foundBlockType) {
        console.warn(`Block type with slug '${block.type}' not found. Skipping block.`, block);
        // If block type not found, return a structure that Directus can handle,
        // e.g., by omitting the block_type or setting it to null if allowed.
        // For now, we'll return null and filter it out.
        return null;
      }
      return {
        id: block.id, // Keep existing ID for updates
        block_type: foundBlockType.id, // Send the UUID of the block_type
        content: block.content,
        sort: block.sort
      };
    }).filter(Boolean); // Remove any nulls if block types weren't found

    // Create the payload for Directus API
    const directusPayload = {
      ...editorNewsletter.value, // Copy all fields from editorNewsletter
      blocks: blocksForDirectus, // Override blocks with transformed ones
      // Ensure Directus-specific field names are used if different from NewsletterData
      // NewsletterData now directly uses Directus field names (title, subject_line, preview_text)
    };

    if (directusPayload.id) {
      await updateNewsletterInDirectus(directusPayload.id, directusPayload);
      showMessage('Newsletter updated successfully!', 'success');
    } else {
      const created = await createNewsletterInDirectus(directusPayload);
      editorNewsletter.value.id = created.id;
      isEditing.value = true;
      showMessage('Newsletter created successfully!', 'success');

      // Update URL to show we're now editing
      await navigateTo(`/?edit=${created.id}`, { replace: true });
    }
  } catch (err) {
    showMessage('Error saving newsletter: ' + err.message, 'error');
    console.error('Save error:', err);
  } finally {
    saving.value = false;
  }
}

// Test email functions
const sendTest = () => {
  testEmail.value = ''
  showTestModal.value = true
}

const confirmSendTest = async () => {
  if (!testEmail.value || !editorNewsletter.value.compiled_html) return

  try {
    // Call the updated sendTestEmail from useSendGrid
    const response = await sendTestEmail(editorNewsletter.value, testEmail.value)
    if (response.status === 'success') {
      showMessage('Test email sent successfully!', 'success')
    } else {
      showMessage(`Test email failed: ${response.message}`, 'error')
    }
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
        newsletter_id: editorNewsletter.value.id,
        send_record_id: `send_${Date.now()}`
      }
    }))

    // Send via SendGrid
    await sendViaGrid(
      editorNewsletter.value,
      recipients,
      {
        fromEmail: editorNewsletter.value.from_email,
        fromName: editorNewsletter.value.from_name,
        replyTo: editorNewsletter.value.reply_to,
        categories: ['newsletter', editorNewsletter.value.category || 'general'],
        sendAt: sendOptions.value.sendNow ? undefined : new Date(sendOptions.value.scheduledDate),
        customArgs: {
          newsletter_id: editorNewsletter.value.id,
          mailing_list_id: selectedMailingList.value
        }
      }
    )

    // Update newsletter status
    await updateNewsletterInDirectus(editorNewsletter.value.id, {
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
  if (editorNewsletter.value) {
    editorNewsletter.value.compiled_mjml = compiled.mjml
    editorNewsletter.value.compiled_html = compiled.html
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
    if (editorNewsletter.value?.id && !saving.value) {
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

