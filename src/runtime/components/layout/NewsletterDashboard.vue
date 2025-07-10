<template>
  <div class="newsletter-dashboard">
    <!-- Search and filters -->
    <div class="dashboard-header">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search newsletters..."
        class="search-input"
      >

      <select
        v-model="statusFilter"
        class="status-filter"
      >
        <option value="">
          All Status
        </option>
        <option value="draft">
          Draft
        </option>
        <option value="scheduled">
          Scheduled
        </option>
        <option value="sent">
          Sent
        </option>
      </select>

      <select
        v-model="categoryFilter"
        class="category-filter"
      >
        <option value="">
          All Categories
        </option>
        <option value="marketing">
          Marketing
        </option>
        <option value="news">
          News
        </option>
        <option value="updates">
          Updates
        </option>
      </select>

      <div class="view-controls">
        <button
          :class="{ active: viewMode === 'grid' }"
          @click="viewMode = 'grid'"
        >
          Grid
        </button>
        <button
          :class="{ active: viewMode === 'list' }"
          @click="viewMode = 'list'"
        >
          List
        </button>
      </div>
    </div>

    <!-- Stats -->
    <div class="dashboard-stats">
      <div class="stat-card">
        <h3>Total Newsletters</h3>
        <p>{{ stats.total }}</p>
      </div>
      <div class="stat-card">
        <h3>Sent This Month</h3>
        <p>{{ stats.sentThisMonth }}</p>
      </div>
      <div class="stat-card">
        <h3>Avg Open Rate</h3>
        <p>{{ stats.avgOpenRate.toFixed(1) }}%</p>
      </div>
    </div>

    <!-- Newsletter Grid/List -->
    <div :class="['newsletter-grid', `view-${viewMode}`]">
      <div
        v-for="newsletter in filteredNewsletters"
        :key="newsletter.id"
        class="newsletter-card"
        @click="editNewsletter(newsletter.id!)"
      >
        <h3>{{ newsletter.title }}</h3>
        <p>{{ newsletter.subject_line }}</p>
        <div class="newsletter-meta">
          <span class="status">{{ newsletter.status }}</span>
          <span class="date">{{ formatDate(newsletter.date_created) }}</span>
        </div>
        <div class="newsletter-actions">
          <button @click.stop="duplicateNewsletterHandler(newsletter.id!)">
            Duplicate
          </button>
          <button @click.stop="deleteNewsletterHandler(newsletter.id!)">
            Delete
          </button>
        </div>
      </div>
    </div>

    <!-- Template Library Modal -->
    <div
      v-if="showTemplateLibrary"
      class="template-library-modal"
    >
      <div class="modal-content">
        <h2>Template Library</h2>
        <button @click="showTemplateLibrary = false">
          Close
        </button>
        <!-- Template library content -->
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useNewsletter } from '../../composables/core/useNewsletter'
import { useNewsletterTemplates } from '../../composables/core/useNewsletterTemplates'
import type { Newsletter, NewsletterTemplate } from '../../types/newsletter'

// Composables
const {
  newsletters: allNewsletters,
  fetchNewsletters,
  duplicateNewsletter,
  deleteNewsletter,
  createNewsletter,
} = useNewsletter()

const { templates, fetchTemplates } = useNewsletterTemplates()

// Reactive state
const searchQuery = ref('')
const statusFilter = ref('')
const categoryFilter = ref('')
const viewMode = ref<'grid' | 'list'>('grid')
const showTemplateLibrary = ref(false)

// Computed properties
const filteredNewsletters = computed(() => {
  let filtered = allNewsletters.value || []

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      (newsletter: Newsletter) =>
        newsletter.title?.toLowerCase().includes(query)
        || newsletter.subject_line?.toLowerCase().includes(query),
    )
  }

  // Status filter
  if (statusFilter.value) {
    filtered = filtered.filter(
      (newsletter: Newsletter) => newsletter.status === statusFilter.value,
    )
  }

  // Category filter
  if (categoryFilter.value) {
    filtered = filtered.filter(
      (newsletter: Newsletter) => newsletter.category === categoryFilter.value,
    )
  }

  return filtered
})

const stats = computed(() => {
  const newsletters = allNewsletters.value || []
  const total = newsletters.length

  const sentThisMonth = newsletters.filter((n: Newsletter) => {
    if (!n.sent_at) return false
    const sentDate = new Date(n.sent_at)
    const now = new Date()
    return (
      sentDate.getMonth() === now.getMonth()
      && sentDate.getFullYear() === now.getFullYear()
    )
  }).length

  const openRates = newsletters
    .filter((n: Newsletter) => n.open_rate && n.open_rate > 0)
    .map((n: Newsletter) => n.open_rate!)

  const avgOpenRate
    = openRates.length > 0
      ? openRates.reduce((sum: number, rate: number) => sum + rate, 0)
      / openRates.length
      : 0

  return {
    total,
    sentThisMonth,
    avgOpenRate,
  }
})

// Methods
const createNewNewsletter = async () => {
  try {
    const newsletter = await createNewsletter({
      title: 'New Newsletter',
      subject_line: 'New Subject',
      from_name: 'Default Sender',
      from_email: 'sender@example.com',
      category: 'draft',
    })
    await navigateTo(`/newsletters/${newsletter.id}/edit`)
  }
  catch (error) {
    console.error('Failed to create newsletter:', error)
  }
}

const editNewsletter = (id: number) => {
  navigateTo(`/newsletters/${id}/edit`)
}

const duplicateNewsletterHandler = async (id: number) => {
  try {
    const duplicated = await duplicateNewsletter(id)
    await navigateTo(`/newsletters/${duplicated.id}/edit`)
  }
  catch (error) {
    console.error('Failed to duplicate newsletter:', error)
  }
}

const deleteNewsletterHandler = async (id: number) => {
  if (confirm('Are you sure you want to delete this newsletter?')) {
    try {
      await deleteNewsletter(id)
    }
    catch (error) {
      console.error('Failed to delete newsletter:', error)
    }
  }
}

const createFromTemplate = async (template: NewsletterTemplate) => {
  try {
    const newsletter = await createNewsletter({
      title: `${template.name} Newsletter`,
      subject_line: 'New Newsletter',
      from_name: 'Default Sender',
      from_email: 'sender@example.com',
      mjml_template: template.mjml_template,
      blocks: template.blocks ? [...template.blocks] : [],
    })
    await navigateTo(`/newsletters/${newsletter.id}/edit`)
  }
  catch (error) {
    console.error('Failed to create newsletter from template:', error)
  }
}

const formatDate = (date: string | Date | undefined): string => {
  if (!date) return ''
  return new Date(date).toLocaleDateString()
}

// Lifecycle
onMounted(async () => {
  await Promise.all([fetchNewsletters(), fetchTemplates()])
})
</script>
