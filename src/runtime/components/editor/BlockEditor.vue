<!-- src/runtime/components/editor/BlockEditor.vue -->
<template>
  <div class="block-editor space-y-6">
    <!-- Block Type Info -->
    <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
      <Icon
        :name="block.block_type.icon || 'lucide:square'"
        class="w-5 h-5 text-gray-600"
      />
      <div>
        <h4 class="font-medium text-gray-900">
          {{ block.block_type.name }}
        </h4>
        <p class="text-sm text-gray-600">
          {{ block.block_type.description }}
        </p>
      </div>
    </div>

    <!-- Dynamic Fields Based on Block Type -->
    <div class="space-y-4">
      <div
        v-for="fieldConfig in fieldConfigs"
        :key="fieldConfig.field"
        class="space-y-2"
      >
        <Label
          :for="fieldConfig.field"
          class="text-sm font-medium"
        >
          {{ fieldConfig.label }}
          <span
            v-if="fieldConfig.required"
            class="text-red-500"
          >*</span>
        </Label>

        <!-- Text Input -->
        <Input
          v-if="fieldConfig.type === 'text'"
          :id="fieldConfig.field"
          :model-value="getFieldValue(fieldConfig.field)"
          :placeholder="fieldConfig.placeholder"
          :required="fieldConfig.required"
          @update:model-value="updateField(fieldConfig.field, $event)"
        />

        <!-- Textarea -->
        <Textarea
          v-else-if="fieldConfig.type === 'textarea'"
          :id="fieldConfig.field"
          :model-value="getFieldValue(fieldConfig.field)"
          :placeholder="fieldConfig.placeholder"
          :required="fieldConfig.required"
          rows="3"
          @update:model-value="updateField(fieldConfig.field, $event)"
        />

        <!-- Rich Text Editor -->
        <div
          v-else-if="fieldConfig.type === 'rich-text'"
          class="space-y-2"
        >
          <TiptapEditor
            :model-value="getFieldValue(fieldConfig.field)"
            :placeholder="fieldConfig.placeholder"
            @update:model-value="updateField(fieldConfig.field, $event)"
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
            class="w-12 h-8 rounded border border-gray-300 cursor-pointer"
            @input="
              updateField(
                fieldConfig.field,
                ($event.target as HTMLInputElement).value,
              )
            "
          >
          <Input
            :model-value="getFieldValue(fieldConfig.field)"
            placeholder="#000000"
            class="flex-1"
            @update:model-value="updateField(fieldConfig.field, $event)"
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
          :placeholder="fieldConfig.placeholder"
          :required="fieldConfig.required"
          @update:model-value="updateField(fieldConfig.field, $event)"
        />

        <!-- File Upload -->
        <div
          v-else-if="fieldConfig.type === 'file'"
          class="space-y-2"
        >
          <div class="flex items-center space-x-2">
            <Input
              :model-value="getFieldValue(fieldConfig.field)"
              placeholder="Enter URL or upload file..."
              class="flex-1"
              @update:model-value="updateField(fieldConfig.field, $event)"
            />
            <Button
              variant="outline"
              size="sm"
              @click="triggerFileUpload"
            >
              <Icon
                name="lucide:upload"
                class="w-4 h-4 mr-1"
              />
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
          >

          <!-- Image Preview -->
          <div
            v-if="
              getFieldValue(fieldConfig.field)
                && fieldConfig.field === 'image_url'
            "
            class="mt-2"
          >
            <img
              :src="getImageUrl(getFieldValue(fieldConfig.field))"
              alt="Preview"
              class="max-w-full h-32 object-cover rounded border border-gray-200"
            >
          </div>
        </div>

        <!-- Number Input -->
        <Input
          v-else-if="fieldConfig.type === 'number'"
          :id="fieldConfig.field"
          type="number"
          :model-value="getFieldValue(fieldConfig.field)"
          :placeholder="fieldConfig.placeholder"
          :required="fieldConfig.required"
          @update:model-value="updateField(fieldConfig.field, $event)"
        />

        <!-- Field Help Text -->
        <p
          v-if="fieldConfig.help"
          class="text-xs text-gray-500"
        >
          {{ fieldConfig.help }}
        </p>
      </div>
    </div>

    <!-- Styling Section -->
    <div class="border-t border-gray-200 pt-6">
      <h5 class="font-medium text-gray-900 mb-4">
        Styling Options
      </h5>

      <div class="grid grid-cols-2 gap-4">
        <!-- Background Color -->
        <div>
          <Label
            for="background_color"
            class="text-sm"
          >Background</Label>
          <div class="flex items-center space-x-2 mt-1">
            <input
              id="background_color"
              type="color"
              :value="block.background_color"
              class="w-8 h-8 rounded border border-gray-300"
              @input="
                updateField(
                  'background_color',
                  ($event.target as HTMLInputElement).value,
                )
              "
            >
            <Input
              :model-value="block.background_color"
              placeholder="#ffffff"
              class="flex-1 text-sm"
              @update:model-value="updateField('background_color', $event)"
            />
          </div>
        </div>

        <!-- Text Color -->
        <div>
          <Label
            for="text_color"
            class="text-sm"
          >Text Color</Label>
          <div class="flex items-center space-x-2 mt-1">
            <input
              id="text_color"
              type="color"
              :value="block.text_color"
              class="w-8 h-8 rounded border border-gray-300"
              @input="
                updateField(
                  'text_color',
                  ($event.target as HTMLInputElement).value,
                )
              "
            >
            <Input
              :model-value="block.text_color"
              placeholder="#333333"
              class="flex-1 text-sm"
              @update:model-value="updateField('text_color', $event)"
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
              <SelectItem value="left">
                Left
              </SelectItem>
              <SelectItem value="center">
                Center
              </SelectItem>
              <SelectItem value="right">
                Right
              </SelectItem>
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
              <SelectItem value="12px">
                Small (12px)
              </SelectItem>
              <SelectItem value="14px">
                Normal (14px)
              </SelectItem>
              <SelectItem value="16px">
                Large (16px)
              </SelectItem>
              <SelectItem value="18px">
                Extra Large (18px)
              </SelectItem>
              <SelectItem value="20px">
                Huge (20px)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <!-- Padding -->
      <div class="mt-4">
        <Label
          for="padding"
          class="text-sm"
        >Padding</Label>
        <Input
          id="padding"
          :model-value="block.padding"
          placeholder="20px 0"
          class="mt-1"
          @update:model-value="updateField('padding', $event)"
        />
        <p class="text-xs text-gray-600 mt-1">
          CSS padding format (e.g., "20px 0" for top/bottom padding)
        </p>
      </div>
    </div>

    <!-- Block Actions -->
    <div class="border-t border-gray-200 pt-6">
      <div class="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          @click="$emit('duplicate')"
        >
          <Icon
            name="lucide:copy"
            class="w-4 h-4 mr-1"
          />
          Duplicate Block
        </Button>

        <Button
          variant="outline"
          size="sm"
          class="text-red-600 hover:text-red-700"
          @click="$emit('delete')"
        >
          <Icon
            name="lucide:trash-2"
            class="w-4 h-4 mr-1"
          />
          Delete Block
        </Button>
      </div>
    </div>

    <!-- Advanced Settings -->
    <div class="border-t border-gray-200 pt-6">
      <details class="group">
        <summary
          class="flex items-center cursor-pointer text-sm font-medium text-gray-900"
        >
          <Icon
            name="lucide:chevron-right"
            class="w-4 h-4 mr-1 transition-transform group-open:rotate-90"
          />
          Advanced Settings
        </summary>

        <div class="mt-4 pl-5 space-y-4">
          <!-- Custom CSS Classes -->
          <div>
            <Label class="text-sm">Custom CSS Classes</Label>
            <Input
              :model-value="block.content?.css_classes || ''"
              placeholder="custom-class another-class"
              class="mt-1"
              @update:model-value="updateField('content.css_classes', $event)"
            />
          </div>

          <!-- Custom Attributes -->
          <div>
            <Label class="text-sm">Custom Attributes (JSON)</Label>
            <Textarea
              :model-value="
                JSON.stringify(block.content?.attributes || {}, null, 2)
              "
              placeholder="{&quot;data-track&quot;: &quot;button-click&quot;, &quot;id&quot;: &quot;hero-button&quot;}"
              class="mt-1 font-mono text-sm"
              rows="3"
              @update:model-value="updateCustomAttributes"
            />
          </div>
        </div>
      </details>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { NewsletterBlock, BlockFieldConfig } from "~/types/newsletter";

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
  // Handle nested field paths like 'content.css_classes'
  if (field.includes(".")) {
    const [parent, child] = field.split(".");
    return (props.block as any)[parent]?.[child] || "";
  }
  return (props.block as any)[field] || "";
};

const updateField = (field: string, value: any) => {
  // Handle nested field paths
  if (field.includes(".")) {
    const [parent, child] = field.split(".");
    const parentData = (props.block as any)[parent] || {};
    emit("update", {
      [parent]: {
        ...parentData,
        [child]: value,
      },
    });
  } else {
    emit("update", { [field]: value });
  }
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

    // Auto-fill alt text with filename if empty
    if (!getFieldValue("image_alt_text")) {
      updateField("image_alt_text", file.name.replace(/\.[^/.]+$/, ""));
    }
  } catch (error) {
    console.error("File upload failed:", error);
    // TODO: Show user-friendly error message
  }
};

const getImageUrl = (url: string) => {
  if (url.startsWith("/") || url.includes("assets/")) {
    return getFileUrl(url);
  }
  return url;
};

const updateCustomAttributes = (jsonString: string) => {
  try {
    const attributes = JSON.parse(jsonString);
    updateField("content.attributes", attributes);
  } catch (error) {
    // Invalid JSON, ignore for now
    console.warn("Invalid JSON for custom attributes:", error);
  }
};
</script>
