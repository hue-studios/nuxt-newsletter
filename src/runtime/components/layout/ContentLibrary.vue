<!-- src/runtime/components/layout/ContentLibrary.vue -->
<template>
  <div class="content-library">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-xl font-semibold text-gray-900">Content Library</h2>
        <p class="text-sm text-gray-600">Reusable content blocks and assets</p>
      </div>
      <div class="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          @click="refreshContent"
          :disabled="isLoading"
        >
          <Icon
            name="lucide:refresh-cw"
            class="w-4 h-4"
            :class="{ 'animate-spin': isLoading }"
          />
        </Button>
        <Button size="sm" @click="showCreateDialog = true">
          <Icon name="lucide:plus" class="w-4 h-4 mr-2" />
          Add Content
        </Button>
      </div>
    </div>

    <!-- Search and Filters -->
    <div class="flex items-center space-x-4 mb-4">
      <div class="flex-1">
        <Input
          v-model="searchQuery"
          placeholder="Search content..."
          class="w-full"
        >
          <template #prefix>
            <Icon name="lucide:search" class="w-4 h-4 text-gray-400" />
          </template>
        </Input>
      </div>

      <Select v-model="selectedContentType">
        <SelectTrigger class="w-40">
          <SelectValue placeholder="Content Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Types</SelectItem>
          <SelectItem value="text">Text</SelectItem>
          <SelectItem value="hero">Hero</SelectItem>
          <SelectItem value="button">Button</SelectItem>
          <SelectItem value="image">Image</SelectItem>
          <SelectItem value="html">HTML</SelectItem>
          <SelectItem value="social">Social</SelectItem>
          <SelectItem value="footer">Footer</SelectItem>
        </SelectContent>
      </Select>

      <Select v-model="selectedCategory">
        <SelectTrigger class="w-40">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Categories</SelectItem>
          <SelectItem value="marketing">Marketing</SelectItem>
          <SelectItem value="product">Product</SelectItem>
          <SelectItem value="event">Event</SelectItem>
          <SelectItem value="announcement">Announcement</SelectItem>
          <SelectItem value="template">Template</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Content Grid -->
    <div
      v-if="isLoading && contentItems.length === 0"
      class="text-center py-12"
    >
      <Icon
        name="lucide:loader-2"
        class="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400"
      />
      <p class="text-gray-600">Loading content...</p>
    </div>

    <div
      v-else-if="filteredContent.length > 0"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <div
        v-for="item in filteredContent"
        :key="item.id"
        class="content-item border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
        @click="selectContent(item)"
      >
        <!-- Content Type Icon -->
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center space-x-2">
            <div
              class="w-8 h-8 rounded-lg flex items-center justify-center"
              :class="getContentTypeColor(item.content_type)"
            >
              <Icon
                :name="getContentTypeIcon(item.content_type)"
                class="w-4 h-4 text-white"
              />
            </div>
            <Badge variant="secondary" class="text-xs">
              {{ item.content_type }}
            </Badge>
          </div>

          <div class="flex items-center space-x-1">
            <Button variant="ghost" size="sm" @click.stop="editContent(item)">
              <Icon name="lucide:edit-2" class="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              @click.stop="duplicateContent(item)"
            >
              <Icon name="lucide:copy" class="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="sm" @click.stop="deleteContent(item)">
              <Icon name="lucide:trash-2" class="w-3 h-3" />
            </Button>
          </div>
        </div>

        <!-- Content Title -->
        <h3 class="font-medium text-gray-900 mb-2 line-clamp-2">
          {{ item.title }}
        </h3>

        <!-- Content Preview -->
        <div class="mb-3">
          <div
            v-if="item.content_type === 'text' || item.content_type === 'html'"
            class="text-sm text-gray-600 line-clamp-3"
            v-html="item.preview_text || getTextPreview(item.content_data)"
          />

          <div
            v-else-if="item.content_type === 'image'"
            class="aspect-video bg-gray-100 rounded flex items-center justify-center overflow-hidden"
          >
            <img
              v-if="item.content_data.image_url"
              :src="item.content_data.image_url"
              :alt="item.content_data.alt_text"
              class="w-full h-full object-cover"
            />
            <Icon v-else name="lucide:image" class="w-8 h-8 text-gray-400" />
          </div>

          <div
            v-else-if="item.content_type === 'button'"
            class="flex items-center justify-center p-3 bg-gray-50 rounded"
          >
            <Button
              :style="{
                backgroundColor:
                  item.content_data.background_color || '#3b82f6',
                color: item.content_data.text_color || '#ffffff',
              }"
            >
              {{ item.content_data.text || "Button Text" }}
            </Button>
          </div>

          <div v-else class="text-sm text-gray-500 italic">
            {{ item.preview_text || "No preview available" }}
          </div>
        </div>

        <!-- Tags -->
        <div v-if="item.tags && item.tags.length > 0" class="mb-3">
          <div class="flex flex-wrap gap-1">
            <Badge
              v-for="tag in item.tags.slice(0, 3)"
              :key="tag"
              variant="outline"
              class="text-xs"
            >
              {{ tag }}
            </Badge>
            <Badge
              v-if="item.tags.length > 3"
              variant="outline"
              class="text-xs"
            >
              +{{ item.tags.length - 3 }}
            </Badge>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-between text-xs text-gray-500">
          <span>{{ item.category }}</span>
          <div class="flex items-center space-x-2">
            <Icon name="lucide:eye" class="w-3 h-3" />
            <span>{{ item.usage_count || 0 }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <Icon
        name="lucide:folder-open"
        class="w-16 h-16 text-gray-400 mx-auto mb-4"
      />
      <h3 class="text-lg font-medium text-gray-900 mb-2">
        {{
          searchQuery || selectedContentType || selectedCategory
            ? "No content found"
            : "No content in library"
        }}
      </h3>
      <p class="text-gray-600 mb-6">
        {{
          searchQuery || selectedContentType || selectedCategory
            ? "Try adjusting your filters"
            : "Add reusable content blocks to get started"
        }}
      </p>
      <Button @click="showCreateDialog = true">
        <Icon name="lucide:plus" class="w-4 h-4 mr-2" />
        Add Your First Content
      </Button>
    </div>

    <!-- Create Content Dialog -->
    <Dialog v-model:open="showCreateDialog">
      <DialogContent class="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Content to Library</DialogTitle>
          <DialogDescription>
            Create reusable content that can be used across newsletters
          </DialogDescription>
        </DialogHeader>

        <form @submit.prevent="createContent" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="content-title">Title</Label>
              <Input
                id="content-title"
                v-model="newContentForm.title"
                placeholder="Content title"
                required
              />
            </div>

            <div class="space-y-2">
              <Label for="content-type">Content Type</Label>
              <Select v-model="newContentForm.content_type" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text Block</SelectItem>
                  <SelectItem value="hero">Hero Section</SelectItem>
                  <SelectItem value="button">Button</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="html">HTML Block</SelectItem>
                  <SelectItem value="social">Social Links</SelectItem>
                  <SelectItem value="footer">Footer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="content-category">Category</Label>
              <Select v-model="newContentForm.category">
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="announcement">Announcement</SelectItem>
                  <SelectItem value="template">Template</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="space-y-2">
              <Label for="content-tags">Tags (comma separated)</Label>
              <Input
                id="content-tags"
                v-model="tagsInput"
                placeholder="tag1, tag2, tag3"
              />
            </div>
          </div>

          <div class="space-y-2">
            <Label for="content-preview">Preview Text</Label>
            <Textarea
              id="content-preview"
              v-model="newContentForm.preview_text"
              placeholder="Brief description of this content"
              rows="2"
            />
          </div>

          <!-- Dynamic content fields based on type -->
          <div v-if="newContentForm.content_type === 'text'" class="space-y-2">
            <Label>Content</Label>
            <TiptapEditor
              v-model="newContentForm.content_data.text"
              placeholder="Enter your text content..."
            />
          </div>

          <div
            v-else-if="newContentForm.content_type === 'button'"
            class="grid grid-cols-2 gap-4"
          >
            <div class="space-y-2">
              <Label for="button-text">Button Text</Label>
              <Input
                id="button-text"
                v-model="newContentForm.content_data.text"
                placeholder="Click here"
              />
            </div>
            <div class="space-y-2">
              <Label for="button-url">Button URL</Label>
              <Input
                id="button-url"
                v-model="newContentForm.content_data.url"
                placeholder="https://example.com"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              @click="showCreateDialog = false"
            >
              Cancel
            </Button>
            <Button type="submit" :disabled="isCreating">
              {{ isCreating ? "Creating..." : "Add to Library" }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { toast } from "vue-sonner";
import type { ContentLibrary } from "../../types/newsletter";

interface Props {
  onSelect?: (content: ContentLibrary) => void;
}

interface Emits {
  (e: "select", content: ContentLibrary): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// State
const contentItems = ref<ContentLibrary[]>([]);
const isLoading = ref(false);
const isCreating = ref(false);
const searchQuery = ref("");
const selectedContentType = ref("");
const selectedCategory = ref("");
const showCreateDialog = ref(false);
const tagsInput = ref("");

// Form data
const newContentForm = ref({
  title: "",
  content_type: "",
  category: "",
  preview_text: "",
  content_data: {} as Record<string, any>,
  tags: [] as string[],
  is_global: true,
});

// Composables
const {
  readItemsCached,
  batchCreate,
  batchUpdate,
  batchDelete,
  search,
  count,
  uploadFile,
  getFileUrl,
  testConnection,
} = useDirectus();

// Computed
const filteredContent = computed(() => {
  let filtered = contentItems.value;

  if (selectedContentType.value) {
    filtered = filtered.filter(
      (item) => item.content_type === selectedContentType.value
    );
  }

  if (selectedCategory.value) {
    filtered = filtered.filter(
      (item) => item.category === selectedCategory.value
    );
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.preview_text?.toLowerCase().includes(query) ||
        item.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  }

  return filtered.sort((a, b) => b.usage_count - a.usage_count);
});

// Methods
const fetchContent = async () => {
  try {
    isLoading.value = true;

    const response = await readItemsCached(
      "content_library",
      {
        fields: ["*"],
        sort: ["-usage_count", "-created_at"],
      },
      "content-library-list"
    );

    contentItems.value = response as ContentLibrary[];
  } catch (error) {
    console.error("Failed to fetch content:", error);
    toast.error("Failed to load content library");
  } finally {
    isLoading.value = false;
  }
};

const refreshContent = () => {
  fetchContent();
};

const createContent = async () => {
  try {
    isCreating.value = true;

    // Parse tags
    const tags = tagsInput.value
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    const contentData = {
      ...newContentForm.value,
      tags,
      usage_count: 0,
      created_at: new Date().toISOString(),
    };

    const response = await batchCreate("content_library", [contentData]);

    contentItems.value.unshift(response[0] as ContentLibrary);

    // Reset form
    newContentForm.value = {
      title: "",
      content_type: "",
      category: "",
      preview_text: "",
      content_data: {},
      tags: [],
      is_global: true,
    };
    tagsInput.value = "";

    showCreateDialog.value = false;
    toast.success("Content added to library");
  } catch (error) {
    console.error("Failed to create content:", error);
    toast.error("Failed to add content");
  } finally {
    isCreating.value = false;
  }
};

const selectContent = (content: ContentLibrary) => {
  // Increment usage count
  incrementUsage(content.id);

  // Emit selection
  emit("select", content);
  props.onSelect?.(content);
};

const editContent = (content: ContentLibrary) => {
  // Open edit dialog or navigate to edit page
  console.log("Edit content:", content);
};

const duplicateContent = async (content: ContentLibrary) => {
  try {
    const duplicated = {
      ...content,
      title: `${content.title} (Copy)`,
      usage_count: 0,
    };

    delete (duplicated as any).id;
    delete (duplicated as any).created_at;
    delete (duplicated as any).updated_at;

    const response = await batchCreate("content_library", [duplicated]);

    contentItems.value.unshift(response[0] as ContentLibrary);
    toast.success("Content duplicated");
  } catch (error) {
    console.error("Failed to duplicate content:", error);
    toast.error("Failed to duplicate content");
  }
};

const deleteContent = async (content: ContentLibrary) => {
  try {
    await batchDelete("content_library", [content.id]);
    contentItems.value = contentItems.value.filter(
      (item) => item.id !== content.id
    );
    toast.success("Content deleted");
  } catch (error) {
    console.error("Failed to delete content:", error);
    toast.error("Failed to delete content");
  }
};

const incrementUsage = async (contentId: number) => {
  try {
    const content = contentItems.value.find((item) => item.id === contentId);
    if (!content) return;

    await batchUpdate("content_library", [
      {
        id: contentId,
        data: { usage_count: content.usage_count + 1 },
      },
    ]);

    content.usage_count += 1;
  } catch (error) {
    console.warn("Failed to increment usage count:", error);
  }
};

// Helper functions
const getContentTypeIcon = (type: string): string => {
  const icons: Record<string, string> = {
    text: "lucide:type",
    hero: "lucide:layout",
    button: "lucide:mouse-pointer-click",
    image: "lucide:image",
    html: "lucide:code",
    social: "lucide:share-2",
    footer: "lucide:layout-footer",
  };
  return icons[type] || "lucide:file";
};

const getContentTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    text: "bg-blue-500",
    hero: "bg-purple-500",
    button: "bg-green-500",
    image: "bg-orange-500",
    html: "bg-red-500",
    social: "bg-pink-500",
    footer: "bg-gray-500",
  };
  return colors[type] || "bg-gray-500";
};

const getTextPreview = (contentData: any): string => {
  if (contentData.text) {
    return contentData.text.replace(/<[^>]*>/g, "").substring(0, 100) + "...";
  }
  return "No preview available";
};

// Lifecycle
onMounted(() => {
  fetchContent();
});
</script>

<style scoped>
.content-library {
  padding: 1.5rem;
}

.content-item {
  transition: all 0.2s ease;
}

.content-item:hover {
  border-color: #3b82f6;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
