<template>
  <div>
    Nuxt module playground!
    <NewsletterList
      :show-filters="true"
      :show-stats="true"
      @newsletter-selected="handleNewsletterSelect"
    />
    <NewsletterEditor
      v-if="selectedNewsletter"
      :newsletter="selectedNewsletter"
      @content-change="handleContentChange"
    />
  </div>
</template>
<script setup>
const selectedNewsletter = ref(null);

function handleNewsletterSelect(newsletter) {
  selectedNewsletter.value = newsletter;
}
</script>
