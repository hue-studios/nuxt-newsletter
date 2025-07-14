<template>
  <div class="image-upload-component">
    <label v-if="label" class="block text-sm font-medium text-gray-700 mb-1">{{ label }}</label>

    <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md relative group">
      <div class="space-y-1 text-center">
        <div v-if="previewUrl" class="relative w-full h-48 overflow-hidden rounded-md mx-auto mb-2">
          <img :src="previewUrl" alt="Image preview" class="w-full h-full object-cover" />
          <div class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button @click="removeImage" class="p-2 rounded-full bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors" title="Remove image">
              <Icon name="lucide:trash-2" class="w-5 h-5" />
            </button>
          </div>
        </div>
        <div v-else>
          <Icon name="lucide:image" class="mx-auto h-12 w-12 text-gray-400" />
          <div class="flex text-sm text-gray-600">
            <label
              for="file-upload"
              class="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
            >
              <span>Upload a file</span>
              <input id="file-upload" ref="fileInput" name="file-upload" type="file" class="sr-only" @change="handleFileChange" accept="image/*" />
            </label>
            <p class="pl-1">or drag and drop</p>
          </div>
          <p class="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
        </div>
      </div>

      <div v-if="selectedFile && !previewUrl" class="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 rounded-md">
        <Icon name="lucide:file" class="w-12 h-12 text-gray-400" />
        <p class="ml-2 text-gray-600">{{ selectedFile.name }}</p>
      </div>

      <div v-if="uploading" class="absolute inset-0 flex items-center justify-center bg-blue-100 bg-opacity-75 rounded-md">
        <Icon name="lucide:loader-2" class="w-8 h-8 text-blue-600 animate-spin" />
        <p class="ml-2 text-blue-700 font-medium">Uploading...</p>
      </div>
    </div>

    <div v-if="selectedFile && !uploading && !currentImageId" class="mt-2 flex justify-end">
      <button
        @click="uploadImage"
        :disabled="uploading"
        class="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Icon name="lucide:upload" class="w-4 h-4 mr-2" />
        Upload
      </button>
    </div>

    <p v-if="uploadError" class="mt-2 text-sm text-red-600">{{ uploadError }}</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useDirectusNewsletter } from '../composables/useDirectusNewsletter';
import { useNewsletter } from '../composables/useNewsletter'; // To get Directus URL for preview

interface Props {
  modelValue?: string | null; // Directus File ID (UUID)
  label?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  label: 'Image'
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | null): void;
  (e: 'error', message: string): void;
}>();

const { uploadFile } = useDirectusNewsletter();
const { directusUrl } = useNewsletter(); // Get the Directus URL from useNewsletter composable

const selectedFile = ref<File | null>(null);
const previewUrl = ref<string | null>(null);
const uploading = ref(false);
const uploadError = ref<string | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

// Internal ref for the current image ID to manage preview
const currentImageId = ref<string | null>(props.modelValue);

// Watch for changes in modelValue to update currentImageId and previewUrl
watch(() => props.modelValue, (newValue) => {
  currentImageId.value = newValue;
  updatePreviewUrl();
}, { immediate: true }); // Immediate ensures it runs on initial load

// Update preview URL based on currentImageId
const updatePreviewUrl = () => {
  if (currentImageId.value) {
    // Construct Directus image URL
    previewUrl.value = `${directusUrl.value}/assets/${currentImageId.value}`;
  } else {
    previewUrl.value = null;
  }
};

const handleFileChange = (event: Event) => {
  uploadError.value = null;
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    const file = target.files[0];
    // Basic validation
    if (!file.type.startsWith('image/')) {
      uploadError.value = 'Please select an image file.';
      selectedFile.value = null;
      return;
    }
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      uploadError.value = 'File size exceeds 10MB limit.';
      selectedFile.value = null;
      return;
    }

    selectedFile.value = file;
    // Create a local preview URL for the newly selected file
    previewUrl.value = URL.createObjectURL(file);
  } else {
    selectedFile.value = null;
    updatePreviewUrl(); // Revert to Directus URL if no new file selected
  }
};

const uploadImage = async () => {
  if (!selectedFile.value) {
    uploadError.value = 'No file selected for upload.';
    return;
  }

  uploading.value = true;
  uploadError.value = null;

  try {
    const result = await uploadFile(selectedFile.value);
    // Directus uploadFiles returns an array of file objects
    if (result && result.length > 0 && result[0].id) {
      const fileId = result[0].id;
      currentImageId.value = fileId; // Update internal state
      emit('update:modelValue', fileId); // Emit the Directus File ID
      selectedFile.value = null; // Clear selected file after successful upload
      updatePreviewUrl(); // Update preview to use Directus URL
    } else {
      throw new Error('Upload failed: No file ID returned.');
    }
  } catch (err: any) {
    uploadError.value = `Upload failed: ${err.message || 'Unknown error'}`;
    emit('error', uploadError.value);
    console.error('Image upload error:', err);
  } finally {
    uploading.value = false;
    // Reset file input to allow re-uploading the same file if needed
    if (fileInput.value) {
      fileInput.value.value = '';
    }
  }
};

const removeImage = () => {
  selectedFile.value = null;
  currentImageId.value = null;
  previewUrl.value = null;
  uploadError.value = null;
  emit('update:modelValue', null); // Emit null to clear the image
  // Reset file input
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

// Clean up object URL when component is unmounted
onMounted(() => {
  updatePreviewUrl(); // Ensure initial preview is set
});

watch(currentImageId, (newId) => {
  if (!newId && previewUrl.value && previewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl.value);
  }
});
</script>

<style scoped>
@reference 'tailwindcss';
.image-upload-component {
  @apply p-4 border border-gray-200 rounded-lg bg-white;
}

.image-upload-component label {
  @apply text-sm font-medium text-gray-700;
}

.image-upload-component .border-dashed {
  @apply border-gray-300;
}

.image-upload-component .group:hover .absolute {
  @apply opacity-100;
}
</style>
