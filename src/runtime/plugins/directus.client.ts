// src/runtime/plugins/directus.client.ts (fixed version)
import { defineNuxtPlugin, useRuntimeConfig } from '#app'
import {
  createDirectus,
  rest,
  readItems,
  createItem,
  updateItem,
  deleteItems,
} from '@directus/sdk'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  const directus = createDirectus(
    config.public?.newsletter?.directusUrl as string,
  ).with(rest())

  // Helper functions with proper Directus SDK usage
  const directusHelpers = {
    // Collection operations
    readItems: async (collection: string, params?: any) => {
      try {
        const response = await directus.request(readItems(collection, params))
        return { success: true, data: response }
      }
      catch (error: any) {
        return { success: false, error: { message: error.message } }
      }
    },

    createItem: async (collection: string, data: any) => {
      try {
        const response = await directus.request(createItem(collection, data))
        return { success: true, data: response }
      }
      catch (error: any) {
        return { success: false, error: { message: error.message } }
      }
    },

    updateItem: async (collection: string, id: string | number, data: any) => {
      try {
        const response = await directus.request(
          updateItem(collection, id, data),
        )
        return { success: true, data: response }
      }
      catch (error: any) {
        return { success: false, error: { message: error.message } }
      }
    },

    deleteItem: async (collection: string, id: string | number) => {
      try {
        await directus.request(deleteItems(collection, [id as any]))
        return { success: true }
      }
      catch (error: any) {
        return { success: false, error: { message: error.message } }
      }
    },

    // Batch operations
    batchCreate: async (collection: string, items: any[]) => {
      try {
        const promises = items.map(item =>
          directus.request(createItem(collection, item)),
        )
        const responses = await Promise.all(promises)
        return { success: true, data: responses }
      }
      catch (error: any) {
        return { success: false, error: { message: error.message } }
      }
    },

    batchUpdate: async (collection: string, items: any[]) => {
      try {
        const promises = items.map(item =>
          directus.request(updateItem(collection, item.id, item)),
        )
        const responses = await Promise.all(promises)
        return { success: true, data: responses }
      }
      catch (error: any) {
        return { success: false, error: { message: error.message } }
      }
    },

    batchDelete: async (collection: string, ids: (string | number)[]) => {
      try {
        await directus.request(deleteItems(collection, ids as any))
        return { success: true }
      }
      catch (error: any) {
        return { success: false, error: { message: error.message } }
      }
    },

    readItemsCached: async (collection: string, params?: any) => {
      // For now, just use regular readItems - implement caching later
      return await directusHelpers.readItems(collection, params)
    },

    // File operations
    uploadFile: async (file: File, options?: any) => {
      try {
        const formData = new FormData()
        formData.append('file', file)

        if (options?.folder) {
          formData.append('folder', options.folder)
        }

        const response = await fetch(
          `${config.public?.newsletter?.directusUrl}/files`,
          {
            method: 'POST',
            body: formData,
          },
        )

        if (!response.ok) {
          throw new Error('Upload failed')
        }

        const result = await response.json()
        return {
          success: true,
          file: {
            id: result.data.id,
            filename: result.data.filename_disk,
            url: `/assets/${result.data.id}`,
            size: result.data.filesize,
            type: result.data.type,
          },
        }
      }
      catch (error: any) {
        return {
          success: false,
          error: error.message || 'Upload failed',
        }
      }
    },

    getFileUrl: (fileId: string) => {
      return `${config.public?.newsletter?.directusUrl}/assets/${fileId}`
    },

    // Authentication
    login: async (email: string, password: string) => {
      try {
        const response = await fetch(
          `${config.public?.newsletter?.directusUrl}/auth/login`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          },
        )

        if (!response.ok) {
          throw new Error('Login failed')
        }

        const result = await response.json()
        return { success: true, data: result.data }
      }
      catch (error: any) {
        return { success: false, error: { message: error.message } }
      }
    },

    logout: async () => {
      try {
        await fetch(`${config.public?.newsletter?.directusUrl}/auth/logout`, {
          method: 'POST',
        })
      }
      catch (error) {
        console.error('Logout error:', error)
      }
    },

    refresh: async () => {
      try {
        const response = await fetch(
          `${config.public?.newsletter?.directusUrl}/auth/refresh`,
          {
            method: 'POST',
          },
        )

        if (!response.ok) {
          throw new Error('Refresh failed')
        }

        const result = await response.json()
        return { success: true, data: result.data }
      }
      catch (error: any) {
        return { success: false, error: { message: error.message } }
      }
    },

    // Specific collections
    newsletters: {
      list: async (params?: any) =>
        await directusHelpers.readItems('newsletters', params),
      get: async (id: number) => {
        const result = await directusHelpers.readItems('newsletters', {
          filter: { id },
        })
        if (
          result.success
          && Array.isArray(result.data)
          && result.data.length > 0
        ) {
          return { success: true, data: result.data[0] }
        }
        return result
      },
      create: async (data: any) =>
        await directusHelpers.createItem('newsletters', data),
      update: async (id: number, data: any) =>
        await directusHelpers.updateItem('newsletters', id, data),
      delete: async (id: number) =>
        await directusHelpers.deleteItem('newsletters', id),
    },

    blockTypes: {
      list: async () => await directusHelpers.readItems('block_types'),
      get: async (id: number) => {
        const result = await directusHelpers.readItems('block_types', {
          filter: { id },
        })
        if (
          result.success
          && Array.isArray(result.data)
          && result.data.length > 0
        ) {
          return { success: true, data: result.data[0] }
        }
        return result
      },
    },

    templates: {
      list: async () => await directusHelpers.readItems('newsletter_templates'),
      get: async (id: number) => {
        const result = await directusHelpers.readItems('newsletter_templates', {
          filter: { id },
        })
        if (
          result.success
          && Array.isArray(result.data)
          && result.data.length > 0
        ) {
          return { success: true, data: result.data[0] }
        }
        return result
      },
      create: async (data: any) =>
        await directusHelpers.createItem('newsletter_templates', data),
      update: async (id: number, data: any) =>
        await directusHelpers.updateItem('newsletter_templates', id, data),
      delete: async (id: number) =>
        await directusHelpers.deleteItem('newsletter_templates', id),
    },
  }

  return {
    provide: {
      directus,
      directusHelpers,
    },
  }
})
