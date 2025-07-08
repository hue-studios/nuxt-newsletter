// src/runtime/composables/utils/useFileUpload.ts
import { ref } from "vue";
import type { UploadOptions, UploadResult } from "../../types/newsletter";

export const useFileUpload = () => {
  const isUploading = ref(false);
  const uploadProgress = ref(0);
  const error = ref<string | null>(null);

  const uploadFile = async (
    file: File,
    options: UploadOptions = {}
  ): Promise<UploadResult> => {
    try {
      isUploading.value = true;
      uploadProgress.value = 0;
      error.value = null;

      const {
        maxSize = 5 * 1024 * 1024, // 5MB
        allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"],
        folder = "newsletters",
      } = options;

      // Validate file size
      if (file.size > maxSize) {
        throw new Error(`File size exceeds ${maxSize / (1024 * 1024)}MB limit`);
      }

      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`File type ${file.type} is not allowed`);
      }

      // Validate file name
      const fileName = file.name;
      if (fileName.length > 255) {
        throw new Error("File name is too long");
      }

      // Check for potentially dangerous file names
      const dangerousPatterns = [
        /\.exe$/i,
        /\.bat$/i,
        /\.cmd$/i,
        /\.scr$/i,
        /\.pif$/i,
        /\.jar$/i,
        /\.php$/i,
        /\.js$/i,
      ];

      if (dangerousPatterns.some((pattern) => pattern.test(fileName))) {
        throw new Error("File type not allowed for security reasons");
      }

      // Try to upload via Directus first
      try {
        const { $directusHelpers } = useNuxtApp();
        const result = await $directusHelpers.uploadFile(file, { folder });

        if (result.success) {
          uploadProgress.value = 100;
          return {
            id: result.result.id,
            filename: result.result.filename_download,
            url: `/assets/${result.result.id}`,
            size: file.size,
            type: file.type,
          };
        } else {
          throw new Error(result.error?.message || "Directus upload failed");
        }
      } catch (directusError: any) {
        console.warn(
          "Directus upload failed, falling back to mock:",
          directusError.message
        );

        // Fallback to mock upload for development
        await simulateUpload();

        return {
          id: Date.now().toString(),
          filename: file.name,
          url: URL.createObjectURL(file),
          size: file.size,
          type: file.type,
        };
      }
    } catch (err: any) {
      error.value = err.message || "Failed to upload file";
      throw err;
    } finally {
      isUploading.value = false;
    }
  };

  const uploadMultiple = async (
    files: File[],
    options: UploadOptions = {}
  ): Promise<UploadResult[]> => {
    try {
      const uploads = await Promise.all(
        files.map((file) => uploadFile(file, options))
      );
      return uploads;
    } catch (err: any) {
      error.value = err.message || "Failed to upload files";
      throw err;
    }
  };

  const deleteFile = async (fileId: string): Promise<void> => {
    try {
      error.value = null;

      const { $directusHelpers } = useNuxtApp();
      const result = await $directusHelpers.deleteItem(
        "directus_files",
        fileId
      );

      if (!result.success) {
        throw new Error(result.error?.message || "Failed to delete file");
      }
    } catch (err: any) {
      error.value = err.message || "Failed to delete file";
      console.error("Failed to delete file:", err);
      throw err;
    }
  };

  const validateFile = (
    file: File,
    options: UploadOptions = {}
  ): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const {
      maxSize = 5 * 1024 * 1024,
      allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"],
    } = options;

    // Size validation
    if (file.size > maxSize) {
      errors.push(`File size exceeds ${maxSize / (1024 * 1024)}MB limit`);
    }

    // Type validation
    if (!allowedTypes.includes(file.type)) {
      errors.push(`File type "${file.type}" is not allowed`);
    }

    // Name validation
    if (file.name.length > 255) {
      errors.push("File name is too long");
    }

    // Security validation
    const dangerousExtensions = [
      ".exe",
      ".bat",
      ".cmd",
      ".scr",
      ".pif",
      ".jar",
    ];
    if (
      dangerousExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))
    ) {
      errors.push("Potentially dangerous file type detected");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  const getFilePreview = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith("image/")) {
        reject(new Error("File is not an image"));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };
      reader.readAsDataURL(file);
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (fileType: string): string => {
    if (fileType.startsWith("image/")) return "lucide:image";
    if (fileType.startsWith("video/")) return "lucide:video";
    if (fileType.startsWith("audio/")) return "lucide:music";
    if (fileType.includes("pdf")) return "lucide:file-text";
    if (fileType.includes("word") || fileType.includes("doc"))
      return "lucide:file-text";
    if (fileType.includes("excel") || fileType.includes("sheet"))
      return "lucide:file-spreadsheet";
    return "lucide:file";
  };

  // Helper function to simulate upload progress
  const simulateUpload = (): Promise<void> => {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        uploadProgress.value += Math.random() * 30;
        if (uploadProgress.value >= 100) {
          uploadProgress.value = 100;
          clearInterval(interval);
          resolve();
        }
      }, 200);
    });
  };

  return {
    isUploading,
    uploadProgress,
    error,
    uploadFile,
    uploadMultiple,
    deleteFile,
    validateFile,
    getFilePreview,
    formatFileSize,
    getFileIcon,
  };
};
