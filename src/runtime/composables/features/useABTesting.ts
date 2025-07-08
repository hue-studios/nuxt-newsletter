// src/runtime/composables/features/useABTesting.ts
import { ref } from "vue";
export const useABTesting = () => {
  const abTests = ref<any[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Fetch A/B tests
  const fetchABTests = async (newsletterId?: number) => {
    try {
      isLoading.value = true;
      error.value = null;

      const url = newsletterId
        ? `/api/newsletter/ab-tests?newsletter_id=${newsletterId}`
        : "/api/newsletter/ab-tests";

      const response = await $fetch(url);
      abTests.value = response;
      return response;
    } catch (err: any) {
      error.value = err.message || "Failed to fetch A/B tests";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Create A/B test
  const createABTest = async (testData: {
    newsletter_id: number;
    test_type: "subject_line" | "content" | "send_time";
    variant_a: any;
    variant_b: any;
    test_percentage: number;
    duration_hours?: number;
  }) => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await $fetch("/api/newsletter/ab-tests", {
        method: "POST",
        body: testData,
      });

      abTests.value.push(response);
      return response;
    } catch (err: any) {
      error.value = err.message || "Failed to create A/B test";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Start A/B test
  const startABTest = async (testId: number) => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await $fetch(
        `/api/newsletter/ab-tests/${testId}/start`,
        {
          method: "POST",
        }
      );

      const index = abTests.value.findIndex((t) => t.id === testId);
      if (index !== -1) {
        abTests.value[index] = { ...abTests.value[index], ...response };
      }

      return response;
    } catch (err: any) {
      error.value = err.message || "Failed to start A/B test";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Stop A/B test
  const stopABTest = async (testId: number) => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await $fetch(`/api/newsletter/ab-tests/${testId}/stop`, {
        method: "POST",
      });

      const index = abTests.value.findIndex((t) => t.id === testId);
      if (index !== -1) {
        abTests.value[index] = { ...abTests.value[index], ...response };
      }

      return response;
    } catch (err: any) {
      error.value = err.message || "Failed to stop A/B test";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Get A/B test results
  const getABTestResults = async (testId: number) => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await $fetch(
        `/api/newsletter/ab-tests/${testId}/results`
      );
      return response;
    } catch (err: any) {
      error.value = err.message || "Failed to fetch A/B test results";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Send winning variant
  const sendWinningVariant = async (testId: number, variant: "A" | "B") => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await $fetch(
        `/api/newsletter/ab-tests/${testId}/send-winner`,
        {
          method: "POST",
          body: { variant },
        }
      );

      return response;
    } catch (err: any) {
      error.value = err.message || "Failed to send winning variant";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Calculate statistical significance
  const calculateSignificance = (variantA: any, variantB: any) => {
    const { sent: sentA, opens: opensA } = variantA;
    const { sent: sentB, opens: opensB } = variantB;

    if (sentA === 0 || sentB === 0) return 0;

    const openRateA = opensA / sentA;
    const openRateB = opensB / sentB;

    // Simplified z-test calculation
    const pooledRate = (opensA + opensB) / (sentA + sentB);
    const standardError = Math.sqrt(
      pooledRate * (1 - pooledRate) * (1 / sentA + 1 / sentB)
    );

    if (standardError === 0) return 0;

    const zScore = Math.abs(openRateA - openRateB) / standardError;

    // Convert z-score to confidence level (simplified)
    if (zScore >= 2.58) return 99; // 99% confidence
    if (zScore >= 1.96) return 95; // 95% confidence
    if (zScore >= 1.65) return 90; // 90% confidence
    if (zScore >= 1.28) return 80; // 80% confidence
    return Math.round(50 + (zScore / 3.29) * 45); // Linear approximation for lower values
  };

  // Get test recommendations
  const getTestRecommendations = (newsletter: any) => {
    const recommendations = [];

    // Subject line recommendations
    if (!newsletter.ab_test_subject_b) {
      recommendations.push({
        type: "subject_line",
        title: "Test Subject Line Variations",
        description:
          "Try different subject line approaches to improve open rates",
        suggestions: [
          "Add urgency or scarcity",
          "Use personalization",
          "Ask a question",
          "Include numbers or statistics",
          "Test different lengths",
        ],
      });
    }

    // Send time recommendations
    recommendations.push({
      type: "send_time",
      title: "Test Send Times",
      description: "Find the optimal time when your audience is most engaged",
      suggestions: [
        "Morning vs afternoon",
        "Weekday vs weekend",
        "Different time zones",
        "Based on subscriber behavior",
      ],
    });

    // Content recommendations
    if (newsletter.blocks?.length > 3) {
      recommendations.push({
        type: "content",
        title: "Test Content Variations",
        description: "Optimize your newsletter content for better engagement",
        suggestions: [
          "Different CTA button text",
          "Image vs no image",
          "Short vs long content",
          "Different content order",
        ],
      });
    }

    return recommendations;
  };

  return {
    abTests: readonly(abTests),
    isLoading: readonly(isLoading),
    error: readonly(error),
    fetchABTests,
    createABTest,
    startABTest,
    stopABTest,
    getABTestResults,
    sendWinningVariant,
    calculateSignificance,
    getTestRecommendations,
  };
};
