<template>
  <div class="template-browser">
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-semibold text-gray-900">
            Choose a Template
          </h2>
          <p class="text-gray-600 mt-1">
            Start with a pre-designed template or create from scratch
          </p>
        </div>

        <!-- Search -->
        <div class="relative w-64">
          <Icon
            name="lucide:search"
            class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"
          />
          <Input
            v-model="searchQuery"
            placeholder="Search templates..."
            class="pl-10"
          />
        </div>
      </div>
    </div>

    <!-- Categories -->
    <div class="flex space-x-2 mb-6">
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
        {{ category.label }}
      </Button>
    </div>

    <!-- Templates Grid -->
    <div
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
    >
      <!-- Blank Template -->
      <Card
        class="template-card cursor-pointer hover:shadow-lg transition-all group border-2 border-dashed border-gray-300 hover:border-blue-400"
        @click="$emit('select', null)"
      >
        <CardContent class="p-6">
          <div class="flex flex-col items-center justify-center h-40">
            <div
              class="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-50"
            >
              <Icon
                name="lucide:plus"
                class="w-8 h-8 text-gray-500 group-hover:text-blue-500"
              />
            </div>
            <h3 class="font-medium text-gray-900 group-hover:text-blue-700">
              Start from Scratch
            </h3>
            <p class="text-sm text-gray-500 text-center mt-1">
              Create a custom newsletter
            </p>
          </div>
        </CardContent>
      </Card>

      <!-- Template Cards -->
      <Card
        v-for="template in filteredTemplates"
        :key="template.id"
        class="template-card cursor-pointer hover:shadow-lg transition-all group"
        @click="$emit('select', template)"
      >
        <CardContent class="p-0">
          <!-- Preview -->
          <div
            class="aspect-video bg-gray-100 relative overflow-hidden rounded-t-lg"
          >
            <img
              v-if="template.thumbnail_url"
              :src="template.thumbnail_url"
              :alt="template.name"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform"
            >
            <div
              v-else
              class="flex items-center justify-center h-full"
            >
              <Icon
                name="lucide:layout-template"
                class="w-12 h-12 text-gray-400"
              />
            </div>

            <!-- Category Badge -->
            <div class="absolute top-2 left-2">
              <Badge
                variant="secondary"
                class="text-xs"
              >
                {{ getCategoryLabel(template.category) }}
              </Badge>
            </div>
          </div>

          <!-- Content -->
          <div class="p-4">
            <h3
              class="font-medium text-gray-900 group-hover:text-blue-700 mb-1"
            >
              {{ template.name }}
            </h3>
            <p class="text-sm text-gray-600 mb-3 line-clamp-2">
              {{ template.description }}
            </p>

            <!-- Tags -->
            <div class="flex flex-wrap gap-1 mb-3">
              <Badge
                v-for="tag in template.tags.slice(0, 2)"
                :key="tag"
                variant="outline"
                class="text-xs"
              >
                {{ tag }}
              </Badge>
            </div>

            <!-- Usage Count -->
            <div
              class="flex items-center justify-between text-xs text-gray-500"
            >
              <span>Used {{ template.usage_count }} times</span>
              <Icon
                name="lucide:arrow-right"
                class="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Empty State -->
    <div
      v-if="filteredTemplates.length === 0"
      class="text-center py-16"
    >
      <Icon
        name="lucide:search-x"
        class="w-16 h-16 text-gray-400 mx-auto mb-4"
      />
      <h3 class="text-lg font-medium text-gray-900 mb-2">
        No templates found
      </h3>
      <p class="text-gray-600">
        Try adjusting your search or category filter
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { NewsletterTemplate } from "~/types/newsletter";

interface Props {
  templates: NewsletterTemplate[];
}

interface Emits {
  (e: "select", template: NewsletterTemplate | null): void;
}

const props = defineProps<Props>();
defineEmits<Emits>();

// State
const searchQuery = ref("");
const selectedCategory = ref("all");

// Categories
const categories = [
  { value: "all", label: "All Templates" },
  { value: "company", label: "Company News" },
  { value: "product", label: "Product Updates" },
  { value: "weekly", label: "Weekly Digest" },
  { value: "monthly", label: "Monthly Report" },
  { value: "event", label: "Events" },
  { value: "offer", label: "Offers" },
];

// Computed
const filteredTemplates = computed(() => {
  let filtered = props.templates.filter((t) => t.status === "published");

  // Category filter
  if (selectedCategory.value !== "all") {
    filtered = filtered.filter((t) => t.category === selectedCategory.value);
  }

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.name.toLowerCase().includes(query)
        || t.description.toLowerCase().includes(query)
        || t.tags.some((tag) => tag.toLowerCase().includes(query)),
    );
  }

  return filtered.sort((a, b) => b.usage_count - a.usage_count);
});

// Methods
const getCategoryLabel = (category: string) => {
  return categories.find((c) => c.value === category)?.label || category;
};
</script>

<style scoped>
.template-card:hover {
  transform: translateY(-2px);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
