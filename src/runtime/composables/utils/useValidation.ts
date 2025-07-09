// src/runtime/composables/utils/useValidation.ts
import { ref, readonly } from "vue";
import type {
  ValidationError,
  ValidationResult,
  Newsletter,
  NewsletterBlock,
} from "../../types/newsletter";
import {
  validateNewsletter,
  validateBlock,
  getValidationSummary,
} from "../../types/newsletter-validation";

export const useValidation = () => {
  const isValidating = ref(false);
  const errors = ref<ValidationError[]>([]);

  const validateNewsletterData = async (
    newsletter: Newsletter
  ): Promise<ValidationResult> => {
    try {
      isValidating.value = true;
      const result = validateNewsletter(newsletter);
      errors.value = result.errors;
      return result;
    } finally {
      isValidating.value = false;
    }
  };

  const validateBlockData = (block: NewsletterBlock): ValidationError[] => {
    return validateBlock(block);
  };

  const clearErrors = () => {
    errors.value = [];
  };

  const getValidationSummaryData = () => {
    return getValidationSummary(errors.value);
  };

  return {
    isValidating: readonly(isValidating),
    errors: readonly(errors),
    validateNewsletter: validateNewsletterData,
    validateBlock: validateBlockData,
    clearErrors,
    getValidationSummary: getValidationSummaryData,
  };
};
