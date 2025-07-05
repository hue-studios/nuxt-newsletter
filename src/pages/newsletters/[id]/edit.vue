<template>
  <div class="min-h-screen">
    <!-- Loading State -->
    <div v-if="pending" class="flex items-center justify-center h-screen">
      <div class="text-center">
        <Icon
          name="lucide:loader-2"
          class="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4"
        />
        <p class="text-gray-600">Loading newsletter...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex items-center justify-center h-screen">
      <div class="text-center">
        <Icon
          name="lucide:alert-circle"
          class="w-8 h-8 text-red-500 mx-auto mb-4"
        />
        <h2 class="text-lg font-semibold text-gray-900 mb-2">
          Error loading newsletter
        </h2>
        <p class="text-gray-600 mb-4">{{ error.message }}</p>
        <Button @click="refresh()">
          <Icon name="lucide:refresh-cw" class="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    </div>

    <!-- Newsletter Editor -->
    <NewsletterEditor
      v-else-if="newsletter"
      :newsletter="newsletter"
      @back="navigateTo('/newsletters')"
      @update="handleNewsletterUpdate"
    />
  </div>
</template>

<script setup lang="ts">
import type { Newsletter } from "~/types/newsletter";

// Route params
const route = useRoute();
const newsletterId = computed(() => parseInt(route.params.id as string));

// Composables
const { fetchNewsletter } = useNewsletter();

// Fetch newsletter data
const {
  data: newsletter,
  pending,
  error,
  refresh,
} = await useLazyAsyncData(
  `newsletter-${newsletterId.value}`,
  () => fetchNewsletter(newsletterId.value),
  {
    server: false,
  }
);

// Page metadata
definePageMeta({
  title: "Edit Newsletter",
  description: "Edit your newsletter with drag-and-drop blocks",
});

// SEO
useSeoMeta({
  title: () =>
    newsletter.value ? `Edit: ${newsletter.value.title}` : "Edit Newsletter",
  description: "Edit your newsletter with an intuitive drag-and-drop editor",
});

// Methods
const handleNewsletterUpdate = (updatedNewsletter: Newsletter) => {
  newsletter.value = updatedNewsletter;
};

// Redirect if newsletter not found
watch(error, (newError) => {
  if (newError && newError.statusCode === 404) {
    throw createError({
      statusCode: 404,
      statusMessage: "Newsletter not found",
    });
  }
});
</script>
