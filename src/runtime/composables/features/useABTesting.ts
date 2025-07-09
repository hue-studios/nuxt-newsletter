// src/runtime/composables/features/useABTesting.ts
import { ref, readonly } from "vue";

export const useABTesting = () => {
  const abTests = ref<any[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const createABTest = async (data: any) => {
    try {
      isLoading.value = true;
      error.value = null;

      // Placeholder for A/B test creation
      const test = { id: Date.now(), ...data };
      abTests.value.push(test);
      return test;
    } catch (err: any) {
      error.value = err.message || "Failed to create A/B test";
      console.error("Failed to create A/B test:", err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const updateABTest = async (id: number, data: any) => {
    try {
      error.value = null;

      const index = abTests.value.findIndex((test) => test.id === id);
      if (index !== -1) {
        abTests.value[index] = { ...abTests.value[index], ...data };
      }
    } catch (err: any) {
      error.value = err.message || "Failed to update A/B test";
      console.error("Failed to update A/B test:", err);
      throw err;
    }
  };

  const deleteABTest = async (id: number) => {
    try {
      error.value = null;

      abTests.value = abTests.value.filter((test) => test.id !== id);
    } catch (err: any) {
      error.value = err.message || "Failed to delete A/B test";
      console.error("Failed to delete A/B test:", err);
      throw err;
    }
  };

  return {
    abTests: readonly(abTests),
    isLoading: readonly(isLoading),
    error: readonly(error),
    createABTest,
    updateABTest,
    deleteABTest,
  };
};
