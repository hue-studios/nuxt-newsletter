<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Schedule Newsletter</DialogTitle>
        <DialogDescription>
          Schedule your newsletter to be sent at a specific time
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-6">
        <!-- Newsletter Info -->
        <div class="bg-gray-50 rounded-lg p-4">
          <div class="flex items-center space-x-3">
            <Icon name="lucide:mail" class="w-5 h-5 text-gray-600" />
            <div>
              <h4 class="font-medium text-gray-900">
                {{ newsletter.title }}
              </h4>
              <p class="text-sm text-gray-600">
                {{ newsletter.subject_line }}
              </p>
            </div>
          </div>
        </div>

        <!-- Scheduling Options -->
        <div class="space-y-4">
          <div>
            <Label class="text-sm font-medium">Send Time</Label>
            <RadioGroup v-model="scheduleType" class="mt-2">
              <div class="flex items-center space-x-2">
                <RadioGroupItem id="now" value="now" />
                <Label for="now" class="text-sm">Send immediately</Label>
              </div>
              <div class="flex items-center space-x-2">
                <RadioGroupItem id="schedule" value="schedule" />
                <Label for="schedule" class="text-sm">Schedule for later</Label>
              </div>
            </RadioGroup>
          </div>

          <!-- Date/Time Picker -->
          <div
            v-if="scheduleType === 'schedule'"
            class="grid grid-cols-2 gap-4"
          >
            <div>
              <Label for="send-date" class="text-sm">Date</Label>
              <Input
                id="send-date"
                v-model="sendDate"
                type="date"
                :min="minDate"
                class="mt-1"
              />
            </div>
            <div>
              <Label for="send-time" class="text-sm">Time</Label>
              <Input
                id="send-time"
                v-model="sendTime"
                type="time"
                class="mt-1"
              />
            </div>
          </div>

          <!-- Timezone -->
          <div v-if="scheduleType === 'schedule'">
            <Label for="timezone" class="text-sm">Timezone</Label>
            <Select v-model="timezone">
              <SelectTrigger class="mt-1">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="tz in timezones"
                  :key="tz.value"
                  :value="tz.value"
                >
                  {{ tz.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Mailing List -->
          <div>
            <Label for="mailing-list" class="text-sm">Mailing List</Label>
            <Select v-model="selectedMailingList">
              <SelectTrigger class="mt-1">
                <SelectValue placeholder="Select mailing list" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="list in mailingLists"
                  :key="list.id"
                  :value="list.id.toString()"
                >
                  {{ list.name }} ({{ list.active_subscriber_count }}
                  subscribers)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- A/B Testing -->
          <div v-if="newsletter.is_ab_test" class="space-y-3">
            <div class="flex items-center space-x-2">
              <Checkbox id="enable-ab-test" v-model:checked="enableABTest" />
              <Label for="enable-ab-test" class="text-sm"
                >Enable A/B Testing</Label
              >
            </div>

            <div v-if="enableABTest" class="space-y-3 pl-6">
              <div>
                <Label class="text-sm">Test Percentage</Label>
                <Slider
                  v-model="abTestPercentage"
                  :min="5"
                  :max="50"
                  :step="5"
                  class="mt-2"
                />
                <p class="text-xs text-gray-600 mt-1">
                  {{ abTestPercentage[0] }}% of subscribers will receive each
                  version
                </p>
              </div>

              <div>
                <Label class="text-sm">Alternative Subject Line</Label>
                <Input
                  v-model="alternativeSubject"
                  placeholder="Alternative subject for testing..."
                  class="mt-1"
                />
              </div>
            </div>
          </div>

          <!-- Preview -->
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div class="flex items-start space-x-3">
              <Icon name="lucide:info" class="w-5 h-5 text-blue-600 mt-0.5" />
              <div class="text-sm">
                <p class="font-medium text-blue-900">Send Summary</p>
                <ul class="text-blue-800 mt-2 space-y-1">
                  <li>
                    • Recipients:
                    {{ selectedMailingListInfo?.active_subscriber_count || 0 }}
                    subscribers
                  </li>
                  <li v-if="scheduleType === 'now'">• Send immediately</li>
                  <li v-else>• Scheduled for: {{ formattedScheduleTime }}</li>
                  <li v-if="enableABTest">
                    • A/B test with {{ abTestPercentage[0] }}% split
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="open = false"> Cancel </Button>
        <Button :disabled="!canSchedule" @click="scheduleNewsletter">
          <Icon name="lucide:clock" class="w-4 h-4 mr-2" />
          {{ scheduleType === "now" ? "Send Now" : "Schedule" }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import type { Newsletter, MailingList } from "../../types/newsletter";

interface Props {
  newsletter: Newsletter;
  mailingLists: MailingList[];
  open: boolean;
}

interface Emits {
  (e: "update:open", value: boolean): void;
  (e: "schedule", data: ScheduleData): void;
}

interface ScheduleData {
  type: "immediate" | "scheduled";
  scheduledDate?: string;
  mailingListId: number;
  abTest?: {
    enabled: boolean;
    percentage: number;
    alternativeSubject?: string;
  };
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// State
const scheduleType = ref<"now" | "schedule">("now");
const sendDate = ref("");
const sendTime = ref("09:00");
const timezone = ref(Intl.DateTimeFormat().resolvedOptions().timeZone);
const selectedMailingList = ref("");
const enableABTest = ref(false);
const abTestPercentage = ref([10]);
const alternativeSubject = ref("");

// Computed
const minDate = computed(() => {
  return new Date().toISOString().split("T")[0];
});

const selectedMailingListInfo = computed(() => {
  return props.mailingLists.find(
    (list) => list.id.toString() === selectedMailingList.value
  );
});

const formattedScheduleTime = computed(() => {
  if (!sendDate.value || !sendTime.value) return "";

  const dateTime = new Date(`${sendDate.value}T${sendTime.value}`);
  return dateTime.toLocaleString();
});

const canSchedule = computed(() => {
  if (!selectedMailingList.value) return false;
  if (scheduleType.value === "schedule" && (!sendDate.value || !sendTime.value))
    return false;
  return true;
});

const timezones = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "Europe/London", label: "Greenwich Mean Time (GMT)" },
  { value: "Europe/Paris", label: "Central European Time (CET)" },
  { value: "Asia/Tokyo", label: "Japan Standard Time (JST)" },
  { value: "Australia/Sydney", label: "Australian Eastern Time (AET)" },
];

// Methods
const scheduleNewsletter = () => {
  const scheduleData: ScheduleData = {
    type: scheduleType.value === "now" ? "immediate" : "scheduled",
    mailingListId: Number.parseInt(selectedMailingList.value),
    abTest: enableABTest.value
      ? {
          enabled: true,
          percentage: abTestPercentage.value[0],
          alternativeSubject: alternativeSubject.value,
        }
      : undefined,
  };

  if (scheduleType.value === "schedule") {
    const scheduledDateTime = new Date(`${sendDate.value}T${sendTime.value}`);
    scheduleData.scheduledDate = scheduledDateTime.toISOString();
  }

  emit("schedule", scheduleData);
  emit("update:open", false);
};

// Initialize with defaults
onMounted(() => {
  if (props.mailingLists.length > 0) {
    selectedMailingList.value = props.mailingLists[0].id.toString();
  }

  if (props.newsletter.ab_test_subject_b) {
    alternativeSubject.value = props.newsletter.ab_test_subject_b;
  }
});
</script>
