export const useSegmentation = () => {
  const segments = ref<any[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Fetch saved segments
  const fetchSegments = async () => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await $fetch("/api/newsletter/segments");
      segments.value = response;
      return response;
    } catch (err: any) {
      error.value = err.message || "Failed to fetch segments";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Create new segment
  const createSegment = async (segmentData: {
    name: string;
    description?: string;
    rules: any[];
    estimated_count?: number;
  }) => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await $fetch("/api/newsletter/segments", {
        method: "POST",
        body: segmentData,
      });

      segments.value.push(response);
      return response;
    } catch (err: any) {
      error.value = err.message || "Failed to create segment";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Update segment
  const updateSegment = async (segmentId: number, updates: any) => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await $fetch(`/api/newsletter/segments/${segmentId}`, {
        method: "PATCH",
        body: updates,
      });

      const index = segments.value.findIndex((s) => s.id === segmentId);
      if (index !== -1) {
        segments.value[index] = { ...segments.value[index], ...response };
      }

      return response;
    } catch (err: any) {
      error.value = err.message || "Failed to update segment";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Delete segment
  const deleteSegment = async (segmentId: number) => {
    try {
      isLoading.value = true;
      error.value = null;

      await $fetch(`/api/newsletter/segments/${segmentId}`, {
        method: "DELETE",
      });

      segments.value = segments.value.filter((s) => s.id !== segmentId);
    } catch (err: any) {
      error.value = err.message || "Failed to delete segment";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Calculate segment
  const calculateSegment = async (rules: any[]) => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await $fetch("/api/newsletter/segments/calculate", {
        method: "POST",
        body: { rules },
      });

      return response;
    } catch (err: any) {
      error.value = err.message || "Failed to calculate segment";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Get segment subscribers
  const getSegmentSubscribers = async (
    segmentId: number,
    options: {
      limit?: number;
      offset?: number;
      fields?: string[];
    } = {},
  ) => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await $fetch(
        `/api/newsletter/segments/${segmentId}/subscribers`,
        {
          query: options,
        },
      );

      return response;
    } catch (err: any) {
      error.value = err.message || "Failed to fetch segment subscribers";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Export segment
  const exportSegment = async (
    segmentId: number,
    format: "csv" | "json" = "csv",
  ) => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await $fetch(
        `/api/newsletter/segments/${segmentId}/export`,
        {
          method: "POST",
          body: { format },
        },
      );

      return response;
    } catch (err: any) {
      error.value = err.message || "Failed to export segment";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Predefined segment templates
  const getSegmentTemplates = () => {
    return [
      {
        name: "Highly Engaged",
        description: "Subscribers with high engagement scores",
        rules: [
          {
            field: "engagement_score",
            operator: "greater_than",
            value: "75",
          },
        ],
      },
      {
        name: "Recent Subscribers",
        description: "Subscribers who joined in the last 30 days",
        rules: [
          {
            field: "subscribed_at",
            operator: "last_days",
            value: "30",
          },
        ],
      },
      {
        name: "Inactive Subscribers",
        description: "Subscribers who haven't opened emails in 60 days",
        rules: [
          {
            field: "last_email_opened",
            operator: "before",
            value: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0],
          },
        ],
      },
      {
        name: "VIP Customers",
        description: "High-value subscribers from specific companies",
        rules: [
          {
            field: "engagement_score",
            operator: "greater_than",
            value: "80",
          },
          {
            connector: "AND",
            field: "subscription_source",
            operator: "equals",
            value: "website",
          },
        ],
      },
    ];
  };

  return {
    segments: readonly(segments),
    isLoading: readonly(isLoading),
    error: readonly(error),
    fetchSegments,
    createSegment,
    updateSegment,
    deleteSegment,
    calculateSegment,
    getSegmentSubscribers,
    exportSegment,
    getSegmentTemplates,
  };
};
