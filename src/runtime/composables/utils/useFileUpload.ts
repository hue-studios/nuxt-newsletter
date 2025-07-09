// src/runtime/composables/utils/useFileUpload.ts
import { useNuxtApp } from "nuxt/app";
import { ref, readonly } from "vue";
import type { UploadOptions, UploadResult } from "../../types/newsletter";

export const useFileUpload = () => {
  const isUploading = ref(false);
  const uploadProgress = ref(0);
  const error = ref<string | null>(null);

  const uploadFile = async (
    file: File,
    options?: UploadOptions
  ): Promise<UploadResult> => {
    try {
      isUploading.value = true;
      uploadProgress.value = 0;
      error.value = null;

      const { $directusHelpers } = useNuxtApp();

      // Validate file
      if (options?.maxSize && file.size > options.maxSize) {
        throw new Error(`File size exceeds limit of ${options.maxSize} bytes`);
      }

      if (options?.allowedTypes && !options.allowedTypes.includes(file.type)) {
        throw new Error(`File type ${file.type} is not allowed`);
      }

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        uploadProgress.value = Math.min(uploadProgress.value + 10, 90);
      }, 100);

      const result = await $directusHelpers.uploadFile(file, options);

      clearInterval(progressInterval);
      uploadProgress.value = 100;

      return result;
    } catch (err: any) {
      error.value = err.message || "Upload failed";
      throw err;
    } finally {
      isUploading.value = false;
      setTimeout(() => {
        uploadProgress.value = 0;
      }, 1000);
    }
  };

  const uploadMultipleFiles = async (
    files: File[],
    options?: UploadOptions
  ): Promise<UploadResult[]> => {
    const results: UploadResult[] = [];

    for (const file of files) {
      try {
        const result = await uploadFile(file, options);
        results.push(result);
      } catch (err) {
        results.push({
          success: false,
          error: err instanceof Error ? err.message : "Upload failed",
        });
      }
    }

    return results;
  };

  return {
    isUploading: readonly(isUploading),
    uploadProgress: readonly(uploadProgress),
    error: readonly(error),
    uploadFile,
    uploadMultipleFiles,
  };
};
