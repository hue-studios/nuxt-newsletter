<template>
  <div class="segment-builder">
    <div class="space-y-6">
      <!-- Header -->
      <div>
        <h3 class="text-lg font-medium text-gray-900">Audience Segmentation</h3>
        <p class="text-sm text-gray-600 mt-1">
          Create custom audience segments based on subscriber data
        </p>
      </div>

      <!-- Segment Rules -->
      <div class="space-y-4">
        <div
          v-for="(rule, index) in segmentRules"
          :key="index"
          class="border border-gray-200 rounded-lg p-4"
        >
          <div class="flex items-center space-x-4">
            <!-- Connector -->
            <div v-if="index > 0" class="w-16">
              <Select v-model="rule.connector">
                <SelectTrigger class="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AND"> AND </SelectItem>
                  <SelectItem value="OR"> OR </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div v-else class="w-16 text-sm font-medium text-gray-700">
              WHERE
            </div>

            <!-- Field -->
            <div class="flex-1">
              <Select v-model="rule.field">
                <SelectTrigger>
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="status"> Status </SelectItem>
                  <SelectItem value="subscription_source"> Source </SelectItem>
                  <SelectItem value="subscription_preferences">
                    Preferences
                  </SelectItem>
                  <SelectItem value="engagement_score">
                    Engagement Score
                  </SelectItem>
                  <SelectItem value="subscribed_at">
                    Subscribe Date
                  </SelectItem>
                  <SelectItem value="last_email_opened">
                    Last Opened
                  </SelectItem>
                  <SelectItem value="company"> Company </SelectItem>
                  <SelectItem value="job_title"> Job Title </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <!-- Operator -->
            <div class="flex-1">
              <Select v-model="rule.operator">
                <SelectTrigger>
                  <SelectValue placeholder="Operator" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="op in getOperatorsForField(rule.field)"
                    :key="op.value"
                    :value="op.value"
                  >
                    {{ op.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <!-- Value -->
            <div class="flex-1">
              <Input
                v-if="isTextInput(rule.field, rule.operator)"
                v-model="rule.value"
                placeholder="Enter value"
              />
              <Input
                v-else-if="isNumberInput(rule.field)"
                v-model="rule.value"
                type="number"
                placeholder="Enter number"
              />
              <Input
                v-else-if="isDateInput(rule.field)"
                v-model="rule.value"
                type="date"
              />
              <Select
                v-else-if="isSelectInput(rule.field)"
                v-model="rule.value"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select value" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="option in getOptionsForField(rule.field)"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <!-- Remove Rule -->
            <Button
              variant="ghost"
              size="sm"
              :disabled="segmentRules.length === 1"
              @click="removeRule(index)"
            >
              <Icon name="lucide:x" class="w-4 h-4" />
            </Button>
          </div>
        </div>

        <!-- Add Rule -->
        <Button variant="outline" class="w-full" @click="addRule">
          <Icon name="lucide:plus" class="w-4 h-4 mr-2" />
          Add Rule
        </Button>
      </div>

      <!-- Preview -->
      <div class="bg-gray-50 rounded-lg p-4">
        <div class="flex items-center justify-between mb-3">
          <h4 class="font-medium text-gray-900">Segment Preview</h4>
          <Button
            variant="outline"
            size="sm"
            :disabled="isCalculating"
            @click="calculateSegment"
          >
            <Icon
              name="lucide:refresh-cw"
              class="w-4 h-4 mr-1"
              :class="{ 'animate-spin': isCalculating }"
            />
            Calculate
          </Button>
        </div>

        <div v-if="segmentPreview" class="space-y-2">
          <div class="flex items-center space-x-4 text-sm">
            <div class="flex items-center space-x-2">
              <div class="w-3 h-3 bg-green-500 rounded-full" />
              <span class="font-medium"
                >{{ segmentPreview.matchedCount }} subscribers</span
              >
            </div>
            <div class="text-gray-600">
              {{
                (
                  (segmentPreview.matchedCount / segmentPreview.totalCount) *
                  100
                ).toFixed(1)
              }}% of total
            </div>
          </div>

          <!-- Sample Subscribers -->
          <div v-if="segmentPreview.sampleSubscribers.length > 0" class="mt-3">
            <p class="text-xs font-medium text-gray-700 mb-2">
              Sample subscribers:
            </p>
            <div class="space-y-1">
              <div
                v-for="subscriber in segmentPreview.sampleSubscribers.slice(
                  0,
                  3
                )"
                :key="subscriber.id"
                class="text-xs text-gray-600"
              >
                {{ subscriber.name }} ({{ subscriber.email }})
              </div>
            </div>
          </div>
        </div>

        <div v-else class="text-sm text-gray-600">
          Click "Calculate" to preview your segment
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-end space-x-3">
        <Button variant="outline" @click="$emit('cancel')"> Cancel </Button>
        <Button
          :disabled="!segmentPreview || segmentPreview.matchedCount === 0"
          @click="saveSegment"
        >
          Use This Segment
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, emit } from "vue";
interface SegmentRule {
  connector: "AND" | "OR";
  field: string;
  operator: string;
  value: string;
}

interface SegmentPreview {
  matchedCount: number;
  totalCount: number;
  sampleSubscribers: Array<{
    id: number;
    name: string;
    email: string;
  }>;
}

interface Emits {
  (e: "save", rules: SegmentRule[]): void;
  (e: "cancel"): void;
}

defineEmits<Emits>();

// State
const segmentRules = ref<SegmentRule[]>([
  {
    connector: "AND",
    field: "",
    operator: "",
    value: "",
  },
]);

const segmentPreview = ref<SegmentPreview | null>(null);
const isCalculating = ref(false);

// Field operators mapping
const fieldOperators = {
  status: [
    { value: "equals", label: "equals" },
    { value: "not_equals", label: "does not equal" },
  ],
  subscription_source: [
    { value: "equals", label: "equals" },
    { value: "not_equals", label: "does not equal" },
  ],
  subscription_preferences: [
    { value: "contains", label: "contains" },
    { value: "not_contains", label: "does not contain" },
  ],
  engagement_score: [
    { value: "greater_than", label: "greater than" },
    { value: "less_than", label: "less than" },
    { value: "equals", label: "equals" },
  ],
  subscribed_at: [
    { value: "after", label: "after" },
    { value: "before", label: "before" },
    { value: "between", label: "between" },
  ],
  last_email_opened: [
    { value: "after", label: "after" },
    { value: "before", label: "before" },
    { value: "is_null", label: "never opened" },
  ],
  company: [
    { value: "equals", label: "equals" },
    { value: "contains", label: "contains" },
    { value: "not_contains", label: "does not contain" },
  ],
  job_title: [
    { value: "equals", label: "equals" },
    { value: "contains", label: "contains" },
    { value: "not_contains", label: "does not contain" },
  ],
};

// Field options
const fieldOptions = {
  status: [
    { value: "active", label: "Active" },
    { value: "unsubscribed", label: "Unsubscribed" },
    { value: "bounced", label: "Bounced" },
    { value: "pending", label: "Pending" },
  ],
  subscription_source: [
    { value: "website", label: "Website" },
    { value: "import", label: "Import" },
    { value: "manual", label: "Manual" },
    { value: "event", label: "Event" },
    { value: "api", label: "API" },
  ],
};

// Methods
const addRule = () => {
  segmentRules.value.push({
    connector: "AND",
    field: "",
    operator: "",
    value: "",
  });
};

const removeRule = (index: number) => {
  segmentRules.value.splice(index, 1);
};

const getOperatorsForField = (field: string) => {
  return fieldOperators[field as keyof typeof fieldOperators] || [];
};

const getOptionsForField = (field: string) => {
  return fieldOptions[field as keyof typeof fieldOptions] || [];
};

const isTextInput = (field: string, operator: string) => {
  return (
    ["company", "job_title"].includes(field) && !["is_null"].includes(operator)
  );
};

const isNumberInput = (field: string) => {
  return ["engagement_score"].includes(field);
};

const isDateInput = (field: string) => {
  return ["subscribed_at", "last_email_opened"].includes(field);
};

const isSelectInput = (field: string) => {
  return ["status", "subscription_source"].includes(field);
};

const calculateSegment = async () => {
  isCalculating.value = true;

  try {
    // Simulate API call to calculate segment
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock response
    segmentPreview.value = {
      matchedCount: 234,
      totalCount: 1500,
      sampleSubscribers: [
        { id: 1, name: "John Doe", email: "john@example.com" },
        { id: 2, name: "Jane Smith", email: "jane@example.com" },
        { id: 3, name: "Bob Johnson", email: "bob@example.com" },
      ],
    };
  } catch (error) {
    console.error("Failed to calculate segment:", error);
  } finally {
    isCalculating.value = false;
  }
};

const saveSegment = () => {
  emit("save", segmentRules.value);
};
</script>
