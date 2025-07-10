<template>
  <div>
    <NewsletterList
      :show-filters="true"
      @newsletter-selected="navigateTo(`/${$event.id}`)"
    />
  </div>
</template>
<script setup>
const selectedNewsletter = ref(null);

function handleNewsletterSelect(newsletter) {
  selectedNewsletter.value = newsletter;
}
</script>
