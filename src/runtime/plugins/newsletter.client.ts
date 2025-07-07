import {
  generateSlug,
  validateEmail,
  validateNewsletterData,
  calculateReadingTime,
  estimateEmailSize,
  generatePreviewText,
  formatNewsletterStatus,
  canSendNewsletter,
} from "../utils/core/newsletter";

export default defineNuxtPlugin(() => {
  // Register global newsletter utilities
  return {
    provide: {
      newsletter: {
        generateSlug,
        validateEmail,
        validateNewsletterData,
        calculateReadingTime,
        estimateEmailSize,
        generatePreviewText,
        formatNewsletterStatus,
        canSendNewsletter,
      },
    },
  };
});
