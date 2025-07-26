<!-- playground/pages/index.vue - Simplified with NewsletterStudio -->
<template>
  <NewsletterStudio
    ref="studioRef"
    v-model="newsletter"
    title="Newsletter Module Playground"
    :auto-save="false"
    :show-status-bar="true"
    @save="handleSave"
    @create="handleCreate"
    @error="handleError"
  >
    <!-- Custom header actions -->
    <template #header-actions>
      <button @click="createNew" class="btn btn-secondary">
        <Icon name="lucide:plus" class="w-4 h-4" />
        New Newsletter
      </button>
      <button @click="loadSample" class="btn btn-secondary">
        <Icon name="lucide:file-text" class="w-4 h-4" />
        Load Sample
      </button>
      <button @click="studioRef?.save()" class="btn btn-primary">
        <Icon name="lucide:save" class="w-4 h-4" />
        Save
      </button>
    </template>

    <!-- Custom status bar -->
    <template #status-right>
      <button @click="showDebug = !showDebug" class="btn btn-xs btn-ghost">
        <Icon name="lucide:bug" class="w-3 h-3" />
        Debug
      </button>
    </template>
  </NewsletterStudio>

  <!-- Debug Panel (Optional) -->
  <Transition name="slide">
    <div v-if="showDebug" class="debug-panel">
      <div class="debug-header">
        <h3>Debug Info</h3>
        <button @click="showDebug = false" class="close-btn">
          <Icon name="lucide:x" class="w-4 h-4" />
        </button>
      </div>
      
      <div class="debug-content">
        <pre>{{ JSON.stringify(newsletter, null, 2) }}</pre>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { NewsletterData } from '../../src/types'

// State
const newsletter = ref<NewsletterData>({
  subject: '',
  preheader: '',
  blocks: [],
  status: 'draft'
})

const studioRef = ref()
const showDebug = ref(false)

// Methods
const createNew = () => {
  if (confirm('Create a new newsletter? Unsaved changes will be lost.')) {
    newsletter.value = {
      subject: '',
      preheader: '',
      blocks: [],
      status: 'draft'
    }
    studioRef.value?.showNotification('Created new newsletter', 'info')
  }
}

const loadSample = () => {
  newsletter.value = {
    subject: 'Monthly Newsletter - {{month_year}}',
    preheader: 'Check out our latest updates and news',
    blocks: [
      {
        id: `block_${Date.now()}_1`,
        type: 'hero',
        block_type: '1',
        content: {
          title: 'Welcome to Our Newsletter!',
          subtitle: 'Your monthly dose of updates',
          image: 'https://via.placeholder.com/600x300',
          image_alt_text: 'Newsletter header image',
          button_text: 'Read More',
          button_url: 'https://example.com'
        },
        sort: 0
      },
      {
        id: `block_${Date.now()}_2`,
        type: 'text',
        block_type: '2',
        content: {
          title: 'Latest News',
          text_content: 'Here\'s what\'s been happening this month. We have exciting updates to share with you!'
        },
        sort: 1
      },
      {
        id: `block_${Date.now()}_3`,
        type: 'cta-section',
        block_type: '13',
        content: {
          cta_title: 'Ready to Get Started?',
          cta_subtitle: 'Join thousands of satisfied customers',
          primary_button_text: 'Sign Up Now',
          primary_button_url: 'https://example.com/signup'
        },
        sort: 2
      }
    ],
    status: 'draft'
  }
  
  studioRef.value?.showNotification('Loaded sample newsletter', 'success')
}

const handleSave = async (data: NewsletterData) => {
  console.log('Newsletter saved:', data)
  // In a real app, this would save to your backend
}

const handleCreate = async (data: NewsletterData) => {
  console.log('Newsletter created:', data)
  // In a real app, this would create in your backend
}

const handleError = (error: Error) => {
  console.error('Newsletter error:', error)
}
</script>

<style scoped>
@reference 'tailwindcss';
/* Debug Panel */
.debug-panel {
  @apply fixed right-0 top-0 h-screen w-96 bg-white shadow-xl z-50;
  @apply border-l border-gray-200;
}

.debug-header {
  @apply flex items-center justify-between p-4 border-b border-gray-200;
}

.debug-header h3 {
  @apply text-lg font-semibold;
}

.close-btn {
  @apply p-1 rounded hover:bg-gray-100;
}

.debug-content {
  @apply p-4 overflow-auto h-full;
}

.debug-content pre {
  @apply text-xs bg-gray-50 p-3 rounded;
}

/* Transition */
.slide-enter-active,
.slide-leave-active {
  @apply transition-transform duration-300;
}

.slide-enter-from,
.slide-leave-to {
  @apply translate-x-full;
}

/* Button styles */
.btn {
  @apply inline-flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors;
}

.btn-primary {
  @apply bg-blue-600 text-white hover:bg-blue-700;
}

.btn-secondary {
  @apply bg-gray-100 text-gray-700 hover:bg-gray-200;
}

.btn-ghost {
  @apply text-gray-600 hover:bg-gray-100;
}

.btn-xs {
  @apply px-2 py-1 text-xs;
}
</style>