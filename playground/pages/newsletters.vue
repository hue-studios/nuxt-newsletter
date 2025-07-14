<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
    <!-- Enhanced Header -->
    <div class="bg-white/90 backdrop-blur-sm border-b border-slate-200/60 shadow-sm">
      <div class="max-w-7xl mx-auto px-6 py-6">
        <div class="flex items-center justify-between">
          <!-- Enhanced Brand -->
          <div class="flex items-center space-x-4">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
                <Icon name="lucide:mail" class="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 class="text-2xl font-bold text-slate-900">Newsletter Studio</h1>
                <p class="text-sm text-slate-600">Manage your email campaigns</p>
              </div>
            </div>
          </div>

          <!-- Enhanced Actions -->
          <div class="flex items-center space-x-3">
            <button
              @click="navigateTo('/setup')"
              class="inline-flex items-center px-4 py-2.5 border border-slate-300 text-sm font-medium rounded-xl text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-200 shadow-sm hover:shadow"
            >
              <Icon name="lucide:settings" class="w-4 h-4 mr-2" />
              Setup
            </button>
            
            <button
              @click="navigateTo('/')"
              class="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Icon name="lucide:plus" class="w-4 h-4 mr-2" />
              Create Newsletter
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Enhanced Content -->
    <div class="max-w-7xl mx-auto px-6 py-8">
      <!-- Enhanced Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Icon name="lucide:mail" class="w-5 h-5 text-white" />
            </div>
            <div>
              <p class="text-sm font-medium text-slate-600">Total Newsletters</p>
              <p class="text-2xl font-bold text-slate-900">{{ stats.total || 0 }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
              <Icon name="lucide:send" class="w-5 h-5 text-white" />
            </div>
            <div>
              <p class="text-sm font-medium text-slate-600">Sent</p>
              <p class="text-2xl font-bold text-slate-900">{{ stats.sent || 0 }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center">
              <Icon name="lucide:clock" class="w-5 h-5 text-white" />
            </div>
            <div>
              <p class="text-sm font-medium text-slate-600">Scheduled</p>
              <p class="text-2xl font-bold text-slate-900">{{ stats.scheduled || 0 }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
              <Icon name="lucide:users" class="w-5 h-5 text-white" />
            </div>
            <div>
              <p class="text-sm font-medium text-slate-600">Subscribers</p>
              <p class="text-2xl font-bold text-slate-900">{{ stats.subscribers || 0 }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Enhanced Filters -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-6">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <!-- Search and Filters -->
          <div class="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <!-- Search -->
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon name="lucide:search" class="w-4 h-4 text-slate-400" />
              </div>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search newsletters..."
                class="block w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
              />
            </div>

            <!-- Status Filter -->
            <select
              v-model="statusFilter"
              class="block w-full sm:w-auto px-4 py-2.5 text-sm border border-slate-300 rounded-xl shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="ready">Ready</option>
              <option value="scheduled">Scheduled</option>
              <option value="sending">Sending</option>
              <option value="sent">Sent</option>
            </select>

            <!-- Date Filter -->
            <select
              v-model="dateFilter"
              class="block w-full sm:w-auto px-4 py-2.5 text-sm border border-slate-300 rounded-xl shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
            >
              <option value="">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
            </select>
          </div>

          <!-- View Options -->
          <div class="flex items-center space-x-3">
            <span class="text-sm text-slate-600">View:</span>
            <div class="flex items-center bg-slate-100 rounded-lg p-1">
              <button
                @click="viewMode = 'grid'"
                class="flex items-center justify-center w-8 h-8 rounded-md transition-all duration-200"
                :class="viewMode === 'grid' 
                  ? 'bg-white shadow-sm text-slate-900' 
                  : 'text-slate-500 hover:text-slate-700'"
              >
                <Icon name="lucide:grid-3x3" class="w-4 h-4" />
              </button>
              <button
                @click="viewMode = 'list'"
                class="flex items-center justify-center w-8 h-8 rounded-md transition-all duration-200"
                :class="viewMode === 'list' 
                  ? 'bg-white shadow-sm text-slate-900' 
                  : 'text-slate-500 hover:text-slate-700'"
              >
                <Icon name="lucide:list" class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Enhanced Loading State -->
      <div v-if="loading" class="text-center py-12">
        <div class="w-12 h-12 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
          <Icon name="lucide:loader-2" class="w-6 h-6 text-white animate-spin" />
        </div>
        <h3 class="text-lg font-semibold text-slate-900 mb-2">Loading Newsletters</h3>
        <p class="text-slate-600">Fetching your email campaigns...</p>
      </div>

      <!-- Enhanced Empty State -->
      <div v-else-if="filteredNewsletters.length === 0 && !loading" class="text-center py-16">
        <div class="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
          <Icon name="lucide:mail-plus" class="w-8 h-8 text-slate-500" />
        </div>
        <h3 class="text-xl font-semibold text-slate-900 mb-2">
          {{ newsletters.length === 0 ? 'No Newsletters Yet' : 'No Results Found' }}
        </h3>
        <p class="text-slate-600 mb-6 max-w-md mx-auto">
          {{ newsletters.length === 0 
            ? 'Start creating beautiful email campaigns with our drag-and-drop editor.' 
            : 'Try adjusting your search criteria or filters to find what you\'re looking for.' 
          }}
        </p>
        <div class="flex items-center justify-center space-x-3">
          <button
            v-if="newsletters.length === 0"
            @click="navigateTo('/')"
            class="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Icon name="lucide:plus" class="w-4 h-4 mr-2" />
            Create Your First Newsletter
          </button>
          <button
            v-else
            @click="clearFilters"
            class="inline-flex items-center px-4 py-2.5 border border-slate-300 text-sm font-medium rounded-xl text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-200"
          >
            <Icon name="lucide:filter-x" class="w-4 h-4 mr-2" />
            Clear Filters
          </button>
        </div>
      </div>

      <!-- Enhanced Newsletter Grid -->
      <div v-else-if="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="newsletter in filteredNewsletters"
          :key="newsletter.id"
          class="group bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden hover:shadow-lg hover:border-blue-300/60 transition-all duration-200"
        >
          <!-- Card Header -->
          <div class="p-6 pb-4">
            <div class="flex items-start justify-between mb-3">
              <div class="flex-1 min-w-0">
                <h3 class="text-lg font-semibold text-slate-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {{ newsletter.subject_line || newsletter.title || 'Untitled Newsletter' }}
                </h3>
                <p v-if="newsletter.preview_text" class="text-sm text-slate-600 mt-1 line-clamp-2">
                  {{ newsletter.preview_text }}
                </p>
              </div>
              
              <!-- Status Badge -->
              <span 
                class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ml-3 flex-shrink-0"
                :class="getStatusClasses(newsletter.status)"
              >
                <Icon :name="getStatusIcon(newsletter.status)" class="w-3 h-3 mr-1" />
                {{ formatStatus(newsletter.status) }}
              </span>
            </div>

            <!-- Meta Info -->
            <div class="flex items-center space-x-4 text-xs text-slate-500">
              <div class="flex items-center space-x-1">
                <Icon name="lucide:calendar" class="w-3 h-3" />
                <span>{{ formatDate(newsletter.date_created) }}</span>
              </div>
              <div v-if="newsletter.blocks?.length" class="flex items-center space-x-1">
                <Icon name="lucide:blocks" class="w-3 h-3" />
                <span>{{ newsletter.blocks.length }} blocks</span>
              </div>
            </div>
          </div>

          <!-- Preview Thumbnail -->
          <div class="px-6 pb-4">
            <div class="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl overflow-hidden group-hover:shadow-md transition-all duration-200">
              <div class="w-full h-full flex items-center justify-center">
                <div class="text-center">
                  <Icon name="lucide:mail" class="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p class="text-xs text-slate-500">Email Preview</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Card Actions -->
          <div class="px-6 pb-6">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <button
                  @click="editNewsletter(newsletter.id)"
                  class="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                >
                  <Icon name="lucide:edit-3" class="w-3 h-3 mr-1" />
                  Edit
                </button>
                
                <button
                  v-if="newsletter.status === 'draft'"
                  @click="markReady(newsletter)"
                  class="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
                >
                  <Icon name="lucide:check" class="w-3 h-3 mr-1" />
                  Ready
                </button>
                
                <button
                  v-if="newsletter.status === 'ready'"
                  @click="sendNewsletter(newsletter)"
                  class="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors"
                >
                  <Icon name="lucide:send" class="w-3 h-3 mr-1" />
                  Send
                </button>
              </div>

              <!-- More Actions -->
              <div class="relative">
                <button
                  @click="toggleMenu(newsletter.id)"
                  class="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Icon name="lucide:more-horizontal" class="w-4 h-4" />
                </button>

                <!-- Dropdown Menu -->
                <Transition
                  enter-active-class="transition ease-out duration-100"
                  enter-from-class="transform opacity-0 scale-95"
                  enter-to-class="transform opacity-100 scale-100"
                  leave-active-class="transition ease-in duration-75"
                  leave-from-class="transform opacity-100 scale-100"
                  leave-to-class="transform opacity-0 scale-95"
                >
                  <div
                    v-if="openMenuId === newsletter.id"
                    class="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-xl shadow-lg ring-1 ring-black/5 z-20"
                  >
                    <div class="py-1">
                      <button
                        @click="duplicateNewsletter(newsletter.id); closeMenu()"
                        class="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <Icon name="lucide:copy" class="w-4 h-4 mr-3" />
                        Duplicate
                      </button>
                      <button
                        @click="sendTestEmail(newsletter); closeMenu()"
                        class="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <Icon name="lucide:mail" class="w-4 h-4 mr-3" />
                        Test Email
                      </button>
                      <div class="border-t border-slate-100 my-1"></div>
                      <button
                        @click="deleteNewsletter(newsletter.id); closeMenu()"
                        class="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <Icon name="lucide:trash-2" class="w-4 h-4 mr-3" />
                        Delete
                      </button>
                    </div>
                  </div>
                </Transition>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Enhanced Newsletter List -->
      <div v-else class="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200">
            <thead class="bg-slate-50">
              <tr>
                <th class="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Newsletter
                </th>
                <th class="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th class="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Created
                </th>
                <th class="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Blocks
                </th>
                <th class="px-6 py-4 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-slate-200">
              <tr
                v-for="newsletter in filteredNewsletters"
                :key="newsletter.id"
                class="hover:bg-slate-50 transition-colors"
              >
                <!-- Newsletter Info -->
                <td class="px-6 py-4">
                  <div class="flex items-center">
                    <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mr-4">
                      <Icon name="lucide:mail" class="w-5 h-5 text-blue-600" />
                    </div>
                    <div class="min-w-0 flex-1">
                      <p class="text-sm font-medium text-slate-900 truncate">
                        {{ newsletter.subject_line || newsletter.title || 'Untitled Newsletter' }}
                      </p>
                      <p v-if="newsletter.preview_text" class="text-sm text-slate-500 truncate">
                        {{ newsletter.preview_text }}
                      </p>
                    </div>
                  </div>
                </td>

                <!-- Status -->
                <td class="px-6 py-4">
                  <span 
                    class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium"
                    :class="getStatusClasses(newsletter.status)"
                  >
                    <Icon :name="getStatusIcon(newsletter.status)" class="w-3 h-3 mr-1" />
                    {{ formatStatus(newsletter.status) }}
                  </span>
                </td>

                <!-- Created Date -->
                <td class="px-6 py-4 text-sm text-slate-500">
                  {{ formatDate(newsletter.date_created) }}
                </td>

                <!-- Blocks Count -->
                <td class="px-6 py-4 text-sm text-slate-500">
                  {{ newsletter.blocks?.length || 0 }} blocks
                </td>

                <!-- Actions -->
                <td class="px-6 py-4 text-right">
                  <div class="flex items-center justify-end space-x-2">
                    <button
                      @click="editNewsletter(newsletter.id)"
                      class="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit newsletter"
                    >
                      <Icon name="lucide:edit-3" class="w-4 h-4" />
                    </button>
                    
                    <button
                      @click="sendTestEmail(newsletter)"
                      class="p-2 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Send test email"
                    >
                      <Icon name="lucide:mail" class="w-4 h-4" />
                    </button>

                    <div class="relative">
                      <button
                        @click="toggleMenu(newsletter.id)"
                        class="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        title="More actions"
                      >
                        <Icon name="lucide:more-horizontal" class="w-4 h-4" />
                      </button>

                      <!-- Dropdown Menu -->
                      <Transition
                        enter-active-class="transition ease-out duration-100"
                        enter-from-class="transform opacity-0 scale-95"
                        enter-to-class="transform opacity-100 scale-100"
                        leave-active-class="transition ease-in duration-75"
                        leave-from-class="transform opacity-100 scale-100"
                        leave-to-class="transform opacity-0 scale-95"
                      >
                        <div
                          v-if="openMenuId === newsletter.id"
                          class="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg ring-1 ring-black/5 z-20"
                        >
                          <div class="py-1">
                            <button
                              @click="duplicateNewsletter(newsletter.id); closeMenu()"
                              class="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                            >
                              <Icon name="lucide:copy" class="w-4 h-4 mr-3" />
                              Duplicate
                            </button>
                            <button
                              v-if="newsletter.status === 'ready'"
                              @click="sendNewsletter(newsletter); closeMenu()"
                              class="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                            >
                              <Icon name="lucide:send" class="w-4 h-4 mr-3" />
                              Send Newsletter
                            </button>
                            <div class="border-t border-slate-100 my-1"></div>
                            <button
                              @click="deleteNewsletter(newsletter.id); closeMenu()"
                              class="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <Icon name="lucide:trash-2" class="w-4 h-4 mr-3" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </Transition>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
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
  title: 'Newsletter Studio - Manage Your Campaigns'
})

// Enhanced state management
const loading = ref(true)
const newsletters = ref([])
const searchQuery = ref('')
const statusFilter = ref('')
const dateFilter = ref('')
const viewMode = ref('grid')
const openMenuId = ref(null)

const stats = ref({
  total: 0,
  sent: 0,
  scheduled: 0,
  subscribers: 0
})

const notification = ref({
  show: false,
  message: '',
  type: 'success'
})

// Composables
const {
  fetchNewsletters,
  deleteNewsletter: deleteNewsletterFromDirectus,
  updateNewsletter: updateNewsletterInDirectus,
  duplicateNewsletter: duplicateNewsletterInDirectus
} = useDirectusNewsletter()

// Enhanced computed properties
const filteredNewsletters = computed(() => {
  let filtered = newsletters.value

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(newsletter => 
      (newsletter.subject_line || '').toLowerCase().includes(query) ||
      (newsletter.title || '').toLowerCase().includes(query) ||
      (newsletter.preview_text || '').toLowerCase().includes(query)
    )
  }

  // Status filter
  if (statusFilter.value) {
    filtered = filtered.filter(newsletter => newsletter.status === statusFilter.value)
  }

  // Date filter
  if (dateFilter.value) {
    const now = new Date()
    filtered = filtered.filter(newsletter => {
      const createdDate = new Date(newsletter.date_created)
      
      switch (dateFilter.value) {
        case 'today':
          return createdDate.toDateString() === now.toDateString()
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          return createdDate >= weekAgo
        case 'month':
          const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
          return createdDate >= monthAgo
        case 'quarter':
          const quarterAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
          return createdDate >= quarterAgo
        default:
          return true
      }
    })
  }

  return filtered.sort((a, b) => new Date(b.date_created) - new Date(a.date_created))
})

// Enhanced utility functions
const showNotification = (message, type = 'success') => {
  notification.value = { show: true, message, type }
  setTimeout(() => {
    notification.value.show = false
  }, 4000)
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
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

const getStatusClasses = (status) => {
  const statusClasses = {
    draft: 'bg-slate-100 text-slate-700',
    ready: 'bg-green-100 text-green-700',
    scheduled: 'bg-blue-100 text-blue-700',
    sending: 'bg-yellow-100 text-yellow-700',
    sent: 'bg-purple-100 text-purple-700',
    paused: 'bg-red-100 text-red-700'
  }
  return statusClasses[status] || 'bg-slate-100 text-slate-700'
}

const getStatusIcon = (status) => {
  const statusIcons = {
    draft: 'lucide:edit-3',
    ready: 'lucide:check-circle',
    scheduled: 'lucide:clock',
    sending: 'lucide:loader-2',
    sent: 'lucide:check',
    paused: 'lucide:pause'
  }
  return statusIcons[status] || 'lucide:circle'
}

const toggleMenu = (newsletterId) => {
  openMenuId.value = openMenuId.value === newsletterId ? null : newsletterId
}

const closeMenu = () => {
  openMenuId.value = null
}

const clearFilters = () => {
  searchQuery.value = ''
  statusFilter.value = ''
  dateFilter.value = ''
}

// Enhanced action functions
const editNewsletter = (newsletterId) => {
  navigateTo(`/?edit=${newsletterId}`)
}

const markReady = async (newsletter) => {
  try {
    await updateNewsletterInDirectus(newsletter.id, { status: 'ready' })
    newsletter.status = 'ready'
    showNotification('Newsletter marked as ready')
  } catch (error) {
    showNotification('Failed to update newsletter status', 'error')
  }
}

const sendNewsletter = (newsletter) => {
  navigateTo(`/?edit=${newsletter.id}&send=true`)
}

const sendTestEmail = (newsletter) => {
  // This would open a test email modal or redirect to editor with test modal
  navigateTo(`/?edit=${newsletter.id}`)
}

const duplicateNewsletter = async (newsletterId) => {
  try {
    const duplicated = await duplicateNewsletterInDirectus(newsletterId)
    newsletters.value.unshift(duplicated)
    showNotification('Newsletter duplicated successfully')
  } catch (error) {
    showNotification('Failed to duplicate newsletter', 'error')
  }
}

const deleteNewsletter = async (newsletterId) => {
  if (!confirm('Are you sure you want to delete this newsletter? This action cannot be undone.')) {
    return
  }

  try {
    await deleteNewsletterFromDirectus(newsletterId)
    newsletters.value = newsletters.value.filter(n => n.id !== newsletterId)
    showNotification('Newsletter deleted successfully')
    updateStats()
  } catch (error) {
    showNotification('Failed to delete newsletter', 'error')
  }
}

// Enhanced data loading
const refreshNewsletters = async () => {
  loading.value = true
  try {
    newsletters.value = await fetchNewsletters({
      sort: ['-date_created'],
      limit: 100
    })
    updateStats()
  } catch (error) {
    console.error('Failed to load newsletters:', error)
    showNotification('Failed to load newsletters', 'error')
  } finally {
    loading.value = false
  }
}

const updateStats = () => {
  stats.value = {
    total: newsletters.value.length,
    sent: newsletters.value.filter(n => n.status === 'sent').length,
    scheduled: newsletters.value.filter(n => n.status === 'scheduled').length,
    subscribers: 0 // This would come from a separate API call
  }
}

// Close menu when clicking outside
onMounted(() => {
  refreshNewsletters()
  
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.relative')) {
      openMenuId.value = null
    }
  })
})
</script>

<style scoped>
/* Enhanced line clamping */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Enhanced transitions */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 200ms;
}

/* Enhanced hover effects */
.group:hover .group-hover\:text-blue-600 {
  color: #2563eb;
}

.group:hover .group-hover\:shadow-md {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

/* Enhanced scrollbar */
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
</style>