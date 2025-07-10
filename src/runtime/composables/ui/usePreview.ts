// src/runtime/composables/ui/usePreview.ts
import { useNuxtApp } from "#imports";
import { ref, readonly } from "vue";
import { $fetch } from "ofetch";
import type { Newsletter } from "../../types/newsletter";

export const usePreview = () => {
  const previewHtml = ref("");
  const isGenerating = ref(false);
  const error = ref<string | null>(null);

  const generatePreview = async (newsletter: Newsletter) => {
    try {
      isGenerating.value = true;
      error.value = null;

      const result = await $fetch<{ html: string }>(
        "/api/newsletter/core/compile-mjml",
        {
          method: "POST",
          body: { newsletter },
        }
      );

      previewHtml.value = result.html;
      return result.html;
    } catch (err: any) {
      error.value = err.message || "Failed to generate preview";
      console.error("Failed to generate preview:", err);
      throw err;
    } finally {
      isGenerating.value = false;
    }
  };

  const clearPreview = () => {
    previewHtml.value = "";
    error.value = null;
  };

  return {
    previewHtml: readonly(previewHtml),
    isGenerating: readonly(isGenerating),
    error: readonly(error),
    generatePreview,
    clearPreview,
  };
};
