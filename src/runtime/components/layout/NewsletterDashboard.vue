<template>
  <div class="newsletter-dashboard">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">
            Newsletters
          </h1>
          <p class="text-gray-600 mt-1">
            Create and manage your email newsletters
          </p>
        </div>

        <div class="flex items-center space-x-3">
          <Button
            variant="outline"
            @click="showTemplateLibrary = true"
          >
            <Icon
              name="lucide:layout-template"
              class="w-4 h-4 mr-2"
            />
            Templates
          </Button>

          <Button @click="createNewNewsletter">
            <Icon
              name="lucide:plus"
              class="w-4 h-4 mr-2"
            />
            New Newsletter
          </Button>
        </div>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardContent class="p-6">
          <div class="flex items-center">
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-600">
                Total Newsletters
              </p>
              <p class="text-2xl font-bold text-gray-900">
                {{ stats.total }}
              </p>
            </div>
            <Icon
              name="lucide:mail"
              class="w-8 h-8 text-blue-500"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-6">
          <div class="flex items-center">
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-600">
                Sent This Month
              </p>
              <p class="text-2xl font-bold text-gray-900">
                {{ stats.sentThisMonth }}
              </p>
            </div>
            <Icon
              name="lucide:send"
              class="w-8 h-8 text-green-500"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-6">
          <div class="flex items-center">
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-600">
                Avg. Open Rate
              </p>
              <p class="text-2xl font-bold text-gray-900">
                {{ stats.avgOpenRate }}%
              </p>
            </div>
            <Icon
              name="lucide:eye"
              class="w-8 h-8 text-purple-500"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-6">
          <div class="flex items-center">
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-600">
                Subscribers
              </p>
              <p class="text-2xl font-bold text-gray-900">
                {{ stats.totalSubscribers }}
              </p>
            </div>
            <Icon
              name="lucide:users"
              class="w-8 h-8 text-orange-500"
            />
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Filters and Search -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center space-x-4">
        <!-- Search -->
        <div class="relative">
          <Icon
            name="lucide:search"
            class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"
          />
          <Input
            v-model="searchQuery"
            placeholder="Search newsletters..."
            class="pl-10 w-64"
          />
        </div>

        <!-- Status Filter -->
        <Select v-model="statusFilter">
          <SelectTrigger class="w-40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">
              All Status
            </SelectItem>
            <SelectItem value="draft">
              Draft
            </SelectItem>
            <SelectItem value="ready">
              Ready
            </SelectItem>
            <SelectItem value="scheduled">
              Scheduled
            </SelectItem>
            <SelectItem value="sent">
              Sent
            </SelectItem>
          </SelectContent>
        </Select>

        <!-- Category Filter -->
        <Select v-model="categoryFilter">
          <SelectTrigger class="w-40">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">
              All Categories
            </SelectItem>
            <SelectItem value="company">
              Company
            </SelectItem>
            <SelectItem value="product">
              Product
            </SelectItem>
            <SelectItem value="weekly">
              Weekly
            </SelectItem>
            <SelectItem value="monthly">
              Monthly
            </SelectItem>
            <SelectItem value="event">
              Event
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <!-- View Toggle -->
      <div class="flex border rounded-lg overflow-hidden">
        <Button
          variant="ghost"
          size="sm"
          :class="{ 'bg-gray-100': viewMode === 'grid' }"
          @click="viewMode = 'grid'"
        >
          <Icon
            name="lucide:grid-3x3"
            class="w-4 h-4"
          />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          :class="{ 'bg-gray-100': viewMode === 'list' }"
          @click="viewMode = 'list'"
        >
          <Icon
            name="lucide:list"
            class="w-4 h-4"
          />
        </Button>
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-if="isLoading"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      <Card
        v-for="i in 6"
        :key="i"
        class="animate-pulse"
      >
        <CardContent class="p-6">
          <div class="space-y-3">
            <div class="h-4 bg-gray-200 rounded w-3/4" />
            <div class="h-3 bg-gray-200 rounded w-1/2" />
            <div class="h-20 bg-gray-200 rounded" />
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Grid View -->
    <div
      v-else-if="viewMode === 'grid'"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      <NewsletterCard
        v-for="newsletter in filteredNewsletters"
        :key="newsletter.id"
        :newsletter="newsletter"
        @edit="editNewsletter"
        @duplicate="duplicateNewsletter"
        @delete="deleteNewsletter"
        @send-test="sendTestEmail"
      />
    </div>

    <!-- List View -->
    <div
      v-else-if="viewMode === 'list'"
      class="bg-white rounded-lg border border-gray-200"
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Newsletter</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Open Rate</TableHead>
            <TableHead>Created</TableHead>
            <TableHead class="text-right">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow
            v-for="newsletter in filteredNewsletters"
            :key="newsletter.id"
            class="cursor-pointer hover:bg-gray-50"
            @click="editNewsletter(newsletter.id)"
          >
            <TableCell>
              <div>
                <div class="font-medium text-gray-900">
                  {{ newsletter.title }}
                </div>
                <div class="text-sm text-gray-600">
                  {{ newsletter.subject_line }}
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Badge :variant="getStatusVariant(newsletter.status)">
                {{ newsletter.status }}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant="outline">
                {{ newsletter.category }}
              </Badge>
            </TableCell>
            <TableCell>
              <span v-if="newsletter.open_rate">{{ newsletter.open_rate.toFixed(1) }}%</span>
              <span
                v-else
                class="text-gray-400"
              >-</span>
            </TableCell>
            <TableCell class="text-gray-600">
              {{ formatDate(newsletter.created_at) }}
            </TableCell>
            <TableCell class="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button
                    variant="ghost"
                    size="sm"
                    @click.stop
                  >
                    <Icon
                      name="lucide:more-horizontal"
                      class="w-4 h-4"
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem @click.stop="editNewsletter(newsletter.id)">
                    <Icon
                      name="lucide:edit"
                      class="w-4 h-4 mr-2"
                    />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    @click.stop="duplicateNewsletter(newsletter.id)"
                  >
                    <Icon
                      name="lucide:copy"
                      class="w-4 h-4 mr-2"
                    />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem @click.stop="sendTestEmail(newsletter)">
                    <Icon
                      name="lucide:send"
                      class="w-4 h-4 mr-2"
                    />
                    Send Test
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    class="text-red-600"
                    @click.stop="deleteNewsletter(newsletter.id)"
                  >
                    <Icon
                      name="lucide:trash-2"
                      class="w-4 h-4 mr-2"
                    />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- Empty State -->
    <div
      v-if="!isLoading && filteredNewsletters.length === 0"
      class="text-center py-16"
    >
      <Icon
        name="lucide:mail"
        class="w-16 h-16 text-gray-400 mx-auto mb-4"
      />
      <h3 class="text-lg font-medium text-gray-900 mb-2">
        {{
          searchQuery || statusFilter || categoryFilter
            ? "No newsletters found"
            : "No newsletters yet"
        }}
      </h3>
      <p class="text-gray-600 mb-6">
        {{
          searchQuery || statusFilter || categoryFilter
            ? "Try adjusting your filters or search terms"
            : "Get started by creating your first newsletter"
        }}
      </p>
      <Button
        v-if="!searchQuery && !statusFilter && !categoryFilter"
        @click="createNewNewsletter"
      >
        <Icon
          name="lucide:plus"
          class="w-4 h-4 mr-2"
        />
        Create Newsletter
      </Button>
    </div>

    <!-- Template Library Dialog -->
    <Dialog v-model:open="showTemplateLibrary">
      <DialogContent class="max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Newsletter Templates</DialogTitle>
          <DialogDescription>
            Choose a template to get started quickly
          </DialogDescription>
        </DialogHeader>

        <TemplateBrowser
          :templates="templates"
          @select="createFromTemplate"
        />
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import type { Newsletter, NewsletterTemplate } from "~/types/newsletter";

// Composables
const {
  newsletters,
  isLoading,
  fetchNewsletters,
  createNewsletter,
  duplicateNewsletter: duplicateNewsletterData,
  deleteNewsletter: deleteNewsletterData,
} = useNewsletter();

const {
  templates,
  fetchTemplates,
  createFromTemplate: createFromTemplateData,
} = useNewsletterTemplates();

// State
const searchQuery = ref("");
const statusFilter = ref("");
const categoryFilter = ref("");
const viewMode = ref<"grid" | "list">("grid");
const showTemplateLibrary = ref(false);

// Computed
const filteredNewsletters = computed(() => {
  let filtered = newsletters.value || [];

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (newsletter) =>
        newsletter.title.toLowerCase().includes(query)
        || newsletter.subject_line.toLowerCase().includes(query)
        || newsletter.category.toLowerCase().includes(query),
    );
  }

  // Status filter
  if (statusFilter.value) {
    filtered = filtered.filter(
      (newsletter) => newsletter.status === statusFilter.value,
    );
  }

  // Category filter
  if (categoryFilter.value) {
    filtered = filtered.filter(
      (newsletter) => newsletter.category === categoryFilter.value,
    );
  }

  return filtered;
});

const stats = computed(() => {
  const allNewsletters = newsletters.value || [];
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const sentThisMonth = allNewsletters.filter((n) => {
    if (n.status !== "sent" || !n.created_at) return false;
    const date = new Date(n.created_at);
    return (
      date.getMonth() === currentMonth && date.getFullYear() === currentYear
    );
  }).length;

  const openRates = allNewsletters
    .filter((n) => n.open_rate && n.open_rate > 0)
    .map((n) => n.open_rate!);

  const avgOpenRate
    = openRates.length > 0
      ? openRates.reduce((sum, rate) => sum + rate, 0) / openRates.length
      : 0;

  return {
    total: allNewsletters.length,
    sentThisMonth,
    avgOpenRate: Math.round(avgOpenRate * 10) / 10,
    totalSubscribers: 0, // TODO: Fetch from subscribers
  };
});

// Methods
const createNewNewsletter = async () => {
  try {
    const newsletter = await createNewsletter({
      title: "Untitled Newsletter",
      subject_line: "",
      from_name: "",
      from_email: "",
      category: "company",
    });

    await navigateTo(`/newsletters/${newsletter.id}/edit`);
  } catch (error) {
    console.error("Failed to create newsletter:", error);
  }
};

const editNewsletter = (id: number) => {
  navigateTo(`/newsletters/${id}/edit`);
};

const duplicateNewsletter = async (id: number) => {
  try {
    const duplicated = await duplicateNewsletterData(id);
    await navigateTo(`/newsletters/${duplicated.id}/edit`);
  } catch (error) {
    console.error("Failed to duplicate newsletter:", error);
  }
};

const deleteNewsletter = async (id: number) => {
  if (!confirm("Are you sure you want to delete this newsletter?")) return;

  try {
    await deleteNewsletterData(id);
  } catch (error) {
    console.error("Failed to delete newsletter:", error);
  }
};

const sendTestEmail = (newsletter: Newsletter) => {
  // TODO: Implement test email functionality
  console.log("Send test email for:", newsletter.title);
};

const createFromTemplate = async (template: NewsletterTemplate | null) => {
  showTemplateLibrary.value = false;

  if (!template) {
    return createNewNewsletter();
  }

  try {
    const newsletter = await createFromTemplateData(template);
    await navigateTo(`/newsletters/${newsletter.id}/edit`);
  } catch (error) {
    console.error("Failed to create from template:", error);
  }
};

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
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString();
};

// Lifecycle
onMounted(async () => {
  await Promise.all([fetchNewsletters(), fetchTemplates()]);
});
</script>
