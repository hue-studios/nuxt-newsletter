<!-- components/NewsletterEditor.vue -->
<template>
  <div class="newsletter-editor h-screen flex bg-gray-50">
    <!-- Left Sidebar - Block Library -->
    <div class="w-80 bg-white border-r border-gray-200 flex flex-col">
      <div class="p-4 border-b border-gray-200">
        <h2 class="text-lg font-semibold text-gray-900">Block Library</h2>
        <p class="text-sm text-gray-600 mt-1">Drag blocks to your newsletter</p>
      </div>

      <!-- Block Categories -->
      <div class="flex-1 overflow-y-auto p-4">
        <div
          v-for="category in blockCategories"
          :key="category.name"
          class="mb-6"
        >
          <h3
            class="text-sm font-medium text-gray-700 mb-3 uppercase tracking-wide"
          >
            {{ category.name }}
          </h3>

          <div class="grid grid-cols-2 gap-2">
            <div
              v-for="blockType in category.blocks"
              :key="blockType.id"
              ref="blockLibraryItems"
              :data-block-type-id="blockType.id"
              class="block-library-item p-3 border border-gray-200 rounded-lg cursor-move hover:border-blue-400 hover:shadow-sm transition-all group"
              @mousedown="initBlockDrag($event, blockType)"
            >
              <div class="flex items-center space-x-2">
                <Icon
                  :name="blockType.icon || 'lucide:square'"
                  class="w-4 h-4 text-gray-500 group-hover:text-blue-500"
                />
                <span
                  class="text-xs font-medium text-gray-700 group-hover:text-blue-700"
                >
                  {{ blockType.name }}
                </span>
              </div>
              <p class="text-xs text-gray-500 mt-1 leading-tight">
                {{ blockType.description }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Editor Area -->
    <div class="flex-1 flex flex-col">
      <!-- Top Toolbar -->
      <div class="bg-white border-b border-gray-200 px-6 py-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <Button variant="ghost" size="sm" @click="$emit('back')">
              <Icon name="lucide:arrow-left" class="w-4 h-4 mr-2" />
              Back
            </Button>

            <div class="flex items-center space-x-2">
              <Input
                v-model="newsletter.title"
                placeholder="Newsletter title..."
                class="font-medium text-lg border-none px-0 focus:ring-0"
                @input="autoSave"
              />
              <Badge
                :variant="
                  newsletter.status === 'draft' ? 'secondary' : 'default'
                "
                class="ml-2"
              >
                {{ newsletter.status }}
              </Badge>
            </div>
          </div>

          <div class="flex items-center space-x-2">
            <!-- View Toggle -->
            <div class="flex border rounded-lg overflow-hidden">
              <Button
                variant="ghost"
                size="sm"
                :class="{
                  'bg-blue-50 text-blue-600': !editorState.isPreviewMode,
                }"
                @click="setViewMode('edit')"
              >
                <Icon name="lucide:edit" class="w-4 h-4 mr-1" />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                :class="{
                  'bg-blue-50 text-blue-600': editorState.isPreviewMode,
                }"
                @click="setViewMode('preview')"
              >
                <Icon name="lucide:eye" class="w-4 h-4 mr-1" />
                Preview
              </Button>
            </div>

            <!-- Actions -->
            <Button
              variant="outline"
              size="sm"
              @click="compileAndPreview"
              :disabled="editorState.isCompiling"
            >
              <Icon
                name="lucide:refresh-cw"
                class="w-4 h-4 mr-1"
                :class="{ 'animate-spin': editorState.isCompiling }"
              />
              Compile
            </Button>

            <Button
              variant="outline"
              size="sm"
              @click="showSendTestDialog = true"
            >
              <Icon name="lucide:send" class="w-4 h-4 mr-1" />
              Test Send
            </Button>

            <Button
              size="sm"
              @click="saveNewsletter"
              :disabled="editorState.isSaving"
            >
              <Icon
                name="lucide:save"
                class="w-4 h-4 mr-1"
                :class="{ 'animate-pulse': editorState.isSaving }"
              />
              Save
            </Button>
          </div>
        </div>
      </div>

      <!-- Editor Content -->
      <div class="flex-1 flex">
        <!-- Newsletter Canvas -->
        <div class="flex-1 overflow-y-auto bg-gray-100 p-6">
          <div class="max-w-2xl mx-auto">
            <!-- Newsletter Preview/Editor -->
            <div
              v-if="!editorState.isPreviewMode"
              class="bg-white rounded-lg shadow-sm min-h-[600px]"
            >
              <!-- Email Header Preview -->
              <div class="border-b border-gray-200 p-4 bg-gray-50 rounded-t-lg">
                <div
                  class="flex items-center justify-between text-sm text-gray-600"
                >
                  <span
                    >From: {{ newsletter.from_name }} &lt;{{
                      newsletter.from_email
                    }}&gt;</span
                  >
                  <span>{{ new Date().toLocaleDateString() }}</span>
                </div>
                <div class="mt-2">
                  <div class="font-medium text-gray-900">
                    {{ newsletter.subject_line }}
                  </div>
                  <div class="text-sm text-gray-600 mt-1">
                    {{ newsletter.preview_text }}
                  </div>
                </div>
              </div>

              <!-- Newsletter Blocks -->
              <div
                ref="newsletterCanvas"
                class="newsletter-canvas p-4 min-h-[500px]"
                @dragover="handleDragOver"
                @drop="handleDrop"
              >
                <transition-group name="block" tag="div">
                  <NewsletterBlock
                    v-for="(block, index) in sortedBlocks"
                    :key="`block-${block.id}`"
                    :block="block"
                    :index="index"
                    :is-selected="editorState.selectedBlock?.id === block.id"
                    :is-last="index === sortedBlocks.length - 1"
                    @select="selectBlock"
                    @update="updateBlock"
                    @delete="deleteBlock"
                    @duplicate="duplicateBlock"
                    @move-up="moveBlockUp"
                    @move-down="moveBlockDown"
                  />
                </transition-group>

                <!-- Empty State -->
                <div
                  v-if="!sortedBlocks.length"
                  class="flex flex-col items-center justify-center py-20 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg"
                >
                  <Icon name="lucide:plus-circle" class="w-12 h-12 mb-4" />
                  <h3 class="text-lg font-medium mb-2">
                    Start building your newsletter
                  </h3>
                  <p class="text-center text-sm">
                    Drag blocks from the left sidebar or click below to add your
                    first block
                  </p>
                  <Button
                    variant="outline"
                    class="mt-4"
                    @click="showBlockPicker = true"
                  >
                    <Icon name="lucide:plus" class="w-4 h-4 mr-2" />
                    Add Block
                  </Button>
                </div>

                <!-- Drop Zone Indicators -->
                <div
                  v-for="(zone, index) in dropZones"
                  :key="`drop-zone-${index}`"
                  :ref="(el) => setDropZoneRef(el, index)"
                  class="drop-zone h-2 border-2 border-dashed border-transparent rounded transition-colors"
                  :class="{
                    'border-blue-400 bg-blue-50': zone.isActive,
                  }"
                  :style="{ top: zone.y + 'px' }"
                ></div>
              </div>
            </div>

            <!-- MJML Preview -->
            <div
              v-else-if="newsletter.compiled_html"
              class="bg-white rounded-lg shadow-sm overflow-hidden"
            >
              <div class="border-b border-gray-200 p-4 bg-gray-50">
                <h3 class="font-medium text-gray-900">Email Preview</h3>
                <p class="text-sm text-gray-600">
                  How your newsletter will look in email clients
                </p>
              </div>
              <div class="p-4">
                <iframe
                  :srcdoc="newsletter.compiled_html"
                  class="w-full h-96 border border-gray-200 rounded"
                  title="Newsletter Preview"
                ></iframe>
              </div>
            </div>

            <!-- Compilation Required -->
            <div v-else class="bg-white rounded-lg shadow-sm p-8 text-center">
              <Icon
                name="lucide:code"
                class="w-12 h-12 text-gray-400 mx-auto mb-4"
              />
              <h3 class="text-lg font-medium text-gray-900 mb-2">
                Preview not available
              </h3>
              <p class="text-gray-600 mb-4">
                Compile your newsletter to see the preview
              </p>
              <Button @click="compileAndPreview">
                <Icon name="lucide:play" class="w-4 h-4 mr-2" />
                Compile Newsletter
              </Button>
            </div>
          </div>
        </div>

        <!-- Right Sidebar - Block Properties -->
        <div
          v-if="editorState.selectedBlock && !editorState.isPreviewMode"
          class="w-80 bg-white border-l border-gray-200 flex flex-col"
        >
          <div class="p-4 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <h3 class="font-medium text-gray-900">Block Settings</h3>
              <Button variant="ghost" size="sm" @click="selectBlock(null)">
                <Icon name="lucide:x" class="w-4 h-4" />
              </Button>
            </div>
            <p class="text-sm text-gray-600 mt-1">
              {{ editorState.selectedBlock.block_type.name }}
            </p>
          </div>

          <div class="flex-1 overflow-y-auto p-4">
            <BlockEditor
              :block="editorState.selectedBlock"
              @update="updateBlock"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Dialogs -->
    <Dialog v-model:open="showSendTestDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Test Email</DialogTitle>
          <DialogDescription>
            Enter email addresses to receive a test version of this newsletter
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4">
          <div>
            <Label for="test-emails">Test Email Addresses</Label>
            <Textarea
              id="test-emails"
              v-model="testEmails"
              placeholder="test@example.com, another@example.com"
              class="mt-1"
            />
            <p class="text-sm text-gray-600 mt-1">
              Separate multiple emails with commas
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="showSendTestDialog = false">
            Cancel
          </Button>
          <Button @click="sendTestEmail" :disabled="!testEmails.trim()">
            <Icon name="lucide:send" class="w-4 h-4 mr-2" />
            Send Test
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Block Picker Dialog -->
    <Dialog v-model:open="showBlockPicker">
      <DialogContent class="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Add Block</DialogTitle>
          <DialogDescription>
            Choose a block type to add to your newsletter
          </DialogDescription>
        </DialogHeader>

        <BlockPicker :block-types="blockTypes" @select="addBlockFromPicker" />
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { gsap } from "gsap";
import { Draggable } from "gsap/Draggable";
import type {
  Newsletter,
  NewsletterBlock,
  BlockType,
} from "~/types/newsletter";

// Register GSAP plugins
if (process.client) {
  gsap.registerPlugin(Draggable);
}

interface Props {
  newsletter: Newsletter;
}

interface Emits {
  (e: "back"): void;
  (e: "update", newsletter: Newsletter): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Composables
const {
  currentNewsletter,
  editorState,
  updateNewsletter,
  compileMJML,
  sendTestEmail: sendTest,
  selectBlock,
  autoSave,
} = useNewsletter();

const {
  blockTypes,
  createBlock,
  updateBlock: updateBlockData,
  deleteBlock: deleteBlockData,
  duplicateBlock: duplicateBlockData,
  reorderBlocks,
  fetchBlockTypes,
} = useNewsletterBlocks();

// Reactive data
const newsletter = ref(props.newsletter);
const showSendTestDialog = ref(false);
const showBlockPicker = ref(false);
const testEmails = ref("");
const blockLibraryItems = ref<HTMLElement[]>([]);
const newsletterCanvas = ref<HTMLElement>();
const dropZones = ref<{ y: number; isActive: boolean }[]>([]);
const draggedBlockType = ref<BlockType | null>(null);

// Computed
const sortedBlocks = computed(() => {
  return newsletter.value.blocks?.sort((a, b) => a.sort - b.sort) || [];
});

const blockCategories = computed(() => {
  const categories = new Map();

  blockTypes.value.forEach((blockType) => {
    const category = blockType.category || "content";
    if (!categories.has(category)) {
      categories.set(category, {
        name: category.charAt(0).toUpperCase() + category.slice(1),
        blocks: [],
      });
    }
    categories.get(category).blocks.push(blockType);
  });

  return Array.from(categories.values());
});

// Methods
const setViewMode = (mode: "edit" | "preview") => {
  editorState.value.isPreviewMode = mode === "preview";
};

const compileAndPreview = async () => {
  try {
    await compileMJML(newsletter.value.id);
    // Refresh newsletter data
    emit("update", { ...newsletter.value });
  } catch (error) {
    console.error("Compilation failed:", error);
  }
};

const saveNewsletter = async () => {
  try {
    const updated = await updateNewsletter(
      newsletter.value.id,
      newsletter.value
    );
    emit("update", updated);
  } catch (error) {
    console.error("Save failed:", error);
  }
};

const initBlockDrag = (event: MouseEvent, blockType: BlockType) => {
  if (!process.client) return;

  draggedBlockType.value = blockType;
  const element = event.currentTarget as HTMLElement;

  // Create drag helper
  const helper = element.cloneNode(true) as HTMLElement;
  helper.style.position = "fixed";
  helper.style.pointerEvents = "none";
  helper.style.zIndex = "1000";
  helper.style.opacity = "0.8";
  helper.style.transform = "rotate(2deg) scale(0.95)";
  document.body.appendChild(helper);

  const startX = event.clientX;
  const startY = event.clientY;

  const onMouseMove = (e: MouseEvent) => {
    helper.style.left = e.clientX - startX + element.offsetLeft + "px";
    helper.style.top = e.clientY - startY + element.offsetTop + "px";

    updateDropZones(e.clientY);
  };

  const onMouseUp = (e: MouseEvent) => {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
    document.body.removeChild(helper);

    // Check if dropped on canvas
    const canvas = newsletterCanvas.value;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      if (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      ) {
        addBlockToNewsletter(blockType, e.clientY - rect.top);
      }
    }

    clearDropZones();
    draggedBlockType.value = null;
  };

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
};

const updateDropZones = (mouseY: number) => {
  const canvas = newsletterCanvas.value;
  if (!canvas) return;

  const rect = canvas.getBoundingClientRect();
  const relativeY = mouseY - rect.top;

  // Calculate drop zones between blocks
  const zones: { y: number; isActive: boolean }[] = [];

  if (sortedBlocks.value.length === 0) {
    zones.push({ y: 100, isActive: relativeY > 50 && relativeY < 150 });
  } else {
    // Zone before first block
    zones.push({ y: 0, isActive: relativeY < 50 });

    // Zones between blocks
    sortedBlocks.value.forEach((_, index) => {
      const y = (index + 1) * 100;
      zones.push({
        y,
        isActive: relativeY > y - 25 && relativeY < y + 25,
      });
    });

    // Zone after last block
    const lastY = sortedBlocks.value.length * 100;
    zones.push({
      y: lastY + 50,
      isActive: relativeY > lastY + 25,
    });
  }

  dropZones.value = zones;
};

const clearDropZones = () => {
  dropZones.value = [];
};

const addBlockToNewsletter = async (blockType: BlockType, dropY: number) => {
  // Calculate sort position based on drop location
  let sort = sortedBlocks.value.length + 1;

  if (sortedBlocks.value.length > 0) {
    const blockHeight = 100; // Approximate block height
    const dropIndex = Math.floor(dropY / blockHeight);
    sort = Math.min(Math.max(dropIndex + 1, 1), sortedBlocks.value.length + 1);
  }

  try {
    const newBlock = await createBlock({
      newsletter_id: newsletter.value.id,
      block_type: blockType.id,
      sort,
      title:
        blockType.name === "Hero Section" ? "Welcome to our newsletter" : "",
      text_content:
        blockType.category === "content" ? "Add your content here..." : "",
      background_color: "#ffffff",
      text_color: "#333333",
      text_align: "center",
      padding: "20px 0",
      font_size: "14px",
    });

    // Add to newsletter blocks
    if (!newsletter.value.blocks) newsletter.value.blocks = [];
    newsletter.value.blocks.push(newBlock);

    // Auto-select the new block
    selectBlock(newBlock);

    // Trigger auto-save
    autoSave(newsletter.value.id, newsletter.value);
  } catch (error) {
    console.error("Failed to add block:", error);
  }
};

const addBlockFromPicker = async (blockType: BlockType) => {
  await addBlockToNewsletter(blockType, sortedBlocks.value.length * 100);
  showBlockPicker.value = false;
};

const updateBlock = async (blockId: number, data: Partial<NewsletterBlock>) => {
  try {
    const updated = await updateBlockData(blockId, data);

    // Update local newsletter data
    const blockIndex = newsletter.value.blocks?.findIndex(
      (b) => b.id === blockId
    );
    if (blockIndex !== -1 && newsletter.value.blocks) {
      newsletter.value.blocks[blockIndex] = {
        ...newsletter.value.blocks[blockIndex],
        ...updated,
      };
    }

    // Trigger auto-save
    autoSave(newsletter.value.id, newsletter.value);
  } catch (error) {
    console.error("Failed to update block:", error);
  }
};

const deleteBlock = async (blockId: number) => {
  try {
    await deleteBlockData(blockId);

    // Remove from local newsletter data
    if (newsletter.value.blocks) {
      newsletter.value.blocks = newsletter.value.blocks.filter(
        (b) => b.id !== blockId
      );
    }

    // Clear selection if deleted block was selected
    if (editorState.value.selectedBlock?.id === blockId) {
      selectBlock(null);
    }

    // Trigger auto-save
    autoSave(newsletter.value.id, newsletter.value);
  } catch (error) {
    console.error("Failed to delete block:", error);
  }
};

const duplicateBlock = async (block: NewsletterBlock) => {
  try {
    const duplicated = await duplicateBlockData(block);

    // Add to local newsletter data
    if (!newsletter.value.blocks) newsletter.value.blocks = [];
    newsletter.value.blocks.push(duplicated);

    // Auto-select the duplicated block
    selectBlock(duplicated);

    // Trigger auto-save
    autoSave(newsletter.value.id, newsletter.value);
  } catch (error) {
    console.error("Failed to duplicate block:", error);
  }
};

const moveBlockUp = async (blockId: number) => {
  const blockIndex = sortedBlocks.value.findIndex((b) => b.id === blockId);
  if (blockIndex <= 0) return;

  const blocks = [...sortedBlocks.value];
  const [block] = blocks.splice(blockIndex, 1);
  blocks.splice(blockIndex - 1, 0, block);

  const newOrder = blocks.map((b) => b.id);
  await reorderBlocks(newsletter.value.id, newOrder);

  // Update local data
  if (newsletter.value.blocks) {
    newsletter.value.blocks.forEach((block, index) => {
      const newIndex = newOrder.indexOf(block.id);
      if (newIndex !== -1) {
        block.sort = newIndex + 1;
      }
    });
  }
};

const moveBlockDown = async (blockId: number) => {
  const blockIndex = sortedBlocks.value.findIndex((b) => b.id === blockId);
  if (blockIndex >= sortedBlocks.value.length - 1) return;

  const blocks = [...sortedBlocks.value];
  const [block] = blocks.splice(blockIndex, 1);
  blocks.splice(blockIndex + 1, 0, block);

  const newOrder = blocks.map((b) => b.id);
  await reorderBlocks(newsletter.value.id, newOrder);

  // Update local data
  if (newsletter.value.blocks) {
    newsletter.value.blocks.forEach((block, index) => {
      const newIndex = newOrder.indexOf(block.id);
      if (newIndex !== -1) {
        block.sort = newIndex + 1;
      }
    });
  }
};

const sendTestEmail = async () => {
  try {
    const emails = testEmails.value
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);
    if (emails.length === 0) return;

    await sendTest(newsletter.value.id, emails);
    showSendTestDialog.value = false;
    testEmails.value = "";

    // Show success message
    console.log("Test email sent successfully");
  } catch (error) {
    console.error("Failed to send test email:", error);
  }
};

const handleDragOver = (event: DragEvent) => {
  event.preventDefault();
};

const handleDrop = (event: DragEvent) => {
  event.preventDefault();
  // Handle native drag and drop if needed
};

const setDropZoneRef = (el: HTMLElement | null, index: number) => {
  // Handle drop zone refs if needed
};

// Lifecycle
onMounted(async () => {
  await fetchBlockTypes();
});

// Watch for newsletter changes
watch(
  () => props.newsletter,
  (newNewsletter) => {
    newsletter.value = newNewsletter;
  },
  { deep: true }
);
</script>

<style scoped>
.newsletter-editor {
  font-family: system-ui, -apple-system, sans-serif;
}

.block-library-item {
  transition: all 0.2s ease;
}

.block-library-item:hover {
  transform: translateY(-1px);
}

.newsletter-canvas {
  position: relative;
}

.drop-zone {
  position: absolute;
  left: 0;
  right: 0;
  z-index: 10;
}

.block-enter-active,
.block-leave-active {
  transition: all 0.3s ease;
}

.block-enter-from,
.block-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.block-move {
  transition: transform 0.3s ease;
}
</style>
