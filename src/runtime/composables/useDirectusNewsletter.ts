// src/runtime/composables/useDirectusNewsletter.ts
import { useState } from '#app'
import { authentication, createDirectus, rest, staticToken } from '@directus/sdk'
import type { NewsletterData } from './useNewsletterEditor'

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

  // Create Directus client
  const getClient = () => {
    const client = createDirectus(config.directus.url).with(rest())

    // Handle authentication based on config
    if (config.directus.auth?.type === 'static' && config.directus.auth.token) {
      return client.with(staticToken(config.directus.auth.token))
    } else if (config.directus.auth?.type === 'middleware' && authToken.value) {
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
        rest.readItems('newsletters', {
          limit: options?.limit || 10,
          offset: options?.offset || 0,
          filter: options?.filter,
          sort: options?.sort || ['-created_at']
        })
      )
      return response as DirectusNewsletter[]
    } catch (error) {
      console.error('[Newsletter] Error fetching newsletters:', error)
      throw error
    }
  }

  const fetchNewsletter = async (id: string) => {
    try {
      const client = getClient()
      const response = await client.request(
        rest.readItem('newsletters', id)
      )
      return response as DirectusNewsletter
    } catch (error) {
      console.error('[Newsletter] Error fetching newsletter:', error)
      throw error
    }
  }

  const createNewsletter = async (data: NewsletterData) => {
    try {
      const client = getClient()
      const response = await client.request(
        rest.createItem('newsletters', {
          ...data,
          status: 'draft'
        })
      )
      return response as DirectusNewsletter
    } catch (error) {
      console.error('[Newsletter] Error creating newsletter:', error)
      throw error
    }
  }

  const updateNewsletter = async (id: string, data: Partial<NewsletterData>) => {
    try {
      const client = getClient()
      const response = await client.request(
        rest.updateItem('newsletters', id, data)
      )
      return response as DirectusNewsletter
    } catch (error) {
      console.error('[Newsletter] Error updating newsletter:', error)
      throw error
    }
  }

  const deleteNewsletter = async (id: string) => {
    try {
      const client = getClient()
      await client.request(rest.deleteItem('newsletters', id))
      return true
    } catch (error) {
      console.error('[Newsletter] Error deleting newsletter:', error)
      throw error
    }
  }

  const sendTestEmail = async (id: string, email: string) => {
    try {
      const client = getClient()
      // This would call a custom endpoint in Directus
      const response = await client.request(
        rest.createItem('newsletter_test', {
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
    sendTestEmail
  }
}