// src/runtime/composables/useNewsletter.ts
import { useNuxtApp, useRuntimeConfig } from '#app'
import { computed } from 'vue'

export function useNewsletter() {
  const nuxtApp = useNuxtApp()
  const config = useRuntimeConfig().public.newsletter

  const isInitialized = computed(() => !!nuxtApp.$newsletter?.initialized)
  
  const directusUrl = computed(() => config.directus?.url)
  
  const authType = computed(() => config.directus?.auth?.type || 'static')
  
  const mjmlMode = computed(() => config.mjmlMode || 'client')

  const defaultFromEmail = computed(() => config.defaultFromEmail || 'newsletter@example.com')
  
  const defaultFromName = computed(() => config.defaultFromName || 'Newsletter')

  return {
    isInitialized,
    config,
    directusUrl,
    authType,
    mjmlMode,
    defaultFromEmail,
    defaultFromName
  }
}