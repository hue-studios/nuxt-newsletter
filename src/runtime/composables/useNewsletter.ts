// src/runtime/composables/useNewsletter.ts
import { useNuxtApp, useRuntimeConfig } from '#app'
import { computed } from 'vue'

export function useNewsletter() {
  const nuxtApp = useNuxtApp()
  const config = useRuntimeConfig().public.newsletter

  const isInitialized = computed(() => !!nuxtApp.$newsletter?.initialized)
  
  const features = computed(() => config.features || {})
  
  const isDragDropEnabled = computed(() => features.value.dragDrop !== false)
  
  const stylingMode = computed(() => features.value.styling || 'unstyled')

  return {
    isInitialized: isInitialized,
    config: config,
    features: features,
    isDragDropEnabled: isDragDropEnabled,
    stylingMode: stylingMode
  }
}



