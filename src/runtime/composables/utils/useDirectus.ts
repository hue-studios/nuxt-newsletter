// src/runtime/composables/utils/useDirectus.ts
import { useNuxtApp, useRuntimeConfig } from '#app'
import { ref, readonly } from 'vue'
import type {
  UseDirectusReturn,
  DirectusHelpers,
  ApiResponse,
  UploadOptions,
  UploadResult,
} from '../../types/newsletter'

const isConnected = ref(false)
const isLoading = ref(false)
const error = ref<string | null>(null)

export const useDirectus = (): UseDirectusReturn => {
  const { $directus } = useNuxtApp()

  const testConnection = async (): Promise<boolean> => {
    try {
      isLoading.value = true
      error.value = null

      // Try to fetch server info to test connection
      await $directus.request({ path: '/server/info' })
      isConnected.value = true
      return true
    }
    catch (err: any) {
      error.value = err.message || 'Failed to connect to Directus'
      isConnected.value = false
      return false
    }
    finally {
      isLoading.value = false
    }
  }

  const directusHelpers: DirectusHelpers = {
    // Collection operations
    readItems: async (
      collection: string,
      params?: any,
    ): Promise<ApiResponse> => {
      try {
        const response = await $directus.request({
          path: `/items/${collection}`,
          method: 'GET',
          params,
        })
        return { success: true, data: response.data }
      }
      catch (err: any) {
        return { success: false, error: { message: err.message } }
      }
    },

    createItem: async (collection: string, data: any): Promise<ApiResponse> => {
      try {
        const response = await $directus.request({
          path: `/items/${collection}`,
          method: 'POST',
          body: data,
        })
        return { success: true, data: response.data }
      }
      catch (err: any) {
        return { success: false, error: { message: err.message } }
      }
    },

    updateItem: async (
      collection: string,
      id: string | number,
      data: any,
    ): Promise<ApiResponse> => {
      try {
        const response = await $directus.request({
          path: `/items/${collection}/${id}`,
          method: 'PATCH',
          body: data,
        })
        return { success: true, data: response.data }
      }
      catch (err: any) {
        return { success: false, error: { message: err.message } }
      }
    },

    deleteItem: async (
      collection: string,
      id: string | number,
    ): Promise<ApiResponse> => {
      try {
        await $directus.request({
          path: `/items/${collection}/${id}`,
          method: 'DELETE',
        })
        return { success: true }
      }
      catch (err: any) {
        return { success: false, error: { message: err.message } }
      }
    },

    // Batch operations
    batchCreate: async (
      collection: string,
      items: any[],
    ): Promise<ApiResponse> => {
      try {
        const response = await $directus.request({
          path: `/items/${collection}`,
          method: 'POST',
          body: items,
        })
        return { success: true, data: response.data }
      }
      catch (err: any) {
        return { success: false, error: { message: err.message } }
      }
    },

    batchUpdate: async (
      collection: string,
      items: any[],
    ): Promise<ApiResponse> => {
      try {
        const updatePromises = items.map(item =>
          $directus.request({
            path: `/items/${collection}/${item.id}`,
            method: 'PATCH',
            body: item,
          }),
        )
        const responses = await Promise.all(updatePromises)
        return { success: true, data: responses.map(r => r.data) }
      }
      catch (err: any) {
        return { success: false, error: { message: err.message } }
      }
    },

    batchDelete: async (
      collection: string,
      ids: (string | number)[],
    ): Promise<ApiResponse> => {
      try {
        const deletePromises = ids.map(id =>
          $directus.request({
            path: `/items/${collection}/${id}`,
            method: 'DELETE',
          }),
        )
        await Promise.all(deletePromises)
        return { success: true }
      }
      catch (err: any) {
        return { success: false, error: { message: err.message } }
      }
    },

    readItemsCached: async (
      collection: string,
      params?: any,
    ): Promise<ApiResponse> => {
      // For now, just call readItems - implement caching later
      return await directusHelpers.readItems(collection, params)
    },

    // File operations
    uploadFile: async (
      file: File,
      options?: UploadOptions,
    ): Promise<UploadResult> => {
      try {
        const formData = new FormData()
        formData.append('file', file)

        if (options?.folder) {
          formData.append('folder', options.folder)
        }

        const response = await $directus.request({
          path: '/files',
          method: 'POST',
          body: formData,
        })

        return {
          success: true,
          file: {
            id: response.data.id,
            filename: response.data.filename_disk,
            url: `/assets/${response.data.id}`,
            size: response.data.filesize,
            type: response.data.type,
          },
        }
      }
      catch (err: any) {
        return {
          success: false,
          error: err.message || 'Failed to upload file',
        }
      }
    },

    getFileUrl: (fileId: string): string => {
      const config = useRuntimeConfig()
      return `${config.public?.newsletter?.directusUrl}/assets/${fileId}`
    },

    // Authentication
    login: async (email: string, password: string): Promise<ApiResponse> => {
      try {
        const response = await $directus.request({
          path: '/auth/login',
          method: 'POST',
          body: { email, password },
        })
        return { success: true, data: response.data }
      }
      catch (err: any) {
        return { success: false, error: { message: err.message } }
      }
    },

    logout: async (): Promise<void> => {
      try {
        await $directus.request({
          path: '/auth/logout',
          method: 'POST',
        })
      }
      catch (err: any) {
        console.error('Logout error:', err)
      }
    },

    refresh: async (): Promise<ApiResponse> => {
      try {
        const response = await $directus.request({
          path: '/auth/refresh',
          method: 'POST',
        })
        return { success: true, data: response.data }
      }
      catch (err: any) {
        return { success: false, error: { message: err.message } }
      }
    },

    // Specific collections
    newsletters: {
      list: async (params?: any) =>
        await directusHelpers.readItems('newsletters', params),
      get: async (id: number) =>
        await directusHelpers.readItems('newsletters', { filter: { id } }),
      create: async (data: any) =>
        await directusHelpers.createItem('newsletters', data),
      update: async (id: number, data: any) =>
        await directusHelpers.updateItem('newsletters', id, data),
      delete: async (id: number) =>
        await directusHelpers.deleteItem('newsletters', id),
    },

    blockTypes: {
      list: async () => await directusHelpers.readItems('block_types'),
      get: async (id: number) =>
        await directusHelpers.readItems('block_types', { filter: { id } }),
    },

    templates: {
      list: async () => await directusHelpers.readItems('newsletter_templates'),
      get: async (id: number) =>
        await directusHelpers.readItems('newsletter_templates', {
          filter: { id },
        }),
      create: async (data: any) =>
        await directusHelpers.createItem('newsletter_templates', data),
      update: async (id: number, data: any) =>
        await directusHelpers.updateItem('newsletter_templates', id, data),
      delete: async (id: number) =>
        await directusHelpers.deleteItem('newsletter_templates', id),
    },
  }

  return {
    directus: $directus,
    directusHelpers,
    isConnected: readonly(isConnected),
    isLoading: readonly(isLoading),
    error: readonly(error),
    testConnection,
  }
}
