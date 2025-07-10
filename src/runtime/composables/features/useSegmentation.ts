// src/runtime/composables/features/useSegmentation.ts
import { useNuxtApp } from '#app'
import { ref, readonly } from 'vue'
import type { NewsletterSegment, SegmentRule } from '../../types/newsletter'

export const useSegmentation = () => {
  const segments = ref<NewsletterSegment[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const fetchSegments = async () => {
    try {
      isLoading.value = true
      error.value = null

      const { $directusHelpers } = useNuxtApp()
      const response = await $directusHelpers.readItems('newsletter_segments')

      if (response.success) {
        segments.value = response.data || []
      }
      else {
        throw new Error(response.error?.message || 'Failed to fetch segments')
      }
    }
    catch (err: any) {
      error.value = err.message || 'Failed to fetch segments'
      console.error('Failed to fetch segments:', err)
    }
    finally {
      isLoading.value = false
    }
  }

  const createSegment = async (data: Partial<NewsletterSegment>) => {
    try {
      isLoading.value = true
      error.value = null

      const { $directusHelpers } = useNuxtApp()
      const response = await $directusHelpers.createItem(
        'newsletter_segments',
        data,
      )

      if (response.success) {
        segments.value.push(response.data)
        return response.data
      }
      else {
        throw new Error(response.error?.message || 'Failed to create segment')
      }
    }
    catch (err: any) {
      error.value = err.message || 'Failed to create segment'
      console.error('Failed to create segment:', err)
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  const updateSegment = async (
    id: number,
    data: Partial<NewsletterSegment>,
  ) => {
    try {
      error.value = null

      const { $directusHelpers } = useNuxtApp()
      const response = await $directusHelpers.updateItem(
        'newsletter_segments',
        id,
        data,
      )

      if (response.success) {
        const index = segments.value.findIndex(s => s.id === id)
        if (index !== -1) {
          segments.value[index] = {
            ...segments.value[index],
            ...response.data,
          }
        }
        return response.data
      }
      else {
        throw new Error(response.error?.message || 'Failed to update segment')
      }
    }
    catch (err: any) {
      error.value = err.message || 'Failed to update segment'
      console.error('Failed to update segment:', err)
      throw err
    }
  }

  const deleteSegment = async (id: number) => {
    try {
      error.value = null

      const { $directusHelpers } = useNuxtApp()
      const response = await $directusHelpers.deleteItem(
        'newsletter_segments',
        id,
      )

      if (response.success) {
        segments.value = segments.value.filter(s => s.id !== id)
      }
      else {
        throw new Error(response.error?.message || 'Failed to delete segment')
      }
    }
    catch (err: any) {
      error.value = err.message || 'Failed to delete segment'
      console.error('Failed to delete segment:', err)
      throw err
    }
  }

  const getInputType = (rule: SegmentRule): string => {
    switch (rule.type) {
      case 'number':
        return 'number'
      case 'date':
        return 'date'
      case 'select':
        return 'select'
      case 'multi-select':
        return 'multi-select'
      default:
        return 'text'
    }
  }

  return {
    segments: readonly(segments),
    isLoading: readonly(isLoading),
    error: readonly(error),
    fetchSegments,
    createSegment,
    updateSegment,
    deleteSegment,
    getInputType,
  }
}
