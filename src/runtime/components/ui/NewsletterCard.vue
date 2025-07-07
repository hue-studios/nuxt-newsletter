<template>
  <Card
    class="newsletter-card group hover:shadow-lg transition-all duration-200"
  >
    <CardContent class="p-0">
      <!-- Preview Image -->
      <div
        class="aspect-video bg-gray-100 relative overflow-hidden rounded-t-lg"
      >
        <div
          v-if="newsletter.template?.thumbnail_url"
          class="absolute inset-0 bg-cover bg-center"
          :style="{
            backgroundImage: `url(${newsletter.template.thumbnail_url})`,
          }"
        />
        <div
          v-else
          class="flex items-center justify-center h-full"
        >
          <Icon
            name="lucide:mail"
            class="w-12 h-12 text-gray-400"
          />
        </div>

        <!-- Status Badge -->
        <div class="absolute top-3 left-3">
          <Badge :variant="getStatusVariant(newsletter.status)">
            {{ newsletter.status }}
          </Badge>
        </div>

        <!-- Quick Actions -->
        <div
          class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button
                variant="secondary"
                size="sm"
              >
                <Icon
                  name="lucide:more-horizontal"
                  class="w-4 h-4"
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem @click="$emit('edit', newsletter.id)">
                <Icon
                  name="lucide:edit"
                  class="w-4 h-4 mr-2"
                />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem @click="$emit('duplicate', newsletter.id)">
                <Icon
                  name="lucide:copy"
                  class="w-4 h-4 mr-2"
                />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem @click="$emit('send-test', newsletter)">
                <Icon
                  name="lucide:send"
                  class="w-4 h-4 mr-2"
                />
                Send Test
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                class="text-red-600"
                @click="$emit('delete', newsletter.id)"
              >
                <Icon
                  name="lucide:trash-2"
                  class="w-4 h-4 mr-2"
                />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <!-- Content -->
      <div class="p-6">
        <div class="flex items-start justify-between mb-3">
          <div class="flex-1 min-w-0">
            <h3
              class="font-semibold text-gray-900 truncate cursor-pointer hover:text-blue-600"
              @click="$emit('edit', newsletter.id)"
            >
              {{ newsletter.title }}
            </h3>
            <p class="text-sm text-gray-600 truncate mt-1">
              {{ newsletter.subject_line }}
            </p>
          </div>

          <Badge
            variant="outline"
            class="ml-2 shrink-0"
          >
            {{ newsletter.category }}
          </Badge>
        </div>

        <!-- Stats -->
        <div class="flex items-center space-x-4 text-sm text-gray-600 mb-4">
          <div class="flex items-center space-x-1">
            <Icon
              name="lucide:eye"
              class="w-3 h-3"
            />
            <span>{{ newsletter.open_rate?.toFixed(1) || "0" }}%</span>
          </div>
          <div class="flex items-center space-x-1">
            <Icon
              name="lucide:mouse-pointer-click"
              class="w-3 h-3"
            />
            <span>{{ newsletter.click_rate?.toFixed(1) || "0" }}%</span>
          </div>
          <div class="flex items-center space-x-1">
            <Icon
              name="lucide:mail-open"
              class="w-3 h-3"
            />
            <span>{{ newsletter.total_opens || 0 }}</span>
          </div>
        </div>

        <!-- Tags -->
        <div
          v-if="newsletter.tags?.length"
          class="flex flex-wrap gap-1 mb-4"
        >
          <Badge
            v-for="tag in newsletter.tags.slice(0, 3)"
            :key="tag"
            variant="secondary"
            class="text-xs"
          >
            {{ tag }}
          </Badge>
          <Badge
            v-if="newsletter.tags.length > 3"
            variant="secondary"
            class="text-xs"
          >
            +{{ newsletter.tags.length - 3 }}
          </Badge>
        </div>

        <!-- Meta Info -->
        <div class="flex items-center justify-between text-xs text-gray-500">
          <span>{{ formatDate(newsletter.created_at) }}</span>
          <span>{{ newsletter.blocks?.length || 0 }} blocks</span>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import type { Newsletter } from "~/types/newsletter";

interface Props {
  newsletter: Newsletter;
}

interface Emits {
  (e: "edit", id: number): void;
  (e: "duplicate", id: number): void;
  (e: "delete", id: number): void;
  (e: "send-test", newsletter: Newsletter): void;
}

defineProps<Props>();
defineEmits<Emits>();

const getStatusVariant = (status: string) => {
  switch (status) {
    case "draft":
      return "secondary";
    case "ready":
      return "default";
    case "scheduled":
      return "default";
    case "sending":
      return "default";
    case "sent":
      return "default";
    case "paused":
      return "destructive";
    default:
      return "secondary";
  }
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "No date";
  return new Date(dateString).toLocaleDateString();
};
</script>

<style scoped>
.newsletter-card:hover {
  transform: translateY(-2px);
}
</style>
