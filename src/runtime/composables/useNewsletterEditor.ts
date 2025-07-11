// src/runtime/composables/useNewsletterEditor.ts
import { ref } from 'vue'
import { useNewsletter } from './useNewsletter'

export interface NewsletterBlock {
  id: string
  type: 'text' | 'image' | 'button' | 'divider' | 'columns'
  content: any
  settings?: Record<string, any>
}

export interface NewsletterData {
  id?: string
  subject: string
  preheader?: string
  blocks: NewsletterBlock[]
  settings?: {
    backgroundColor?: string
    textColor?: string
    fontFamily?: string
  }
}

export function useNewsletterEditor(initialData?: NewsletterData) {
  const { isDragDropEnabled } = useNewsletter()
  
  const newsletter = ref<NewsletterData>(initialData || {
    subject: '',
    blocks: [],
    settings: {
      backgroundColor: '#ffffff',
      textColor: '#000000',
      fontFamily: 'Arial, sans-serif'
    }
  })

  const blocks = computed({
    get: () => newsletter.value.blocks,
    set: (value) => {
      newsletter.value.blocks = value
    }
  })

  const addBlock = (type: NewsletterBlock['type'], index?: number) => {
    const newBlock: NewsletterBlock = {
      id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      content: getDefaultContent(type)
    }

    if (index !== undefined) {
      blocks.value.splice(index, 0, newBlock)
    } else {
      blocks.value.push(newBlock)
    }

    return newBlock
  }

  const removeBlock = (id: string) => {
    const index = blocks.value.findIndex(b => b.id === id)
    if (index > -1) {
      blocks.value.splice(index, 1)
    }
  }

  const updateBlock = (id: string, updates: Partial<NewsletterBlock>) => {
    const block = blocks.value.find(b => b.id === id)
    if (block) {
      Object.assign(block, updates)
    }
  }

  const moveBlock = (fromIndex: number, toIndex: number) => {
    if (!isDragDropEnabled.value) return
    
    const [removed] = blocks.value.splice(fromIndex, 1)
    blocks.value.splice(toIndex, 0, removed)
  }

  const duplicateBlock = (id: string) => {
    const block = blocks.value.find(b => b.id === id)
    if (block) {
      const index = blocks.value.findIndex(b => b.id === id)
      const duplicate = {
        ...block,
        id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
      blocks.value.splice(index + 1, 0, duplicate)
    }
  }

  const clearBlocks = () => {
    blocks.value = []
  }

  return {
    newsletter: newsletter,
    blocks: blocks,
    addBlock,
    removeBlock,
    updateBlock,
    moveBlock,
    duplicateBlock,
    clearBlocks
  }
}

function getDefaultContent(type: NewsletterBlock['type']) {
  switch (type) {
    case 'text':
      return { text: 'Enter your text here...' }
    case 'image':
      return { src: '', alt: '', width: '100%' }
    case 'button':
      return { text: 'Click me', url: '#', style: 'primary' }
    case 'divider':
      return { height: 1, color: '#cccccc' }
    case 'columns':
      return { columns: 2, gap: 20, content: [] }
    default:
      return {}
  }
}