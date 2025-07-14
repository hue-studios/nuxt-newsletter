<template>
  <div class="image-upload-component">
    <label :for="inputId" class="block text-sm font-medium text-slate-700 mb-2">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <!-- Enhanced Upload Area -->
    <div class="relative">
      <!-- Image Preview -->
      <div
        v-if="previewUrl && !uploading"
        class="relative group aspect-video bg-slate-100 rounded-xl overflow-hidden border-2 border-slate-200 hover:border-blue-300 transition-all duration-200"
      >
        <img
          :src="previewUrl"
          :alt="label"
          class="w-full h-full object-cover"
          @error="handleImageError"
        />
        
        <!-- Image Overlay Actions -->
        <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-200">
          <div class="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            <div class="text-white text-sm">
              <p class="font-medium truncate">{{ getFileName() }}</p>
              <p class="text-white/80 text-xs">{{ getFileSize() }}</p>
            </div>
            <div class="flex items-center space-x-2">
              <button
                @click="openFileDialog"
                class="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors"
                title="Change image"
              >
                <Icon name="lucide:edit-2" class="w-4 h-4 text-white" />
              </button>
              <button
                @click="removeImage"
                class="p-2 bg-red-500/80 backdrop-blur-sm rounded-lg hover:bg-red-600/80 transition-colors"
                title="Remove image"
              >
                <Icon name="lucide:trash-2" class="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Upload Drop Zone -->
      <div
        v-else-if="!uploading"
        @click="openFileDialog"
        @dragover.prevent="handleDragOver"
        @dragleave.prevent="handleDragLeave"
        @drop.prevent="handleDrop"
        class="relative cursor-pointer group aspect-video border-2 border-dashed rounded-xl transition-all duration-200 hover:border-blue-500 hover:bg-blue-50/30"
        :class="{
          'border-slate-300 bg-slate-50': !isDragOver,
          'border-blue-500 bg-blue-50': isDragOver
        }"
      >
        <div class="absolute inset-0 flex flex-col items-center justify-center p-6">
          <div 
            class="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-200"
            :class="isDragOver 
              ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' 
              : 'bg-gradient-to-br from-slate-200 to-slate-300 text-slate-500 group-hover:from-blue-100 group-hover:to-blue-200 group-hover:text-blue-600'"
          >
            <Icon name="lucide:upload" class="w-6 h-6" />
          </div>
          
          <div class="text-center">
            <p class="text-sm font-medium text-slate-900 mb-1">
              {{ isDragOver ? 'Drop image here' : 'Upload Image' }}
            </p>
            <p class="text-xs text-slate-500 mb-3">
              {{ isDragOver ? 'Release to upload' : 'Drag and drop or click to browse' }}
            </p>
            <p class="text-xs text-slate-400">
              Supports: JPG, PNG, GIF, WebP (max 10MB)
            </p>
          </div>
        </div>
      </div>

      <!-- Upload Progress -->
      <div
        v-else
        class="aspect-video bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200 flex flex-col items-center justify-center p-6"
      >
        <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4">
          <Icon name="lucide:loader-2" class="w-6 h-6 text-white animate-spin" />
        </div>
        <div class="text-center">
          <p class="text-sm font-medium text-slate-900 mb-2">Uploading Image</p>
          <div class="w-32 h-2 bg-blue-200 rounded-full overflow-hidden">
            <div 
              class="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300"
              :style="{ width: `${uploadProgress}%` }"
            ></div>
          </div>
          <p class="text-xs text-slate-600 mt-2">{{ uploadProgress }}% complete</p>
        </div>
      </div>

      <!-- Hidden File Input -->
      <input
        ref="fileInput"
        :id="inputId"
        type="file"
        accept="image/*"
        class="hidden"
        @change="handleFileSelect"
      />
    </div>

    <!-- Enhanced Error Message -->
    <div v-if="uploadError" class="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
      <div class="flex items-start space-x-2">
        <Icon name="lucide:alert-circle" class="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
        <div class="text-sm text-red-800">
          <p class="font-medium">Upload Failed</p>
          <p>{{ uploadError }}</p>
        </div>
      </div>
    </div>

    <!-- Image Details -->
    <div v-if="currentImageId && imageDetails" class="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
      <div class="flex items-start space-x-3">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center flex-shrink-0">
          <Icon name="lucide:check-circle" class="w-4 h-4 text-green-600" />
        </div>
        <div class="text-sm text-slate-700 min-w-0 flex-1">
          <p class="font-medium mb-1">Image Details</p>
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span class="text-slate-500">Size:</span>
              <span class="ml-1 font-medium">{{ formatFileSize(imageDetails.filesize) }}</span>
            </div>
            <div>
              <span class="text-slate-500">Type:</span>
              <span class="ml-1 font-medium">{{ imageDetails.type?.toUpperCase() }}</span>
            </div>
            <div v-if="imageDetails.width">
              <span class="text-slate-500">Dimensions:</span>
              <span class="ml-1 font-medium">{{ imageDetails.width }}×{{ imageDetails.height }}</span>
            </div>
            <div>
              <span class="text-slate-500">Uploaded:</span>
              <span class="ml-1 font-medium">{{ formatDate(imageDetails.uploaded_on) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Upload Tips -->
    <div v-if="!currentImageId && !uploading" class="mt-3">
      <details class="group">
        <summary class="flex items-center space-x-2 text-xs text-slate-500 cursor-pointer hover:text-slate-700 transition-colors">
          <Icon name="lucide:help-circle" class="w-3 h-3" />
          <span>Image optimization tips</span>
          <Icon name="lucide:chevron-down" class="w-3 h-3 group-open:rotate-180 transition-transform" />
        </summary>
        <div class="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <ul class="text-xs text-blue-800 space-y-1">
            <li>• Use high-quality images (at least 600px wide for newsletters)</li>
            <li>• Optimize file size to improve email load times</li>
            <li>• Always include descriptive alt text for accessibility</li>
            <li>• Consider using WebP format for better compression</li>
          </ul>
        </div>
      </details>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useDirectusNewsletter } from '../composables/useDirectusNewsletter';
import { useNewsletter } from '../composables/useNewsletter';

interface Props {
  modelValue?: string | null;
  label?: string;
  required?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  label: 'Image',
  required: false
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | null): void;
  (e: 'error', message: string): void;
}>();

const { uploadFile, fetchFile } = useDirectusNewsletter();
const { directusUrl } = useNewsletter();

// Enhanced state management
const selectedFile = ref<File | null>(null);
const previewUrl = ref<string | null>(null);
const uploading = ref(false);
const uploadProgress = ref(0);
const uploadError = ref<string | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const isDragOver = ref(false);
const imageDetails = ref<any>(null);

// Internal ref for the current image ID
const currentImageId = ref<string | null>(props.modelValue);

// Generate unique input ID
const inputId = computed(() => `image-upload-${Math.random().toString(36).substr(2, 9)}`);

// Watch for changes in modelValue
watch(() => props.modelValue, (newValue) => {
  currentImageId.value = newValue;
  updatePreviewUrl();
  if (newValue) {
    loadImageDetails();
  } else {
    imageDetails.value = null;
  }
}, { immediate: true });

// Enhanced preview URL management
const updatePreviewUrl = () => {
  if (currentImageId.value) {
    previewUrl.value = `${directusUrl.value}/assets/${currentImageId.value}?width=800&height=600&fit=cover&format=webp`;
  } else {
    previewUrl.value = null;
  }
};

// Load image details from Directus
const loadImageDetails = async () => {
  if (!currentImageId.value) return;
  
  try {
    imageDetails.value = await fetchFile(currentImageId.value);
  } catch (error) {
    console.warn('Could not load image details:', error);
  }
};

// Enhanced file handling
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    processFile(target.files[0]);
  }
};

const handleDrop = (event: DragEvent) => {
  isDragOver.value = false;
  if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
    processFile(event.dataTransfer.files[0]);
  }
};

const handleDragOver = () => {
  isDragOver.value = true;
};

const handleDragLeave = () => {
  isDragOver.value = false;
};

const processFile = (file: File) => {
  uploadError.value = null;
  
  // Enhanced validation
  if (!file.type.startsWith('image/')) {
    uploadError.value = 'Please select an image file (JPG, PNG, GIF, or WebP).';
    return;
  }
  
  if (file.size > 10 * 1024 * 1024) {
    uploadError.value = 'File size exceeds 10MB limit. Please choose a smaller image.';
    return;
  }
  
  selectedFile.value = file;
  uploadImage();
};

// Enhanced upload with progress
const uploadImage = async () => {
  if (!selectedFile.value) return;

  uploading.value = true;
  uploadProgress.value = 0;
  uploadError.value = null;

  try {
    // Simulate upload progress for better UX
    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 90) {
        uploadProgress.value += Math.random() * 20;
      }
    }, 200);

    const result = await uploadFile(selectedFile.value);
    
    clearInterval(progressInterval);
    uploadProgress.value = 100;
    
    // Brief delay to show completion
    setTimeout(() => {
      currentImageId.value = result.id;
      emit('update:modelValue', result.id);
      updatePreviewUrl();
      loadImageDetails();
      selectedFile.value = null;
      uploading.value = false;
      uploadProgress.value = 0;
    }, 500);

  } catch (error: any) {
    uploading.value = false;
    uploadProgress.value = 0;
    uploadError.value = error.message || 'Upload failed. Please try again.';
    emit('error', uploadError.value);
  }
};

// Enhanced utility functions
const openFileDialog = () => {
  fileInput.value?.click();
};

const removeImage = () => {
  currentImageId.value = null;
  previewUrl.value = null;
  imageDetails.value = null;
  selectedFile.value = null;
  emit('update:modelValue', null);
  
  // Reset file input
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const getFileName = () => {
  if (imageDetails.value?.filename_download) {
    return imageDetails.value.filename_download;
  }
  if (selectedFile.value) {
    return selectedFile.value.name;
  }
  return 'Image';
};

const getFileSize = () => {
  if (imageDetails.value?.filesize) {
    return formatFileSize(imageDetails.value.filesize);
  }
  if (selectedFile.value) {
    return formatFileSize(selectedFile.value.size);
  }
  return '';
};

const formatFileSize = (bytes: number) => {
  if (!bytes) return '';
  
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const handleImageError = () => {
  uploadError.value = 'Failed to load image. The file may be corrupted or unsupported.';
};

// Initialize
onMounted(() => {
  updatePreviewUrl();
  if (currentImageId.value) {
    loadImageDetails();
  }
});
</script>

<style scoped>
.image-upload-component {
  position: relative;
}

/* Enhanced drag and drop styling */
@media (hover: hover) {
  .cursor-pointer:hover {
    transform: translateY(-1px);
  }
}

/* Smooth transitions for all interactive elements */
* {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Enhanced focus styles */
input:focus,
button:focus {
  outline: none;
}

/* Custom scrollbar for details content */
details div::-webkit-scrollbar {
  width: 4px;
}

details div::-webkit-scrollbar-track {
  background: rgba(59, 130, 246, 0.1);
}

details div::-webkit-scrollbar-thumb {
  background: rgba(59, 130, 246, 0.3);
  border-radius: 2px;
}
</style>