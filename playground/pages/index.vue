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
    <!-- <template #header-actions>
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
    </template> -->

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

// Improved loadSample function for playground/pages/index.vue
// This ensures blocks are properly displayed in the Content Blocks section

const loadSample = async () => {
  // First, ensure we have block types loaded
  if (!studioRef.value?.blockTypes || studioRef.value.blockTypes.length === 0) {
    try {
      await studioRef.value?.loadBlockTypes()
    } catch (error) {
      console.error('Failed to load block types:', error)
      // Continue with hardcoded sample anyway
    }
  }

  // Create sample newsletter with proper block structure
  newsletter.value = {
    subject: 'Monthly Newsletter - {{month_year}}',
    preheader: 'Check out our latest updates and news',
    blocks: [
      {
        id: `block_${Date.now()}_1`,
        type: 'hero', // This should match the block type slug in Directus
        block_type: findBlockTypeId('hero'), // Find actual ID from loaded block types
        content: {
          title: 'Welcome to Our Newsletter!',
          subtitle: 'Your monthly dose of updates and insights',
          button_text: 'Learn More',
          button_url: 'https://example.com',
          background_color: '#f8fafc'
        },
        sort: 0
      },
      {
        id: `block_${Date.now()}_2`,
        type: 'text',
        block_type: findBlockTypeId('text'),
        content: {
          text_content: '<p>Here\'s what\'s been happening this month. We have exciting updates to share with you.</p><p>Our team has been working hard to bring you new features and improvements.</p>'
        },
        sort: 1
      },
      {
        id: `block_${Date.now()}_3`,
        type: 'button',
        block_type: findBlockTypeId('button'),
        content: {
          button_text: 'Read Full Newsletter',
          button_url: 'https://example.com/newsletter',
          button_color: '#3b82f6'
        },
        sort: 2
      }
    ],
    status: 'draft'
  }

  // Force reactivity update
  await nextTick()
  
  // Notify the studio component
  if (studioRef.value?.showNotification) {
    studioRef.value.showNotification('Sample content loaded successfully!', 'success')
  }

  console.log('Sample newsletter loaded:', newsletter.value)
}

// Helper function to find block type ID by slug
const findBlockTypeId = (slug) => {
  if (!studioRef.value?.blockTypes) return slug
  
  const blockType = studioRef.value.blockTypes.find(bt => bt.slug === slug)
  return blockType ? blockType.id : slug
}

// Enhanced sample loading with better error handling and validation
const loadSampleWithErrorHandling = async () => {
  try {
    console.log('Loading sample content...')
    
    // Ensure block types are loaded first
    if (studioRef.value?.loadBlockTypes) {
      await studioRef.value.loadBlockTypes()
      console.log('Block types loaded:', studioRef.value.blockTypes?.length || 0)
    }
    
    // Load the sample content
    await loadSample()
    
    // Validate the result
    if (newsletter.value.blocks && newsletter.value.blocks.length > 0) {
      console.log(`Successfully loaded ${newsletter.value.blocks.length} blocks`)
      
      // Log each block for debugging
      newsletter.value.blocks.forEach((block, index) => {
        console.log(`Block ${index + 1}:`, {
          id: block.id,
          type: block.type,
          block_type: block.block_type,
          hasContent: !!block.content,
          contentKeys: block.content ? Object.keys(block.content) : []
        })
      })
    } else {
      console.warn('No blocks were created in sample')
    }
    
  } catch (error) {
    console.error('Failed to load sample:', error)
    
    // Fallback: create simple sample without block type validation
    newsletter.value = {
      subject: 'Sample Newsletter',
      preheader: 'Sample preview text',
      blocks: [
        {
          id: `block_${Date.now()}_fallback`,
          type: 'text',
          block_type: '1', // Fallback ID
          content: {
            text_content: 'This is a fallback sample block.'
          },
          sort: 0
        }
      ],
      status: 'draft'
    }
    
    if (studioRef.value?.showNotification) {
      studioRef.value.showNotification('Loaded fallback sample content', 'info')
    }
  }
}

// Alternative: Use the new block creation method from the studio
const loadSampleUsingStudioMethods = () => {
  if (!studioRef.value) return
  
  // Clear existing content
  newsletter.value = {
    subject: 'Monthly Newsletter Sample',
    preheader: 'Sample preview text',
    blocks: [],
    status: 'draft'
  }
  
  // Add blocks using the studio's methods if available
  const blockTypesToAdd = ['hero', 'text', 'button']
  
  blockTypesToAdd.forEach((blockTypeSlug, index) => {
    const blockType = studioRef.value.blockTypes?.find(bt => bt.slug === blockTypeSlug)
    if (blockType && studioRef.value.handleAddBlock) {
      // Use the studio's block creation method
      studioRef.value.handleAddBlock(blockType)
    }
  })
}

// Usage in the component - replace the existing loadSample function call:
// @click="loadSampleWithErrorHandling"

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