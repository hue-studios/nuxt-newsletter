<!-- src/runtime/components/editor/BlockPicker.vue -->
<template>
  <div class="block-picker">
    <!-- Search -->
    <div class="mb-6">
      <div class="relative">
        <Icon
          name="lucide:search"
          class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"
        />
        <Input
          v-model="searchQuery"
          placeholder="Search block types..."
          class="pl-10"
        />
      </div>
    </div>

    <!-- Category Filter -->
    <div class="mb-6">
      <div class="flex flex-wrap gap-2">
        <Button
          v-for="category in categories"
          :key="category.value"
          variant="outline"
          size="sm"
          :class="{
            'bg-blue-50 border-blue-200 text-blue-700':
              selectedCategory === category.value,
          }"
          @click="selectedCategory = category.value"
        >
          <Icon :name="category.icon" class="w-4 h-4 mr-1" />
          {{ category.label }}
        </Button>
      </div>
    </div>

    <!-- Block Categories -->
    <div class="space-y-6">
      <div
        v-for="category in filteredCategories"
        :key="category.name"
        class="space-y-4"
      >
        <h3 class="text-sm font-medium text-gray-700 uppercase tracking-wide">
          {{ category.name }} ({{ category.blocks.length }})
        </h3>

        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div
            v-for="blockType in category.blocks"
            :key="blockType.id"
            class="block-type-card group cursor-pointer border border-gray-200 rounded-lg p-4 hover:border-blue-400 hover:shadow-md transition-all"
            @click="selectBlock(blockType)"
          >
            <div class="flex flex-col items-center text-center space-y-3">
              <!-- Icon -->
              <div
                class="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-blue-50 transition-colors"
              >
                <Icon
                  :name="blockType.icon || 'lucide:square'"
                  class="w-6 h-6 text-gray-600 group-hover:text-blue-600"
                />
              </div>

              <!-- Name -->
              <div>
                <h4 class="font-medium text-gray-900 group-hover:text-blue-700">
                  {{ blockType.name }}
                </h4>
                <p class="text-xs text-gray-600 mt-1 leading-tight">
                  {{ blockType.description }}
                </p>
              </div>

              <!-- Category Badge -->
              <Badge variant="secondary" class="text-xs">
                {{ blockType.category }}
              </Badge>

              <!-- Preview Button -->
              <Button
                variant="ghost"
                size="sm"
                class="opacity-0 group-hover:opacity-100 transition-opacity"
                @click.stop="previewBlock(blockType)"
              >
                <Icon name="lucide:eye" class="w-3 h-3 mr-1" />
                Preview
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Popular Blocks Section -->
    <div
      v-if="popularBlocks.length > 0"
      class="mt-8 pt-6 border-t border-gray-200"
    >
      <h3
        class="text-sm font-medium text-gray-700 uppercase tracking-wide mb-4"
      >
        Popular Blocks
      </h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div
          v-for="blockType in popularBlocks"
          :key="`popular-${blockType.id}`"
          class="flex items-center space-x-2 p-2 border border-gray-200 rounded cursor-pointer hover:bg-gray-50"
          @click="selectBlock(blockType)"
        >
          <Icon
            :name="blockType.icon || 'lucide:square'"
            class="w-4 h-4 text-gray-600"
          />
          <span class="text-sm font-medium text-gray-900">{{
            blockType.name
          }}</span>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="filteredCategories.length === 0" class="text-center py-12">
      <Icon
        name="lucide:search-x"
        class="w-16 h-16 text-gray-400 mx-auto mb-4"
      />
      <h3 class="text-lg font-medium text-gray-900 mb-2">No blocks found</h3>
      <p class="text-gray-600">Try a different search term or category</p>
      <Button variant="outline" class="mt-4" @click="clearFilters">
        <Icon name="lucide:refresh-cw" class="w-4 h-4 mr-2" />
        Clear Filters
      </Button>
    </div>

    <!-- Block Preview Modal -->
    <Dialog v-model:open="showPreview">
      <DialogContent class="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{{ previewBlockType?.name }} Preview</DialogTitle>
          <DialogDescription>
            {{ previewBlockType?.description }}
          </DialogDescription>
        </DialogHeader>

        <div v-if="previewBlockType" class="space-y-4">
          <!-- Block Preview -->
          <div class="border border-gray-200 rounded-lg p-6 bg-gray-50">
            <div
              class="bg-white rounded p-4 min-h-[200px] flex items-center justify-center"
            >
              <!-- Mock preview based on block type -->
              <div v-if="previewBlockType.slug === 'hero'" class="text-center">
                <h2 class="text-2xl font-bold text-gray-900 mb-2">
                  Hero Title
                </h2>
                <p class="text-gray-600 mb-4">Hero subtitle text goes here</p>
                <div
                  class="inline-block bg-blue-600 text-white px-4 py-2 rounded"
                >
                  Call to Action
                </div>
              </div>

              <div v-else-if="previewBlockType.slug === 'text'" class="prose">
                <p>
                  This is a sample text block with
                  <strong>rich formatting</strong> support.
                </p>
                <p>You can add paragraphs, lists, and other content here.</p>
              </div>

              <div
                v-else-if="previewBlockType.slug === 'image'"
                class="text-center"
              >
                <div
                  class="w-32 h-24 bg-gray-200 rounded mb-2 mx-auto flex items-center justify-center"
                >
                  <Icon name="lucide:image" class="w-8 h-8 text-gray-400" />
                </div>
                <p class="text-sm text-gray-600">Image caption goes here</p>
              </div>

              <div
                v-else-if="previewBlockType.slug === 'button'"
                class="text-center"
              >
                <div
                  class="inline-block bg-blue-600 text-white px-6 py-3 rounded"
                >
                  Button Text
                </div>
              </div>

              <div v-else class="text-center text-gray-500">
                <Icon name="lucide:layout" class="w-12 h-12 mx-auto mb-2" />
                <p>{{ previewBlockType.name }} Block</p>
              </div>
            </div>
          </div>

          <!-- Block Details -->
          <div class="space-y-3">
            <div>
              <h4 class="font-medium text-gray-900">Category</h4>
              <Badge variant="outline">
                {{ previewBlockType.category }}
              </Badge>
            </div>

            <div>
              <h4 class="font-medium text-gray-900">Available Fields</h4>
              <div class="flex flex-wrap gap-1 mt-1">
                <Badge
                  v-for="field in previewBlockType.field_visibility_config"
                  :key="field"
                  variant="secondary"
                  class="text-xs"
                >
                  {{ formatFieldName(field) }}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="showPreview = false">
            Close
          </Button>
          <Button @click="selectBlock(previewBlockType!)">
            <Icon name="lucide:plus" class="w-4 h-4 mr-2" />
            Add This Block
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { BlockType } from "../../types/newsletter";

interface Props {
  blockTypes: BlockType[];
}

interface Emits {
  (e: "select", blockType: BlockType): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// State
const searchQuery = ref("");
const selectedCategory = ref("all");
const showPreview = ref(false);
const previewBlockType = ref<BlockType | null>(null);

// Categories configuration
const categories = [
  { value: "all", label: "All Blocks", icon: "lucide:grid-3x3" },
  { value: "content", label: "Content", icon: "lucide:type" },
  { value: "layout", label: "Layout", icon: "lucide:layout" },
  { value: "media", label: "Media", icon: "lucide:image" },
  {
    value: "interactive",
    label: "Interactive",
    icon: "lucide:mouse-pointer-click",
  },
];

// Computed
const filteredCategories = computed(() => {
  const categoryMap = new Map();

  // Filter block types by search query and category
  const filteredBlocks = props.blockTypes.filter(
    (blockType: {
      name: string;
      description: string;
      category: string;
      status: string;
    }) => {
      // Search filter
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        const matches =
          blockType.name.toLowerCase().includes(query) ||
          blockType.description.toLowerCase().includes(query) ||
          blockType.category.toLowerCase().includes(query);
        if (!matches) return false;
      }

      // Category filter
      if (
        selectedCategory.value !== "all" &&
        blockType.category !== selectedCategory.value
      ) {
        return false;
      }

      return blockType.status === "published";
    }
  );

  // Group by category
  filteredBlocks.forEach((blockType: { category: string }) => {
    const category = blockType.category || "content";
    if (!categoryMap.has(category)) {
      categoryMap.set(category, {
        name: category.charAt(0).toUpperCase() + category.slice(1),
        blocks: [],
      });
    }
    categoryMap.get(category).blocks.push(blockType);
  });

  return Array.from(categoryMap.values());
});

const popularBlocks = computed(() => {
  // Define popular block types (could be based on usage statistics)
  const popularSlugs = ["hero", "text", "image", "button"];

  return props.blockTypes
    .filter(
      (bt: { slug: string; status: string }) =>
        popularSlugs.includes(bt.slug) && bt.status === "published"
    )
    .sort(
      (a: { slug: string }, b: { slug: string }) =>
        popularSlugs.indexOf(a.slug) - popularSlugs.indexOf(b.slug)
    );
});

// Methods
const selectBlock = (blockType: BlockType) => {
  emit("select", blockType);
  showPreview.value = false;
};

const previewBlock = (blockType: BlockType) => {
  previewBlockType.value = blockType;
  showPreview.value = true;
};

const clearFilters = () => {
  searchQuery.value = "";
  selectedCategory.value = "all";
};

const formatFieldName = (field: string) => {
  return field.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};
</script>

<style scoped>
.block-type-card:hover {
  transform: translateY(-1px);
}

.block-type-card .opacity-0 {
  transition: opacity 0.2s ease;
}
</style>
