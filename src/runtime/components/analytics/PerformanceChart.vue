<!-- src/runtime/components/analytics/PerformanceChart.vue -->
<template>
  <Card>
    <CardHeader>
      <div class="flex items-center justify-between">
        <div>
          <CardTitle>Performance Over Time</CardTitle>
          <CardDescription>
            Track your newsletter performance trends
          </CardDescription>
        </div>

        <!-- Chart Controls -->
        <div class="flex items-center space-x-2">
          <Select v-model="selectedMetric">
            <SelectTrigger class="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="opens">Open Rate</SelectItem>
              <SelectItem value="clicks">Click Rate</SelectItem>
              <SelectItem value="both">Both Metrics</SelectItem>
            </SelectContent>
          </Select>

          <Select v-model="timeRange">
            <SelectTrigger class="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 Days</SelectItem>
              <SelectItem value="30">30 Days</SelectItem>
              <SelectItem value="90">90 Days</SelectItem>
              <SelectItem value="365">1 Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </CardHeader>

    <CardContent>
      <div class="h-80 w-full">
        <!-- Using Recharts for the chart -->
        <LineChart
          v-if="filteredData.length > 0"
          :data="filteredData"
          :margin="{ top: 5, right: 30, left: 20, bottom: 5 }"
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }}
          tickFormatter="formatDate" /> <YAxis tick={{ fontSize: 12 }}
          domain={[0, 'dataMax + 5']} />
          <Tooltip
            :content="CustomTooltip"
            labelFormatter="formatTooltipDate"
          />
          <Legend />

          <Line v-if="selectedMetric === 'opens' || selectedMetric === 'both'"
          type="monotone" dataKey="opens" stroke="#10b981" strokeWidth="2"
          dot={{ r: 4 }} name="Open Rate (%)" /> <Line v-if="selectedMetric ===
          'clicks' || selectedMetric === 'both'" type="monotone"
          dataKey="clicks" stroke="#3b82f6" strokeWidth="2" dot={{ r: 4 }}
          name="Click Rate (%)" />
        </LineChart>

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
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

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

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || payload.length === 0) return null;

  return h(
    "div",
    {
      class: "bg-white p-3 border border-gray-200 rounded-lg shadow-lg",
    },
    [
      h(
        "p",
        { class: "font-medium text-gray-900 mb-2" },
        formatTooltipDate(label)
      ),
      ...payload.map((entry: any) =>
        h(
          "div",
          {
            key: entry.dataKey,
            class: "flex items-center space-x-2 text-sm",
          },
          [
            h("div", {
              class: "w-3 h-3 rounded-full",
              style: { backgroundColor: entry.color },
            }),
            h("span", { class: "text-gray-600" }, entry.name + ":"),
            h("span", { class: "font-medium" }, entry.value + "%"),
          ]
        )
      ),
    ]
  );
};
</script>
