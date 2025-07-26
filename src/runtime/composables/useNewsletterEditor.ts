// src/runtime/composables/useNewsletterEditor.ts
import { computed, nextTick, ref, watch } from 'vue'
import type { BlockType, NewsletterBlock, NewsletterData } from '../../types'

export interface NewsletterEditorState {
  newsletter: NewsletterData
  blocks: NewsletterBlock[]
  subject: string
  preheader: string
  isTransitioning: boolean
}

export function useNewsletterEditor(initialNewsletter?: Partial<NewsletterData>) {
  // State
  const newsletter = ref<NewsletterData>({
    id: initialNewsletter?.id || undefined,
    title: initialNewsletter?.title || '',
    subject_line: initialNewsletter?.subject_line || '',
    preview_text: initialNewsletter?.preview_text || '',
    from_name: initialNewsletter?.from_name || '',
    from_email: initialNewsletter?.from_email || '',
    reply_to: initialNewsletter?.reply_to || '',
    category: initialNewsletter?.category || '',
    status: initialNewsletter?.status || 'draft',
    blocks: [],
    ...initialNewsletter
  })

  const blocks = ref<NewsletterBlock[]>(initialNewsletter?.blocks || [])
  const isTransitioning = ref(false)

  // Computed properties
  const subject = computed({
    get: () => newsletter.value.subject_line,
    set: (value: string) => {
      newsletter.value.subject_line = value
      newsletter.value.title = value // Keep title in sync
    }
  })

  const preheader = computed({
    get: () => newsletter.value.preview_text,
    set: (value: string) => {
      newsletter.value.preview_text = value
    }
  })

  // Methods
  const addBlock = (blockType: BlockType, content: Record<string, any> = {}): NewsletterBlock => {
    const newBlock: NewsletterBlock = {
      id: generateBlockId(),
      type: blockType.slug,
      block_type: blockType.id,
      content,
      sort: blocks.value.length
    }
    
    blocks.value.push(newBlock)
    syncBlocksToNewsletter()
    return newBlock
  }

  const removeBlock = async (blockId: string): Promise<void> => {
    if (isTransitioning.value) return
    
    const index = blocks.value.findIndex(b => b.id === blockId)
    if (index === -1) return

    isTransitioning.value = true

    try {
      blocks.value.splice(index, 1)
      
      // Update sort values
      blocks.value.forEach((block, idx) => {
        block.sort = idx
      })
      
      syncBlocksToNewsletter()
      await nextTick()
      
    } finally {
      setTimeout(() => {
        isTransitioning.value = false
      }, 300) // CSS transition duration
    }
  }

  const updateBlock = (blockId: string, updates: Partial<NewsletterBlock>): void => {
    const index = blocks.value.findIndex(b => b.id === blockId)
    if (index === -1) return

    // Create new array with updated block to maintain reactivity
    const newBlocks = [...blocks.value]
    newBlocks[index] = { ...newBlocks[index], ...updates }
    blocks.value = newBlocks
    syncBlocksToNewsletter()
  }

  const moveBlock = async (fromIndex: number, toIndex: number): Promise<void> => {
    if (isTransitioning.value) return
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return
    if (fromIndex >= blocks.value.length || toIndex >= blocks.value.length) return

    isTransitioning.value = true

    try {
      const newBlocks = [...blocks.value]
      const [movedBlock] = newBlocks.splice(fromIndex, 1)
      newBlocks.splice(toIndex, 0, movedBlock)
      
      // Update sort values
      newBlocks.forEach((block, idx) => {
        block.sort = idx
      })
      
      blocks.value = newBlocks
      syncBlocksToNewsletter()
      await nextTick()
      
    } finally {
      setTimeout(() => {
        isTransitioning.value = false
      }, 300)
    }
  }

  const duplicateBlock = async (blockId: string): Promise<NewsletterBlock | null> => {
    if (isTransitioning.value) return null
    
    const originalIndex = blocks.value.findIndex(b => b.id === blockId)
    if (originalIndex === -1) return null

    const originalBlock = blocks.value[originalIndex]
    const duplicatedBlock: NewsletterBlock = {
      ...originalBlock,
      id: generateBlockId(),
      content: { ...originalBlock.content },
      sort: originalIndex + 1
    }

    isTransitioning.value = true

    try {
      const newBlocks = [...blocks.value]
      newBlocks.splice(originalIndex + 1, 0, duplicatedBlock)
      
      // Update sort values for blocks after the insertion point
      newBlocks.forEach((block, idx) => {
        block.sort = idx
      })
      
      blocks.value = newBlocks
      syncBlocksToNewsletter()
      await nextTick()
      
      return duplicatedBlock
    } finally {
      setTimeout(() => {
        isTransitioning.value = false
      }, 300)
    }
  }

  const clearBlocks = async (): Promise<void> => {
    if (isTransitioning.value) return
    
    isTransitioning.value = true
    
    try {
      blocks.value = []
      syncBlocksToNewsletter()
      await nextTick()
    } finally {
      setTimeout(() => {
        isTransitioning.value = false
      }, 300)
    }
  }

  const loadFromTemplate = (template: any): void => {
    if (!template) return

    // Clear existing blocks
    blocks.value = []

    // Parse blocks configuration
    let templateBlocks: any[] = []
    try {
      templateBlocks = Array.isArray(template.blocks_config)
        ? template.blocks_config
        : JSON.parse(template.blocks_config || '[]')
    } catch (error) {
      console.error('Invalid template blocks_config:', error)
      return
    }

    // Create new blocks from template with unique IDs
    templateBlocks.forEach((blockConfig: any, index: number) => {
      const blockType = blockConfig.type || blockConfig.block_type_slug || blockConfig.blockType
      
      if (!blockType || typeof blockType !== 'string') {
        console.warn('Invalid block config - missing or invalid type:', blockConfig)
        return
      }

      const newBlock: NewsletterBlock = {
        id: generateBlockId(index),
        type: blockType,
        content: { ...(blockConfig.content || blockConfig.data || {}) },
        sort: index
      }
      
      blocks.value.push(newBlock)
    })

    // Apply template settings with validation
    if (template.default_subject_pattern && typeof template.default_subject_pattern === 'string') {
      newsletter.value.subject_line = template.default_subject_pattern
      newsletter.value.title = template.default_subject_pattern
    }
    if (template.default_from_name) {
      newsletter.value.from_name = template.default_from_name
    }
    if (template.default_from_email) {
      newsletter.value.from_email = template.default_from_email
    }
    if (template.default_reply_to) {
      newsletter.value.reply_to = template.default_reply_to
    }
    if (template.default_category) {
      newsletter.value.category = template.default_category
    }

    syncBlocksToNewsletter()
  }

  // Helper functions
  const generateBlockId = (index?: number): string => {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substr(2, 9)
    const suffix = index !== undefined ? `_${index}` : ''
    return `block_${timestamp}_${random}${suffix}`
  }

  const syncBlocksToNewsletter = (): void => {
    newsletter.value.blocks = blocks.value.map(block => ({
      ...block,
      content: { ...block.content }
    }))
  }

  // Watch for external changes
  watch(() => initialNewsletter, (newValue) => {
    if (newValue) {
      newsletter.value = { ...newsletter.value, ...newValue }
      if (newValue.blocks) {
        blocks.value = newValue.blocks.map(block => ({
          ...block,
          content: { ...block.content }
        }))
      }
    }
  }, { deep: true })

  return {
    // State
    newsletter,
    blocks,
    subject,
    preheader,
    isTransitioning,
    
    // Methods
    addBlock,
    removeBlock,
    updateBlock,
    moveBlock,
    duplicateBlock,
    clearBlocks,
    loadFromTemplate
  }
}