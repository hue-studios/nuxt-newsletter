<template>
  <Card>
    <CardHeader>
      <CardTitle>A/B Test Results</CardTitle>
      <CardDescription>
        Compare performance between your two newsletter versions
      </CardDescription>
    </CardHeader>

    <CardContent class="space-y-6">
      <!-- Test Overview -->
      <div class="grid grid-cols-2 gap-6">
        <!-- Version A -->
        <div class="border border-gray-200 rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <h4 class="font-medium text-gray-900">Version A (Control)</h4>
            <Badge
              :variant="winningVersion === 'A' ? 'default' : 'secondary'"
              v-if="testComplete"
            >
              {{ winningVersion === "A" ? "Winner" : "Loser" }}
            </Badge>
          </div>

          <div class="space-y-3">
            <div>
              <p class="text-sm text-gray-600">Subject Line</p>
              <p class="font-medium">{{ abTest.subjectA }}</p>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <p class="text-sm text-gray-600">Sent</p>
                <p class="text-lg font-bold">
                  {{ abTest.sentA?.toLocaleString() }}
                </p>
              </div>
              <div>
                <p class="text-sm text-gray-600">Opens</p>
                <p class="text-lg font-bold text-green-600">
                  {{ abTest.opensA?.toLocaleString() }}
                </p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <p class="text-sm text-gray-600">Open Rate</p>
                <p class="text-xl font-bold">
                  {{
                    (
                      ((abTest.opensA || 0) / (abTest.sentA || 1)) *
                      100
                    ).toFixed(1)
                  }}%
                </p>
              </div>
              <div>
                <p class="text-sm text-gray-600">Clicks</p>
                <p class="text-lg font-bold text-blue-600">
                  {{ abTest.clicksA?.toLocaleString() }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Version B -->
        <div class="border border-gray-200 rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <h4 class="font-medium text-gray-900">Version B (Variant)</h4>
            <Badge
              :variant="winningVersion === 'B' ? 'default' : 'secondary'"
              v-if="testComplete"
            >
              {{ winningVersion === "B" ? "Winner" : "Loser" }}
            </Badge>
          </div>

          <div class="space-y-3">
            <div>
              <p class="text-sm text-gray-600">Subject Line</p>
              <p class="font-medium">{{ abTest.subjectB }}</p>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <p class="text-sm text-gray-600">Sent</p>
                <p class="text-lg font-bold">
                  {{ abTest.sentB?.toLocaleString() }}
                </p>
              </div>
              <div>
                <p class="text-sm text-gray-600">Opens</p>
                <p class="text-lg font-bold text-green-600">
                  {{ abTest.opensB?.toLocaleString() }}
                </p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <p class="text-sm text-gray-600">Open Rate</p>
                <p class="text-xl font-bold">
                  {{
                    (
                      ((abTest.opensB || 0) / (abTest.sentB || 1)) *
                      100
                    ).toFixed(1)
                  }}%
                </p>
              </div>
              <div>
                <p class="text-sm text-gray-600">Clicks</p>
                <p class="text-lg font-bold text-blue-600">
                  {{ abTest.clicksB?.toLocaleString() }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Performance Comparison -->
      <div class="bg-gray-50 rounded-lg p-4">
        <h4 class="font-medium text-gray-900 mb-3">Performance Comparison</h4>

        <div class="grid grid-cols-2 gap-6">
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm text-gray-600">Open Rate Difference</span>
              <span
                class="text-sm font-medium"
                :class="{
                  'text-green-600': openRateDifference > 0,
                  'text-red-600': openRateDifference < 0,
                  'text-gray-600': openRateDifference === 0,
                }"
              >
                {{ openRateDifference > 0 ? "+" : ""
                }}{{ openRateDifference.toFixed(1) }}%
              </span>
            </div>
            <Progress
              :value="Math.abs(openRateDifference) * 10"
              class="h-2"
              :class="{
                'text-green-600': openRateDifference > 0,
                'text-red-600': openRateDifference < 0,
              }"
            />
          </div>

          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm text-gray-600">Click Rate Difference</span>
              <span
                class="text-sm font-medium"
                :class="{
                  'text-green-600': clickRateDifference > 0,
                  'text-red-600': clickRateDifference < 0,
                  'text-gray-600': clickRateDifference === 0,
                }"
              >
                {{ clickRateDifference > 0 ? "+" : ""
                }}{{ clickRateDifference.toFixed(1) }}%
              </span>
            </div>
            <Progress
              :value="Math.abs(clickRateDifference) * 10"
              class="h-2"
              :class="{
                'text-green-600': clickRateDifference > 0,
                'text-red-600': clickRateDifference < 0,
              }"
            />
          </div>
        </div>
      </div>

      <!-- Statistical Significance -->
      <div
        v-if="testComplete"
        class="border-l-4 border-blue-500 bg-blue-50 p-4"
      >
        <div class="flex items-start">
          <Icon
            name="lucide:trending-up"
            class="w-5 h-5 text-blue-600 mt-0.5 mr-3"
          />
          <div>
            <p class="font-medium text-blue-900">Test Results</p>
            <p class="text-sm text-blue-800 mt-1">
              Version {{ winningVersion }} performed
              {{ Math.abs(openRateDifference).toFixed(1) }}% better with
              {{ confidenceLevel }}% confidence.
              {{
                statisticallySignificant
                  ? "This difference is statistically significant."
                  : "This difference is not statistically significant."
              }}
            </p>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div v-if="testComplete" class="flex justify-end space-x-3">
        <Button variant="outline" @click="exportResults">
          <Icon name="lucide:download" class="w-4 h-4 mr-2" />
          Export Results
        </Button>
        <Button @click="sendWinningVersion">
          <Icon name="lucide:send" class="w-4 h-4 mr-2" />
          Send Winning Version
        </Button>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
interface ABTestData {
  subjectA: string;
  subjectB: string;
  sentA?: number;
  opensA?: number;
  clicksA?: number;
  sentB?: number;
  opensB?: number;
  clicksB?: number;
  startDate: string;
  endDate?: string;
  status: "running" | "completed";
}

interface Props {
  abTest: ABTestData;
}

interface Emits {
  (e: "export-results"): void;
  (e: "send-winning-version", version: "A" | "B"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Computed
const testComplete = computed(() => props.abTest.status === "completed");

const openRateA = computed(() => {
  return props.abTest.sentA
    ? ((props.abTest.opensA || 0) / props.abTest.sentA) * 100
    : 0;
});

const openRateB = computed(() => {
  return props.abTest.sentB
    ? ((props.abTest.opensB || 0) / props.abTest.sentB) * 100
    : 0;
});

const clickRateA = computed(() => {
  return props.abTest.sentA
    ? ((props.abTest.clicksA || 0) / props.abTest.sentA) * 100
    : 0;
});

const clickRateB = computed(() => {
  return props.abTest.sentB
    ? ((props.abTest.clicksB || 0) / props.abTest.sentB) * 100
    : 0;
});

const openRateDifference = computed(() => {
  return openRateB.value - openRateA.value;
});

const clickRateDifference = computed(() => {
  return clickRateB.value - clickRateA.value;
});

const winningVersion = computed(() => {
  return openRateB.value > openRateA.value ? "B" : "A";
});

const confidenceLevel = computed(() => {
  // Simplified confidence calculation
  const difference = Math.abs(openRateDifference.value);
  if (difference > 5) return 95;
  if (difference > 3) return 90;
  if (difference > 1) return 80;
  return 60;
});

const statisticallySignificant = computed(() => {
  return confidenceLevel.value >= 90;
});

// Methods
const exportResults = () => {
  emit("export-results");
};

const sendWinningVersion = () => {
  emit("send-winning-version", winningVersion.value);
};
</script>
