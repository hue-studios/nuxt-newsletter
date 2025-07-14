// src/runtime/composables/useDirectusNewsletter.ts
import { useRuntimeConfig, useState } from '#app';
import { createDirectus, createItem, deleteItem, readItem, readItems, rest, staticToken, updateItem, uploadFiles } from '@directus/sdk';
import type {
  BlockType,
  MailingList,
  NewsletterData, // Use the updated NewsletterData interface
  NewsletterTemplate,
  Subscriber
} from '../../types'; // Assuming types.ts defines these, or update path

// This interface should align with your Directus 'newsletters' collection schema
interface DirectusNewsletterPayload extends NewsletterData {
  // NewsletterData is now structured to directly match Directus fields for newsletter
  // so no further transformation is needed here for top-level fields.
  // The 'blocks' array will contain objects with 'block_type' as UUID.
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
    }
    // Fallback if no specific auth type is configured or token is missing
    return client
  }

  const setAuthToken = (token: string | null) => {
    authToken.value = token
  }

  const fetchNewsletters = async (options?: { limit?: number; sort?: string[] }) => {
    try {
      const client = getClient()
      const response = await client.request(readItems('newsletters', {
        limit: options?.limit || 20,
        sort: options?.sort || ['-date_created'],
        fields: ['*', 'blocks.id', 'blocks.sort', 'blocks.content', 'blocks.block_type.slug', 'blocks.block_type.name'] // Request block_type slug and name for display
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
          type: block.block_type?.slug || block.block_type, // Ensure 'type' is slug string
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
        total_opens: item.total_opens, // Assuming these fields exist in Directus
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
        fields: ['*', 'blocks.id', 'blocks.sort', 'blocks.content', 'blocks.block_type.slug', 'blocks.block_type.name'] // Request block_type slug and name
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
          type: block.block_type?.slug || block.block_type, // Ensure 'type' is slug string
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
    console.log('Creating newsletter with data:', {
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
    
    // Remove any undefined/null values that might cause issues
    const cleanData = Object.fromEntries(
      Object.entries(newsletterData).filter(([_, value]) => value !== undefined && value !== null)
    )
    
    const result = await client.request(createItem('newsletters', cleanData))
    return result
  } catch (error) {
    console.error('[Newsletter] Error creating newsletter:', error)
    
    // Provide more helpful error messages
    if (error.response?.status === 403) {
      throw new Error('Permission denied. Check your Directus token and user permissions.')
    }
    if (error.response?.status === 422) {
      throw new Error('Invalid data. Check required fields and data format.')
    }
    
    throw error
  }
}

  const updateNewsletter = async (id: string, payload: NewsletterData) => {
    try {
      const client = getClient()
      // payload.blocks should already be transformed with block_type ID by the caller (index.vue)
      // payload is already of type DirectusNewsletterPayload (which is NewsletterData)
      const response = await client.request(updateItem('newsletters', id, payload))
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
      const client = getClient()
      const response = await client.request(readItems('block_types', {
        limit: options?.limit || -1 // Fetch all block types
      }))
      return response as BlockType[]
    } catch (error) {
      console.error('[Newsletter] Error fetching block types:', error)
      throw error
    }
  }

  const fetchTemplates = async (options?: { limit?: number }) => {
    try {
      const client = getClient()
      const response = await client.request(readItems('newsletter_templates', {
        limit: options?.limit || 20
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
        fields: ['*', 'blocks_config'] // Ensure blocks_config is fetched
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
        fields: ['*', 'subscriber_count'] // Assuming you have a count field or want to calculate
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
        limit: options?.limit || 1000,
        offset: options?.offset || 0
      }

      const response = await client.request(readItems('mailing_lists_subscribers', requestOptions))
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

  // New function to upload files to Directus
  const uploadFile = async (file: File) => {
    try {
      const client = getClient();
      const formData = new FormData();
      formData.append('file', file); // 'file' is the key Directus expects for the file itself

      // You can add other properties to the file here if needed by Directus, e.g.:
      // formData.append('title', file.name);
      // formData.append('folder', 'your-folder-id');

      const result = await client.request(uploadFiles(formData));
      return result; // Directus uploadFiles typically returns an array of uploaded file objects
    } catch (error) {
      console.error('[Newsletter] Error uploading file:', error);
      throw error;
    }
  };

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
    sendTestEmail,
    uploadFile // Expose the new upload function
  }
}
