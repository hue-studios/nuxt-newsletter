<template>
  <div>
    <h1>Newsletter Module Test</h1>
    <NewsletterEditor v-model="newsletter" />
  </div>
</template>

<script setup>
const newsletter = ref({
  subject: 'Test Newsletter',
  blocks: []
})
</script>