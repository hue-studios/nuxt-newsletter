<template>
  <div class="create-newsletter-page">
    <div class="header">
      <Button variant="outline" @click="goBack">
        <Icon name="arrow-left" class="w-4 h-4 mr-2" />
        Back to Newsletters
      </Button>
      <h1 class="text-3xl font-bold">Create Newsletter</h1>
    </div>

    <NewsletterEditor
      :newsletter="newNewsletter"
      :is-loading="isCreating"
      @save="handleSave"
      @cancel="goBack"
    />
  </div>
</template>

<script setup lang="ts">
import type { Newsletter, CreateNewsletterPayload } from "../types/newsletter";

// Initialize empty newsletter
const newNewsletter = ref<Partial<Newsletter>>({
  title: "",
  subject_line: "",
  content: "",
  status: "draft",
});

const isCreating = ref(false);

// Handle save
const handleSave = async (newsletterData: CreateNewsletterPayload) => {
  try {
    isCreating.value = true;

    const { data } = await $fetch<{ data: Newsletter }>("/api/newsletters", {
      method: "POST",
      body: newsletterData,
    });

    // Show success message
    // useToast().add({
    //   title: "Success",
    //   description: "Newsletter created successfully!",
    //   color: "green",
    // });

    // Navigate to edit page for the new newsletter
    await navigateTo(`/newsletters/${data.id}/edit`);
  } catch (error) {
    console.error("Failed to create newsletter:", error);
    // useToast().add({
    //   title: "Error",
    //   description: "Failed to create newsletter. Please try again.",
    //   color: "red",
    // });
  } finally {
    isCreating.value = false;
  }
};

// Go back to newsletters list
const goBack = () => {
  navigateTo("/newsletters");
};
</script>
