// src/runtime/composables/features/useAnalytics.ts
export const useAnalytics = () => {
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Fetch newsletter analytics
  const fetchNewsletterAnalytics = async (newsletterId: number) => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await $fetch(
        `/api/newsletter/analytics/${newsletterId}`,
      );
      return response;
    } catch (err: any) {
      error.value = err.message || "Failed to fetch analytics";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Fetch dashboard analytics
  const fetchDashboardAnalytics = async (
    filters: {
      dateRange?: { start: string; end: string };
      category?: string;
      status?: string;
    } = {},
  ) => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await $fetch("/api/newsletter/analytics/dashboard", {
        method: "POST",
        body: filters,
      });
      return response;
    } catch (err: any) {
      error.value = err.message || "Failed to fetch dashboard analytics";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Export analytics data
  const exportAnalytics = async (options: {
    newsletter_ids?: number[];
    date_range?: { start: string; end: string };
    format?: "csv" | "json" | "excel";
    include_details?: boolean;
  }) => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await $fetch("/api/newsletter/analytics/export", {
        method: "POST",
        body: options,
      });

      return response;
    } catch (err: any) {
      error.value = err.message || "Failed to export analytics";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Calculate engagement metrics
  const calculateEngagementMetrics = (newsletters: any[]) => {
    const sentNewsletters = newsletters.filter((n) => n.status === "sent");

    if (sentNewsletters.length === 0) {
      return {
        totalSent: 0,
        avgOpenRate: 0,
        avgClickRate: 0,
        totalOpens: 0,
        totalClicks: 0,
        bestPerformer: null,
        trends: [],
      };
    }

    const totalSent = sentNewsletters.length;
    const avgOpenRate
      = sentNewsletters.reduce((sum, n) => sum + (n.open_rate || 0), 0)
        / totalSent;
    const avgClickRate
      = sentNewsletters.reduce((sum, n) => sum + (n.click_rate || 0), 0)
        / totalSent;
    const totalOpens = sentNewsletters.reduce(
      (sum, n) => sum + (n.total_opens || 0),
      0,
    );
    const totalClicks = sentNewsletters.reduce(
      (sum, n) => sum + (n.total_clicks || 0),
      0,
    );

    const bestPerformer = sentNewsletters.reduce((best, current) =>
      (current.open_rate || 0) > (best.open_rate || 0) ? current : best,
    );

    // Calculate trends (last 30 days vs previous 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const recent = sentNewsletters.filter(
      (n) => new Date(n.created_at) >= thirtyDaysAgo,
    );
    const previous = sentNewsletters.filter(
      (n) =>
        new Date(n.created_at) >= sixtyDaysAgo
          && new Date(n.created_at) < thirtyDaysAgo,
    );

    const recentAvgOpen
      = recent.length > 0
        ? recent.reduce((sum, n) => sum + (n.open_rate || 0), 0) / recent.length
        : 0;
    const previousAvgOpen
      = previous.length > 0
        ? previous.reduce((sum, n) => sum + (n.open_rate || 0), 0)
        / previous.length
        : 0;

    const openRateTrend
      = previousAvgOpen > 0
        ? ((recentAvgOpen - previousAvgOpen) / previousAvgOpen) * 100
        : 0;

    return {
      totalSent,
      avgOpenRate: Math.round(avgOpenRate * 10) / 10,
      avgClickRate: Math.round(avgClickRate * 10) / 10,
      totalOpens,
      totalClicks,
      bestPerformer,
      trends: {
        openRateTrend: Math.round(openRateTrend * 10) / 10,
        recentCount: recent.length,
        previousCount: previous.length,
      },
    };
  };

  // Track custom event
  const trackEvent = async (eventData: {
    newsletter_id: number;
    event_type: string;
    subscriber_id?: number;
    metadata?: Record<string, any>;
  }) => {
    try {
      await $fetch("/api/newsletter/analytics/track", {
        method: "POST",
        body: eventData,
      });
    } catch (err: any) {
      console.error("Failed to track event:", err);
    }
  };

  return {
    isLoading: readonly(isLoading),
    error: readonly(error),
    fetchNewsletterAnalytics,
    fetchDashboardAnalytics,
    exportAnalytics,
    calculateEngagementMetrics,
    trackEvent,
  };
};
