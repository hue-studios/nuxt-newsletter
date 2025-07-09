// src/runtime/composables/utils/useDirectus.ts
import { useNuxtApp } from "#imports";
import { onMounted, ref, readonly } from "vue";

export const useDirectus = () => {
  const { $directus, $directusHelpers } = useNuxtApp();

  const isConnected = ref(false);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const testConnection = async () => {
    try {
      isLoading.value = true;
      error.value = null;

      const result = await $directusHelpers.testConnection();
      isConnected.value = result.success;

      return result;
    } catch (err: any) {
      error.value = err.message || "Connection failed";
      isConnected.value = false;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Auto-test connection on mount
  onMounted(async () => {
    await testConnection();
  });

  return {
    // Direct access to Directus instance and helpers
    directus: $directus,
    directusHelpers: $directusHelpers,

    // State
    isConnected: readonly(isConnected),
    isLoading: readonly(isLoading),
    error: readonly(error),

    // Methods
    testConnection,
  };
};
