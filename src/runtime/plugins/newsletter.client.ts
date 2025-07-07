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
