<template>
  <NewsletterEditor :newsletter="newsletter" @update="handleUpdate" />
</template>

<script setup>
const route = useRoute();
const newsletterId = route.params.id;
const newsletter = await $fetch("/api/newsletter/" + newsletterId);

const handleUpdate = async (updated) => {
  await $fetch("/api/newsletter/" + newsletterId, {
    method: "PUT",
    body: updated,
  });
};
</script>
