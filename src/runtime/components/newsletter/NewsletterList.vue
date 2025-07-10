<!-- src/runtime/components/newsletter/NewsletterList.vue -->
<template>
  <div class="newsletter-list">
    <div class="header">
      <h2>Newsletters</h2>
      <Button @click="createNew">Create Newsletter</Button>
    </div>

    <div v-if="isLoading" class="loading">Loading newsletters...</div>

    <div v-else-if="newsletters.length === 0" class="empty">
      <p>No newsletters found. Create your first newsletter!</p>
    </div>

    <div v-else class="grid">
      <div
        v-for="newsletter in newsletters"
        :key="newsletter.id"
        class="newsletter-card"
        @click="$emit('select', newsletter)"
      >
        <h3>{{ newsletter.title }}</h3>
        <p>{{ newsletter.subject_line }}</p>
        <div class="meta">
          <span class="status">{{ newsletter.status }}</span>
          <span class="date">{{ formatDate(newsletter.updated_at) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Newsletter } from "../../types/newsletter";

interface Props {
  newsletters?: Newsletter[];
  isLoading?: boolean;
}

interface Emits {
  (e: "select", newsletter: Newsletter): void;
  (e: "create"): void;
}

const props = withDefaults(defineProps<Props>(), {
  newsletters: () => [],
  isLoading: false,
});

const emit = defineEmits<Emits>();

const createNew = () => {
  emit("create");
};

const getUpdatedDate = (newsletter: Newsletter): string => {
  return (
    newsletter.updated_at ||
    newsletter.date_updated ||
    newsletter.date_created ||
    new Date().toISOString()
  );
};

const formatDate = (date?: string) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString();
};
</script>

<style scoped>
.newsletter-list {
  @apply p-6;
}

.header {
  @apply flex justify-between items-center mb-6;
}

.header h2 {
  @apply text-2xl font-bold;
}

.loading,
.empty {
  @apply text-center py-12 text-gray-500;
}

.grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6;
}

.newsletter-card {
  @apply p-4 border rounded-lg cursor-pointer hover:shadow-md transition-shadow;
}

.newsletter-card h3 {
  @apply font-semibold mb-2;
}

.newsletter-card p {
  @apply text-gray-600 mb-3;
}

.meta {
  @apply flex justify-between text-sm text-gray-500;
}

.status {
  @apply px-2 py-1 rounded text-xs font-medium bg-gray-100;
}
</style>
