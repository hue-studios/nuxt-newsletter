<template>
  <div class="newsletters-page">
    <NewsletterList
      :newsletters="newsletters"
      :is-loading="pending"
      @select="handleNewsletterSelect"
      @create="handleCreateNewsletter"
    />
  </div>
</template>

<script setup>
// Page meta
// definePageMeta({
//   title: "Newsletters",
//   requiresAuth: true, // If using middleware
// });

// Fetch newsletters from Directus
const {
  data: newsletters,
  pending,
  refresh,
} = await useLazyFetch("/api/newsletters", {
  default: () => [],
});

// Handle newsletter selection - navigate to edit page
const handleNewsletterSelect = (newsletter) => {
  navigateTo(`/newsletters/${newsletter.id}/edit`);
};

// Handle create new newsletter - navigate to create page
const handleCreateNewsletter = () => {
  navigateTo("/newsletters/create");
};

// Refresh data when returning to this page
onMounted(() => {
  refresh();
});
</script>
