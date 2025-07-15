<!-- Simple test for enhanced debug preview -->
<template>
  <div class="test-page">
    <div class="header">
      <h1>Enhanced Debug Test</h1>
      <button @click="loadData" class="btn-primary">Load Test Data</button>
    </div>
    
    <!-- Enhanced Debug Component -->
     <DebugNewsletterPreview 
      :newsletter="newsletter"
      :block-types="blockTypes"
      device="desktop"
      @update:compiled="handleCompiled"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'

const newsletter = ref({
  subject: 'Test Newsletter',
  preheader: 'Test preview text',
  blocks: []
})

// Mock block types with actual MJML templates
const blockTypes = ref([
  {
    id: 2,
    name: 'Text Block',
    slug: 'text',
    mjml_template: '<mj-section><mj-column><mj-text>{{text}}</mj-text></mj-column></mj-section>'
  },
  {
    id: 4,
    name: 'Button',
    slug: 'button',
    mjml_template: '<mj-section><mj-column><mj-button href="{{url}}">{{text}}</mj-button></mj-column></mj-section>'
  }
])

const loadData = () => {
  newsletter.value = {
    subject: 'Test Newsletter Subject',
    preheader: 'This is a test newsletter preview text',
    blocks: [
      {
        id: 'block_1',
        type: 'text',
        block_type: 'text',
        content: {
          text: 'Welcome to our newsletter! This is a sample text block.'
        },
        sort: 0
      },
      {
        id: 'block_2',
        type: 'button',
        block_type: 'button',
        content: {
          text: 'Click Me',
          url: 'https://example.com'
        },
        sort: 1
      }
    ]
  }
}

const handleCompiled = (compiled) => {
  console.log('Compilation result:', compiled)
}
</script>

<style scoped>
  @reference 'tailwindcss';
.test-page {
  @apply min-h-screen bg-gray-50;
}

.header {
  @apply bg-white border-b border-gray-200 p-4 flex items-center justify-between;
}

.header h1 {
  @apply text-xl font-bold;
}

.btn-primary {
  @apply bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700;
}
</style>