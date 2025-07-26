<template>
  <div class="newsletter-editor-page">
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>{{ loadingMessage }}</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <h2>Error Loading Editor</h2>
      <p>{{ error }}</p>
      <button @click="initializeEditor" class="retry-button">Retry</button>
    </div>

    <!-- Editor -->
    <div v-else class="editor-container">
      <!-- Header -->
      <div class="editor-header">
        <h1>{{ newsletter.id ? 'Edit' : 'Create' }} Newsletter</h1>
        
        <!-- Template Selector -->
        <div class="template-selector">
          <label>Apply Template:</label>
          <select @change="applyTemplate($event.target.value)" v-model="selectedTemplateId">
            <option value="">Choose template...</option>
            <option v-for="template in templates" :key="template.id" :value="template.id">
              {{ template.name }}
            </option>
          </select>
        </div>

        <!-- Save Status -->
        <div v-if="saveStatus" :class="['save-status', saveStatus.type]">
          {{ saveStatus.message }}
        </div>
      </div>

      <!-- Newsletter Editor Component -->
      <NewsletterEditor 
        v-model="newsletter" 
        :show-preview="true"
        @save="saveNewsletter"
      />
      <BlockStructureDiagnostic 
        :newsletter="newsletter" 
        :blockTypes="blockTypes"
        @update:newsletter="newsletter = $event"
      />

      <!-- Action Buttons -->
      <div class="action-buttons">
        <button 
          @click="saveNewsletter" 
          :disabled="saving"
          class="save-button"
        >
          <span v-if="saving">Saving...</span>
          <span v-else>{{ newsletter.id ? 'Update' : 'Create' }} Newsletter</span>
        </button>

        <button 
          @click="sendTestEmail" 
          :disabled="!newsletter.id || saving"
          class="test-button"
        >
          Send Test Email
        </button>
        <button 
          v-if="newsletter.id"
          @click="deleteNewsletter"
          class="delete-button"
        >
          Delete Newsletter
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// Get newsletter ID from route if editing
const route = useRoute()
const router = useRouter()
const newsletterId = ref(route.params.id || null)

// State
const newsletter = ref({
  title: '',
  subject_line: '',
  preview_text: '',
  from_name: '',
  from_email: '',
  reply_to: '',
  blocks: [],
  status: 'draft',
  category: ''
})

const blockTypes = ref([])
const templates = ref([])
const selectedTemplateId = ref('')
const loading = ref(true)
const loadingMessage = ref('Initializing editor...')
const error = ref(null)
const saving = ref(false)
const saveStatus = ref(null)

// Composables
const { 
  fetchBlockTypes, 
  fetchTemplates, 
  fetchTemplate,
  fetchNewsletter,
  createNewsletter,
  updateNewsletter,
  deleteNewsletter: deleteNewsletterApi
} = useDirectusNewsletter()

const { sendTestEmail: sendTest } = useSendGrid()

// Apply template to newsletter
const applyTemplate = async (templateId) => {
  if (!templateId) return

  try {
    loadingMessage.value = 'Applying template...'
    loading.value = true
    
    // Fetch the full template
    const template = await fetchTemplate(templateId)
    
    // Parse blocks_config if it's a string
    let templateBlocks = []
    try {
      templateBlocks = typeof template.blocks_config === 'string' 
        ? JSON.parse(template.blocks_config)
        : template.blocks_config
    } catch (error) {
      console.error('Invalid template blocks_config:', error)
      throw new Error('Template has invalid block configuration')
    }

    // Transform template blocks to newsletter blocks
    const newBlocks = []
    
    for (const [index, blockConfig] of templateBlocks.entries()) {
      // Extract the block type slug from the config
      const blockTypeSlug = blockConfig.block_type_slug || blockConfig.type || blockConfig.blockType
      
      if (!blockTypeSlug) {
        console.warn('Block config missing type:', blockConfig)
        continue
      }

      // Find the corresponding block type
      const blockType = blockTypes.value.find(bt => bt.slug === blockTypeSlug)
      
      if (!blockType) {
        console.warn(`Block type not found for slug: ${blockTypeSlug}`)
        continue
      }

      // Create the block with proper structure
      const newBlock = {
        id: `block_${Date.now()}_${index}`,
        type: blockType.slug, // Store the slug for the editor
        block_type: blockType.id, // Store the ID for Directus
        content: blockConfig.data || blockConfig.content || {},
        sort: index
      }
      
      newBlocks.push(newBlock)
    }

    // Update newsletter with template data
    newsletter.value = {
      ...newsletter.value,
      blocks: newBlocks,
      title: template.default_subject_pattern || newsletter.value.title,
      subject_line: template.default_subject_pattern || newsletter.value.subject_line,
      from_name: template.default_from_name || newsletter.value.from_name,
      from_email: template.default_from_email || newsletter.value.from_email,
      reply_to: template.default_reply_to || newsletter.value.reply_to,
      category: template.default_category || newsletter.value.category,
      template_id: template.id
    }

    showSaveStatus('Template applied successfully!', 'success')
    
  } catch (err) {
    console.error('Failed to apply template:', err)
    showSaveStatus('Failed to apply template: ' + err.message, 'error')
  } finally {
    loading.value = false
  }
}

// Initialize editor
const initializeEditor = async () => {
  try {
    loading.value = true
    error.value = null
    
    // Load block types
    loadingMessage.value = 'Loading block types...'
    const blockTypesData = await fetchBlockTypes()
    blockTypes.value = blockTypesData

    // Load templates
    loadingMessage.value = 'Loading templates...'
    const templatesData = await fetchTemplates()
    templates.value = templatesData

    // Load existing newsletter if editing
    if (newsletterId.value) {
      loadingMessage.value = 'Loading newsletter...'
      const existingNewsletter = await fetchNewsletter(newsletterId.value)
      newsletter.value = existingNewsletter
    }

    loading.value = false
  } catch (err) {
    error.value = err.message || 'Failed to initialize editor'
    loading.value = false
  }
}

// Save newsletter
// Add this debug version of saveNewsletter to your index.vue to see what's happening

const saveNewsletter = async () => {
  if (saving.value) return

  try {
    saving.value = true
    clearSaveStatus()

    // Validate required fields
    if (!newsletter.value.subject_line?.trim()) {
      throw new Error('Subject line is required')
    }

    // Auto-generate title from subject if not provided
    if (!newsletter.value.title?.trim()) {
      newsletter.value.title = newsletter.value.subject_line
    }

    // Debug: Log the newsletter structure before transformation
    console.log('=== SAVE DEBUG ===')
    console.log('Newsletter before save:', {
      ...newsletter.value,
      blocks: newsletter.value.blocks.map(b => ({
        id: b.id,
        type: b.type,
        block_type: b.block_type,
        hasContent: !!b.content,
        contentKeys: Object.keys(b.content || {})
      }))
    })

    // Debug: Check block types
    const blockTypes = await fetchBlockTypes()
    console.log('Available block types:', blockTypes.map(bt => ({
      id: bt.id,
      slug: bt.slug
    })))

    // Debug: Try transformation
    const { transformBlocksForDirectus } = useDirectusNewsletter()
    try {
      const transformedBlocks = await transformBlocksForDirectus(newsletter.value.blocks)
      console.log('Transformed blocks:', transformedBlocks.map(b => ({
        id: b.id,
        block_type: b.block_type,
        hasContent: !!b.content
      })))
    } catch (transformError) {
      console.error('Block transformation failed:', transformError)
      throw new Error(`Block transformation failed: ${transformError.message}`)
    }

    // Debug: Log the final payload
    console.log('Sending newsletter data...')

    let result

    if (newsletter.value.id) {
      // Update existing - the composable will handle block transformation
      result = await updateNewsletter(newsletter.value.id, newsletter.value)
      showSaveStatus('Newsletter updated successfully!', 'success')
    } else {
      // Create new - the composable will handle block transformation
      result = await createNewsletter(newsletter.value)
      newsletter.value.id = result.id
      showSaveStatus('Newsletter created successfully!', 'success')
      
      // Update URL to include the new ID
      router.replace({ params: { id: result.id } })
    }

    return result

  } catch (err) {
    console.error('=== SAVE ERROR ===')
    console.error('Full error:', err)
    console.error('Error response:', err.response)
    
    // More detailed error messages
    let errorMessage = 'Failed to save newsletter'
    
    if (err.response?.status === 403) {
      errorMessage = 'Permission denied. This might be a data format issue.'
      console.error('403 Error - Check if blocks have proper block_type UUIDs')
    } else if (err.response?.status === 422) {
      errorMessage = 'Validation error. Check the browser console for details.'
      if (err.response?.data?.errors) {
        console.error('Validation errors:', err.response.data.errors)
      }
    } else if (err.message.includes('Block transformation')) {
      errorMessage = err.message
    } else if (err.message.includes('Invalid block type')) {
      errorMessage = `Invalid block type. Make sure all block types exist in Directus.`
    }
    
    showSaveStatus(errorMessage, 'error')
  } finally {
    saving.value = false
  }
}

// Send test email
const sendTestEmail = async () => {
  const email = prompt('Enter test email address:')
  if (!email) return

  try {
    await sendTest(newsletter.value, email)
    showSaveStatus('Test email sent!', 'success')
  } catch (err) {
    showSaveStatus('Failed to send test email', 'error')
  }
}

// Delete newsletter
const deleteNewsletter = async () => {
  if (!confirm('Are you sure you want to delete this newsletter?')) return

  try {
    await deleteNewsletterApi(newsletter.value.id)
    showSaveStatus('Newsletter deleted', 'success')
    
    // Redirect to newsletter list
    setTimeout(() => {
      router.push('/newsletters')
    }, 1500)
  } catch (err) {
    showSaveStatus('Failed to delete newsletter', 'error')
  }
}

// Status helpers
const showSaveStatus = (message, type = 'success') => {
  saveStatus.value = { message, type }
  setTimeout(clearSaveStatus, 5000)
}

const clearSaveStatus = () => {
  saveStatus.value = null
}

// Initialize on mount
onMounted(() => {
  initializeEditor()
})
</script>

<style scoped>
.newsletter-editor-page {
  min-height: 100vh;
  background-color: #f8fafc;
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 1rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.editor-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.editor-header h1 {
  font-size: 1.875rem;
  font-weight: 700;
  color: #1e293b;
}

.template-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.template-selector label {
  font-weight: 500;
  color: #475569;
}

.template-selector select {
  padding: 0.5rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  background-color: white;
}

.save-status {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.save-status.success {
  background-color: #dcfce7;
  color: #166534;
}

.save-status.error {
  background-color: #fee2e2;
  color: #991b1b;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e2e8f0;
}

.save-button,
.test-button,
.delete-button {
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: all 0.2s;
}

.save-button {
  background-color: #3b82f6;
  color: white;
  border: none;
}

.save-button:hover:not(:disabled) {
  background-color: #2563eb;
}

.save-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.test-button {
  background-color: #8b5cf6;
  color: white;
  border: none;
}

.test-button:hover:not(:disabled) {
  background-color: #7c3aed;
}

.test-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.delete-button {
  background-color: #ef4444;
  color: white;
  border: none;
  margin-left: auto;
}

.delete-button:hover {
  background-color: #dc2626;
}

.retry-button {
  padding: 0.5rem 1rem;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
}

.retry-button:hover {
  background-color: #2563eb;
}
</style>