<!-- src/runtime/components/analytics/NewsletterAnalytics.vue -->
<template>
  <div class="newsletter-analytics space-y-6">
    <!-- Overview Stats -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card>
        <CardContent class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">
                Total Sent
              </p>
              <p class="text-2xl font-bold text-gray-900">
                {{ stats.totalSent.toLocaleString() }}
              </p>
            </div>
            <Icon
              name="lucide:send"
              class="w-8 h-8 text-blue-500"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">
                Avg Open Rate
              </p>
              <p class="text-2xl font-bold text-green-600">
                {{ stats.avgOpenRate }}%
              </p>
            </div>
            <Icon
              name="lucide:eye"
              class="w-8 h-8 text-green-500"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">
                Avg Click Rate
              </p>
              <p class="text-2xl font-bold text-blue-600">
                {{ stats.avgClickRate }}%
              </p>
            </div>
            <Icon
              name="lucide:mouse-pointer-click"
              class="w-8 h-8 text-blue-500"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">
                Total Subscribers
              </p>
              <p class="text-2xl font-bold text-purple-600">
                {{ stats.totalSubscribers.toLocaleString() }}
              </p>
            </div>
            <Icon
              name="lucide:users"
              class="w-8 h-8 text-purple-500"
            />
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Performance Chart -->
    <PerformanceChart :data="chartData" />

    <!-- Top Performers -->
    <Card>
      <CardHeader>
        <CardTitle>Top Performing Newsletters</CardTitle>
        <CardDescription>
          Your best newsletters by open rate in the last 30 days
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="space-y-4">
          <div
            v-for="newsletter in topPerformers"
            :key="newsletter.id"
            class="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
          >
            <div>
              <h4 class="font-medium text-gray-900">
                {{ newsletter.title }}
              </h4>
              <p class="text-sm text-gray-600">
                {{ newsletter.subject_line }}
              </p>
              <p class="text-xs text-gray-500">
                {{ formatDate(newsletter.date_created) }}
              </p>
            </div>
            <div class="text-right">
              <p class="text-lg font-bold text-green-600">
                {{ newsletter.open_rate?.toFixed(1) }}%
              </p>
              <p class="text-sm text-gray-500">
                {{ newsletter.total_opens }} opens
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Engagement Trends -->
    <Card>
      <CardHeader>
        <CardTitle>Engagement Trends</CardTitle>
        <CardDescription> Monthly engagement patterns </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 class="font-medium text-gray-900 mb-3">
              Best Sending Days
            </h4>
            <div class="space-y-2">
              <div
                v-for="day in bestDays"
                :key="day.name"
                class="flex items-center justify-between"
              >
                <span class="text-sm text-gray-600">{{ day.name }}</span>
                <span class="text-sm font-medium">{{ day.rate }}%</span>
              </div>
            </div>
          </div>

          <div>
            <h4 class="font-medium text-gray-900 mb-3">
              Best Sending Times
            </h4>
            <div class="space-y-2">
              <div
                v-for="time in bestTimes"
                :key="time.hour"
                class="flex items-center justify-between"
              >
                <span class="text-sm text-gray-600">{{ time.period }}</span>
                <span class="text-sm font-medium">{{ time.rate }}%</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Newsletter } from '../../types/newsletter'

interface Props {
  newsletters: Newsletter[]
}

const props = defineProps<Props>()

// Computed analytics
const stats = computed(() => {
  const sent = props.newsletters.filter(n => n.status === 'sent')
  const totalSent = sent.length
  const totalOpens = sent.reduce((sum, n) => sum + (n.total_opens || 0), 0)
  const avgOpenRate
    = sent.length > 0
      ? sent.reduce((sum, n) => sum + (n.open_rate || 0), 0) / sent.length
      : 0
  const avgClickRate
    = sent.length > 0
      ? sent.reduce((sum, n) => sum + (n.click_rate || 0), 0) / sent.length
      : 0

  return {
    totalSent,
    totalOpens,
    avgOpenRate: avgOpenRate.toFixed(1),
    avgClickRate: avgClickRate.toFixed(1),
    totalSubscribers: 0, // TODO: Get from subscribers API
  }
})

const chartData = computed(() => {
  return props.newsletters
    .filter(n => n.status === 'sent')
    .slice(-12)
    .map(n => ({
      date: new Date(n.date_created!).toLocaleDateString(),
      opens: n.open_rate || 0,
      clicks: n.click_rate || 0,
      sent: n.total_opens || 0,
    }))
})

const topPerformers = computed(() => {
  return props.newsletters
    .filter(n => n.status === 'sent' && n.open_rate)
    .sort((a, b) => (b.open_rate || 0) - (a.open_rate || 0))
    .slice(0, 5)
})

// Mock data for engagement patterns
const bestDays = ref([
  { name: 'Tuesday', rate: 24.5 },
  { name: 'Wednesday', rate: 23.8 },
  { name: 'Thursday', rate: 22.1 },
  { name: 'Monday', rate: 18.9 },
  { name: 'Friday', rate: 16.2 },
])

const bestTimes = ref([
  { period: '9:00 AM', hour: 9, rate: 28.3 },
  { period: '1:00 PM', hour: 13, rate: 25.7 },
  { period: '10:00 AM', hour: 10, rate: 23.4 },
  { period: '2:00 PM', hour: 14, rate: 21.8 },
  { period: '11:00 AM', hour: 11, rate: 19.5 },
])

const formatDate = (date: string | Date | undefined): string => {
  if (!date) return ''

  // Convert Date object to string if needed
  const dateString = date instanceof Date ? date.toISOString() : date

  // Your existing formatting logic here
  return new Date(dateString).toLocaleDateString()
}
</script>
