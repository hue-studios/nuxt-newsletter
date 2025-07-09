<template>
  <div class="newsletter-validation">
    <div v-if="isValidating" class="validation-loading">Validating...</div>

    <div
      v-if="validationSummary && !validationSummary.isValid"
      class="validation-errors"
    >
      <h3>Validation Issues ({{ validationSummary.totalErrors }})</h3>

      <div v-if="validationSummary.criticalErrors > 0" class="critical-errors">
        <h4>Critical Issues ({{ validationSummary.criticalErrors }})</h4>
        <div
          v-for="(
            categoryErrors, category
          ) in validationSummary.errorsByCategory"
          :key="category"
          class="error-category"
        >
          <h5>{{ category }}</h5>
          <ul>
            <li
              v-for="error in categoryErrors.filter((e: any) => isCritical(e))"
              :key="error.field"
              class="error-item critical"
            >
              <strong>{{ error.field }}:</strong> {{ error.message }}
            </li>
          </ul>
        </div>
      </div>

      <div v-if="validationSummary.warningCount > 0" class="warnings">
        <h4>Warnings ({{ validationSummary.warningCount }})</h4>
        <div
          v-for="(
            categoryErrors, category
          ) in validationSummary.errorsByCategory"
          :key="category"
          class="error-category"
        >
          <h5>{{ category }}</h5>
          <ul>
            <li
              v-for="error in categoryErrors.filter((e: any) => !isCritical(e))"
              :key="error.field"
              class="error-item warning"
            >
              <strong>{{ error.field }}:</strong> {{ error.message }}
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div
      v-else-if="validationSummary && validationSummary.isValid"
      class="validation-success"
    >
      ✅ Newsletter is ready to send!
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { ValidationError } from "../../types/newsletter";
import { getValidationSummary } from "../../types/newsletter-validation";

const props = defineProps<{
  errors: ValidationError[];
}>();

// Reactive state
const isValidating = ref(false);

// Computed properties
const validationSummary = computed(() => getValidationSummary(props.errors));

// Methods
const isCritical = (error: ValidationError): boolean => {
  const criticalCodes = [
    "REQUIRED_FIELD",
    "REQUIRED_CONTENT",
    "INVALID_EMAIL",
    "NO_CONTENT",
  ];
  return criticalCodes.includes(error.code || "");
};
</script>
