<!-- playground/pages/list.vue -->
<template>
  <div class="newsletter-list-page">
    <div class="list-header">
      <div class="header-content">
        <h1>Newsletters</h1>
        <p class="subtitle">Manage your email newsletters</p>
      </div>
      <div class="header-actions">
        <NuxtLink to="/" class="btn btn-primary">
          Create Newsletter
        </NuxtLink>
      </div>
    </div>

   
    
    <div class="">
      <NewsletterSetup />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'

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
    alert('Newsletter duplicated successfully!')
  } catch (err) {
    alert('Error duplicating newsletter: ' + err.message)
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
  } catch (err) {
    alert('Error deleting newsletter: ' + err.message)
  }
}

const sendTestEmail = (newsletter) => {
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
      alert('Newsletter must be compiled first. Please edit and save the newsletter.')
      return
    }
    
    await sendTestViaGrid(fullNewsletter, testEmail.value)
    alert('Test email sent to ' + testEmail.value)
    showTestModal.value = false
  } catch (err) {
    alert('Error sending test: ' + err.message)
  }
}

const markReady = async (newsletter) => {
  try {
    await updateNewsletterInDirectus(newsletter.id, { status: 'ready' })
    await refreshNewsletters()
  } catch (err) {
    alert('Error updating newsletter status: ' + err.message)
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

// Close menu when clicking outside
onMounted(() => {
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.card-menu')) {
      openMenuId.value = null
    }
  })
})
</script>

<style scoped>
.newsletter-list-page {
  min-height: 100vh;
  background: #f8fafc;
  padding: 2rem;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.header-content h1 {
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

.filters-section {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.search-bar {
  flex: 1;
  min-width: 300px;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.filters {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.filter-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  font-size: 0.875rem;
}

.newsletters-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.results-info {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  color: #64748b;
  font-size: 0.875rem;
}

.newsletters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 1.5rem;
  padding: 1.5rem;
}

.newsletter-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s;
  position: relative;
}

.newsletter-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.newsletter-draft {
  border-left: 4px solid #94a3b8;
}

.newsletter-ready {
  border-left: 4px solid #3b82f6;
}

.newsletter-scheduled {
  border-left: 4px solid #8b5cf6;
}

.newsletter-sent {
  border-left: 4px solid #10b981;
}

.card-header {
  padding: 1.5rem;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.title-section h3 {
  margin: 0 0 0.5rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.4;
}

.meta-info {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: #64748b;
}

.category {
  background: #f1f5f9;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-weight: 500;
}

.status-section {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status {
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-draft { background: #f1f5f9; color: #64748b; }
.status-ready { background: #dbeafe; color: #1d4ed8; }
.status-scheduled { background: #ede9fe; color: #7c3aed; }
.status-sent { background: #d1fae5; color: #047857; }
.status-sending { background: #fef3c7; color: #92400e; }

.card-menu {
  position: relative;
}

.menu-btn {
  padding: 0.5rem;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 4px;
  color: #64748b;
  transition: all 0.2s;
}

.menu-btn:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  z-index: 10;
  min-width: 160px;
  overflow: hidden;
}

.menu-item {
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #374151;
  transition: background 0.2s;
}

.menu-item:hover:not(:disabled) {
  background: #f9fafb;
}

.menu-item:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.menu-item.danger {
  color: #dc2626;
}

.menu-item.danger:hover {
  background: #fef2f2;
}

.menu-divider {
  margin: 0;
  border: none;
  border-top: 1px solid #e5e7eb;
}

.card-body {
  padding: 1.5rem;
}

.subject-line {
  margin-bottom: 0.75rem;
  color: #374151;
  font-size: 0.875rem;
}

.preview-text {
  margin-bottom: 1rem;
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.5;
}

.newsletter-stats {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f1f5f9;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.stat-label {
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-value {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
}

.card-actions {
  padding: 1rem 1.5rem;
  background: #f8fafc;
  display: flex;
  gap: 0.75rem;
}

.pagination {
  padding: 1.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  border-top: 1px solid #e2e8f0;
}

.page-info {
  color: #64748b;
  font-size: 0.875rem;
}

/* States */
.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 1rem;
  border: 3px solid #f3f4f6;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-icon,
.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-state h3,
.empty-state h3 {
  margin: 0 0 0.5rem;
  color: #1f2937;
}

.warning-text {
  color: #dc2626;
  font-size: 0.875rem;
  margin: 0.5rem 0;
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
  gap: 0.5rem;
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

.btn-success {
  background: #10b981;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #059669;
}

.btn-danger {
  background: #dc2626;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #b91c1c;
}

/* Modal */
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
  color: #1f2937;
}

.modal-content p {
  margin: 0.5rem 0;
  color: #6b7280;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
  margin: 1rem 0;
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

/* Responsive */
@media (max-width: 768px) {
  .newsletter-list-page {
    padding: 1rem;
  }
  
  .list-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .filters-section {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filters {
    justify-content: space-between;
  }
  
  .newsletters-grid {
    grid-template-columns: 1fr;
    padding: 1rem;
    gap: 1rem;
  }
  
  .card-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .status-section {
    justify-content: space-between;
    width: 100%;
  }
}
</style>