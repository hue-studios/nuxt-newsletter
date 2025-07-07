// src/runtime/composables/utils/useFileUpload.ts
export const useFileUpload = () => {
  const uploadState = ref({
    isUploading: false,
    progress: 0,
    error: null as string | null,
  });

  const uploadedFiles = ref<any[]>([]);

  // Upload single file
  const uploadFile = async (
    file: File,
    options: {
      folder?: string;
      maxSize?: number; // in MB
      allowedTypes?: string[];
      onProgress?: (progress: number) => void;
    } = {},
  ) => {
    const {
      folder = "newsletter-assets",
      maxSize = 10,
      allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ],
      onProgress,
    } = options;

    // Validate file
    if (file.size > maxSize * 1024 * 1024) {
      throw new Error(`File size must be less than ${maxSize}MB`);
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} is not allowed`);
    }

    uploadState.value.isUploading = true;
    uploadState.value.progress = 0;
    uploadState.value.error = null;

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (folder) {
        formData.append("folder", folder);
      }

      const response = await $fetch("/api/newsletter/upload-image", {
        method: "POST",
        body: formData,
        onUploadProgress: (progress) => {
          const percentage = Math.round(
            (progress.loaded / progress.total) * 100,
          );
          uploadState.value.progress = percentage;
          onProgress?.(percentage);
        },
      });

      uploadedFiles.value.push(response.file);
      return response.file;
    } catch (error: any) {
      uploadState.value.error = error.message || "Upload failed";
      throw error;
    } finally {
      uploadState.value.isUploading = false;
      uploadState.value.progress = 0;
    }
  };

  // Upload multiple files
  const uploadFiles = async (files: FileList | File[], options: any = {}) => {
    const fileArray = Array.from(files);
    const results = [];

    for (let i = 0; i < fileArray.length; i++) {
      try {
        const result = await uploadFile(fileArray[i], {
          ...options,
          onProgress: (progress) => {
            const totalProgress = (i * 100 + progress) / fileArray.length;
            options.onProgress?.(Math.round(totalProgress));
          },
        });
        results.push(result);
      } catch (error) {
        console.error(`Failed to upload file ${fileArray[i].name}:`, error);
        results.push({ error: error.message, file: fileArray[i] });
      }
    }

    return results;
  };

  // Create file input trigger
  const triggerFileSelect = (
    options: {
      multiple?: boolean;
      accept?: string;
      onSelect?: (files: FileList) => void;
    } = {},
  ) => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = options.multiple || false;
    input.accept = options.accept || "image/*";

    input.onchange = (event) => {
      const files = (event.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        options.onSelect?.(files);
      }
    };

    input.click();
  };

  // Get file URL
  const getFileUrl = (
    fileId: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: "jpg" | "png" | "webp";
    } = {},
  ) => {
    const config = useRuntimeConfig();
    let url = `${config.public.newsletter.directusUrl}/assets/${fileId}`;

    const params = new URLSearchParams();
    if (options.width) params.set("width", options.width.toString());
    if (options.height) params.set("height", options.height.toString());
    if (options.quality) params.set("quality", options.quality.toString());
    if (options.format) params.set("format", options.format);

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    return url;
  };

  // Image optimization helpers
  const optimizeImage = (
    file: File,
    options: {
      maxWidth?: number;
      maxHeight?: number;
      quality?: number;
    } = {},
  ): Promise<File> => {
    return new Promise((resolve, reject) => {
      const { maxWidth = 1200, maxHeight = 800, quality = 0.8 } = options;

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const optimizedFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(optimizedFile);
            } else {
              reject(new Error("Failed to optimize image"));
            }
          },
          "image/jpeg",
          quality,
        );
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
  };

  // Generate file preview
  const generatePreview = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith("image/")) {
        reject(new Error("File is not an image"));
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        resolve(event.target?.result as string);
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  // Validate image dimensions
  const validateImageDimensions = (
    file: File,
    constraints: {
      minWidth?: number;
      minHeight?: number;
      maxWidth?: number;
      maxHeight?: number;
      aspectRatio?: number;
    },
  ): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const { width, height } = img;
        const { minWidth, minHeight, maxWidth, maxHeight, aspectRatio }
          = constraints;

        if (minWidth && width < minWidth) {
          reject(new Error(`Image width must be at least ${minWidth}px`));
          return;
        }

        if (minHeight && height < minHeight) {
          reject(new Error(`Image height must be at least ${minHeight}px`));
          return;
        }

        if (maxWidth && width > maxWidth) {
          reject(new Error(`Image width must be no more than ${maxWidth}px`));
          return;
        }

        if (maxHeight && height > maxHeight) {
          reject(new Error(`Image height must be no more than ${maxHeight}px`));
          return;
        }

        if (aspectRatio) {
          const ratio = width / height;
          if (Math.abs(ratio - aspectRatio) > 0.1) {
            reject(
              new Error(
                `Image aspect ratio must be approximately ${aspectRatio}:1`,
              ),
            );
            return;
          }
        }

        resolve(true);
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
  };

  return {
    uploadState: readonly(uploadState),
    uploadedFiles: readonly(uploadedFiles),
    uploadFile,
    uploadFiles,
    triggerFileSelect,
    getFileUrl,
    optimizeImage,
    generatePreview,
    validateImageDimensions,
  };
};
