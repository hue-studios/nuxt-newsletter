<!-- components/NewsletterBlock.vue -->
<template>
  <div
    class="newsletter-block group relative"
    :class="{
      'ring-2 ring-blue-500 ring-opacity-50': isSelected,
      'hover:ring-1 hover:ring-gray-300': !isSelected,
    }"
    @click="$emit('select', block)"
  >
    <!-- Block Content Preview -->
    <div
      class="block-content rounded-lg overflow-hidden transition-all"
      :style="{ backgroundColor: block.background_color }"
    >
      <!-- Hero Block -->
      <div v-if="block.block_type.slug === 'hero'" class="text-center p-8">
        <h1
          class="text-3xl font-bold mb-4"
          :style="{
            color: block.text_color,
            textAlign: block.text_align,
            fontSize: getFontSize(32),
          }"
        >
          {{ block.title || "Hero Title" }}
        </h1>
        <p
          v-if="block.subtitle"
          class="text-lg mb-6"
          :style="{
            color: block.text_color,
            textAlign: block.text_align,
            fontSize: getFontSize(18),
          }"
        >
          {{ block.subtitle }}
        </p>
        <Button
          v-if="block.button_text"
          class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
        >
          {{ block.button_text }}
        </Button>
      </div>

      <!-- Text Block -->
      <div
        v-else-if="block.block_type.slug === 'text'"
        class="prose max-w-none"
        :style="{
          padding: block.padding,
          textAlign: block.text_align,
          color: block.text_color,
          fontSize: block.font_size,
        }"
      >
        <div v-if="block.text_content" v-html="block.text_content" />
        <p v-else class="text-gray-500 italic">Click to add text content...</p>
      </div>

      <!-- Image Block -->
      <div
        v-else-if="block.block_type.slug === 'image'"
        class="text-center"
        :style="{ padding: block.padding }"
      >
        <img
          v-if="block.image_url"
          :src="getImageUrl(block.image_url)"
          :alt="block.image_alt_text || ''"
          class="max-w-full h-auto rounded-lg mx-auto"
        />
        <div
          v-else
          class="bg-gray-200 border-2 border-dashed border-gray-400 rounded-lg p-12 text-center"
        >
          <Icon
            name="lucide:image"
            class="w-12 h-12 text-gray-400 mx-auto mb-4"
          />
          <p class="text-gray-500">Click to add image</p>
        </div>
        <p
          v-if="block.image_caption"
          class="text-sm mt-2"
          :style="{ color: block.text_color }"
        >
          {{ block.image_caption }}
        </p>
      </div>

      <!-- Button Block -->
      <div
        v-else-if="block.block_type.slug === 'button'"
        class="text-center"
        :style="{ padding: block.padding }"
      >
        <Button
          class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-lg"
          :style="{ textAlign: block.text_align }"
        >
          {{ block.button_text || "Button Text" }}
        </Button>
      </div>

      <!-- Two Column Block -->
      <div
        v-else-if="block.block_type.slug === 'two-column'"
        class="grid grid-cols-2 gap-6"
        :style="{ padding: block.padding }"
      >
        <div>
          <h3
            class="font-semibold mb-2"
            :style="{
              color: block.text_color,
              fontSize: getFontSize(18),
            }"
          >
            {{ block.title || "Column 1 Title" }}
          </h3>
          <p :style="{ color: block.text_color, fontSize: block.font_size }">
            Left column content
          </p>
        </div>
        <div>
          <h3
            class="font-semibold mb-2"
            :style="{
              color: block.text_color,
              fontSize: getFontSize(18),
            }"
          >
            {{ block.subtitle || "Column 2 Title" }}
          </h3>
          <p :style="{ color: block.text_color, fontSize: block.font_size }">
            Right column content
          </p>
        </div>
      </div>

      <!-- Divider Block -->
      <div
        v-else-if="block.block_type.slug === 'divider'"
        :style="{ padding: block.padding }"
      >
        <hr
          class="border-0 h-px"
          :style="{ backgroundColor: block.text_color || '#e5e7eb' }"
        />
      </div>

      <!-- Fallback for unknown block types -->
      <div
        v-else
        class="p-4 border-2 border-dashed border-gray-300 text-center text-gray-500"
      >
        <Icon name="lucide:help-circle" class="w-8 h-8 mx-auto mb-2" />
        <p>Unknown block type: {{ block.block_type.slug }}</p>
      </div>
    </div>

    <!-- Block Controls Overlay -->
    <div
      v-show="isSelected"
      class="absolute inset-0 bg-blue-500 bg-opacity-10 rounded-lg"
    >
      <!-- Top Controls -->
      <div
        class="absolute -top-10 left-0 right-0 flex items-center justify-between"
      >
        <div class="flex items-center space-x-1">
          <Badge variant="secondary" class="text-xs">
            {{ block.block_type.name }}
          </Badge>
          <span class="text-xs text-gray-500">#{{ block.sort }}</span>
        </div>

        <div class="flex items-center space-x-1">
          <!-- Move Up -->
          <Button
            v-if="index > 0"
            variant="outline"
            size="sm"
            @click.stop="$emit('move-up', block.id)"
          >
            <Icon name="lucide:chevron-up" class="w-3 h-3" />
          </Button>

          <!-- Move Down -->
          <Button
            v-if="!isLast"
            variant="outline"
            size="sm"
            @click.stop="$emit('move-down', block.id)"
          >
            <Icon name="lucide:chevron-down" class="w-3 h-3" />
          </Button>

          <!-- Duplicate -->
          <Button
            variant="outline"
            size="sm"
            @click.stop="$emit('duplicate', block)"
          >
            <Icon name="lucide:copy" class="w-3 h-3" />
          </Button>

          <!-- Delete -->
          <Button variant="outline" size="sm" @click.stop="confirmDelete">
            <Icon name="lucide:trash-2" class="w-3 h-3" />
          </Button>
        </div>
      </div>

      <!-- Quick Edit Overlay -->
      <div
        v-if="showQuickEdit"
        class="absolute inset-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-20"
        @click.stop
      >
        <div class="flex items-center justify-between mb-4">
          <h4 class="font-medium">Quick Edit</h4>
          <Button variant="ghost" size="sm" @click="showQuickEdit = false">
            <Icon name="lucide:x" class="w-4 h-4" />
          </Button>
        </div>

        <div class="space-y-3">
          <!-- Title Field -->
          <div v-if="hasField('title')">
            <Label class="text-xs">Title</Label>
            <Input
              :model-value="block.title"
              placeholder="Enter title..."
              class="text-sm"
              @update:model-value="updateField('title', $event)"
            />
          </div>

          <!-- Text Content Field -->
          <div v-if="hasField('text_content')">
            <Label class="text-xs">Content</Label>
            <Textarea
              :model-value="block.text_content"
              placeholder="Enter content..."
              class="text-sm h-20"
              @update:model-value="updateField('text_content', $event)"
            />
          </div>

          <!-- Button Text Field -->
          <div v-if="hasField('button_text')">
            <Label class="text-xs">Button Text</Label>
            <Input
              :model-value="block.button_text"
              placeholder="Button text..."
              class="text-sm"
              @update:model-value="updateField('button_text', $event)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Hover Controls -->
    <div
      v-show="!isSelected"
      class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
    >
      <Button variant="outline" size="sm" @click.stop="showQuickEdit = true">
        <Icon name="lucide:edit-2" class="w-3 h-3" />
      </Button>
    </div>

    <!-- Delete Confirmation Dialog -->
    <Dialog v-model:open="showDeleteDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Block</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this
            {{ block.block_type.name.toLowerCase() }} block? This action cannot
            be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" @click="showDeleteDialog = false">
            Cancel
          </Button>
          <Button variant="destructive" @click="deleteBlock">
            Delete Block
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import type { NewsletterBlock, BlockFieldConfig } from "../../types/newsletter";
</script>

<template>
  <div class="block-editor space-y-6">
    <!-- Block Type Info -->
    <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
      <Icon
        :name="block.block_type.icon || 'lucide:square'"
        class="w-5 h-5 text-gray-600"
      />
      <div>
        <h4 class="font-medium text-gray-900">{{ block.block_type.name }}</h4>
        <p class="text-sm text-gray-600">{{ block.block_type.description }}</p>
      </div>
    </div>

    <!-- Dynamic Fields -->
    <div class="space-y-4">
      <div
        v-for="fieldConfig in fieldConfigs"
        :key="fieldConfig.field"
        class="space-y-2"
      >
        <Label :for="fieldConfig.field" class="text-sm font-medium">
          {{ fieldConfig.label }}
          <span v-if="fieldConfig.required" class="text-red-500">*</span>
        </Label>

        <!-- Text Input -->
        <Input
          v-if="fieldConfig.type === 'text'"
          :id="fieldConfig.field"
          :model-value="getFieldValue(fieldConfig.field)"
          @update:model-value="updateField(fieldConfig.field, $event)"
          :placeholder="fieldConfig.placeholder"
          :required="fieldConfig.required"
        />

        <!-- Textarea -->
        <Textarea
          v-else-if="fieldConfig.type === 'textarea'"
          :id="fieldConfig.field"
          :model-value="getFieldValue(fieldConfig.field)"
          @update:model-value="updateField(fieldConfig.field, $event)"
          :placeholder="fieldConfig.placeholder"
          :required="fieldConfig.required"
          rows="3"
        />

        <!-- Rich Text Editor -->
        <div v-else-if="fieldConfig.type === 'rich-text'" class="space-y-2">
          <TiptapEditor
            :model-value="getFieldValue(fieldConfig.field)"
            @update:model-value="updateField(fieldConfig.field, $event)"
            :placeholder="fieldConfig.placeholder"
          />
        </div>

        <!-- Color Picker -->
        <div
          v-else-if="fieldConfig.type === 'color'"
          class="flex items-center space-x-3"
        >
          <input
            :id="fieldConfig.field"
            type="color"
            :value="getFieldValue(fieldConfig.field)"
            @input="
              updateField(
                fieldConfig.field,
                ($event.target as HTMLInputElement).value
              )
            "
            class="w-12 h-8 rounded border border-gray-300 cursor-pointer"
          />
          <Input
            :model-value="getFieldValue(fieldConfig.field)"
            @update:model-value="updateField(fieldConfig.field, $event)"
            placeholder="#000000"
            class="flex-1"
          />
        </div>

        <!-- Select Dropdown -->
        <Select
          v-else-if="fieldConfig.type === 'select'"
          :model-value="getFieldValue(fieldConfig.field)"
          @update:model-value="updateField(fieldConfig.field, $event)"
        >
          <SelectTrigger>
            <SelectValue :placeholder="fieldConfig.placeholder" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="option in fieldConfig.options"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </SelectItem>
          </SelectContent>
        </Select>

        <!-- URL Input -->
        <Input
          v-else-if="fieldConfig.type === 'url'"
          :id="fieldConfig.field"
          type="url"
          :model-value="getFieldValue(fieldConfig.field)"
          @update:model-value="updateField(fieldConfig.field, $event)"
          :placeholder="fieldConfig.placeholder"
          :required="fieldConfig.required"
        />

        <!-- File Upload -->
        <div v-else-if="fieldConfig.type === 'file'" class="space-y-2">
          <div class="flex items-center space-x-2">
            <Input
              :model-value="getFieldValue(fieldConfig.field)"
              @update:model-value="updateField(fieldConfig.field, $event)"
              placeholder="Enter URL or upload file..."
              class="flex-1"
            />
            <Button variant="outline" size="sm" @click="triggerFileUpload">
              <Icon name="lucide:upload" class="w-4 h-4 mr-1" />
              Upload
            </Button>
          </div>

          <!-- File Input -->
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="handleFileUpload"
          />

          <!-- Image Preview -->
          <div
            v-if="
              getFieldValue(fieldConfig.field) &&
              fieldConfig.field === 'image_url'
            "
            class="mt-2"
          >
            <img
              :src="getImageUrl(getFieldValue(fieldConfig.field))"
              alt="Preview"
              class="max-w-full h-32 object-cover rounded border border-gray-200"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Styling Section -->
    <div class="border-t border-gray-200 pt-6">
      <h5 class="font-medium text-gray-900 mb-4">Styling</h5>

      <div class="grid grid-cols-2 gap-4">
        <!-- Background Color -->
        <div>
          <Label for="background_color" class="text-sm">Background</Label>
          <div class="flex items-center space-x-2 mt-1">
            <input
              id="background_color"
              type="color"
              :value="block.background_color"
              @input="
                updateField(
                  'background_color',
                  ($event.target as HTMLInputElement).value
                )
              "
              class="w-8 h-8 rounded border border-gray-300"
            />
            <Input
              :model-value="block.background_color"
              @update:model-value="updateField('background_color', $event)"
              placeholder="#ffffff"
              class="flex-1 text-sm"
            />
          </div>
        </div>

        <!-- Text Color -->
        <div>
          <Label for="text_color" class="text-sm">Text Color</Label>
          <div class="flex items-center space-x-2 mt-1">
            <input
              id="text_color"
              type="color"
              :value="block.text_color"
              @input="
                updateField(
                  'text_color',
                  ($event.target as HTMLInputElement).value
                )
              "
              class="w-8 h-8 rounded border border-gray-300"
            />
            <Input
              :model-value="block.text_color"
              @update:model-value="updateField('text_color', $event)"
              placeholder="#333333"
              class="flex-1 text-sm"
            />
          </div>
        </div>

        <!-- Text Alignment -->
        <div>
          <Label class="text-sm">Text Align</Label>
          <Select
            :model-value="block.text_align"
            @update:model-value="updateField('text_align', $event)"
          >
            <SelectTrigger class="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Left</SelectItem>
              <SelectItem value="center">Center</SelectItem>
              <SelectItem value="right">Right</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Font Size -->
        <div>
          <Label class="text-sm">Font Size</Label>
          <Select
            :model-value="block.font_size"
            @update:model-value="updateField('font_size', $event)"
          >
            <SelectTrigger class="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="12px">Small (12px)</SelectItem>
              <SelectItem value="14px">Normal (14px)</SelectItem>
              <SelectItem value="16px">Large (16px)</SelectItem>
              <SelectItem value="18px">Extra Large (18px)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <!-- Padding -->
      <div class="mt-4">
        <Label for="padding" class="text-sm">Padding</Label>
        <Input
          id="padding"
          :model-value="block.padding"
          @update:model-value="updateField('padding', $event)"
          placeholder="20px 0"
          class="mt-1"
        />
        <p class="text-xs text-gray-600 mt-1">
          CSS padding format (e.g., "20px 0" for top/bottom padding)
        </p>
      </div>
    </div>

    <!-- Actions -->
    <div class="border-t border-gray-200 pt-6">
      <div class="flex items-center space-x-2">
        <Button variant="outline" size="sm" @click="$emit('duplicate')">
          <Icon name="lucide:copy" class="w-4 h-4 mr-1" />
          Duplicate
        </Button>

        <Button
          variant="outline"
          size="sm"
          @click="$emit('delete')"
          class="text-red-600 hover:text-red-700"
        >
          <Icon name="lucide:trash-2" class="w-4 h-4 mr-1" />
          Delete
        </Button>
      </div>
    </div>
  </div>
</template>

<!-- components/BlockEditor.vue -->
<script setup lang="ts">
interface Props {
  block: NewsletterBlock;
  index: number;
  isSelected: boolean;
  isLast: boolean;
}

interface Emits {
  (e: "select", block: NewsletterBlock): void;
  (e: "update", blockId: number, data: Partial<NewsletterBlock>): void;
  (e: "delete", blockId: number): void;
  (e: "duplicate", block: NewsletterBlock): void;
  (e: "move-up", blockId: number): void;
  (e: "move-down", blockId: number): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Local state
const showQuickEdit = ref(false);
const showDeleteDialog = ref(false);

// Computed
const visibleFields = computed(() => {
  return props.block.block_type.field_visibility_config || [];
});

// Methods
const hasField = (fieldName: string) => {
  return visibleFields.value.includes(fieldName);
};

const updateField = (field: string, value: any) => {
  emit("update", props.block.id, { [field]: value });
};

const getFontSize = (baseSize: number) => {
  const currentSize = Number.parseInt(props.block.font_size || "14");
  const ratio = currentSize / 14;
  return `${Math.round(baseSize * ratio)}px`;
};

const getImageUrl = (url: string) => {
  // Handle Directus assets
  if (url.startsWith("/") || url.includes("assets/")) {
    const { $directus } = useNuxtApp();
    return `${$directus.url}${url.startsWith("/") ? url : `/${url}`}`;
  }
  return url;
};

const confirmDelete = () => {
  showDeleteDialog.value = true;
};

const deleteBlock = () => {
  emit("delete", props.block.id);
  showDeleteDialog.value = false;
};

// Watch for selection changes
watch(
  () => props.isSelected,
  (selected) => {
    if (!selected) {
      showQuickEdit.value = false;
    }
  }
);

interface Props {
  block: NewsletterBlock;
}

interface Emits {
  (e: "update", data: Partial<NewsletterBlock>): void;
  (e: "duplicate"): void;
  (e: "delete"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { getBlockFieldConfig } = useNewsletterBlocks();
const { uploadFile, getFileUrl } = useDirectus();

// Refs
const fileInput = ref<HTMLInputElement>();

// Computed
const fieldConfigs = computed(() => {
  return getBlockFieldConfig(props.block.block_type);
});

// Methods
const getFieldValue = (field: string) => {
  return (props.block as any)[field] || "";
};

const updateField = (field: string, value: any) => {
  emit("update", { [field]: value });
};

const triggerFileUpload = () => {
  fileInput.value?.click();
};

const handleFileUpload = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  try {
    const uploadedFile = await uploadFile(file);
    const fileUrl = getFileUrl(uploadedFile.id);
    updateField("image_url", fileUrl);
  } catch (error) {
    console.error("File upload failed:", error);
  }
};

const getImageUrl = (url: string) => {
  if (url.startsWith("/") || url.includes("assets/")) {
    return getFileUrl(url);
  }
  return url;
};
</script>

<style scoped>
.newsletter-block {
  margin-bottom: 1rem;
  transition: all 0.2s ease;
}

.newsletter-block:hover {
  transform: translateY(-1px);
}

.block-content {
  min-height: 60px;
  border: 2px solid transparent;
  transition: border-color 0.2s ease;
}

.newsletter-block:hover .block-content {
  border-color: rgba(156, 163, 175, 0.3);
}

.prose {
  max-width: none;
}

.prose p {
  margin: 0.5em 0;
}

.prose h1,
.prose h2,
.prose h3,
.prose h4,
.prose h5,
.prose h6 {
  margin: 0.5em 0;
}
</style>
