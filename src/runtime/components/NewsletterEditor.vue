<template>
  <div class="newsletter-editor">
    <div class="newsletter-editor__toolbar">
      <div class="toolbar-section">
        <h3>Newsletter Editor</h3>
        <select 
          v-if="templates.length > 0" 
          @change="loadTemplate($event.target.value)"
          class="template-select"
        >
          <option value="">-- Select Template --</option>
          <option 
            v-for="template in templates" 
            :key="template.id"
            :value="template.id"
          >
            {{ template.name }}
          </option>
        </select>
      </div>
      <div class="toolbar-section">
        <div v-if="loadingBlockTypes" class="loading-message">
          Loading block types...
        </div>
        <template v-else>
          <div class="block-categories">
            <div 
              v-for="category in blockCategories" 
              :key="category"
              class="category-group"
            >
              <span class="category-label">{{ category }}:</span>
              <button 
                v-for="blockType in getBlocksByCategory(category)" 
                :key="blockType.id"
                @click="addBlockFromType(blockType)"
                class="toolbar-button"
                :title="blockType.description"
              >
                <span class="icon">{{ blockType.icon || '📄' }}</span>
                <span>{{ blockType.name }}</span>
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>

    <div class="newsletter-editor__main">
      <div class="newsletter-editor__canvas">
        <!-- Newsletter Header Info -->
        <div class="newsletter-header">
          <div class="form-group">
            <label for="subject">Subject Line</label>
            <input
              id="subject"
              v-model="newsletter.subject"
              type="text"
              placeholder="Enter your newsletter subject..."
              class="form-input"
              required
            />
          </div>

          <div class="form-group">
            <label for="preheader">Preheader Text</label>
            <input
              id="preheader"
              v-model="newsletter.preheader"
              type="text"
              placeholder="Preview text that appears in inbox..."
              class="form-input"
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="from_name">From Name</label>
              <input
                id="from_name"
                v-model="newsletter.from_name"
                type="text"
                placeholder="Your Name"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label for="from_email">From Email</label>
              <input
                id="from_email"
                v-model="newsletter.from_email"
                type="email"
                placeholder="newsletter@example.com"
                class="form-input"
              />
            </div>
          </div>
        </div>

        <!-- Blocks -->
        <div class="blocks-container">
          <template v-if="blocks.length === 0">
            <div class="empty-state">
              <p>No blocks added yet. Click the buttons above to add content.</p>
            </div>
          </template>
          
          <div
            v-for="(block, index) in blocks"
            :key="block.id"
            class="block-wrapper"
            :data-block-id="block.id"
          >
            <div class="block-controls">
              <button @click="moveBlock(index, index - 1)" :disabled="index === 0" class="control-btn" title="Move up">
                ↑
              </button>
              <button @click="moveBlock(index, index + 1)" :disabled="index === blocks.length - 1" class="control-btn" title="Move down">
                ↓
              </button>
              <button @click="duplicateBlock(block.id)" class="control-btn" title="Duplicate">
                ⧉
              </button>
              <button @click="removeBlock(block.id)" class="control-btn danger" title="Delete">
                ×
              </button>
            </div>
            
            <NewsletterBlock
              :block="block"
              :block-type="getBlockType(block.type)"
              @update="(updates) => updateBlock(block.id, updates)"
            />
          </div>
        </div>
      </div>

      <!-- Preview Panel -->
      <div v-if="showPreview" class="newsletter-editor__preview">
        <NewsletterPreview 
          :newsletter="newsletter" 
          :block-types="blockTypes"
          @update:compiled="handleCompiled"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, ref } from 'vue'
import { useDirectusNewsletter } from '../composables/useDirectusNewsletter'
import type { NewsletterData } from '../composables/useNewsletterEditor'
import { useNewsletterEditor } from '../composables/useNewsletterEditor'

interface Props {
  modelValue?: NewsletterData
  showPreview?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showPreview: true
})

const emit = defineEmits<{
  'update:modelValue': [value: NewsletterData]
}>()

const { 
  newsletter, 
  blocks, 
  addBlock, 
  removeBlock, 
  updateBlock, 
  moveBlock, 
  duplicateBlock,
  loadFromTemplate 
} = useNewsletterEditor(props.modelValue)

const { fetchBlockTypes, fetchTemplates, fetchTemplate } = useDirectusNewsletter()

// Dynamic component loading
const NewsletterBlock = defineAsyncComponent(() => import('./NewsletterBlock.vue'))
const NewsletterPreview = defineAsyncComponent(() => import('./NewsletterPreview.vue'))

// Block types and templates from Directus
const blockTypes = ref<any[]>([])
const templates = ref<any[]>([])
const loadingBlockTypes = ref(true)

// Load block types and templates from Directus
onMounted(async () => {
  try {
    const [blockTypesData, templatesData] = await Promise.all([
      fetchBlockTypes(),
      fetchTemplates({ limit: 50 })
    ])
    blockTypes.value = blockTypesData
    templates.value = templatesData
    loadingBlockTypes.value = false
  } catch (error) {
    console.error('Failed to load data from Directus:', error)
    loadingBlockTypes.value = false
  }
})

// Get unique categories
const blockCategories = computed(() => {
  const categories = new Set(blockTypes.value.map(bt => bt.category))
  return Array.from(categories).sort()
})

// Get blocks by category
const getBlocksByCategory = (category: string) => {
  return blockTypes.value.filter(bt => bt.category === category)
}

// Get block type by slug
const getBlockType = (slug: string) => {
  return blockTypes.value.find(bt => bt.slug === slug)
}

// Add block from block type
const addBlockFromType = (blockType: any) => {
  const newBlock = addBlock(blockType.slug)
  
  // Set default content based on field visibility config
  if (blockType.field_visibility_config) {
    const defaultContent: any = {}
    
    // Set reasonable defaults for common fields
    if (blockType.field_visibility_config.includes('title')) {
      defaultContent.title = 'Enter title'
    }
    if (blockType.field_visibility_config.includes('text_content')) {
      defaultContent.text_content = 'Enter your content here...'
    }
    if (blockType.field_visibility_config.includes('button_text')) {
      defaultContent.button_text = 'Click here'
      defaultContent.button_url = '#'
    }
    if (blockType.field_visibility_config.includes('image_url')) {
      defaultContent.image_url = ''
      defaultContent.image_alt_text = ''
    }
    
    updateBlock(newBlock.id, { content: defaultContent })
  }
}

// Load template
const loadTemplate = async (templateId: string) => {
  if (!templateId) return
  
  try {
    const template = await fetchTemplate(templateId)
    loadFromTemplate(template)
  } catch (error) {
    console.error('Failed to load template:', error)
  }
}

// Handle compiled MJML/HTML from preview
const handleCompiled = (compiled: { mjml: string, html: string }) => {
  newsletter.value.compiled_mjml = compiled.mjml
  newsletter.value.compiled_html = compiled.html
}

// Watch for changes and emit
watch(newsletter, (value) => {
  emit('update:modelValue', value)
}, { deep: true })
</script>

<style scoped>
/* Base styles */
.newsletter-editor {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
}

.newsletter-editor__toolbar {
  background: white;
  border-bottom: 1px solid #e5e5e5;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.toolbar-section {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.template-select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
}

.block-categories {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.category-group {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.category-label {
  font-size: 0.875rem;
  color: #666;
  text-transform: capitalize;
}

.toolbar-button {
  padding: 0.5rem 0.75rem;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.toolbar-button:hover {
  background: #f5f5f5;
  border-color: #999;
}

.toolbar-button .icon {
  font-size: 1.125rem;
}

.loading-message {
  color: #666;
  font-style: italic;
}

.newsletter-editor__main {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.newsletter-editor__canvas {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
}

.newsletter-header {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.blocks-container {
  min-height: 200px;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #666;
  background: white;
  border-radius: 8px;
  border: 2px dashed #ddd;
}

.block-wrapper {
  position: relative;
  margin-bottom: 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s;
}

.block-wrapper:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.block-controls {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 10;
}

.block-wrapper:hover .block-controls {
  opacity: 1;
}

.control-btn {
  padding: 0.25rem 0.5rem;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
  border-radius: 3px;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.control-btn:hover:not(:disabled) {
  background: #f5f5f5;
  border-color: #999;
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.control-btn.danger {
  color: #dc3545;
}

.control-btn.danger:hover {
  background: #dc3545;
  color: white;
  border-color: #dc3545;
}

.newsletter-editor__preview {
  width: 450px;
  border-left: 1px solid #e5e5e5;
  background: white;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Responsive */
@media (max-width: 1200px) {
  .newsletter-editor__preview {
    width: 400px;
  }
}

@media (max-width: 768px) {
  .newsletter-editor__main {
    flex-direction: column;
  }
  
  .newsletter-editor__preview {
    width: 100%;
    border-left: none;
    border-top: 1px solid #e5e5e5;
    height: 50vh;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>