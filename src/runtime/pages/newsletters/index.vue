<!-- pages/newsletters/index.vue -->
<template>
  <div class="min-h-screen bg-gray-50">
    <NewsletterDashboard />
  </div>
</template>

<script setup lang="ts">
// Page metadata
definePageMeta({
  title: "Newsletters",
  description: "Manage your email newsletters",
});

// SEO
useSeoMeta({
  title: "Newsletter Dashboard",
  description: "Create and manage email newsletters with drag-and-drop blocks",
});
</script>
