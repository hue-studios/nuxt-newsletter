// src/runtime/composables/useNewsletterEditor.ts
import { computed, nextTick, ref } from 'vue';
import type { NewsletterBlock, NewsletterData } from '../../types';

export function useNewsletterEditor(initialData?: NewsletterData) {
  const newsletter = ref<NewsletterData>(initialData || {
    title: '',
    subject_line: '',
    preview_text: '',
    blocks: [],
    status: 'draft'
  })

  // Add transitioning state to prevent rapid operations
  const isTransitioning = ref(false)

  // Expose subject and preheader as computed properties for convenience
  const subject = computed({
    get: () => newsletter.value.subject_line,
    set: (value) => { 
      newsletter.value.subject_line = value; 
      newsletter.value.title = value; 
    }
  });

  const preheader = computed({
    get: () => newsletter.value.preview_text || '',
    set: (value) => { newsletter.value.preview_text = value; }
  });

  const blocks = computed({
    get: () => newsletter.value.blocks || [],
    set: (value) => {
      newsletter.value.blocks = value
    }
  })

  const addBlock = (type: string, index?: number): NewsletterBlock => {
    const newBlock: NewsletterBlock = {
      id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      content: {},
      sort: index !== undefined ? index : blocks.value.length
    }

    if (index !== undefined) {
      // Insert at specific position
      const newBlocks = [...blocks.value]
      newBlocks.splice(index, 0, newBlock)
      // Update sort values
      newBlocks.forEach((block, idx) => {
        block.sort = idx
      })
      blocks.value = newBlocks
    } else {
      // Add to end
      blocks.value = [...blocks.value, newBlock]
    }

    return newBlock
  }

  const removeBlock = async (blockId: string): Promise<void> => {
    if (isTransitioning.value) return // Prevent multiple rapid operations
    
    const index = blocks.value.findIndex(b => b.id === blockId)
    if (index === -1) return

    isTransitioning.value = true
    
    try {
      // Create new array without the block to remove
      const newBlocks = blocks.value.filter(b => b.id !== blockId)
      
      // Update sort values for remaining blocks
      newBlocks.forEach((block, idx) => {
        block.sort = idx
      })
      
      // Update blocks with proper reactivity
      blocks.value = newBlocks
      
      // Wait for DOM update to complete
      await nextTick()
      
    } finally {
      // Reset transitioning state after a short delay to allow transition to complete
      setTimeout(() => {
        isTransitioning.value = false
      }, 300) // Match your CSS transition duration
    }
  }

  const updateBlock = (blockId: string, updates: Partial<NewsletterBlock>): void => {
    const index = blocks.value.findIndex(b => b.id === blockId)
    if (index === -1) return

    // Create new array with updated block to maintain reactivity
    const newBlocks = [...blocks.value]
    newBlocks[index] = { ...newBlocks[index], ...updates }
    blocks.value = newBlocks
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
      id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
      await nextTick()
    } finally {
      setTimeout(() => {
        isTransitioning.value = false
      }, 300)
    }
  }

  const loadFromTemplate = (template: any): void => {
    if (!template) return

    // Parse blocks configuration
    let templateBlocks: any[] = []
    try {
      templateBlocks = Array.isArray(template.blocks_config)
        ? template.blocks_config
        : JSON.parse(template.blocks_config)
    } catch (error) {
      console.error('Invalid template blocks_config:', error)
      return
    }

    // Create new blocks array
    const newBlocks: NewsletterBlock[] = []
    templateBlocks.forEach((blockConfig: any, index: number) => {
      const blockType = blockConfig.type || blockConfig.block_type_slug || blockConfig.blockType
      
      if (!blockType || typeof blockType !== 'string') {
        console.warn('Invalid block config - missing or invalid type:', blockConfig)
        return
      }

      const newBlock: NewsletterBlock = {
        id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: blockType,
        content: blockConfig.content || blockConfig.data || {},
        sort: index
      }
      newBlocks.push(newBlock)
    })

    // Update blocks
    blocks.value = newBlocks

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
  }

  return {
    newsletter,
    blocks,
    subject,
    preheader,
    isTransitioning, // Export this so components can use it
    addBlock,
    removeBlock,
    updateBlock,
    moveBlock,
    duplicateBlock,
    clearBlocks,
    loadFromTemplate
  }
}