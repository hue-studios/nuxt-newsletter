// src/runtime/composables/useDirectusNewsletter.ts
import { useRuntimeConfig, useState } from '#app'
import { authentication, createDirectus, createItem, deleteItem, readItem, readItems, rest, staticToken, updateItem } from '@directus/sdk'
import type {
  BlockType,
  MailingList,
  Newsletter,
  NewsletterData,
  NewsletterTemplate,
  Subscriber
} from '../../types'

interface DirectusNewsletter extends NewsletterData {
  status: 'draft' | 'scheduled' | 'sent'
  scheduled_at?: string
  sent_at?: string
  recipients?: number
  opens?: number
  clicks?: number
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

  // Create Directus client
  const getClient = () => {
    const client = createDirectus(directusUrl).with(rest())

    // Handle authentication based on config
    if (authConfig?.type === 'static' && authConfig.token) {
      return client.with(staticToken(authConfig.token))
    } else if (authConfig?.type === 'middleware' && authToken.value) {
      return client.with(staticToken(authToken.value))
    } else {
      return client.with(authentication())
    }
  }

  const setAuthToken = (token: string) => {
    authToken.value = token
  }

  const fetchNewsletters = async (options?: {
    limit?: number
    offset?: number
    filter?: Record<string, any>
    sort?: string[]
  }) => {
    try {
      const client = getClient()
      const response = await client.request(
        readItems('newsletters', {
          limit: options?.limit || 10,
          offset: options?.offset || 0,
          filter: options?.filter,
          sort: options?.sort || ['-date_created'],
          fields: ['*', 'blocks.*', 'blocks.block_type.*']
        })
      )
      return response as Newsletter[]
    } catch (error) {
      console.error('[Newsletter] Error fetching newsletters:', error)
      throw error
    }
  }

  const fetchNewsletter = async (id: string) => {
    try {
      const client = getClient()
      const response = await client.request(
       readItem('newsletters', id, {
          fields: ['*', 'blocks.*', 'blocks.block_type.*']
        })
      )
      return response as Newsletter
    } catch (error) {
      console.error('[Newsletter] Error fetching newsletter:', error)
      throw error
    }
  }

  const createNewsletter = async (data: NewsletterData) => {
    try {
      const client = getClient()
      
      // Create newsletter with blocks
      const newsletterData = {
        title: data.subject,
        subject_line: data.subject,
        preview_text: data.preheader,
        from_name: data.from_name,
        from_email: data.from_email,
        reply_to: data.reply_to,
        status: data.status || 'draft',
        blocks: data.blocks.map((block, index) => ({
          block_type: block.type,
          sort: index + 1,
          content: block.content,
          ...block.content // Flatten content fields
        }))
      }
      
      const response = await client.request(
        createItem('newsletters', newsletterData)
      )
      return response as Newsletter
    } catch (error) {
      console.error('[Newsletter] Error creating newsletter:', error)
      throw error
    }
  }

  const updateNewsletter = async (id: string, data: Partial<NewsletterData>) => {
    try {
      const client = getClient()
      
      const updateData: any = {}
      
      if (data.subject) {
        updateData.title = data.subject
        updateData.subject_line = data.subject
      }
      if (data.preheader !== undefined) updateData.preview_text = data.preheader
      if (data.from_name !== undefined) updateData.from_name = data.from_name
      if (data.from_email !== undefined) updateData.from_email = data.from_email
      if (data.reply_to !== undefined) updateData.reply_to = data.reply_to
      if (data.status !== undefined) updateData.status = data.status
      if (data.compiled_mjml !== undefined) updateData.compiled_mjml = data.compiled_mjml
      if (data.compiled_html !== undefined) updateData.compiled_html = data.compiled_html
      
      if (data.blocks) {
        // Handle blocks update - this is complex and might need a separate endpoint
        updateData.blocks = data.blocks.map((block, index) => ({
          block_type: typeof block.type === 'string' ? block.type : block.type.slug,
          sort: index + 1,
          content: block.content,
          ...block.content
        }))
      }
      
      const response = await client.request(
        updateItem('newsletters', id, updateData)
      )
      return response as Newsletter
    } catch (error) {
      console.error('[Newsletter] Error updating newsletter:', error)
      throw error
    }
  }

  const deleteNewsletter = async (id: string) => {
    try {
      const client = getClient()
      await client.request(deleteItem('newsletters', id))
      return true
    } catch (error) {
      console.error('[Newsletter] Error deleting newsletter:', error)
      throw error
    }
  }

  const fetchBlockTypes = async (options?: {
    limit?: number
    filter?: Record<string, any>
    sort?: string[]
  }) => {
    try {
      const client = getClient()
      const response = await client.request(
        readItems('block_types', {
          limit: options?.limit || 100,
          filter: options?.filter || { status: { _eq: 'published' } },
          sort: options?.sort || ['category', 'name']
        })
      )
      return response as BlockType[]
    } catch (error) {
      console.error('[Newsletter] Error fetching block types:', error)
      throw error
    }
  }

  const fetchTemplates = async (options?: {
    limit?: number
    offset?: number
    filter?: Record<string, any>
    sort?: string[]
  }) => {
    try {
      const client = getClient()
      const response = await client.request(
        readItems('newsletter_templates', {
          limit: options?.limit || 20,
          offset: options?.offset || 0,
          filter: options?.filter || { status: { _eq: 'published' } },
          sort: options?.sort || ['-usage_count', 'name']
        })
      )
      return response as NewsletterTemplate[]
    } catch (error) {
      console.error('[Newsletter] Error fetching templates:', error)
      throw error
    }
  }

  const fetchTemplate = async (id: string) => {
    try {
      const client = getClient()
      const response = await client.request(
        readItem('newsletter_templates', id)
      )
      return response as NewsletterTemplate
    } catch (error) {
      console.error('[Newsletter] Error fetching template:', error)
      throw error
    }
  }

  const fetchSubscribers = async (options?: {
    limit?: number
    offset?: number
    filter?: Record<string, any>
    sort?: string[]
  }) => {
    try {
      const client = getClient()
      const response = await client.request(
        readItems('subscribers', {
          limit: options?.limit || 50,
          offset: options?.offset || 0,
          filter: options?.filter || { status: { _eq: 'active' } },
          sort: options?.sort || ['-subscribed_at']
        })
      )
      return response as Subscriber[]
    } catch (error) {
      console.error('[Newsletter] Error fetching subscribers:', error)
      throw error
    }
  }

  const fetchMailingLists = async (options?: {
    limit?: number
    filter?: Record<string, any>
  }) => {
    try {
      const client = getClient()
      const response = await client.request(
        readItems('mailing_lists', {
          limit: options?.limit || 100,
          filter: options?.filter || { status: { _eq: 'active' } },
          fields: ['*', 'subscriber_count']
        })
      )
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
      const response = await client.request(
        readItems('mailing_lists_subscribers', {
          filter: {
            mailing_lists_id: { _eq: listId },
            status: { _eq: 'subscribed' }
          },
          fields: ['*', 'subscribers_id.*'],
          limit: options?.limit || 1000,
          offset: options?.offset || 0
        })
      )
      return response.map((item: any) => item.subscribers_id) as Subscriber[]
    } catch (error) {
      console.error('[Newsletter] Error fetching mailing list subscribers:', error)
      throw error
    }
  }

  const sendTestEmail = async (id: string, email: string) => {
    try {
      const client = getClient()
      // This would call a custom endpoint in Directus
      const response = await client.request(
        createItem('newsletter_test', {
          newsletter_id: id,
          email
        })
      )
      return response
    } catch (error) {
      console.error('[Newsletter] Error sending test email:', error)
      throw error
    }
  }

  return {
    setAuthToken,
    fetchNewsletters,
    fetchNewsletter,
    createNewsletter,
    updateNewsletter,
    deleteNewsletter,
    fetchBlockTypes,
    fetchTemplates,
    fetchTemplate,
    fetchSubscribers,
    fetchMailingLists,
    fetchMailingListSubscribers,
    sendTestEmail
  }
}