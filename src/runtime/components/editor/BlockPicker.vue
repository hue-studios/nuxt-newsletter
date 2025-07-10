<!-- components/BlockPicker.vue -->
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

    <!-- Categories -->
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
            @click="$emit('select', blockType)"
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
            </div>
          </div>
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
      <p class="text-gray-600">Try a different search term</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
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

// Computed
const filteredCategories = computed(() => {
  const categories = new Map();

  // Filter block types by search query
  const filteredBlocks = props.blockTypes.filter((blockType) => {
    if (!searchQuery.value) return true;

    const query = searchQuery.value.toLowerCase();
    const isDescriptionMatch = blockType.description
      ? blockType.description.toLowerCase().includes(query)
      : false;

    return (
      blockType.name.toLowerCase().includes(query) ||
      isDescriptionMatch ||
      blockType.category.toLowerCase().includes(query)
    );
  });

  // Group by category
  filteredBlocks.forEach((blockType) => {
    const category = blockType.category || "content";
    if (!categories.has(category)) {
      categories.set(category, {
        name: category.charAt(0).toUpperCase() + category.slice(1),
        blocks: [],
      });
    }
    categories.get(category).blocks.push(blockType);
  });

  return Array.from(categories.values());
});
</script>

<style scoped>
.block-type-card:hover {
  transform: translateY(-1px);
}
</style>
