// src/runtime/utils/performance/monitoring.ts
/**
 * Performance monitoring and metrics
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  tags?: Record<string, string>;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private timers = new Map<string, number>();

  // Record a metric
  record(
    name: string,
    value: number,
    unit: string = "ms",
    tags?: Record<string, string>
  ): void {
    this.metrics.push({
      name,
      value,
      unit,
      timestamp: Date.now(),
      tags,
    });

    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  // Start a timer
  startTimer(name: string): void {
    this.timers.set(name, performance.now());
  }

  // End a timer and record the metric
  endTimer(name: string, tags?: Record<string, string>): number {
    const startTime = this.timers.get(name);
    if (!startTime) {
      console.warn(`Timer "${name}" was not started`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(name);
    this.record(name, duration, "ms", tags);
    return duration;
  }

  // Measure a function execution
  measure<T>(name: string, fn: () => T, tags?: Record<string, string>): T {
    this.startTimer(name);
    try {
      const result = fn();
      this.endTimer(name, tags);
      return result;
    } catch (error) {
      this.endTimer(name, { ...tags, error: "true" });
      throw error;
    }
  }

  // Measure an async function
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    tags?: Record<string, string>
  ): Promise<T> {
    this.startTimer(name);
    try {
      const result = await fn();
      this.endTimer(name, tags);
      return result;
    } catch (error) {
      this.endTimer(name, { ...tags, error: "true" });
      throw error;
    }
  }

  // Get metrics summary
  getSummary(timeRange?: { start: number; end: number }): Record<string, any> {
    let filteredMetrics = this.metrics;

    if (timeRange) {
      filteredMetrics = this.metrics.filter(
        (m) => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      );
    }

    const summary: Record<string, any> = {};

    // Group by metric name
    const grouped = filteredMetrics.reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = [];
      }
      acc[metric.name].push(metric.value);
      return acc;
    }, {} as Record<string, number[]>);

    // Calculate statistics
    Object.entries(grouped).forEach(([name, values]) => {
      const sorted = values.sort((a, b) => a - b);
      const len = values.length;

      summary[name] = {
        count: len,
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((sum, v) => sum + v, 0) / len,
        p50: sorted[Math.floor(len * 0.5)],
        p95: sorted[Math.floor(len * 0.95)],
        p99: sorted[Math.floor(len * 0.99)],
      };
    });

    return summary;
  }

  // Export metrics
  exportMetrics(format: "json" | "csv" = "json"): string {
    if (format === "csv") {
      const headers = ["name", "value", "unit", "timestamp", "tags"];
      const rows = this.metrics.map((m) => [
        m.name,
        m.value.toString(),
        m.unit,
        m.timestamp.toString(),
        JSON.stringify(m.tags || {}),
      ]);

      return [headers, ...rows].map((row) => row.join(",")).join("\n");
    }

    return JSON.stringify(this.metrics, null, 2);
  }

  // Clear metrics
  clear(): void {
    this.metrics = [];
    this.timers.clear();
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Newsletter-specific performance tracking
export function trackNewsletterPerformance() {
  // Track MJML compilation time
  const originalCompile = window.mjml?.compile;
  if (originalCompile) {
    window.mjml.compile = function (...args: any[]) {
      return performanceMonitor.measure("mjml_compile", () =>
        originalCompile.apply(this, args)
      );
    };
  }

  // Track API request times
  const originalFetch = window.fetch;
  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
    const url = typeof input === "string" ? input : input.toString();
    const isNewsletterAPI = url.includes("/api/newsletter/");

    if (isNewsletterAPI) {
      return performanceMonitor.measureAsync(
        "api_request",
        () => originalFetch(input, init),
        {
          endpoint: url.split("/").pop() || "unknown",
        }
      );
    }

    return originalFetch(input, init);
  };
}

// Web Vitals tracking
export function trackWebVitals() {
  if (typeof window === "undefined") return;

  // Track LCP (Largest Contentful Paint)
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === "largest-contentful-paint") {
        performanceMonitor.record("lcp", entry.startTime, "ms");
      }
      if (entry.entryType === "first-input") {
        const fidEntry = entry as PerformanceEventTiming;
        performanceMonitor.record(
          "fid",
          fidEntry.processingStart - fidEntry.startTime,
          "ms"
        );
      }
    }
  });

  observer.observe({ entryTypes: ["largest-contentful-paint", "first-input"] });

  // Track CLS (Cumulative Layout Shift)
  let clsValue = 0;
  const clsObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (
        entry.entryType === "layout-shift" &&
        !(entry as any).hadRecentInput
      ) {
        clsValue += (entry as any).value;
      }
    }
  });

  clsObserver.observe({ entryTypes: ["layout-shift"] });

  // Record CLS on page unload
  window.addEventListener("beforeunload", () => {
    performanceMonitor.record("cls", clsValue, "score");
  });
}
