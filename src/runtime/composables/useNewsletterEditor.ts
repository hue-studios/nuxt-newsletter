// src/runtime/composables/useNewsletterEditor.ts
import { computed, ref } from 'vue'

export interface NewsletterBlock {
  id: string
  type: string // slug from block_types
  content: Record<string, any>
  sort?: number
}

export interface NewsletterData {
  id?: string
  subject: string
  preheader?: string
  from_name?: string
  from_email?: string
  reply_to?: string
  blocks: NewsletterBlock[]
  settings?: {
    backgroundColor?: string
    textColor?: string
    fontFamily?: string
  }
  status?: 'draft' | 'ready' | 'scheduled' | 'sent'
  scheduled_send_date?: string
  mailing_list_id?: string
  template_id?: string
  compiled_mjml?: string
  compiled_html?: string
}

export function useNewsletterEditor(initialData?: NewsletterData) {
  const newsletter = ref<NewsletterData>(initialData || {
    subject: '',
    preheader: '',
    blocks: [],
    settings: {
      backgroundColor: '#f5f5f5',
      textColor: '#333333',
      fontFamily: 'Arial, sans-serif'
    },
    status: 'draft'
  })

  const blocks = computed({
    get: () => newsletter.value.blocks,
    set: (value) => {
      newsletter.value.blocks = value
    }
  })

  const addBlock = (type: string, index?: number) => {
    const newBlock: NewsletterBlock = {
      id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      content: {},
      sort: index !== undefined ? index : blocks.value.length
    }

    if (index !== undefined) {
      blocks.value.splice(index, 0, newBlock)
      // Update sort order for subsequent blocks
      for (let i = index + 1; i < blocks.value.length; i++) {
        blocks.value[i].sort = i
      }
    } else {
      blocks.value.push(newBlock)
    }

    return newBlock
  }

  const removeBlock = (id: string) => {
    const index = blocks.value.findIndex(b => b.id === id)
    if (index > -1) {
      blocks.value.splice(index, 1)
      // Update sort order
      blocks.value.forEach((block, i) => {
        block.sort = i
      })
    }
  }

  const updateBlock = (id: string, updates: Partial<NewsletterBlock>) => {
    const block = blocks.value.find(b => b.id === id)
    if (block) {
      Object.assign(block, updates)
    }
  }

  const moveBlock = (fromIndex: number, toIndex: number) => {
    const [removed] = blocks.value.splice(fromIndex, 1)
    blocks.value.splice(toIndex, 0, removed)
    // Update sort order
    blocks.value.forEach((block, i) => {
      block.sort = i
    })
  }

  const duplicateBlock = (id: string) => {
    const block = blocks.value.find(b => b.id === id)
    if (block) {
      const index = blocks.value.findIndex(b => b.id === id)
      const duplicate = {
        ...block,
        id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: { ...block.content },
        sort: index + 1
      }
      blocks.value.splice(index + 1, 0, duplicate)
      // Update sort order for subsequent blocks
      for (let i = index + 2; i < blocks.value.length; i++) {
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
          type: blockConfig.type,
          content: blockConfig.content || {},
          sort: index
        }
        blocks.value.push(newBlock)
      })
    }

    // Apply template settings
    if (template.default_subject_pattern) {
      newsletter.value.subject = template.default_subject_pattern
    }
    if (template.default_from_name) {
      newsletter.value.from_name = template.default_from_name
    }
    if (template.default_from_email) {
      newsletter.value.from_email = template.default_from_email
    }
  }

  return {
    newsletter,
    blocks,
    addBlock,
    removeBlock,
    updateBlock,
    moveBlock,
    duplicateBlock,
    clearBlocks,
    loadFromTemplate
  }
}