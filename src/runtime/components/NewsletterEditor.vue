<template>
  <div class="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-blue-50 font-sans antialiased">
    <!-- Enhanced Header -->
    <div class="flex-shrink-0 bg-white/90 backdrop-blur-sm border-b border-slate-200/60 px-6 py-4 shadow-sm">
      <div class="flex items-center justify-between">
        <!-- Progress & Status -->
        <div class="flex items-center space-x-4">
          <div class="flex items-center space-x-3">
            <div class="relative w-10 h-10">
              <div class="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md flex items-center justify-center">
                <Icon name="lucide:mail" class="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <h1 class="text-xl font-bold text-slate-900">Newsletter Editor</h1>
              <div class="flex items-center space-x-2 text-sm text-slate-600">
                <span>{{ completionPercentage }}% complete</span>
                <div class="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    class="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out"
                    :style="{ width: `${completionPercentage}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center space-x-3">
          <button
            v-if="templates.length > 0"
            @click="showTemplateSelector = !showTemplateSelector"
            class="inline-flex items-center px-4 py-2.5 border border-slate-300 text-sm font-medium rounded-xl text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-sm"
          >
            <Icon name="lucide:layout-template" class="w-4 h-4 mr-2" />
            Templates
          </button>
          
          <button
            @click="$emit('save')"
            :disabled="!isValid"
            class="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Icon name="lucide:save" class="w-4 h-4 mr-2" />
            Save Draft
          </button>
        </div>
      </div>

      <!-- Template Selector Dropdown -->
      <Transition
        enter-active-class="transition ease-out duration-200"
        enter-from-class="transform opacity-0 scale-95 translate-y-1"
        enter-to-class="transform opacity-100 scale-100 translate-y-0"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="transform opacity-100 scale-100 translate-y-0"
        leave-to-class="transform opacity-0 scale-95 translate-y-1"
      >
        <div
          v-if="showTemplateSelector"
          class="absolute top-full right-6 mt-2 w-80 bg-white rounded-xl shadow-xl ring-1 ring-black/5 z-20 overflow-hidden"
        >
          <div class="p-4 border-b border-slate-100">
            <h3 class="text-sm font-semibold text-slate-900">Choose Template</h3>
            <p class="text-xs text-slate-600 mt-1">Start with a pre-designed template</p>
          </div>
          <div class="max-h-64 overflow-y-auto p-2">
            <div class="grid gap-2">
              <button
                v-for="template in templates"
                :key="template.id"
                @click="loadTemplate(template.id); showTemplateSelector = false"
                class="flex items-center p-3 rounded-lg hover:bg-slate-50 transition-colors text-left group"
              >
                <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mr-3">
                  <Icon name="lucide:layout" class="w-4 h-4 text-blue-600" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                    {{ template.name }}
                  </div>
                  <div class="text-xs text-slate-500 truncate">
                    {{ template.description || 'Newsletter template' }}
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Enhanced Block Types Toolbar -->
    <div class="flex-shrink-0 bg-white border-b border-slate-200 px-6 py-4">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-sm font-semibold text-slate-900">Content Blocks</h2>
        <span class="text-xs text-slate-500">Drag to add • Click to insert</span>
      </div>

      <div v-if="loadingBlockTypes" class="flex items-center justify-center py-4">
        <Icon name="lucide:loader-2" class="w-5 h-5 text-blue-500 animate-spin mr-2" />
        <span class="text-sm text-slate-600">Loading blocks...</span>
      </div>

      <div v-else class="space-y-4">
        <div v-for="category in blockCategories" :key="category" class="space-y-2">
          <h3 class="text-xs font-medium text-slate-500 uppercase tracking-wider">
            {{ formatCategoryName(category) }}
          </h3>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="blockType in getBlocksByCategory(category)"
              :key="blockType.id"
              @click="addBlockFromType(blockType)"
              class="group inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-blue-300 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-200"
              :title="blockType.description"
            >
              <Icon 
                :name="getBlockIcon(blockType)" 
                class="w-4 h-4 mr-2 text-slate-500 group-hover:text-blue-600 transition-colors" 
              />
              <span class="text-slate-700 group-hover:text-slate-900">{{ blockType.name }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Layout -->
    <div class="flex flex-1 overflow-hidden min-h-0">
      <!-- Enhanced Editor Canvas -->
      <div class="flex-1 overflow-y-auto min-h-0">
        <div class="max-w-4xl mx-auto p-6 space-y-6">
          <!-- Enhanced Newsletter Settings Card -->
          <div class="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
            <div class="bg-gradient-to-r from-slate-50 to-blue-50/30 px-6 py-4 border-b border-slate-200/60">
              <div class="flex items-center space-x-3">
                <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <Icon name="lucide:settings" class="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 class="text-lg font-semibold text-slate-900">Newsletter Settings</h2>
                  <p class="text-sm text-slate-600">Configure your newsletter details</p>
                </div>
              </div>
            </div>

            <div class="p-6 space-y-6">
              <!-- Subject Line -->
              <div class="space-y-2">
                <label for="subject" class="block text-sm font-medium text-slate-700">
                  Subject Line <span class="text-red-500">*</span>
                </label>
                <div class="relative">
                  <input
                    id="subject"
                    v-model="newsletter.subject_line"
                    type="text"
                    placeholder="Enter a compelling subject line..."
                    class="block w-full px-4 py-3 text-sm border border-slate-300 rounded-xl shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                    :class="{ 'border-red-300 focus:border-red-500 focus:ring-red-500/20': errors.subject }"
                    @blur="validateField('subject')"
                  />
                  <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Icon 
                      name="lucide:check-circle" 
                      v-if="newsletter.subject_line && !errors.subject"
                      class="w-4 h-4 text-green-500" 
                    />
                  </div>
                </div>
                <div class="flex items-center justify-between">
                  <p v-if="errors.subject" class="text-sm text-red-600">{{ errors.subject }}</p>
                  <p class="text-xs text-slate-500 ml-auto">
                    {{ newsletter.subject_line?.length || 0 }}/78 characters
                  </p>
                </div>
              </div>

              <!-- Preview Text -->
              <div class="space-y-2">
                <label for="preheader" class="block text-sm font-medium text-slate-700">
                  Preview Text
                </label>
                <input
                  id="preheader"
                  v-model="newsletter.preview_text"
                  type="text"
                  placeholder="Appears in inbox preview..."
                  class="block w-full px-4 py-3 text-sm border border-slate-300 rounded-xl shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                />
                <p class="text-xs text-slate-500">
                  {{ newsletter.preview_text?.length || 0 }}/140 characters
                </p>
              </div>

              <!-- Sender Info -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-2">
                  <label for="from_name" class="block text-sm font-medium text-slate-700">
                    From Name
                  </label>
                  <input
                    id="from_name"
                    v-model="newsletter.from_name"
                    type="text"
                    placeholder="Your Company"
                    class="block w-full px-4 py-3 text-sm border border-slate-300 rounded-xl shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                  />
                </div>
                <div class="space-y-2">
                  <label for="from_email" class="block text-sm font-medium text-slate-700">
                    From Email <span class="text-red-500">*</span>
                  </label>
                  <div class="relative">
                    <input
                      id="from_email"
                      v-model="newsletter.from_email"
                      type="email"
                      placeholder="newsletter@company.com"
                      class="block w-full px-4 py-3 text-sm border border-slate-300 rounded-xl shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                      :class="{ 'border-red-300 focus:border-red-500 focus:ring-red-500/20': errors.from_email }"
                      @blur="validateField('from_email')"
                    />
                    <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <Icon 
                        name="lucide:check-circle" 
                        v-if="newsletter.from_email && !errors.from_email"
                        class="w-4 h-4 text-green-500" 
                      />
                    </div>
                  </div>
                  <p v-if="errors.from_email" class="text-sm text-red-600">{{ errors.from_email }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Enhanced Content Blocks Section -->
          <div class="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
            <div class="bg-gradient-to-r from-slate-50 to-blue-50/30 px-6 py-4 border-b border-slate-200/60">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                    <Icon name="lucide:blocks" class="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 class="text-lg font-semibold text-slate-900">Content Blocks</h2>
                    <p class="text-sm text-slate-600">{{ blocks.length }} block{{ blocks.length !== 1 ? 's' : '' }}</p>
                  </div>
                </div>
                <span class="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                  Drag to reorder
                </span>
              </div>
            </div>

            <div class="p-6">
              <!-- Empty State -->
              <div v-if="blocks.length === 0" class="text-center py-12">
                <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                  <Icon name="lucide:plus" class="w-8 h-8 text-slate-400" />
                </div>
                <h3 class="text-lg font-medium text-slate-900 mb-2">Start Building Your Newsletter</h3>
                <p class="text-slate-600 mb-6 max-w-sm mx-auto">
                  Add content blocks from the toolbar above to create your newsletter
                </p>
                <button
                  v-if="blockTypes.length > 0"
                  @click="addBlockFromType(blockTypes[0])"
                  class="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <Icon name="lucide:plus" class="w-4 h-4 mr-2" />
                  Add First Block
                </button>
              </div>

              <!-- Enhanced Block List -->
              <TransitionGroup
                v-else
                name="block-list"
                tag="div"
                class="space-y-4"
              >
                <div
                  v-for="(block, index) in blocks"
                  :key="block.id"
                  class="group relative bg-slate-50/50 border border-slate-200/60 rounded-xl overflow-hidden hover:shadow-md transition-all duration-200"
                  :class="{
                    'ring-2 ring-blue-500/20 border-blue-300': dragOverIndex === index,
                    'opacity-50': draggedIndex === index
                  }"
                  @dragover.prevent="dragOverIndex = index"
                  @dragleave="dragOverIndex = null"
                  @drop="handleDrop(index)"
                >
                  <!-- Block Header -->
                  <div class="flex items-center justify-between p-4 bg-white border-b border-slate-200/60">
                    <div class="flex items-center space-x-3">
                      <button
                        class="cursor-grab active:cursor-grabbing p-1 rounded-md hover:bg-slate-100 transition-colors"
                        draggable="true"
                        @dragstart="handleDragStart(index)"
                        @dragend="handleDragEnd"
                        title="Drag to reorder"
                      >
                        <Icon name="lucide:grip-vertical" class="w-4 h-4 text-slate-400" />
                      </button>
                      
                      <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                        <Icon :name="getBlockIcon(getBlockType(block.type))" class="w-4 h-4 text-blue-600" />
                      </div>
                      
                      <div>
                        <h3 class="text-sm font-medium text-slate-900">
                          {{ getBlockType(block.type)?.name || block.type }}
                        </h3>
                        <p class="text-xs text-slate-500">Block {{ index + 1 }}</p>
                      </div>
                    </div>

                    <!-- Block Actions -->
                    <div class="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        @click="duplicateBlock(block.id)"
                        class="p-2 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                        title="Duplicate"
                      >
                        <Icon name="lucide:copy" class="w-4 h-4" />
                      </button>
                      <button
                        @click="moveBlock(block.id, Math.max(0, index - 1))"
                        :disabled="index === 0"
                        class="p-2 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Move up"
                      >
                        <Icon name="lucide:arrow-up" class="w-4 h-4" />
                      </button>
                      <button
                        @click="moveBlock(block.id, Math.min(blocks.length - 1, index + 1))"
                        :disabled="index === blocks.length - 1"
                        class="p-2 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Move down"
                      >
                        <Icon name="lucide:arrow-down" class="w-4 h-4" />
                      </button>
                      <button
                        @click="removeBlock(block.id)"
                        class="p-2 rounded-md hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Icon name="lucide:trash-2" class="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <!-- Enhanced Block Content -->
                  <div class="p-4">
                    <NewsletterBlock
                      v-if="getBlockType(block.type)"
                      :block="block"
                      :block-type="getBlockType(block.type)"
                      @update="(updates: any) => updateBlock(block.id, updates)"
                    />
                    <div v-else class="text-center py-8">
                      <div class="w-12 h-12 mx-auto mb-4 rounded-xl bg-red-100 flex items-center justify-center">
                        <Icon name="lucide:alert-triangle" class="w-6 h-6 text-red-500" />
                      </div>
                      <h4 class="text-sm font-medium text-slate-900 mb-1">Unknown Block Type</h4>
                      <p class="text-xs text-slate-500 mb-4">{{ block.type }}</p>
                      <button
                        @click="removeBlock(block.id)"
                        class="text-xs text-red-600 hover:text-red-700 underline"
                      >
                        Remove Block
                      </button>
                    </div>
                  </div>
                </div>
              </TransitionGroup>
            </div>
          </div>
        </div>
      </div>

      <!-- Enhanced Preview Panel -->
      <div v-if="showPreview" class="w-96 bg-white border-l border-slate-200/60 flex flex-col flex-shrink-0">
        <NewsletterPreview
          :newsletter="newsletter"
          :block-types="blockTypes"
          @update:compiled="handleCompiled"
        />
      </div>
    </div>

    <!-- Enhanced Notification Toast -->
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
        class="fixed top-6 right-6 max-w-sm w-full bg-white rounded-xl shadow-xl ring-1 ring-black/5 overflow-hidden z-50"
      >
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
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import type { NewsletterData } from '../../types';

interface Props {
  modelValue?: NewsletterData
  showPreview?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showPreview: true
})

const emit = defineEmits<{
  'update:modelValue': [value: NewsletterData]
  'save': []
}>()

// Core newsletter editing
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

// Enhanced state management
const errors = ref<Record<string, string>>({})
const notification = ref({
  show: false,
  message: '',
  type: 'success' as 'success' | 'error'
})

const blockTypes = ref<any[]>([])
const templates = ref<any[]>([])
const loadingBlockTypes = ref(true)
const showTemplateSelector = ref(false)

// Drag and drop state
const draggedIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

// Enhanced computed properties
const completionPercentage = computed(() => {
  let completed = 0
  let total = 4

  if (newsletter.value.subject_line?.trim()) completed++
  if (newsletter.value.from_email?.trim()) completed++
  if (blocks.value.length > 0) completed++
  if (newsletter.value.preview_text?.trim()) completed++

  return Math.round((completed / total) * 100)
})

const isValid = computed(() => {
  return newsletter.value.subject_line?.trim() && 
         newsletter.value.from_email?.trim() && 
         !Object.values(errors.value).some(error => error)
})

const blockCategories = computed(() => {
  const categories = new Set(blockTypes.value.map(bt => bt.category || 'content'))
  return Array.from(categories).sort()
})

// Enhanced utility functions
const formatCategoryName = (category: string) => {
  return category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const getBlocksByCategory = (category: string) => {
  return blockTypes.value.filter(bt => (bt.category || 'content') === category)
}

const getBlockType = (type: string) => {
  return blockTypes.value.find(bt => bt.slug === type)
}

const getBlockIcon = (blockType: any) => {
  if (!blockType) return 'lucide:square'
  
  const iconMap: Record<string, string> = {
    header: 'lucide:type',
    text: 'lucide:align-left',
    image: 'lucide:image',
    button: 'lucide:mouse-pointer',
    divider: 'lucide:minus',
    'cta-section': 'lucide:zap',
    'product-showcase': 'lucide:shopping-bag',
    footer: 'lucide:layout-footer'
  }
  
  return iconMap[blockType.slug] || 'lucide:square'
}

// Enhanced event handlers
const addBlockFromType = (blockType: any) => {
  const placeholders = getPlaceholderContent(blockType.slug)
  addBlock(blockType.slug, placeholders)
  showNotification(`Added ${blockType.name} block`)
}

const handleDragStart = (index: number) => {
  draggedIndex.value = index
}

const handleDragEnd = () => {
  draggedIndex.value = null
  dragOverIndex.value = null
}

const handleDrop = (index: number) => {
  if (draggedIndex.value !== null && draggedIndex.value !== index) {
    const sourceBlock = blocks.value[draggedIndex.value]
    moveBlock(sourceBlock.id, index)
  }
  handleDragEnd()
}

// Enhanced validation
const validateField = (field: string) => {
  errors.value = { ...errors.value }
  
  switch (field) {
    case 'subject':
      if (!newsletter.value.subject_line?.trim()) {
        errors.value.subject = 'Subject line is required'
      } else if (newsletter.value.subject_line.length > 78) {
        errors.value.subject = 'Subject line should be under 78 characters'
      } else {
        delete errors.value.subject
      }
      break
    case 'from_email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!newsletter.value.from_email?.trim()) {
        errors.value.from_email = 'From email is required'
      } else if (!emailRegex.test(newsletter.value.from_email)) {
        errors.value.from_email = 'Please enter a valid email address'
      } else {
        delete errors.value.from_email
      }
      break
  }
}

// Enhanced notifications
const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
  notification.value = { show: true, message, type }
  setTimeout(() => {
    notification.value.show = false
  }, 3000)
}

// Enhanced placeholder content
const getPlaceholderContent = (blockSlug: string) => {
  const placeholders: Record<string, any> = {
    header: {
      title: 'Welcome to Our Newsletter',
      subtitle: 'Stay updated with the latest news and insights',
      button_text: 'Learn More',
      button_url: 'https://example.com',
      background_color: '#f8fafc',
      text_color: '#1f2937'
    },
    text: {
      text_content: 'Add your main content here. You can use <strong>HTML formatting</strong> to make text <em>italic</em> or <a href="#">add links</a>.',
      background_color: '#ffffff',
      text_color: '#374151'
    },
    'cta-section': {
      cta_title: 'Ready to Get Started?',
      cta_subtitle: 'Join thousands of satisfied customers',
      primary_button_text: 'Get Started',
      primary_button_url: 'https://example.com/signup',
      secondary_button_text: 'Learn More',
      secondary_button_url: 'https://example.com/about'
    },
    'product-showcase': {
      title: 'Featured Product',
      subtitle: 'Perfect for your needs',
      price: '$99.99',
      button_text: 'Shop Now',
      button_url: 'https://example.com/product'
    }
  }
  
  return placeholders[blockSlug] || {}
}

// Template loading
const loadTemplate = async (templateId: string) => {
  if (!templateId) return

  try {
    const template = await fetchTemplate(templateId)
    loadFromTemplate(template)
    showNotification(`Loaded template: ${template.name}`)
  } catch (error) {
    showNotification('Failed to load template', 'error')
  }
}

// Handle compiled output
const handleCompiled = (compiled: { mjml: string, html: string }) => {
  newsletter.value.compiled_mjml = compiled.mjml
  newsletter.value.compiled_html = compiled.html
}

// Enhanced data loading
onMounted(async () => {
  try {
    const [blockTypesData, templatesData] = await Promise.all([
      fetchBlockTypes().catch(() => {
        showNotification('Could not load block types', 'error')
        return []
      }),
      fetchTemplates({ limit: 50 }).catch(() => [])
    ])

    blockTypes.value = blockTypesData
    templates.value = templatesData
  } finally {
    loadingBlockTypes.value = false
  }
})

// Enhanced emit changes
watch(newsletter, (value) => {
  if (value.subject_line) validateField('subject')
  if (value.from_email) validateField('from_email')
  emit('update:modelValue', value)
}, { deep: true })

// Close dropdowns when clicking outside
onMounted(() => {
  const handleClickOutside = () => {
    showTemplateSelector.value = false
  }
  document.addEventListener('click', handleClickOutside)
})
</script>

<style scoped>
/* Enhanced drag and drop animations */
.block-list-move,
.block-list-enter-active,
.block-list-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.block-list-enter-from,
.block-list-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.block-list-leave-active {
  position: absolute;
  right: 0;
  left: 0;
}

/* Enhanced scrollbar styling */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: rgba(148, 163, 184, 0.1);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.4);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.6);
}

/* Custom gradient backgrounds */
.bg-gradient-to-br {
  background-image: linear-gradient(to bottom right, var(--tw-gradient-stops));
}
</style>