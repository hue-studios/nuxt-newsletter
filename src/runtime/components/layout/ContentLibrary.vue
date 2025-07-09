<template>
  <div class="content-library">
    <div class="library-header">
      <h2>Content Library</h2>
      <button @click="refreshContent">Refresh</button>
    </div>

    <div class="content-grid">
      <div
        v-for="item in contentItems"
        :key="item.id"
        class="content-item"
        @click="selectContent(item)"
      >
        <div class="content-preview">
          <img v-if="item.type === 'image'" :src="item.url" :alt="item.title" />
          <div v-else class="text-preview">{{ item.title }}</div>
        </div>
        <h3>{{ item.title }}</h3>
        <p>{{ item.description }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useDirectus } from "../../composables/utils/useDirectus";

interface ContentItem {
  id: number;
  title: string;
  description?: string;
  type: "image" | "text" | "template";
  url?: string;
  content?: string;
}

const emit = defineEmits<{
  select: [item: ContentItem];
}>();

// Composables
const { directusHelpers } = useDirectus();
const { readItemsCached, batchCreate, batchUpdate, batchDelete } =
  directusHelpers;

// Reactive state
const contentItems = ref<ContentItem[]>([]);
const isLoading = ref(false);

// Methods
const fetchContent = async () => {
  try {
    isLoading.value = true;

    const result = await readItemsCached("content_library");
    if (result.success) {
      contentItems.value = result.data || [];
    }
  } catch (error) {
    console.error("Failed to fetch content:", error);
  } finally {
    isLoading.value = false;
  }
};

const refreshContent = () => {
  fetchContent();
};

const selectContent = (item: ContentItem) => {
  emit("select", item);
};

const createContent = async (items: Partial<ContentItem>[]) => {
  try {
    const result = await batchCreate("content_library", items);
    if (result.success) {
      await fetchContent();
    }
  } catch (error) {
    console.error("Failed to create content:", error);
  }
};

const updateContent = async (items: ContentItem[]) => {
  try {
    const result = await batchUpdate("content_library", items);
    if (result.success) {
      await fetchContent();
    }
  } catch (error) {
    console.error("Failed to update content:", error);
  }
};

const deleteContent = async (ids: number[]) => {
  try {
    const result = await batchDelete("content_library", ids);
    if (result.success) {
      await fetchContent();
    }
  } catch (error) {
    console.error("Failed to delete content:", error);
  }
};

// Lifecycle
onMounted(() => {
  fetchContent();
});

// Expose methods for parent components
defineExpose({
  createContent,
  updateContent,
  deleteContent,
  refreshContent,
});
</script>
