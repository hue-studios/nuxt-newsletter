<!-- src/runtime/components/analytics/PerformanceChart.vue -->
<template>
  <UiCard>
    <UiCardHeader>
      <div class="flex items-center justify-between">
        <div>
          <UiCardTitle>Performance Over Time</UiCardTitle>
          <UiCardDescription>
            Track your newsletter performance trends
          </UiCardDescription>
        </div>

        <!-- Chart Controls -->
        <div class="flex items-center space-x-2">
          <UiSelect v-model="selectedMetric">
            <UiSelectTrigger class="w-40">
              <UiSelectValue placeholder="Select metric" />
            </UiSelectTrigger>
            <UiSelectContent>
              <UiSelectItem value="opens">Open Rate</UiSelectItem>
              <UiSelectItem value="clicks">Click Rate</UiSelectItem>
              <UiSelectItem value="both">Both Metrics</UiSelectItem>
            </UiSelectContent>
          </UiSelect>

          <UiSelect v-model="timeRange">
            <UiSelectTrigger class="w-32">
              <UiSelectValue placeholder="Time range" />
            </UiSelectTrigger>
            <UiSelectContent>
              <UiSelectItem value="7">7 Days</UiSelectItem>
              <UiSelectItem value="30">30 Days</UiSelectItem>
              <UiSelectItem value="90">90 Days</UiSelectItem>
              <UiSelectItem value="365">1 Year</UiSelectItem>
            </UiSelectContent>
          </UiSelect>
        </div>
      </div>
    </UiCardHeader>

    <UiCardContent>
      <div class="h-80 w-full">
        <!-- Using nuxt-echarts -->
        <EChart
          v-if="filteredData.length > 0"
          :option="chartOption"
          :loading="false"
          class="h-full w-full"
          autoresize
        />

        <!-- Empty State -->
        <div
          v-else
          class="flex items-center justify-center h-full text-gray-500"
        >
          <div class="text-center">
            <Icon
              name="lucide:line-chart"
              class="w-12 h-12 mx-auto mb-4 text-gray-400"
            />
            <h3 class="text-lg font-medium text-gray-900 mb-2">
              No Data Available
            </h3>
            <p class="text-sm text-gray-600">
              Send some newsletters to see performance metrics
            </p>
          </div>
        </div>
      </div>

      <!-- Chart Summary -->
      <div
        v-if="filteredData.length > 0"
        class="mt-6 pt-6 border-t border-gray-200"
      >
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="text-center">
            <p class="text-sm text-gray-600">Average Open Rate</p>
            <p class="text-lg font-bold text-green-600">
              {{ averageOpenRate }}%
            </p>
          </div>
          <div class="text-center">
            <p class="text-sm text-gray-600">Average Click Rate</p>
            <p class="text-lg font-bold text-blue-600">
              {{ averageClickRate }}%
            </p>
          </div>
          <div class="text-center">
            <p class="text-sm text-gray-600">Best Open Rate</p>
            <p class="text-lg font-bold text-green-700">{{ bestOpenRate }}%</p>
          </div>
          <div class="text-center">
            <p class="text-sm text-gray-600">Trend</p>
            <div class="flex items-center justify-center">
              <Icon
                :name="trendIcon"
                :class="trendColor"
                class="w-4 h-4 mr-1"
              />
              <span :class="trendColor" class="text-lg font-bold">
                {{ trendPercentage }}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </UiCardContent>
  </UiCard>
</template>

<script setup lang="ts">
interface ChartDataPoint {
  date: string;
  opens: number;
  clicks: number;
  sent: number;
}

interface Props {
  data: ChartDataPoint[];
}

const props = defineProps<Props>();

// State
const selectedMetric = ref("both");
const timeRange = ref("30");

// Computed
const filteredData = computed(() => {
  const days = parseInt(timeRange.value);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return props.data
    .filter((point) => new Date(point.date) >= cutoffDate)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
});

const chartOption = computed(() => {
  const series = [];

  if (selectedMetric.value === "opens" || selectedMetric.value === "both") {
    series.push({
      name: "Open Rate (%)",
      type: "line",
      data: filteredData.value.map((point) => point.opens),
      smooth: true,
      itemStyle: {
        color: "#10b981",
      },
      lineStyle: {
        width: 2,
      },
      symbol: "circle",
      symbolSize: 4,
    });
  }

  if (selectedMetric.value === "clicks" || selectedMetric.value === "both") {
    series.push({
      name: "Click Rate (%)",
      type: "line",
      data: filteredData.value.map((point) => point.clicks),
      smooth: true,
      itemStyle: {
        color: "#3b82f6",
      },
      lineStyle: {
        width: 2,
      },
      symbol: "circle",
      symbolSize: 4,
    });
  }

  return {
    tooltip: {
      trigger: "axis",
      backgroundColor: "white",
      borderColor: "#e5e7eb",
      borderWidth: 1,
      textStyle: {
        color: "#374151",
      },
      formatter: (params: any) => {
        const date = filteredData.value[params[0].dataIndex].date;
        const formattedDate = formatTooltipDate(date);
        let html = `<div style="font-weight: 500; margin-bottom: 4px;">${formattedDate}</div>`;

        params.forEach((param: any) => {
          html += `
            <div style="display: flex; align-items: center; margin-bottom: 2px;">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ${param.color}; margin-right: 8px;"></span>
              <span style="color: #6b7280;">${param.seriesName}:</span>
              <span style="font-weight: 500; margin-left: 4px;">${param.value}%</span>
            </div>
          `;
        });

        return html;
      },
    },
    legend: {
      data: series.map((s) => s.name),
      bottom: 0,
      textStyle: {
        color: "#374151",
        fontSize: 12,
      },
    },
    grid: {
      top: 20,
      left: 30,
      right: 30,
      bottom: 40,
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: filteredData.value.map((point) => formatDate(point.date)),
      axisLine: {
        lineStyle: {
          color: "#e5e7eb",
        },
      },
      axisLabel: {
        color: "#6b7280",
        fontSize: 12,
      },
    },
    yAxis: {
      type: "value",
      min: 0,
      axisLine: {
        lineStyle: {
          color: "#e5e7eb",
        },
      },
      axisLabel: {
        color: "#6b7280",
        fontSize: 12,
      },
      splitLine: {
        lineStyle: {
          color: "#f3f4f6",
          type: "dashed",
        },
      },
    },
    series,
  };
});

const averageOpenRate = computed(() => {
  if (filteredData.value.length === 0) return "0.0";
  const avg =
    filteredData.value.reduce((sum, point) => sum + point.opens, 0) /
    filteredData.value.length;
  return avg.toFixed(1);
});

const averageClickRate = computed(() => {
  if (filteredData.value.length === 0) return "0.0";
  const avg =
    filteredData.value.reduce((sum, point) => sum + point.clicks, 0) /
    filteredData.value.length;
  return avg.toFixed(1);
});

const bestOpenRate = computed(() => {
  if (filteredData.value.length === 0) return "0.0";
  const best = Math.max(...filteredData.value.map((point) => point.opens));
  return best.toFixed(1);
});

const trendPercentage = computed(() => {
  if (filteredData.value.length < 2) return "0.0";

  const recent = filteredData.value.slice(-3);
  const older = filteredData.value.slice(-6, -3);

  if (older.length === 0) return "0.0";

  const recentAvg =
    recent.reduce((sum, point) => sum + point.opens, 0) / recent.length;
  const olderAvg =
    older.reduce((sum, point) => sum + point.opens, 0) / older.length;

  const change = ((recentAvg - olderAvg) / olderAvg) * 100;
  return Math.abs(change).toFixed(1);
});

const trendIcon = computed(() => {
  const trend = parseFloat(trendPercentage.value);
  if (trend > 0) return "lucide:trending-up";
  if (trend < 0) return "lucide:trending-down";
  return "lucide:minus";
});

const trendColor = computed(() => {
  const trend = parseFloat(trendPercentage.value);
  if (trend > 0) return "text-green-600";
  if (trend < 0) return "text-red-600";
  return "text-gray-600";
});

// Methods
const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const formatTooltipDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};
</script>
