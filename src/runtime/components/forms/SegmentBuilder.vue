<!-- src/runtime/components/forms/SegmentBuilder.vue -->
<template>
  <div class="segment-builder space-y-6">
    <!-- Header -->
    <div>
      <h3 class="text-lg font-medium text-gray-900">Audience Segmentation</h3>
      <p class="text-sm text-gray-600 mt-1">
        Create custom audience segments based on subscriber data and behavior
      </p>
    </div>

    <!-- Segment Name -->
    <div>
      <Label for="segment-name" class="text-sm font-medium">Segment Name</Label>
      <Input
        id="segment-name"
        v-model="segmentName"
        placeholder="e.g., Engaged Users, VIP Customers"
        class="mt-1"
      />
    </div>

    <!-- Segment Rules -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h4 class="font-medium text-gray-900">Conditions</h4>
        <Badge variant="outline"> {{ segmentRules.length }} rules </Badge>
      </div>

      <div
        v-for="(rule, index) in segmentRules"
        :key="rule.id"
        class="border border-gray-200 rounded-lg p-4 space-y-3"
      >
        <!-- Rule Header -->
        <div class="flex items-center justify-between">
          <!-- Connector -->
          <div class="flex items-center space-x-2">
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
            <Badge variant="secondary" class="text-xs">
              Rule {{ index + 1 }}
            </Badge>
          </div>

          <!-- Remove Rule -->
          <Button
            variant="ghost"
            size="sm"
            :disabled="segmentRules.length === 1"
            @click="removeRule(rule.id)"
          >
            <Icon name="lucide:x" class="w-4 h-4" />
          </Button>
        </div>

        <!-- Rule Configuration -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Field -->
          <div>
            <Label class="text-sm">Field</Label>
            <Select
              v-model="rule.field"
              @update:model-value="onFieldChange(rule)"
            >
              <SelectTrigger class="mt-1">
                <SelectValue placeholder="Select field" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Basic Info</SelectLabel>
                  <SelectItem value="email"> Email </SelectItem>
                  <SelectItem value="name"> Name </SelectItem>
                  <SelectItem value="status"> Status </SelectItem>
                  <SelectItem value="subscription_source"> Source </SelectItem>
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Behavior</SelectLabel>
                  <SelectItem value="engagement_score">
                    Engagement Score
                  </SelectItem>
                  <SelectItem value="last_email_opened">
                    Last Email Opened
                  </SelectItem>
                  <SelectItem value="total_opens"> Total Opens </SelectItem>
                  <SelectItem value="total_clicks"> Total Clicks </SelectItem>
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Dates</SelectLabel>
                  <SelectItem value="subscribed_at">
                    Subscribe Date
                  </SelectItem>
                  <SelectItem value="last_activity"> Last Activity </SelectItem>
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Custom Fields</SelectLabel>
                  <SelectItem value="company"> Company </SelectItem>
                  <SelectItem value="job_title"> Job Title </SelectItem>
                  <SelectItem value="location"> Location </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <!-- Operator -->
          <div>
            <Label class="text-sm">Condition</Label>
            <Select
              v-model="rule.operator"
              @update:model-value="onOperatorChange(rule)"
            >
              <SelectTrigger class="mt-1">
                <SelectValue placeholder="Select condition" />
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
          <div>
            <Label class="text-sm">Value</Label>
            <div class="mt-1">
              <!-- Text Input -->
              <Input
                v-if="getInputType(rule) === 'text'"
                v-model="rule.value"
                :placeholder="getPlaceholder(rule)"
              />

              <!-- Number Input -->
              <Input
                v-else-if="getInputType(rule) === 'number'"
                v-model="rule.value"
                type="number"
                :placeholder="getPlaceholder(rule)"
              />

              <!-- Date Input -->
              <Input
                v-else-if="getInputType(rule) === 'date'"
                v-model="rule.value"
                type="date"
              />

              <!-- Select Input -->
              <Select
                v-else-if="getInputType(rule) === 'select'"
                v-model="rule.value"
              >
                <SelectTrigger>
                  <SelectValue :placeholder="getPlaceholder(rule)" />
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

              <!-- Multi-select for preferences -->
              <div
                v-else-if="getInputType(rule) === 'multi-select'"
                class="space-y-2"
              >
                <div
                  v-for="option in getOptionsForField(rule.field)"
                  :key="option.value"
                  class="flex items-center space-x-2"
                >
                  <Checkbox
                    :id="`${rule.id}-${option.value}`"
                    :checked="isValueSelected(rule, option.value)"
                    @update:checked="
                      toggleMultiValue(rule, option.value, $event)
                    "
                  />
                  <Label :for="`${rule.id}-${option.value}`" class="text-sm">
                    {{ option.label }}
                  </Label>
                </div>
              </div>

              <!-- No value needed -->
              <div
                v-else-if="getInputType(rule) === 'none'"
                class="text-sm text-gray-500 py-2"
              >
                No additional value needed
              </div>
            </div>
          </div>
        </div>

        <!-- Rule Description -->
        <div class="text-xs text-gray-600 bg-gray-50 p-2 rounded">
          {{ getRuleDescription(rule) }}
        </div>
      </div>

      <!-- Add Rule Button -->
      <Button variant="outline" class="w-full" @click="addRule">
        <Icon name="lucide:plus" class="w-4 h-4 mr-2" />
        Add Another Rule
      </Button>
    </div>

    <!-- Segment Preview -->
    <div class="bg-gray-50 rounded-lg p-4">
      <div class="flex items-center justify-between mb-3">
        <h4 class="font-medium text-gray-900">Segment Preview</h4>
        <div class="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            :disabled="isCalculating || !canCalculate"
            @click="calculateSegment"
          >
            <Icon
              name="lucide:refresh-cw"
              class="w-4 h-4 mr-1"
              :class="{ 'animate-spin': isCalculating }"
            />
            Calculate
          </Button>

          <Button
            v-if="segmentPreview"
            variant="outline"
            size="sm"
            @click="exportSegment"
          >
            <Icon name="lucide:download" class="w-4 h-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      <div v-if="segmentPreview" class="space-y-4">
        <!-- Stats -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="text-center">
            <div class="text-2xl font-bold text-blue-600">
              {{ segmentPreview.matchedCount.toLocaleString() }}
            </div>
            <div class="text-sm text-gray-600">Matching Subscribers</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-green-600">
              {{ segmentPreview.percentage.toFixed(1) }}%
            </div>
            <div class="text-sm text-gray-600">of Total Audience</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-purple-600">
              {{ segmentPreview.avgEngagement.toFixed(1) }}
            </div>
            <div class="text-sm text-gray-600">Avg. Engagement Score</div>
          </div>
        </div>

        <!-- Sample Subscribers -->
        <div v-if="segmentPreview.sampleSubscribers.length > 0">
          <h5 class="text-sm font-medium text-gray-900 mb-2">
            Sample Subscribers
          </h5>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div
              v-for="subscriber in segmentPreview.sampleSubscribers.slice(0, 6)"
              :key="subscriber.id"
              class="flex items-center space-x-2 text-xs bg-white p-2 rounded border"
            >
              <div
                class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center"
              >
                <Icon name="lucide:user" class="w-3 h-3 text-blue-600" />
              </div>
              <div>
                <div class="font-medium">
                  {{ subscriber.name }}
                </div>
                <div class="text-gray-500">
                  {{ subscriber.email }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Segment Health -->
        <div class="border-t pt-4">
          <h5 class="text-sm font-medium text-gray-900 mb-2">Segment Health</h5>
          <div class="space-y-2">
            <div class="flex items-center justify-between text-sm">
              <span>Size</span>
              <Badge :variant="getSizeVariant(segmentPreview.matchedCount)">
                {{ getSizeLabel(segmentPreview.matchedCount) }}
              </Badge>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span>Engagement</span>
              <Badge
                :variant="getEngagementVariant(segmentPreview.avgEngagement)"
              >
                {{ getEngagementLabel(segmentPreview.avgEngagement) }}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="!isCalculating" class="text-center text-gray-500 py-8">
        <Icon
          name="lucide:users"
          class="w-12 h-12 mx-auto mb-2 text-gray-400"
        />
        <p class="text-sm">
          Configure your rules and click "Calculate" to preview the segment
        </p>
      </div>

      <div v-else class="text-center text-gray-500 py-8">
        <Icon
          name="lucide:loader-2"
          class="w-8 h-8 mx-auto mb-2 animate-spin"
        />
        <p class="text-sm">Calculating segment...</p>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex justify-end space-x-3">
      <Button variant="outline" @click="$emit('cancel')"> Cancel </Button>
      <Button
        :disabled="
          !segmentPreview ||
          segmentPreview.matchedCount === 0 ||
          !segmentName.trim()
        "
        @click="saveSegment"
      >
        <Icon name="lucide:save" class="w-4 h-4 mr-2" />
        Save Segment
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { SegmentRule as NewsletterSegmentRule } from "../../types/newsletter";
interface SegmentRule extends NewsletterSegmentRule {
  id: string;
  connector: "AND" | "OR";
}

interface SegmentPreview {
  matchedCount: number;
  totalCount: number;
  percentage: number;
  avgEngagement: number;
  sampleSubscribers: Array<{
    id: number;
    name: string;
    email: string;
    engagement_score: number;
  }>;
}

interface Emits {
  (
    e: "save",
    data: { name: string; rules: SegmentRule[]; preview: SegmentPreview }
  ): void;
  (e: "cancel"): void;
}

const emit = defineEmits<Emits>();

// State
const segmentName = ref("");
const segmentRules = ref<SegmentRule[]>([
  {
    id: generateRuleId(),
    connector: "AND",
    field: "",
    operator: "" as string,
    value: "",
  },
]);
const segmentPreview = ref<SegmentPreview | null>(null);
const isCalculating = ref(false);

// Field operators mapping
const fieldOperators = {
  // Text fields
  email: [
    { value: "contains", label: "contains" },
    { value: "not_contains", label: "does not contain" },
    { value: "equals", label: "equals" },
    { value: "not_equals", label: "does not equal" },
  ],
  name: [
    { value: "contains", label: "contains" },
    { value: "not_contains", label: "does not contain" },
    { value: "equals", label: "equals" },
    { value: "is_empty", label: "is empty" },
  ],

  // Status fields
  status: [
    { value: "equals", label: "is" },
    { value: "not_equals", label: "is not" },
  ],

  // Numeric fields
  engagement_score: [
    { value: "greater_than", label: "greater than" },
    { value: "less_than", label: "less than" },
    { value: "equals", label: "equals" },
    { value: "between", label: "between" },
  ],
  total_opens: [
    { value: "greater_than", label: "greater than" },
    { value: "less_than", label: "less than" },
    { value: "equals", label: "equals" },
  ],

  // Date fields
  subscribed_at: [
    { value: "after", label: "after" },
    { value: "before", label: "before" },
    { value: "between", label: "between" },
    { value: "last_days", label: "in the last X days" },
  ],
  last_email_opened: [
    { value: "after", label: "after" },
    { value: "before", label: "before" },
    { value: "is_null", label: "never opened" },
    { value: "last_days", label: "in the last X days" },
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

// Computed
const canCalculate = computed(() => {
  return segmentRules.value.every(
    (rule: { field: any; operator: string; value: any }) =>
      rule.field &&
      rule.operator &&
      (rule.value || ["is_null", "is_empty"].includes(rule.operator))
  );
});

// Methods
function generateRuleId() {
  return Math.random().toString(36).substr(2, 9);
}

function addRule() {
  segmentRules.value.push({
    id: generateRuleId(),
    connector: "AND",
    field: "",
    operator: "",
    value: "",
  });
}

function removeRule(ruleId: string) {
  segmentRules.value = segmentRules.value.filter(
    (rule: { id: string }) => rule.id !== ruleId
  );
}

function onFieldChange(rule: SegmentRule) {
  rule.operator = "";
  rule.value = "";
}

function onOperatorChange(rule: SegmentRule) {
  rule.value = "";
}

function getOperatorsForField(field: string) {
  return fieldOperators[field as keyof typeof fieldOperators] || [];
}

function getOptionsForField(field: string) {
  return fieldOptions[field as keyof typeof fieldOptions] || [];
}

// function getInputType(rule: SegmentRule) {
//   if (["is_null", "is_empty"].includes(rule.operator)) {
//     return "none";
//   }

//   if (["status", "subscription_source"].includes(rule.field)) {
//     return "select";
//   }

//   if (
//     ["engagement_score", "total_opens", "total_clicks"].includes(rule.field)
//   ) {
//     return "number";
//   }

//   if (
//     ["subscribed_at", "last_email_opened", "last_activity"].includes(rule.field)
//   ) {
//     return "date";
//   }

//   return "text";
// }

const getInputType = (rule: SegmentRule): string => {
  if (rule.type === "multi-select") {
    return "multi-select";
  }
  return rule.type || "none";
};

function getPlaceholder(rule: SegmentRule) {
  const placeholders: Record<string, string> = {
    email: "user@example.com",
    name: "John Doe",
    company: "Acme Corp",
    engagement_score: "75",
    total_opens: "10",
    last_days: "30",
  };

  return placeholders[rule.field] || "Enter value...";
}

function isValueSelected(rule: SegmentRule, value: string) {
  if (Array.isArray(rule.value)) {
    return rule.value.includes(value);
  }
  return rule.value === value;
}

function toggleMultiValue(rule: SegmentRule, value: string, checked: boolean) {
  if (!Array.isArray(rule.value)) {
    rule.value = [];
  }

  if (checked) {
    rule.value.push(value);
  } else {
    rule.value = rule.value.filter((v) => v !== value);
  }
}

function getRuleDescription(rule: SegmentRule) {
  if (!rule.field || !rule.operator) return "Configure rule to see description";

  const fieldName = rule.field.replace(/_/g, " ");
  const operator =
    getOperatorsForField(rule.field).find((op) => op.value === rule.operator)
      ?.label || rule.operator;

  let valueText = rule.value;
  if (Array.isArray(rule.value)) {
    valueText = rule.value.join(", ");
  } else if (["is_null", "is_empty"].includes(rule.operator)) {
    valueText = "";
  }

  return `Subscribers whose ${fieldName} ${operator} ${valueText}`.trim();
}

async function calculateSegment() {
  isCalculating.value = true;

  try {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Mock calculation result
    const mockResult: SegmentPreview = {
      matchedCount: Math.floor(Math.random() * 1000) + 100,
      totalCount: 5000,
      percentage: 0,
      avgEngagement: Math.random() * 100,
      sampleSubscribers: [
        {
          id: 1,
          name: "John Doe",
          email: "john@example.com",
          engagement_score: 85,
        },
        {
          id: 2,
          name: "Jane Smith",
          email: "jane@example.com",
          engagement_score: 92,
        },
        {
          id: 3,
          name: "Bob Johnson",
          email: "bob@example.com",
          engagement_score: 78,
        },
        {
          id: 4,
          name: "Alice Wilson",
          email: "alice@example.com",
          engagement_score: 88,
        },
        {
          id: 5,
          name: "Charlie Brown",
          email: "charlie@example.com",
          engagement_score: 76,
        },
        {
          id: 6,
          name: "Diana Ross",
          email: "diana@example.com",
          engagement_score: 95,
        },
      ],
    };

    mockResult.percentage =
      (mockResult.matchedCount / mockResult.totalCount) * 100;
    segmentPreview.value = mockResult;
  } catch (error) {
    console.error("Failed to calculate segment:", error);
  } finally {
    isCalculating.value = false;
  }
}

function getSizeVariant(count: number) {
  if (count < 100) return "destructive";
  if (count < 500) return "secondary";
  return "default";
}

function getSizeLabel(count: number) {
  if (count < 100) return "Small";
  if (count < 500) return "Medium";
  if (count < 1000) return "Large";
  return "Very Large";
}

function getEngagementVariant(score: number) {
  if (score < 50) return "destructive";
  if (score < 75) return "secondary";
  return "default";
}

function getEngagementLabel(score: number) {
  if (score < 30) return "Low";
  if (score < 50) return "Below Average";
  if (score < 75) return "Average";
  if (score < 90) return "Good";
  return "Excellent";
}

function exportSegment() {
  if (!segmentPreview.value) return;

  const data = {
    name: segmentName.value,
    rules: segmentRules.value,
    preview: segmentPreview.value,
    exported_at: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `segment-${segmentName.value
    .replace(/\s+/g, "-")
    .toLowerCase()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function saveSegment() {
  if (!segmentPreview.value || !segmentName.value.trim()) return;

  emit("save", {
    name: segmentName.value,
    rules: segmentRules.value,
    preview: segmentPreview.value,
  });
}
</script>
