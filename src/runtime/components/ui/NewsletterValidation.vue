<template>
  <div
    v-if="validationSummary.hasErrors || validationSummary.hasWarnings"
    class="newsletter-validation"
  >
    <Card
      :class="{
        'border-red-200 bg-red-50': validationSummary.hasErrors,
        'border-yellow-200 bg-yellow-50':
          !validationSummary.hasErrors && validationSummary.hasWarnings,
      }"
    >
      <CardContent class="p-4">
        <div class="flex items-start space-x-3">
          <Icon
            :name="
              validationSummary.hasErrors
                ? 'lucide:alert-circle'
                : 'lucide:alert-triangle'
            "
            :class="{
              'text-red-600': validationSummary.hasErrors,
              'text-yellow-600':
                !validationSummary.hasErrors && validationSummary.hasWarnings,
            }"
            class="w-5 h-5 mt-0.5"
          />

          <div class="flex-1">
            <h4
              class="font-medium"
              :class="{
                'text-red-900': validationSummary.hasErrors,
                'text-yellow-900':
                  !validationSummary.hasErrors && validationSummary.hasWarnings,
              }"
            >
              {{ validationSummary.summary }}
            </h4>

            <div class="mt-3 space-y-2">
              <div
                v-for="error in errors"
                :key="`${error.field}-${error.message}`"
                class="flex items-start space-x-2 text-sm"
                :class="{
                  'text-red-800': error.severity === 'error',
                  'text-yellow-800': error.severity === 'warning',
                }"
              >
                <Icon
                  :name="
                    error.severity === 'error'
                      ? 'lucide:x-circle'
                      : 'lucide:info'
                  "
                  class="w-4 h-4 mt-0.5 flex-shrink-0"
                />
                <div>
                  <span class="font-medium"
                    >{{ getFieldLabel(error.field) }}:</span
                  >
                  {{ error.message }}
                </div>
              </div>
            </div>

            <div v-if="validationSummary.hasErrors" class="mt-4">
              <Button
                variant="outline"
                size="sm"
                @click="validateAgain"
                :disabled="isValidating"
              >
                <Icon
                  name="lucide:refresh-cw"
                  class="w-4 h-4 mr-2"
                  :class="{ 'animate-spin': isValidating }"
                />
                Check Again
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import type { ValidationError } from "~/utils/newsletter-validation";
import { getValidationSummary } from "~/utils/newsletter-validation";

interface Props {
  errors: ValidationError[];
}

interface Emits {
  (e: "validate"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const isValidating = ref(false);

const validationSummary = computed(() => getValidationSummary(props.errors));

const validateAgain = async () => {
  isValidating.value = true;
  try {
    await new Promise((resolve) => setTimeout(resolve, 500));
    emit("validate");
  } finally {
    isValidating.value = false;
  }
};

const getFieldLabel = (field: string): string => {
  const fieldLabels: Record<string, string> = {
    title: "Title",
    subject_line: "Subject Line",
    from_email: "From Email",
    from_name: "From Name",
    preview_text: "Preview Text",
    blocks: "Content Blocks",
    mailing_list_id: "Mailing List",
    compiled_html: "Compilation",
  };

  // Handle block-specific fields
  if (field.includes("blocks[")) {
    const match = field.match(/blocks\[(\d+)\]\.(.+)/);
    if (match) {
      const blockIndex = parseInt(match[1]);
      const blockField = match[2];
      return `Block ${blockIndex + 1} ${blockField.replace("_", " ")}`;
    }
  }

  return fieldLabels[field] || field.replace("_", " ");
};
</script>
