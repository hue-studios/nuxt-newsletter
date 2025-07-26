// src/runtime/composables/useDirectusNewsletter.ts
import { useRuntimeConfig, useState } from '#app';
import { createDirectus, createItem, deleteItem, readItem, readItems, rest, staticToken, updateItem } from '@directus/sdk';
import type {
  BlockType,
  MailingList,
  NewsletterData,
  NewsletterTemplate,
  Subscriber
} from '../../types';

// Interface for Directus block format
interface DirectusBlock {
  id?: string;
  block_type: string; // UUID of the block type
  content: Record<string, any>;
  sort: number;
}

// Interface for Directus newsletter payload
interface DirectusNewsletterPayload {
  title: string;
  subject_line: string;
  preview_text?: string;
  from_name?: string;
  from_email?: string;
  reply_to?: string;
  blocks?: DirectusBlock[];
  status?: string;
  scheduled_send_date?: string;
  mailing_list_id?: string;
  template_id?: string;
  compiled_mjml?: string;
  compiled_html?: string;
  category?: string;
}

export function useDirectusNewsletter() {
  const config = useRuntimeConfig().public.newsletter
  const authToken = useState<string | null>('newsletter:auth:token', () => null)

  // Validate config
  if (!config?.directus?.url) {
    throw new Error('[Newsletter] Directus URL not configured. Please set newsletter.directus.url in your nuxt.config.ts')
  }

  const directusUrl = config.directus.url
  const authConfig = config.directus.auth

  // Cache for block types to avoid repeated API calls
  const blockTypesCache = useState<BlockType[] | null>('newsletter:blockTypes:cache', () => null)

  // Create Directus client
  const getClient = () => {
    const client = createDirectus(directusUrl).with(rest())

    // Handle authentication based on config
    if (authConfig?.type === 'static' && authConfig.token) {
      return client.with(staticToken(authConfig.token))
    } else if (authConfig?.type === 'middleware' && authToken.value) {
      return client.with(staticToken(authToken.value))
    }
    // Fallback if no specific auth type is configured or token is missing
    return client
  }

  const setAuthToken = (token: string | null) => {
    authToken.value = token
  }

  // Fetch and cache block types
  const ensureBlockTypes = async (): Promise<BlockType[]> => {
    if (blockTypesCache.value) {
      return blockTypesCache.value
    }

    try {
      const client = getClient()
      const response = await client.request(readItems('block_types', {
        limit: -1 // Fetch all block types
      }))
      blockTypesCache.value = response as BlockType[]
      return blockTypesCache.value
    } catch (error) {
      console.error('[Newsletter] Error fetching block types:', error)
      throw error
    }
  }

  // Transform blocks from editor format to Directus format
  const transformBlocksForDirectus = async (blocks: any[]): Promise<DirectusBlock[]> => {
    if (!blocks || blocks.length === 0) {
      return []
    }

    // Ensure we have block types loaded
    const blockTypes = await ensureBlockTypes()

    return blocks.map((block, index) => {
      let blockTypeId: string

      // Handle different block formats
      if (block.block_type && typeof block.block_type === 'string') {
        // Already has block_type as UUID
        blockTypeId = block.block_type
      } else if (block.type && typeof block.type === 'string') {
        // Has type as slug, need to find the UUID
        const blockType = blockTypes.find(bt => bt.slug === block.type)
        if (!blockType) {
          console.warn(`[Newsletter] Block type not found for slug: ${block.type}`)
          throw new Error(`Invalid block type: ${block.type}`)
        }
        blockTypeId = blockType.id
      } else {
        throw new Error(`Invalid block structure at index ${index}`)
      }

      return {
        id: block.id,
        block_type: blockTypeId,
        content: block.content || {},
        sort: block.sort !== undefined ? block.sort : index
      }
    })
  }

  const fetchNewsletters = async (options?: { limit?: number; sort?: string[] }) => {
    try {
      const client = getClient()
      const response = await client.request(readItems('newsletters', {
        limit: options?.limit || 20,
        sort: options?.sort || ['-date_created'],
        fields: ['*', 'blocks.id', 'blocks.sort', 'blocks.content', 'blocks.block_type.slug', 'blocks.block_type.name']
      }))
      
      // Transform Directus response to NewsletterData format
      return response.map((item: any) => ({
        id: item.id,
        title: item.title,
        subject_line: item.subject_line,
        preview_text: item.preview_text,
        from_name: item.from_name,
        from_email: item.from_email,
        reply_to: item.reply_to,
        blocks: item.blocks?.map((block: any) => ({
          id: block.id,
          type: block.block_type?.slug || block.block_type,
          content: block.content,
          sort: block.sort
        })) || [],
        status: item.status,
        scheduled_send_date: item.scheduled_send_date,
        mailing_list_id: item.mailing_list_id,
        template_id: item.template_id,
        compiled_mjml: item.compiled_mjml,
        compiled_html: item.compiled_html,
        category: item.category,
        total_opens: item.total_opens,
        total_clicks: item.total_clicks,
        open_rate: item.open_rate,
        click_rate: item.click_rate,
        date_created: item.date_created,
        date_updated: item.date_updated,
      })) as NewsletterData[]
    } catch (error) {
      console.error('[Newsletter] Error fetching newsletters:', error)
      throw error
    }
  }

  const fetchNewsletter = async (id: string) => {
    try {
      const client = getClient()
      const item: any = await client.request(readItem('newsletters', id, {
        fields: ['*', 'blocks.id', 'blocks.sort', 'blocks.content', 'blocks.block_type.slug', 'blocks.block_type.name']
      }))

      // Transform Directus response to NewsletterData format
      return {
        id: item.id,
        title: item.title,
        subject_line: item.subject_line,
        preview_text: item.preview_text,
        from_name: item.from_name,
        from_email: item.from_email,
        reply_to: item.reply_to,
        blocks: item.blocks?.map((block: any) => ({
          id: block.id,
          type: block.block_type?.slug || block.block_type,
          content: block.content,
          sort: block.sort
        })) || [],
        status: item.status,
        scheduled_send_date: item.scheduled_send_date,
        mailing_list_id: item.mailing_list_id,
        template_id: item.template_id,
        compiled_mjml: item.compiled_mjml,
        compiled_html: item.compiled_html,
        category: item.category,
        total_opens: item.total_opens,
        total_clicks: item.total_clicks,
        open_rate: item.open_rate,
        click_rate: item.click_rate,
        date_created: item.date_created,
        date_updated: item.date_updated,
      } as NewsletterData
    } catch (error) {
      console.error('[Newsletter] Error fetching newsletter:', error)
      throw error
    }
  }

  const createNewsletter = async (newsletterData: any) => {
    try {
      console.log('[Newsletter] Creating newsletter with data:', {
        ...newsletterData,
        blocks: newsletterData.blocks?.length || 0
      })
      
      const client = getClient()
      
      // Validate required fields before sending
      const requiredFields = ['title', 'subject_line']
      for (const field of requiredFields) {
        if (!newsletterData[field]) {
          throw new Error(`Missing required field: ${field}`)
        }
      }

      // Transform blocks to Directus format
      const transformedBlocks = await transformBlocksForDirectus(newsletterData.blocks || [])
      
      // Prepare payload for Directus
      const payload: DirectusNewsletterPayload = {
        title: newsletterData.title,
        subject_line: newsletterData.subject_line,
        preview_text: newsletterData.preview_text || '',
        from_name: newsletterData.from_name || 'Newsletter',
        from_email: newsletterData.from_email || 'newsletter@example.com',
        reply_to: newsletterData.reply_to || newsletterData.from_email || 'newsletter@example.com',
        blocks: transformedBlocks,
        status: newsletterData.status || 'draft',
        scheduled_send_date: newsletterData.scheduled_send_date,
        mailing_list_id: newsletterData.mailing_list_id,
        template_id: newsletterData.template_id,
        compiled_mjml: newsletterData.compiled_mjml,
        compiled_html: newsletterData.compiled_html,
        category: newsletterData.category || ''
      }
      
      // Remove any undefined/null values that might cause issues
      const cleanPayload = Object.fromEntries(
        Object.entries(payload).filter(([_, value]) => value !== undefined && value !== null)
      ) as DirectusNewsletterPayload
      
      console.log('[Newsletter] Sending payload to Directus:', {
        ...cleanPayload,
        blocks: cleanPayload.blocks?.length || 0
      })
      
      const result = await client.request(createItem('newsletters', cleanPayload))
      return result
    } catch (error) {
      console.error('[Newsletter] Error creating newsletter:', error)
      
      // Provide more helpful error messages
      if (error.response?.status === 403) {
        throw new Error('Permission denied. Check your Directus token and user permissions.')
      }
      if (error.response?.status === 422) {
        const details = error.response?.data?.errors?.map((e: any) => e.message).join(', ')
        throw new Error(`Validation error: ${details || 'Check required fields and data format.'}`)
      }
      if (error.response?.status === 400) {
        throw new Error('Bad request. Check that all block types exist in Directus.')
      }
      
      throw error
    }
  }

  const updateNewsletter = async (id: string, newsletterData: any) => {
    try {
      const client = getClient()
      
      // Transform blocks to Directus format
      const transformedBlocks = await transformBlocksForDirectus(newsletterData.blocks || [])
      
      // Prepare payload for Directus
      const payload: Partial<DirectusNewsletterPayload> = {
        title: newsletterData.title,
        subject_line: newsletterData.subject_line,
        preview_text: newsletterData.preview_text,
        from_name: newsletterData.from_name,
        from_email: newsletterData.from_email,
        reply_to: newsletterData.reply_to,
        blocks: transformedBlocks,
        status: newsletterData.status,
        scheduled_send_date: newsletterData.scheduled_send_date,
        mailing_list_id: newsletterData.mailing_list_id,
        template_id: newsletterData.template_id,
        compiled_mjml: newsletterData.compiled_mjml,
        compiled_html: newsletterData.compiled_html,
        category: newsletterData.category
      }
      
      // Remove any undefined values
      const cleanPayload = Object.fromEntries(
        Object.entries(payload).filter(([_, value]) => value !== undefined)
      ) as Partial<DirectusNewsletterPayload>
      
      const response = await client.request(updateItem('newsletters', id, cleanPayload))
      return response as NewsletterData
    } catch (error) {
      console.error('[Newsletter] Error updating newsletter:', error)
      throw error
    }
  }

  const deleteNewsletter = async (id: string) => {
    try {
      const client = getClient()
      await client.request(deleteItem('newsletters', id))
    } catch (error) {
      console.error('[Newsletter] Error deleting newsletter:', error)
      throw error
    }
  }

  const fetchBlockTypes = async (options?: { limit?: number }) => {
    try {
      // Use cached version if available
      if (blockTypesCache.value && !options?.limit) {
        return blockTypesCache.value
      }

      const client = getClient()
      const response = await client.request(readItems('block_types', {
        limit: options?.limit || -1
      }))
      
      const blockTypes = response as BlockType[]
      
      // Cache the result if we fetched all
      if (!options?.limit || options.limit === -1) {
        blockTypesCache.value = blockTypes
      }
      
      return blockTypes
    } catch (error) {
      console.error('[Newsletter] Error fetching block types:', error)
      throw error
    }
  }

  const fetchTemplates = async (options?: { limit?: number }) => {
    try {
      const client = getClient()
      const response = await client.request(readItems('newsletter_templates', {
        limit: options?.limit || 20,
        fields: ['*', 'blocks_config']
      }))
      return response as NewsletterTemplate[]
    } catch (error) {
      console.error('[Newsletter] Error fetching templates:', error)
      throw error
    }
  }

  const fetchTemplate = async (id: string) => {
    try {
      const client = getClient()
      const response = await client.request(readItem('newsletter_templates', id, {
        fields: ['*', 'blocks_config']
      }))
      return response as NewsletterTemplate
    } catch (error) {
      console.error('[Newsletter] Error fetching template:', error)
      throw error
    }
  }

  const fetchSubscribers = async (options?: { limit?: number; offset?: number }) => {
    try {
      const client = getClient()
      const response = await client.request(readItems('subscribers', {
        limit: options?.limit || 100,
        offset: options?.offset || 0
      }))
      return response as Subscriber[]
    } catch (error) {
      console.error('[Newsletter] Error fetching subscribers:', error)
      throw error
    }
  }

  const fetchMailingLists = async (options?: { limit?: number; offset?: number }) => {
    try {
      const client = getClient()
      const response = await client.request(readItems('mailing_lists', {
        limit: options?.limit || 100,
        offset: options?.offset || 0,
        fields: ['*', 'subscriber_count']
      }))
      return response as MailingList[]
    } catch (error) {
      console.error('[Newsletter] Error fetching mailing lists:', error)
      throw error
    }
  }

  const fetchMailingListSubscribers = async (listId: string, options?: {
    limit?: number
    offset?: number
  }) => {
    try {
      const client = getClient()

      const requestOptions: any = {
        filter: {
          mailing_lists_id: { _eq: listId },
          status: { _eq: 'subscribed' }
        },
        fields: ['*', 'subscribers_id.*'],
        limit: options?.limit || 100,
        offset: options?.offset || 0
      }

      const response = await client.request(
        readItems('mailing_lists_subscribers', requestOptions)
      )

      // Extract the subscriber data from the junction table response
      return response.map((item: any) => item.subscribers_id) as Subscriber[]
    } catch (error) {
      console.error('[Newsletter] Error fetching mailing list subscribers:', error)
      throw error
    }
  }

  // Clear block types cache
  const clearBlockTypesCache = () => {
    blockTypesCache.value = null
  }

  return {
    // State management
    setAuthToken,
    clearBlockTypesCache,
    
    // Newsletter operations
    fetchNewsletters,
    fetchNewsletter,
    createNewsletter,
    updateNewsletter,
    deleteNewsletter,
    
    // Block and template operations
    fetchBlockTypes,
    fetchTemplates,
    fetchTemplate,
    
    // Subscriber operations
    fetchSubscribers,
    fetchMailingLists,
    fetchMailingListSubscribers,
    
    // Utility functions
    transformBlocksForDirectus,
    ensureBlockTypes
  }
}