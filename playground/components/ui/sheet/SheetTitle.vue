<script setup lang="ts">
import { cn } from '@/lib/utils'
import { DialogTitle  } from 'reka-ui'
import type {DialogTitleProps} from 'reka-ui';
import { computed  } from 'vue'
import type {HTMLAttributes} from 'vue';

const props = defineProps<DialogTitleProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props

  return delegated
})
</script>

<template>
  <DialogTitle
    data-slot="sheet-title"
    :class="cn('text-foreground font-semibold', props.class)"
    v-bind="delegatedProps"
  >
    <slot />
  </DialogTitle>
</template>
