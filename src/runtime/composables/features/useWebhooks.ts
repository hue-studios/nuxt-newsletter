// src/runtime/composables/features/useWebhooks.ts
import { ref, readonly } from 'vue'

export const useWebhooks = () => {
  const webhooks = ref<any[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const registerWebhook = async (url: string, events: string[]) => {
    try {
      isLoading.value = true
      error.value = null

      // Placeholder for webhook registration
      console.log('Register webhook:', url, events)
    }
    catch (err: any) {
      error.value = err.message || 'Failed to register webhook'
      console.error('Failed to register webhook:', err)
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  const unregisterWebhook = async (id: string) => {
    try {
      error.value = null

      // Placeholder for webhook unregistration
      console.log('Unregister webhook:', id)
    }
    catch (err: any) {
      error.value = err.message || 'Failed to unregister webhook'
      console.error('Failed to unregister webhook:', err)
      throw err
    }
  }

  return {
    webhooks: readonly(webhooks),
    isLoading: readonly(isLoading),
    error: readonly(error),
    registerWebhook,
    unregisterWebhook,
  }
}
