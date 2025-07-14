// src/runtime/composables/useNewsletterEditor.ts
import { computed, ref } from 'vue';
import type { NewsletterBlock, NewsletterData } from '../../types'; // Ensure correct import path

export function useNewsletterEditor(initialData?: NewsletterData) {
  const newsletter = ref<NewsletterData>(initialData || {
    title: '', // Initialize title
    subject_line: '', // Initialize subject_line
    preview_text: '', // Initialize preview_text
    blocks: [],
    // Removed 'settings' initialization as it's not in your Directus schema
    status: 'draft'
  })

  // Expose subject and preheader as computed properties for convenience in components
  // These will map to title/subject_line/preview_text for the Directus payload
  const subject = computed({
    get: () => newsletter.value.subject_line,
    set: (value) => { newsletter.value.subject_line = value; newsletter.value.title = value; }
  });

  const preheader = computed({
    get: () => newsletter.value.preview_text || '',
    set: (value) => { newsletter.value.preview_text = value; }
  });

  const blocks = computed({
    get: () => newsletter.value.blocks,
    set: (value) => {
      newsletter.value.blocks = value
    }
  })

  const addBlock = (type: string, index?: number) => {
    const newBlock: NewsletterBlock = {
      id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: type, // This is the slug string
      content: {},
      sort: blocks.value.length // Set initial sort order
    }
    if (index !== undefined && index >= 0 && index <= blocks.value.length) {
      blocks.value.splice(index, 0, newBlock)
    } else {
      blocks.value.push(newBlock)
    }
    // IMPORTANT: Removed the redundant forEach loop here.
    // The sort order is handled by the initial 'sort' assignment and 'moveBlock'/'duplicateBlock'.
    return newBlock
  }

  const removeBlock = (id: string) => {
    newsletter.value.blocks = newsletter.value.blocks.filter(block => block.id !== id)
    // Update sort order for remaining blocks
    newsletter.value.blocks.forEach((block, i) => { block.sort = i })
  }

  const updateBlock = (id: string, updates: Partial<NewsletterBlock>) => {
    const blockIndex = newsletter.value.blocks.findIndex(block => block.id === id)
    if (blockIndex !== -1) {
      newsletter.value.blocks[blockIndex] = { ...newsletter.value.blocks[blockIndex], ...updates }
    }
  }

  const moveBlock = (fromIndex: number, toIndex: number) => {
    if (fromIndex < 0 || fromIndex >= blocks.value.length ||
        toIndex < 0 || toIndex >= blocks.value.length) {
      return
    }
    const [movedBlock] = blocks.value.splice(fromIndex, 1)
    blocks.value.splice(toIndex, 0, movedBlock)
    // Update sort order for all blocks after a move
    blocks.value.forEach((block, i) => { block.sort = i })
  }

  const duplicateBlock = (id: string) => {
    const blockIndex = blocks.value.findIndex(block => block.id === id)
    if (blockIndex !== -1) {
      const original = blocks.value[blockIndex]
      const duplicate: NewsletterBlock = {
        ...original,
        id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // New unique ID
        sort: blockIndex + 1
      }
      blocks.value.splice(blockIndex + 1, 0, duplicate)
      // Update sort order for subsequent blocks after a duplicate
      for (let i = blockIndex + 2; i < blocks.value.length; i++) {
        blocks.value[i].sort = i
      }
    }
  }

  const clearBlocks = () => {
    blocks.value = []
  }

  const loadFromTemplate = (template: any) => {
    if (template.blocks_config) {
      // Clear existing blocks
      clearBlocks()

      // Load blocks from template
      const templateBlocks = Array.isArray(template.blocks_config)
        ? template.blocks_config
        : JSON.parse(template.blocks_config)

      templateBlocks.forEach((blockConfig: any, index: number) => {
        const newBlock: NewsletterBlock = {
          id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: blockConfig.type, // This should be the slug from the template
          content: blockConfig.content || {},
          sort: index
        }
        blocks.value.push(newBlock)
      })
    }

    // Apply template settings
    if (template.default_subject_pattern) {
      newsletter.value.subject_line = template.default_subject_pattern
      newsletter.value.title = template.default_subject_pattern // Also update title
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
    // Removed default_settings application as 'settings' field is removed
  }

  return {
    newsletter,
    blocks,
    subject, // Expose computed subject
    preheader, // Expose computed preheader
    addBlock,
    removeBlock,
    updateBlock,
    moveBlock,
    duplicateBlock,
    clearBlocks,
    loadFromTemplate
  }
}
