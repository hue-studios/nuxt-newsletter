<template>
  <div class="edit-newsletter-page">
    <div class="header">
      <Button variant="outline" @click="goBack">
        <Icon name="arrow-left" class="w-4 h-4 mr-2" />
        Back to Newsletters
      </Button>
      <div class="flex items-center gap-4">
        <h1 class="text-3xl font-bold">Edit Newsletter</h1>
        <Badge :variant="getBadgeVariant(newsletter?.status)">
          {{ newsletter?.status }}
        </Badge>
      </div>
    </div>

    <div v-if="pending" class="loading">Loading newsletter...</div>

    <div v-else-if="error" class="error">
      <p>Failed to load newsletter. Please try again.</p>
      <Button @click="refresh">Retry</Button>
    </div>

    <NewsletterEditor
      v-else
      :newsletter="newsletter"
      :is-loading="isSaving"
      @save="handleSave"
      @cancel="goBack"
      @delete="handleDelete"
    />
  </div>
</template>

<script setup lang="ts">
import type {
  Newsletter,
  UpdateNewsletterPayload,
} from "../../types/newsletter";

// definePageMeta({
//   title: "Edit Newsletter",
//   requiresAuth: true,
// });

// Get newsletter ID from route
const route = useRoute();
const newsletterId = route.params.id as string;

// Fetch newsletter data
const {
  data: newsletter,
  pending,
  error,
  refresh,
} = await useLazyFetch<Newsletter>(`/api/newsletters/${newsletterId}`);

const isSaving = ref(false);

// Handle save
const handleSave = async (newsletterData: UpdateNewsletterPayload) => {
  try {
    isSaving.value = true;

    await $fetch(`/api/newsletters/${newsletterId}`, {
      method: "PATCH",
      body: newsletterData,
    });

    // Refresh the data
    await refresh();

    // useToast().add({
    //   title: "Success",
    //   description: "Newsletter updated successfully!",
    //   color: "green",
    // });
  } catch (error) {
    console.error("Failed to update newsletter:", error);
    // useToast().add({
    //   title: "Error",
    //   description: "Failed to update newsletter. Please try again.",
    //   color: "red",
    // });
  } finally {
    isSaving.value = false;
  }
};

// Handle delete
const handleDelete = async () => {
  if (
    !confirm(
      "Are you sure you want to delete this newsletter? This action cannot be undone.",
    )
  ) {
    return;
  }

  try {
    await $fetch(`/api/newsletters/${newsletterId}`, {
      method: "DELETE",
    });

    useToast().add({
      title: "Success",
      description: "Newsletter deleted successfully!",
      color: "green",
    });

    // Navigate back to list
    await navigateTo("/newsletters");
  } catch (error) {
    console.error("Failed to delete newsletter:", error);
    useToast().add({
      title: "Error",
      description: "Failed to delete newsletter. Please try again.",
      color: "red",
    });
  }
};

// Get badge variant based on status
const getBadgeVariant = (status?: string) => {
  switch (status) {
    case "published":
      return "default";
    case "draft":
      return "secondary";
    case "scheduled":
      return "outline";
    default:
      return "secondary";
  }
};

// Go back to newsletters list
const goBack = () => {
  navigateTo("/newsletters");
};

// Update page title
watch(newsletter, (newNewsletter) => {
  if (newNewsletter?.title) {
    useHead({
      title: `Edit: ${newNewsletter.title}`,
    });
  }
});
</script>
