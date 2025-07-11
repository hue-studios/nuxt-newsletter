<template>
  <component 
    :is="blockComponent"
    v-if="blockComponent"
    :block="block"
    :styling="stylingMode"
    @update="handleUpdate"
  />
  <div v-else class="unknown-block">
    Unknown block type: {{ block.type }}
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue';
import { useNewsletter } from '../composables/useNewsletter';
import type { NewsletterBlock } from '../composables/useNewsletterEditor';

interface Props {
  block: NewsletterBlock
}

const props = defineProps<Props>()

const emit = defineEmits<{
  update: [updates: Partial<NewsletterBlock>]
}>()

const { stylingMode } = useNewsletter()

// Dynamically load block components based on type
const blockComponents = {
  text: defineAsyncComponent(() => import('./blocks/TextBlock.vue')),
  image: defineAsyncComponent(() => import('./blocks/ImageBlock.vue')),
  button: defineAsyncComponent(() => import('./blocks/ButtonBlock.vue')),
  divider: defineAsyncComponent(() => import('./blocks/DividerBlock.vue')),
  columns: defineAsyncComponent(() => import('./blocks/ColumnsBlock.vue'))
}

const blockComponent = computed(() => {
  return blockComponents[props.block.type as keyof typeof blockComponents]
})

const handleUpdate = (updates: Partial<NewsletterBlock>) => {
  emit('update', updates)
}
</script>

<style scoped>
.unknown-block {
  padding: 1rem;
  background-color: #fee;
  border: 1px solid #fcc;
  border-radius: 4px;
  color: #c00;
}
</style>