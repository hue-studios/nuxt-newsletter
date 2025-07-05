<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center space-x-4 mb-4">
          <Button variant="ghost" @click="navigateTo('/newsletters')">
            <Icon name="lucide:arrow-left" class="w-4 h-4 mr-2" />
            Back to Newsletters
          </Button>
        </div>

        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">
              Newsletter Analytics
            </h1>
            <p v-if="newsletter" class="text-gray-600 mt-1">
              {{ newsletter.title }}
            </p>
          </div>

          <div class="flex items-center space-x-3">
            <Badge :variant="getStatusVariant(newsletter?.status)">
              {{ newsletter?.status }}
            </Badge>
            <Button
              variant="outline"
              @click="navigateTo(`/newsletters/${newsletterId}/edit`)"
            >
              <Icon name="lucide:edit" class="w-4 h-4 mr-2" />
              Edit Newsletter
            </Button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="pending" class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card v-for="i in 4" :key="i" class="animate-pulse">
          <CardContent class="p-6">
            <div class="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div class="h-8 bg-gray-200 rounded w-3/4"></div>
          </CardContent>
        </Card>
      </div>

      <!-- Analytics Content -->
      <div v-else-if="analytics" class="space-y-8">
        <!-- Key Metrics -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent class="p-6">
              <div class="flex items-center">
                <div class="flex-1">
                  <p class="text-sm font-medium text-gray-600">Total Sent</p>
                  <p class="text-2xl font-bold text-gray-900">
                    {{ analytics.statistics.total_sent.toLocaleString() }}
                  </p>
                </div>
                <Icon name="lucide:send" class="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent class="p-6">
              <div class="flex items-center">
                <div class="flex-1">
                  <p class="text-sm font-medium text-gray-600">Open Rate</p>
                  <p class="text-2xl font-bold text-gray-900">
                    {{ analytics.statistics.open_rate }}%
                  </p>
                  <p class="text-sm text-gray-500">
                    {{ analytics.statistics.total_opens.toLocaleString() }}
                    opens
                  </p>
                </div>
                <Icon name="lucide:eye" class="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent class="p-6">
              <div class="flex items-center">
                <div class="flex-1">
                  <p class="text-sm font-medium text-gray-600">Click Rate</p>
                  <p class="text-2xl font-bold text-gray-900">
                    {{ analytics.statistics.click_rate }}%
                  </p>
                  <p class="text-sm text-gray-500">
                    {{ analytics.statistics.total_clicks.toLocaleString() }}
                    clicks
                  </p>
                </div>
                <Icon
                  name="lucide:mouse-pointer-click"
                  class="w-8 h-8 text-purple-500"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent class="p-6">
              <div class="flex items-center">
                <div class="flex-1">
                  <p class="text-sm font-medium text-gray-600">Click-to-Open</p>
                  <p class="text-2xl font-bold text-gray-900">
                    {{ analytics.statistics.click_to_open_rate }}%
                  </p>
                  <p class="text-sm text-gray-500">Engagement quality</p>
                </div>
                <Icon
                  name="lucide:trending-up"
                  class="w-8 h-8 text-orange-500"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- Performance Chart -->
        <Card>
          <CardHeader>
            <CardTitle>Performance Over Time</CardTitle>
            <CardDescription>
              Track opens and clicks for each send
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div class="h-80">
              <LineChart
                :data="chartData"
                :x-key="'date'"
                :y-keys="['opens', 'clicks']"
                :colors="['#3b82f6', '#8b5cf6']"
              />
            </div>
          </CardContent>
        </Card>

        <!-- Send Records Table -->
        <Card>
          <CardHeader>
            <CardTitle>Send History</CardTitle>
            <CardDescription>
              Detailed breakdown of each newsletter send
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mailing List</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Opens</TableHead>
                  <TableHead>Clicks</TableHead>
                  <TableHead>Open Rate</TableHead>
                  <TableHead>Sent Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow
                  v-for="record in analytics.send_records"
                  :key="record.id"
                >
                  <TableCell class="font-medium">
                    {{ record.mailing_list_id?.name || "Unknown" }}
                  </TableCell>
                  <TableCell>
                    <Badge :variant="getSendStatusVariant(record.status)">
                      {{ record.status }}
                    </Badge>
                  </TableCell>
                  <TableCell>{{ record.sent_count || 0 }}</TableCell>
                  <TableCell>{{ record.open_count || 0 }}</TableCell>
                  <TableCell>{{ record.click_count || 0 }}</TableCell>
                  <TableCell>
                    {{
                      calculateOpenRate(record.open_count, record.sent_count)
                    }}%
                  </TableCell>
                  <TableCell>
                    {{ formatDate(record.sent_at) }}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-16">
        <Icon
          name="lucide:alert-circle"
          class="w-16 h-16 text-red-500 mx-auto mb-4"
        />
        <h3 class="text-lg font-medium text-gray-900 mb-2">
          Failed to load analytics
        </h3>
        <p class="text-gray-600 mb-4">{{ error.message }}</p>
        <Button @click="refresh()">
          <Icon name="lucide:refresh-cw" class="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Route params
const route = useRoute();
const newsletterId = computed(() => parseInt(route.params.id as string));

// Fetch analytics data
const {
  data: analytics,
  pending,
  error,
  refresh,
} = await useLazyAsyncData(
  `newsletter-analytics-${newsletterId.value}`,
  () => $fetch(`/api/newsletter/analytics/${newsletterId.value}`),
  {
    server: false,
  }
);

// Computed
const newsletter = computed(() => analytics.value?.newsletter);

const chartData = computed(() => {
  if (!analytics.value?.performance_over_time) return [];

  return analytics.value.performance_over_time.map((point: any) => ({
    date: new Date(point.date).toLocaleDateString(),
    opens: point.opens,
    clicks: point.clicks,
    sent: point.sent,
  }));
});

// Methods
const getStatusVariant = (status?: string) => {
  switch (status) {
    case "sent":
      return "default";
    case "draft":
      return "secondary";
    default:
      return "secondary";
  }
};

const getSendStatusVariant = (status: string) => {
  switch (status) {
    case "sent":
      return "default";
    case "sending":
      return "default";
    case "failed":
      return "destructive";
    default:
      return "secondary";
  }
};

const calculateOpenRate = (opens?: number, sent?: number) => {
  if (!opens || !sent || sent === 0) return "0.0";
  return ((opens / sent) * 100).toFixed(1);
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString();
};

// Page metadata
definePageMeta({
  title: "Newsletter Analytics",
  description: "View detailed analytics for your newsletter",
});

// SEO
useSeoMeta({
  title: () =>
    newsletter.value
      ? `Analytics: ${newsletter.value.title}`
      : "Newsletter Analytics",
  description:
    "View detailed performance metrics and analytics for your newsletter",
});
</script>
