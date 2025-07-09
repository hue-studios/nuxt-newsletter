<template>
  <div class="template-browser">
    <div class="browser-header">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search templates..."
      />
      <select v-model="selectedCategory">
        <option value="all">All Categories</option>
        <option value="marketing">Marketing</option>
        <option value="newsletter">Newsletter</option>
        <option value="announcement">Announcement</option>
      </select>
    </div>

    <div class="template-grid">
      <div
        v-for="template in filteredTemplates"
        :key="template.id"
        class="template-card"
        @click="selectTemplate(template)"
      >
        <div class="template-preview">
          <img
            v-if="template.thumbnail_url"
            :src="template.thumbnail_url"
            :alt="template.name"
          />
          <div v-else class="placeholder-preview">Preview</div>
        </div>
        <h3>{{ template.name }}</h3>
        <p>{{ template.description }}</p>
        <div class="template-tags">
          <span v-for="tag in template.tags" :key="tag" class="tag">
            {{ tag }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { NewsletterTemplate } from "../../types/newsletter";

const props = defineProps<{
  templates: NewsletterTemplate[];
}>();

const emit = defineEmits<{
  select: [template: NewsletterTemplate];
}>();

// Reactive state
const searchQuery = ref("");
const selectedCategory = ref("all");

// Computed properties
const filteredTemplates = computed(() => {
  let filtered = props.templates;

  // Category filter
  if (selectedCategory.value !== "all") {
    filtered = filtered.filter((t) => t.category === selectedCategory.value);
  }

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query) ||
        (t.tags &&
          t.tags.some((tag: string) => tag.toLowerCase().includes(query)))
    );
  }

  return filtered;
});

// Methods
const selectTemplate = (template: NewsletterTemplate) => {
  emit("select", template);
};
</script>
