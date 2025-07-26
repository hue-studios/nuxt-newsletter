<!-- playground/pages/list.vue -->
<template>
  <div class="min-h-screen bg-gray-100 p-6 font-sans antialiased">
    <!-- List Header -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 mb-6 border-b border-gray-200">
      <div class="mb-4 sm:mb-0">
        <h1 class="text-3xl font-bold text-gray-900 uppercase tracking-wide">Newsletters</h1>
        <p class="text-lg text-gray-600 mt-1">Manage your email newsletters</p>
      </div>
      <div class="flex-shrink-0">
        <NuxtLink to="/" class="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
          <Icon name="lucide:plus-circle" class="w-5 h-5 mr-2" />
          Create Newsletter
        </NuxtLink>
      </div>
    </div>

    <!-- Filters and Search -->
    <div class="bg-white rounded-xl shadow-md p-6 mb-6 flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
      <div class="flex-1 min-w-0">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search newsletters by title, subject, or preview text..."
          class="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
        />
      </div>
      <div class="flex flex-wrap items-center space-x-3">
        <select v-model="statusFilter" class="px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="ready">Ready</option>
          <option value="scheduled">Scheduled</option>
          <option value="sent">Sent</option>
        </select>
        <select v-model="categoryFilter" class="px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
          <option value="">All Categories</option>
          <option value="company">Company</option>
          <option value="product">Product</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="event">Event</option>
        </select>
        <button @click="clearFilters" class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
          <Icon name="lucide:x-circle" class="w-4 h-4 mr-2" />
          Clear Filters
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl shadow-md">
      <Icon name="lucide:loader-2" class="w-12 h-12 text-blue-500 animate-spin mb-4" />
      <p class="text-lg text-gray-700 font-medium">Loading newsletters...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl shadow-md">
      <Icon name="lucide:alert-triangle" class="w-12 h-12 text-red-500 mb-4" />
      <h3 class="text-xl font-semibold text-gray-900 mb-2">Error Loading Newsletters</h3>
      <p class="text-gray-600 mb-6">{{ error }}</p>
      <button @click="refreshNewsletters" class="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
        <Icon name="lucide:refresh-cw" class="w-5 h-5 mr-2" />
        Try Again
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredNewsletters.length === 0 && !loading" class="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl shadow-md">
      <Icon name="lucide:mail-open" class="w-12 h-12 text-gray-400 mb-4" />
      <h3 class="text-xl font-semibold text-gray-900 mb-2">{{ newsletters.length === 0 ? 'No newsletters yet' : 'No newsletters match your filters' }}</h3>
      <p class="text-gray-600 mb-6">{{ newsletters.length === 0 ? 'Create your first newsletter to get started' : 'Try adjusting your search or filters' }}</p>
      <NuxtLink v-if="newsletters.length === 0" to="/" class="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
        <Icon name="lucide:plus-circle" class="w-5 h-5 mr-2" />
        Create Your First Newsletter
      </NuxtLink>
    </div>

    <!-- Newsletter Grid -->
    <div v-else class="bg-white rounded-xl shadow-md overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-200 text-gray-600 text-sm">
        <p>{{ filteredNewsletters.length }} of {{ newsletters.length }} newsletters</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
        <div
          v-for="newsletter in paginatedNewsletters"
          :key="newsletter.id"
          class="bg-white border rounded-xl shadow-sm overflow-hidden transform transition-all duration-200 hover:scale-[1.01] hover:shadow-lg"
          :class="{
            'border-l-4 border-gray-400': newsletter.status === 'draft',
            'border-l-4 border-blue-500': newsletter.status === 'ready',
            'border-l-4 border-purple-500': newsletter.status === 'scheduled',
            'border-l-4 border-green-500': newsletter.status === 'sent',
          }"
        >
          <!-- Card Header -->
          <div class="p-4 border-b border-gray-200 flex items-start justify-between">
            <div class="flex-1 pr-4">
              <h3 class="text-lg font-semibold text-gray-900 leading-tight mb-1">{{ newsletter.title }}</h3>
              <div class="flex items-center space-x-3 text-sm text-gray-500">
                <span class="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-medium text-xs">{{ newsletter.category || 'General' }}</span>
                <span class="text-xs">{{ formatDate(newsletter.date_created) }}</span>
              </div>
            </div>
            <div class="flex-shrink-0 flex flex-col items-end space-y-2">
              <span
                class="px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide"
                :class="{
                  'bg-gray-200 text-gray-700': newsletter.status === 'draft',
                  'bg-blue-100 text-blue-800': newsletter.status === 'ready',
                  'bg-purple-100 text-purple-800': newsletter.status === 'scheduled',
                  'bg-green-100 text-green-800': newsletter.status === 'sent',
                  'bg-yellow-100 text-yellow-800': newsletter.status === 'sending',
                }"
              >
                {{ formatStatus(newsletter.status) }}
              </span>
              <div class="relative">
                <button @click="toggleMenu(newsletter.id)" class="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                  <Icon name="lucide:more-horizontal" class="w-5 h-5" />
                </button>
                <div v-if="openMenuId === newsletter.id" class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                  <div class="py-1">
                    <button @click="editNewsletter(newsletter)" class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <Icon name="lucide:edit" class="w-4 h-4 mr-3" /> Edit
                    </button>
                    <button @click="duplicateNewsletter(newsletter)" class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <Icon name="lucide:copy" class="w-4 h-4 mr-3" /> Duplicate
                    </button>
                    <button @click="sendTestEmail(newsletter)" class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" :disabled="newsletter.status === 'draft'">
                      <Icon name="lucide:mail" class="w-4 h-4 mr-3" /> Send Test
                    </button>
                    <hr class="my-1 border-gray-100">
                    <button @click="deleteNewsletterConfirm(newsletter)" class="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                      <Icon name="lucide:trash-2" class="w-4 h-4 mr-3" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Card Body -->
          <div class="p-4">
            <p class="text-sm text-gray-700 mb-2"><strong>Subject:</strong> {{ newsletter.subject_line }}</p>
            <p v-if="newsletter.preview_text" class="text-sm text-gray-600 line-clamp-2">{{ newsletter.preview_text }}</p>
            <div class="flex items-center space-x-4 mt-4 pt-4 border-t border-gray-100">
              <div class="flex flex-col items-center text-center">
                <span class="text-xs text-gray-500 uppercase font-medium mb-0.5">Blocks</span>
                <span class="text-lg font-semibold text-gray-900">{{ newsletter.blocks?.length || 0 }}</span>
              </div>
              <div v-if="newsletter.total_opens !== undefined" class="flex flex-col items-center text-center">
                <span class="text-xs text-gray-500 uppercase font-medium mb-0.5">Opens</span>
                <span class="text-lg font-semibold text-gray-900">{{ newsletter.total_opens || 0 }}</span>
              </div>
              <div v-if="newsletter.open_rate" class="flex flex-col items-center text-center">
                <span class="text-xs text-gray-500 uppercase font-medium mb-0.5">Open Rate</span>
                <span class="text-lg font-semibold text-gray-900">{{ newsletter.open_rate.toFixed(1) }}%</span>
              </div>
            </div>
          </div>

          <!-- Card Actions -->
          <div class="p-4 bg-gray-50 border-t border-gray-200 flex space-x-3 justify-end">
            <button @click="editNewsletter(newsletter)" class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
              <Icon name="lucide:edit" class="w-4 h-4 mr-2" /> Edit
            </button>
            <button
              v-if="newsletter.status === 'ready'"
              @click="sendNewsletter(newsletter)"
              class="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              <Icon name="lucide:send" class="w-4 h-4 mr-2" /> Send
            </button>
            <button
              v-else-if="newsletter.status === 'draft'"
              @click="markReady(newsletter)"
              class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <Icon name="lucide:check-circle" class="w-4 h-4 mr-2" /> Mark Ready
            </button>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-center p-6 border-t border-gray-200 bg-gray-50">
        <button
          @click="currentPage = Math.max(1, currentPage - 1)"
          :disabled="currentPage === 1"
          class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icon name="lucide:chevron-left" class="w-4 h-4 mr-2" /> Previous
        </button>
        <span class="text-gray-700 text-sm mx-4">
          Page {{ currentPage }} of {{ totalPages }}
        </span>
        <button
          @click="currentPage = Math.min(totalPages, currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next <Icon name="lucide:chevron-right" class="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-gray-900/50 flex items-center justify-center p-4 z-50 transition-opacity duration-300">
      <div class="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 sm:p-8 transform scale-100 opacity-100 transition-all duration-300">
        <h3 class="text-xl font-semibold text-gray-900 mb-4">Delete Newsletter</h3>
        <p class="text-gray-600 mb-2">Are you sure you want to delete "<span class="font-medium">{{ newsletterToDelete?.title }}</span>"?</p>
        <p class="text-red-600 text-sm font-medium mb-6">This action cannot be undone.</p>
        <div class="flex justify-end space-x-3 mt-6">
          <button @click="showDeleteModal = false" class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
            Cancel
          </button>
          <button @click="confirmDelete" class="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors">
            <Icon name="lucide:trash-2" class="w-4 h-4 mr-2" /> Delete
          </button>
        </div>
      </div>
    </div>

    <!-- Test Email Modal -->
    <div v-if="showTestModal" class="fixed inset-0 bg-gray-900/50 flex items-center justify-center p-4 z-50 transition-opacity duration-300">
      <div class="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 sm:p-8 transform scale-100 opacity-100 transition-all duration-300">
        <h3 class="text-xl font-semibold text-gray-900 mb-4">Send Test Email</h3>
        <p class="text-gray-600 mb-6">Send test email for "<span class="font-medium">{{ testNewsletter?.title }}</span>"</p>
        <input
          v-model="testEmail"
          type="email"
          placeholder="Enter email address"
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

    <!-- Notification Toast (re-using the one from index.vue or similar pattern) -->
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
import { navigateTo } from '#app'; // Import navigateTo
import { computed, onMounted, ref } from 'vue';

// Page metadata
definePageMeta({
  title: 'Newsletters'
})

// State
const newsletters = ref([])
const loading = ref(true)
const error = ref(null)
const searchQuery = ref('')
const statusFilter = ref('')
const categoryFilter = ref('')
const currentPage = ref(1)
const itemsPerPage = 12
const openMenuId = ref(null)
const showDeleteModal = ref(false)
const newsletterToDelete = ref(null)
const showTestModal = ref(false)
const testNewsletter = ref(null)
const testEmail = ref('')
const message = ref({ // Added for notifications
  show: false,
  text: '',
  type: 'success'
})

// Composables
const {
  fetchNewsletters,
  deleteNewsletter: deleteNewsletterFromDirectus,
  updateNewsletter: updateNewsletterInDirectus,
  createNewsletter: createNewsletterInDirectus,
  fetchNewsletter
} = useDirectusNewsletter()

const { sendTestEmail: sendTestViaGrid } = useSendGrid()

// Computed
const filteredNewsletters = computed(() => {
  let filtered = newsletters.value

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(newsletter =>
      newsletter.title?.toLowerCase().includes(query) ||
      newsletter.subject_line?.toLowerCase().includes(query) ||
      newsletter.preview_text?.toLowerCase().includes(query)
    )
  }

  // Status filter
  if (statusFilter.value) {
    filtered = filtered.filter(newsletter => newsletter.status === statusFilter.value)
  }

  // Category filter
  if (categoryFilter.value) {
    filtered = filtered.filter(newsletter => newsletter.category === categoryFilter.value)
  }

  return filtered
})

const totalPages = computed(() => Math.ceil(filteredNewsletters.value.length / itemsPerPage))

const paginatedNewsletters = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredNewsletters.value.slice(start, end)
})

// Load newsletters
onMounted(async () => {
  await refreshNewsletters()
})

// Methods
const refreshNewsletters = async () => {
  loading.value = true
  error.value = null
  try {
    newsletters.value = await fetchNewsletters({
      limit: 100,
      sort: ['-date_created']
    })
  } catch (err) {
    error.value = err.message
    console.error('Error loading newsletters:', err)
  } finally {
    loading.value = false
  }
}

const clearFilters = () => {
  searchQuery.value = ''
  statusFilter.value = ''
  categoryFilter.value = ''
  currentPage.value = 1
}

const toggleMenu = (id) => {
  openMenuId.value = openMenuId.value === id ? null : id
}

const editNewsletter = (newsletter) => {
  navigateTo(`/?edit=${newsletter.id}`)
}

const duplicateNewsletter = async (newsletter) => {
  try {
    const original = await fetchNewsletter(newsletter.id)
    const copy = {
      title: `${original.title} (Copy)`,
      subject_line: `${original.subject_line} (Copy)`,
      preview_text: original.preview_text,
      from_name: original.from_name,
      from_email: original.from_email,
      reply_to: original.reply_to,
      category: original.category,
      status: 'draft',
      blocks: original.blocks?.map(block => ({
        ...block,
        id: undefined // Remove ID so Directus creates new ones
      })) || []
    }

    await createNewsletterInDirectus(copy)
    await refreshNewsletters()

    // Show success message
    showMessage('Newsletter duplicated successfully!', 'success')
  } catch (err) {
    showMessage('Error duplicating newsletter: ' + err.message, 'error')
  }
}

const deleteNewsletterConfirm = (newsletter) => {
  newsletterToDelete.value = newsletter
  showDeleteModal.value = true
  openMenuId.value = null
}

const confirmDelete = async () => {
  try {
    await deleteNewsletterFromDirectus(newsletterToDelete.value.id)
    await refreshNewsletters()
    showDeleteModal.value = false
    newsletterToDelete.value = null
    showMessage('Newsletter deleted successfully!', 'success')
  } catch (err) {
    showMessage('Error deleting newsletter: ' + err.message, 'error')
  }
}

const sendTestEmail = async (newsletter) => {
  testNewsletter.value = newsletter
  testEmail.value = ''
  showTestModal.value = true
  openMenuId.value = null
}

const confirmSendTest = async () => {
  if (!testEmail.value) return

  try {
    // Get full newsletter data with compiled HTML
    const fullNewsletter = await fetchNewsletter(testNewsletter.value.id)

    if (!fullNewsletter.compiled_html) {
      showMessage('Newsletter must be compiled first. Please edit and save the newsletter.', 'error')
      return
    }

    const response = await sendTestViaGrid(fullNewsletter, testEmail.value) // Call the updated composable
    if (response.status === 'success') {
      showMessage('Test email sent to ' + testEmail.value, 'success')
    } else {
      showMessage(`Test email failed: ${response.message}`, 'error')
    }
    showTestModal.value = false
  } catch (err) {
    showMessage('Error sending test: ' + err.message, 'error')
  }
}

const markReady = async (newsletter) => {
  try {
    await updateNewsletterInDirectus(newsletter.id, { status: 'ready' })
    await refreshNewsletters()
    showMessage('Newsletter marked as ready!', 'success')
  } catch (err) {
    showMessage('Error updating newsletter status: ' + err.message, 'error')
  }
}

const sendNewsletter = (newsletter) => {
  navigateTo(`/?edit=${newsletter.id}&send=true`)
}

// Utility functions
const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatStatus = (status) => {
  const statusMap = {
    draft: 'Draft',
    ready: 'Ready',
    scheduled: 'Scheduled',
    sending: 'Sending',
    sent: 'Sent',
    paused: 'Paused'
  }
  return statusMap[status] || status
}

const showMessage = (text, type = 'success') => {
  message.value = { show: true, text, type }
  setTimeout(() => {
    message.value.show = false
  }, 4000)
}

// Close menu when clicking outside
onMounted(() => {
  document.addEventListener('click', (e) => {
    if (openMenuId.value && !e.target.closest('.card-menu')) {
      openMenuId.value = null
    }
  })
})
</script>

