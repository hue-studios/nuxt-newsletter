<!-- src/runtime/components/analytics/ABTestResults.vue -->
<template>
  <Card>
    <CardHeader>
      <div class="flex items-center justify-between">
        <div>
          <CardTitle>A/B Test Results</CardTitle>
          <CardDescription>
            Compare performance between your newsletter variants
          </CardDescription>
        </div>

        <div class="flex items-center space-x-2">
          <Badge
            :variant="testStatusVariant"
            class="capitalize"
          >
            {{ abTest.status }}
          </Badge>

          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button
                variant="outline"
                size="sm"
              >
                <Icon
                  name="lucide:more-horizontal"
                  class="w-4 h-4"
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem @click="exportResults">
                <Icon
                  name="lucide:download"
                  class="w-4 h-4 mr-2"
                />
                Export Results
              </DropdownMenuItem>
              <DropdownMenuItem
                :disabled="!hasWinner"
                @click="duplicateWinner"
              >
                <Icon
                  name="lucide:copy"
                  class="w-4 h-4 mr-2"
                />
                Duplicate Winner
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                :disabled="abTest.status !== 'running'"
                @click="stopTest"
              >
                <Icon
                  name="lucide:stop-circle"
                  class="w-4 h-4 mr-2"
                />
                Stop Test
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </CardHeader>

    <CardContent class="space-y-6">
      <!-- Test Overview -->
      <div
        class="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg"
      >
        <div class="text-center">
          <div class="text-sm text-gray-600">
            Test Duration
          </div>
          <div class="text-lg font-bold text-gray-900">
            {{ testDuration }}
          </div>
        </div>
        <div class="text-center">
          <div class="text-sm text-gray-600">
            Total Recipients
          </div>
          <div class="text-lg font-bold text-gray-900">
            {{ (abTest.variantA.sent + abTest.variantB.sent).toLocaleString() }}
          </div>
        </div>
        <div class="text-center">
          <div class="text-sm text-gray-600">
            Confidence Level
          </div>
          <div
            class="text-lg font-bold"
            :class="confidenceColor"
          >
            {{ confidenceLevel }}%
          </div>
        </div>
      </div>

      <!-- Variant Comparison -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Variant A -->
        <div
          class="border border-gray-200 rounded-lg p-6 space-y-4"
          :class="{
            'ring-2 ring-green-200 bg-green-50': winnerVariant === 'A',
          }"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <h3 class="text-lg font-semibold text-gray-900">
                Variant A
              </h3>
              <Badge
                variant="outline"
                class="text-xs"
              >
                Control
              </Badge>
            </div>
            <Badge
              v-if="winnerVariant === 'A'"
              variant="default"
              class="bg-green-600"
            >
              <Icon
                name="lucide:crown"
                class="w-3 h-3 mr-1"
              />
              Winner
            </Badge>
          </div>

          <!-- Subject Line -->
          <div class="space-y-1">
            <div class="text-sm text-gray-600">
              Subject Line
            </div>
            <div
              class="font-medium text-gray-900 p-2 bg-gray-100 rounded text-sm"
            >
              {{ abTest.variantA.subject }}
            </div>
          </div>

          <!-- Metrics -->
          <div class="grid grid-cols-2 gap-4">
            <div class="text-center">
              <div class="text-2xl font-bold text-blue-600">
                {{ abTest.variantA.sent.toLocaleString() }}
              </div>
              <div class="text-xs text-gray-600">
                Recipients
              </div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-green-600">
                {{ abTest.variantA.opens.toLocaleString() }}
              </div>
              <div class="text-xs text-gray-600">
                Opens
              </div>
            </div>
          </div>

          <!-- Rates -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">Open Rate</span>
              <span class="text-lg font-bold">{{ variantAOpenRate.toFixed(1) }}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                class="bg-green-600 h-2 rounded-full transition-all duration-500"
                :style="{ width: variantAOpenRate + '%' }"
              />
            </div>

            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">Click Rate</span>
              <span class="text-lg font-bold">{{ variantAClickRate.toFixed(1) }}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                class="bg-blue-600 h-2 rounded-full transition-all duration-500"
                :style="{ width: variantAClickRate + '%' }"
              />
            </div>
          </div>
        </div>

        <!-- Variant B -->
        <div
          class="border border-gray-200 rounded-lg p-6 space-y-4"
          :class="{
            'ring-2 ring-green-200 bg-green-50': winnerVariant === 'B',
          }"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <h3 class="text-lg font-semibold text-gray-900">
                Variant B
              </h3>
              <Badge
                variant="outline"
                class="text-xs"
              >
                Test
              </Badge>
            </div>
            <Badge
              v-if="winnerVariant === 'B'"
              variant="default"
              class="bg-green-600"
            >
              <Icon
                name="lucide:crown"
                class="w-3 h-3 mr-1"
              />
              Winner
            </Badge>
          </div>

          <!-- Subject Line -->
          <div class="space-y-1">
            <div class="text-sm text-gray-600">
              Subject Line
            </div>
            <div
              class="font-medium text-gray-900 p-2 bg-gray-100 rounded text-sm"
            >
              {{ abTest.variantB.subject }}
            </div>
          </div>

          <!-- Metrics -->
          <div class="grid grid-cols-2 gap-4">
            <div class="text-center">
              <div class="text-2xl font-bold text-blue-600">
                {{ abTest.variantB.sent.toLocaleString() }}
              </div>
              <div class="text-xs text-gray-600">
                Recipients
              </div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-green-600">
                {{ abTest.variantB.opens.toLocaleString() }}
              </div>
              <div class="text-xs text-gray-600">
                Opens
              </div>
            </div>
          </div>

          <!-- Rates -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">Open Rate</span>
              <span class="text-lg font-bold">{{ variantBOpenRate.toFixed(1) }}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                class="bg-green-600 h-2 rounded-full transition-all duration-500"
                :style="{ width: variantBOpenRate + '%' }"
              />
            </div>

            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">Click Rate</span>
              <span class="text-lg font-bold">{{ variantBClickRate.toFixed(1) }}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                class="bg-blue-600 h-2 rounded-full transition-all duration-500"
                :style="{ width: variantBClickRate + '%' }"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Performance Comparison -->
      <div class="space-y-4">
        <h4 class="font-semibold text-gray-900">
          Performance Analysis
        </h4>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Open Rate Difference -->
          <div class="p-4 border border-gray-200 rounded-lg">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-900">Open Rate Difference</span>
              <div class="flex items-center space-x-1">
                <Icon
                  :name="
                    openRateDifference >= 0
                      ? 'lucide:trending-up'
                      : 'lucide:trending-down'
                  "
                  :class="
                    openRateDifference >= 0 ? 'text-green-600' : 'text-red-600'
                  "
                  class="w-4 h-4"
                />
                <span
                  class="font-bold"
                  :class="
                    openRateDifference >= 0 ? 'text-green-600' : 'text-red-600'
                  "
                >
                  {{ openRateDifference >= 0 ? "+" : ""
                  }}{{ openRateDifference.toFixed(1) }}%
                </span>
              </div>
            </div>
            <Progress
              :value="Math.abs(openRateDifference) * 2"
              class="h-2"
              :class="
                openRateDifference >= 0 ? 'text-green-600' : 'text-red-600'
              "
            />
            <p class="text-xs text-gray-600 mt-1">
              Variant B
              {{ openRateDifference >= 0 ? "outperformed" : "underperformed" }}
              Variant A
            </p>
          </div>

          <!-- Click Rate Difference -->
          <div class="p-4 border border-gray-200 rounded-lg">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-900">Click Rate Difference</span>
              <div class="flex items-center space-x-1">
                <Icon
                  :name="
                    clickRateDifference >= 0
                      ? 'lucide:trending-up'
                      : 'lucide:trending-down'
                  "
                  :class="
                    clickRateDifference >= 0 ? 'text-green-600' : 'text-red-600'
                  "
                  class="w-4 h-4"
                />
                <span
                  class="font-bold"
                  :class="
                    clickRateDifference >= 0 ? 'text-green-600' : 'text-red-600'
                  "
                >
                  {{ clickRateDifference >= 0 ? "+" : ""
                  }}{{ clickRateDifference.toFixed(1) }}%
                </span>
              </div>
            </div>
            <Progress
              :value="Math.abs(clickRateDifference) * 2"
              class="h-2"
              :class="
                clickRateDifference >= 0 ? 'text-green-600' : 'text-red-600'
              "
            />
            <p class="text-xs text-gray-600 mt-1">
              Variant B
              {{ clickRateDifference >= 0 ? "outperformed" : "underperformed" }}
              Variant A
            </p>
          </div>
        </div>
      </div>

      <!-- Statistical Significance -->
      <div class="p-4 border-l-4 border-blue-500 bg-blue-50 rounded-r-lg">
        <div class="flex items-start space-x-3">
          <Icon
            name="lucide:bar-chart-3"
            class="w-5 h-5 text-blue-600 mt-0.5"
          />
          <div>
            <h5 class="font-medium text-blue-900">
              Statistical Analysis
            </h5>
            <div class="text-sm text-blue-800 mt-1 space-y-1">
              <p>
                <strong>Confidence Level:</strong> {{ confidenceLevel }}%
                {{
                  isStatisticallySignificant
                    ? "(Statistically Significant)"
                    : "(Not Significant)"
                }}
              </p>
              <p>
                <strong>Sample Size:</strong>
                {{ totalSampleSize.toLocaleString() }} recipients
              </p>
              <p v-if="hasWinner">
                <strong>Recommendation:</strong> Use
                {{ winnerVariant === "A" ? "Variant A" : "Variant B" }} ({{
                  winnerVariant === "A" ? "Control" : "Test"
                }}) for future campaigns
              </p>
              <p v-else>
                <strong>Recommendation:</strong> Continue testing or increase
                sample size for conclusive results
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Time Series Chart -->
      <div v-if="timeSeriesData.length > 0">
        <h4 class="font-semibold text-gray-900 mb-4">
          Performance Over Time
        </h4>
        <div class="h-64 w-full">
          <LineChart
            :data="timeSeriesData"
            :margin="{ top: 5, right: 30, left: 20, bottom: 5 }"
          >
            <CartesianGrid stroke-dasharray="3 3" />
            <XAxis
              data-key="time"
              tick="{{"
              fontSize:
              12
              }}
            /> <YAxis
              tick="{{"
              fontSize:
              12
              }}
            />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              data-key="variantA"
              stroke="#3b82f6"
              stroke-width="2"
              name="Variant A"
            />
            <Line
              type="monotone"
              data-key="variantB"
              stroke="#10b981"
              stroke-width="2"
              name="Variant B"
            />
          </LineChart>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <Button
          variant="outline"
          @click="exportResults"
        >
          <Icon
            name="lucide:download"
            class="w-4 h-4 mr-2"
          />
          Export Results
        </Button>

        <Button
          v-if="hasWinner"
          :disabled="abTest.status !== 'completed'"
          @click="sendWinningVariant"
        >
          <Icon
            name="lucide:send"
            class="w-4 h-4 mr-2"
          />
          Send Winning Variant
        </Button>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

interface ABTestData {
  id: number
  status: 'running' | 'completed' | 'stopped'
  startDate: string
  endDate?: string
  variantA: {
    subject: string
    sent: number
    opens: number
    clicks: number
  }
  variantB: {
    subject: string
    sent: number
    opens: number
    clicks: number
  }
}

interface Props {
  abTest: ABTestData
}

interface Emits {
  (e: 'export-results'): void
  (e: 'send-winning-variant', variant: 'A' | 'B'): void
  (e: 'duplicate-winner', variant: 'A' | 'B'): void
  (e: 'stop-test'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Computed
const variantAOpenRate = computed(() => {
  return props.abTest.variantA.sent > 0
    ? (props.abTest.variantA.opens / props.abTest.variantA.sent) * 100
    : 0
})

const variantBOpenRate = computed(() => {
  return props.abTest.variantB.sent > 0
    ? (props.abTest.variantB.opens / props.abTest.variantB.sent) * 100
    : 0
})

const variantAClickRate = computed(() => {
  return props.abTest.variantA.sent > 0
    ? (props.abTest.variantA.clicks / props.abTest.variantA.sent) * 100
    : 0
})

const variantBClickRate = computed(() => {
  return props.abTest.variantB.sent > 0
    ? (props.abTest.variantB.clicks / props.abTest.variantB.sent) * 100
    : 0
})

const openRateDifference = computed(() => {
  return variantBOpenRate.value - variantAOpenRate.value
})

const clickRateDifference = computed(() => {
  return variantBClickRate.value - variantAClickRate.value
})

const winnerVariant = computed(() => {
  if (!isStatisticallySignificant.value) return null
  return variantBOpenRate.value > variantAOpenRate.value ? 'B' : 'A'
})

const hasWinner = computed(() => {
  return winnerVariant.value !== null && isStatisticallySignificant.value
})

const totalSampleSize = computed(() => {
  return props.abTest.variantA.sent + props.abTest.variantB.sent
})

const confidenceLevel = computed(() => {
  // Simplified confidence calculation based on sample size and difference
  const difference = Math.abs(openRateDifference.value)
  const sampleSize = totalSampleSize.value

  if (sampleSize < 100) return 60
  if (difference < 1) return 70
  if (difference < 3) return 85
  if (difference < 5) return 92
  return 98
})

const isStatisticallySignificant = computed(() => {
  return confidenceLevel.value >= 90 && totalSampleSize.value >= 100
})

const confidenceColor = computed(() => {
  if (confidenceLevel.value >= 95) return 'text-green-600'
  if (confidenceLevel.value >= 90) return 'text-yellow-600'
  return 'text-red-600'
})

const testStatusVariant = computed(() => {
  switch (props.abTest.status) {
    case 'running':
      return 'default'
    case 'completed':
      return 'default'
    case 'stopped':
      return 'destructive'
    default:
      return 'secondary'
  }
})

const testDuration = computed(() => {
  const start = new Date(props.abTest.startDate)
  const end = props.abTest.endDate
    ? new Date(props.abTest.endDate)
    : new Date()
  const days = Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  )

  if (days === 1) return '1 day'
  if (days < 7) return `${days} days`
  if (days < 30) return `${Math.floor(days / 7)} weeks`
  return `${Math.floor(days / 30)} months`
})

// Mock time series data - in reality this would come from the API
const timeSeriesData = computed(() => {
  // Generate hourly data points for the last 24 hours
  const data = []
  const now = new Date()

  for (let i = 23; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000)
    data.push({
      time: time.toLocaleTimeString('en-US', { hour: '2-digit' }),
      variantA: variantAOpenRate.value * (0.8 + Math.random() * 0.4),
      variantB: variantBOpenRate.value * (0.8 + Math.random() * 0.4),
    })
  }

  return data
})

// Methods
const exportResults = () => {
  emit('export-results')
}

const sendWinningVariant = () => {
  if (winnerVariant.value) {
    emit('send-winning-variant', winnerVariant.value)
  }
}

const duplicateWinner = () => {
  if (winnerVariant.value) {
    emit('duplicate-winner', winnerVariant.value)
  }
}

const stopTest = () => {
  emit('stop-test')
}
</script>
