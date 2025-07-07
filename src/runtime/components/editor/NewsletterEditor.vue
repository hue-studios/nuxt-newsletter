<template>
  <div class="newsletter-editor min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Back Button & Title -->
          <div class="flex items-center space-x-4">
            <Button variant="ghost" @click="emit('back')">
              <Icon name="lucide:arrow-left" class="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 class="text-xl font-semibold text-gray-900">
                {{ newsletter.title }}
              </h1>
              <p class="text-sm text-gray-500">
                {{ newsletter.status }}
              </p>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center space-x-3">
            <Button variant="outline" @click="togglePreview">
              <Icon
                :name="
                  editorState.isPreviewMode ? 'lucide:edit-3' : 'lucide:eye'
                "
                class="w-4 h-4 mr-2"
              />
              {{ editorState.isPreviewMode ? "Edit" : "Preview" }}
            </Button>

            <Button variant="outline" @click="showSendTestDialog = true">
              <Icon name="lucide:send" class="w-4 h-4 mr-2" />
              Send Test
            </Button>

            <Button @click="autoSave">
              <Icon name="lucide:save" class="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="grid grid-cols-12 gap-6">
        <!-- Block Library -->
        <div class="col-span-3">
          <div class="bg-white rounded-lg shadow">
            <div class="p-4 border-b border-gray-200">
              <h2 class="text-lg font-medium text-gray-900">Blocks</h2>
            </div>
            <div class="p-4 space-y-3">
              <Button
                v-for="blockType in blockTypes"
                :key="blockType.id"
                variant="outline"
                class="w-full justify-start h-auto p-3"
                draggable="true"
                @click="addBlock(blockType)"
                @dragstart="handleBlockTypeStart(blockType, $event)"
                @dragend="handleDragEnd"
              >
                <Icon :name="blockType.icon" class="w-4 h-4 mr-3" />
                <div class="text-left">
                  <div class="font-medium">
                    {{ blockType.name }}
                  </div>
                  <div class="text-xs text-gray-500">
                    {{ blockType.description }}
                  </div>
                </div>
              </Button>
            </div>
          </div>
        </div>

        <!-- Newsletter Canvas -->
        <div class="col-span-6">
          <div class="bg-white rounded-lg shadow min-h-[600px]">
            <div class="p-6">
              <div
                ref="newsletterCanvas"
                class="newsletter-canvas space-y-4"
                @dragover="handleDragOver"
                @drop="handleDrop"
              >
                <!-- Drop Zones -->
                <div
                  v-for="(zone, index) in dropZones"
                  :key="`zone-${index}`"
                  class="drop-zone"
                  :class="{ active: activeDropZone === index }"
                  :style="{ top: `${zone.y}px` }"
                />

                <!-- Newsletter Blocks -->
                <TransitionGroup name="block" tag="div">
                  <NewsletterBlock
                    v-for="(block, index) in newsletter.blocks"
                    :key="block.id"
                    :block="block"
                    :index="index"
                    :is-selected="editorState.selectedBlock?.id === block.id"
                    :is-last="index === newsletter.blocks.length - 1"
                    @select="selectBlock"
                    @update="updateBlock"
                    @delete="deleteBlock"
                    @duplicate="duplicateBlock"
                    @move-up="moveBlockUp"
                    @move-down="moveBlockDown"
                  />
                </TransitionGroup>

                <!-- Empty State -->
                <div
                  v-if="newsletter.blocks.length === 0"
                  class="text-center py-12 text-gray-500"
                >
                  <Icon
                    name="lucide:plus-circle"
                    class="w-8 h-8 mx-auto mb-3"
                  />
                  <p>Drag blocks here to start building your newsletter</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Properties Panel -->
        <div class="col-span-3">
          <div class="bg-white rounded-lg shadow">
            <div class="p-4 border-b border-gray-200">
              <h2 class="text-lg font-medium text-gray-900">Properties</h2>
            </div>
            <div class="p-4">
              <BlockEditor
                v-if="editorState.selectedBlock"
                :block="editorState.selectedBlock"
                @update="updateBlock"
              />
              <div v-else class="text-center text-gray-500 py-8">
                <Icon
                  name="lucide:mouse-pointer-click"
                  class="w-8 h-8 mx-auto mb-3"
                />
                <p>Select a block to edit its properties</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Send Test Dialog -->
    <Dialog v-model:open="showSendTestDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Test Email</DialogTitle>
          <DialogDescription>
            Send a test version of this newsletter to verify how it looks
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4">
          <div>
            <Label for="test-emails">Test Email Addresses</Label>
            <Input
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
          <Button :disabled="!testEmails.trim()" @click="sendTestEmail">
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
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type {
  Newsletter,
  NewsletterBlock,
  BlockType,
} from "../../types/newsletter";

// Register GSAP plugins
if (import.meta.client) {
  gsap.registerPlugin(Draggable, ScrollTrigger);
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
  togglePreview,
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
const dropZones = ref<any[]>([]);
const activeDropZone = ref<number | null>(null);

// Drag and drop state
const draggableInstances: any[] = [];

// Methods
const addBlock = async (blockType: BlockType, index?: number) => {
  const newBlock = await createBlock({
    block_type_id: blockType.id,
    newsletter_id: newsletter.value.id,
    sort_order: index ?? newsletter.value.blocks.length,
    title: `New ${blockType.name}`,
    text_content: blockType.default_content || "",
  });

  if (newBlock) {
    if (index !== undefined) {
      newsletter.value.blocks.splice(index, 0, newBlock);
    } else {
      newsletter.value.blocks.push(newBlock);
    }
    emit("update", newsletter.value);
  }
};

const updateBlock = async (blockId: number, data: Partial<NewsletterBlock>) => {
  const block = newsletter.value.blocks.find((b) => b.id === blockId);
  if (!block) return;

  Object.assign(block, data);
  await updateBlockData(blockId, data);
  emit("update", newsletter.value);
};

const deleteBlock = async (blockId: number) => {
  const index = newsletter.value.blocks.findIndex((b) => b.id === blockId);
  if (index === -1) return;

  newsletter.value.blocks.splice(index, 1);
  await deleteBlockData(blockId);
  emit("update", newsletter.value);
};

const duplicateBlock = async (block: NewsletterBlock) => {
  const newBlock = await duplicateBlockData(block);
  if (newBlock) {
    const index = newsletter.value.blocks.findIndex((b) => b.id === block.id);
    newsletter.value.blocks.splice(index + 1, 0, newBlock);
    emit("update", newsletter.value);
  }
};

const moveBlockUp = (blockId: number) => {
  const index = newsletter.value.blocks.findIndex((b) => b.id === blockId);
  if (index > 0) {
    const block = newsletter.value.blocks.splice(index, 1)[0];
    newsletter.value.blocks.splice(index - 1, 0, block);
    reorderBlocks(newsletter.value.blocks);
    emit("update", newsletter.value);
  }
};

const moveBlockDown = (blockId: number) => {
  const index = newsletter.value.blocks.findIndex((b) => b.id === blockId);
  if (index < newsletter.value.blocks.length - 1) {
    const block = newsletter.value.blocks.splice(index, 1)[0];
    newsletter.value.blocks.splice(index + 1, 0, block);
    reorderBlocks(newsletter.value.blocks);
    emit("update", newsletter.value);
  }
};

// Drag and drop handlers
const handleBlockTypeStart = (blockType: BlockType, event: DragEvent) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData(
      "application/json",
      JSON.stringify({ type: "block-type", data: blockType })
    );
    event.dataTransfer.effectAllowed = "copy";
  }
};

const handleDragEnd = () => {
  activeDropZone.value = null;
  dropZones.value = [];
};

const handleDragOver = (event: DragEvent) => {
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = "copy";
  }

  // Calculate drop zones
  if (newsletterCanvas.value) {
    calculateDropZones();

    const rect = newsletterCanvas.value.getBoundingClientRect();
    const y = event.clientY - rect.top;

    activeDropZone.value = getDropZoneIndex(y);
  }
};

const handleDrop = async (event: DragEvent) => {
  event.preventDefault();

  try {
    const data = event.dataTransfer?.getData("application/json");
    if (!data) return;

    const { type, data: dragData } = JSON.parse(data);

    if (type === "block-type") {
      const dropIndex = activeDropZone.value ?? newsletter.value.blocks.length;
      await addBlock(dragData, dropIndex);
    }
  } catch (error) {
    console.error("Drop error:", error);
  } finally {
    handleDragEnd();
  }
};

const calculateDropZones = () => {
  if (!newsletterCanvas.value) return;

  const zones = [];
  const containerRect = newsletterCanvas.value.getBoundingClientRect();

  // Zone before first block
  zones.push({ y: 0, height: 20 });

  // Zones between blocks
  const blockElements =
    newsletterCanvas.value.querySelectorAll("[data-block-id]");
  blockElements.forEach((element) => {
    const rect = element.getBoundingClientRect();
    const relativeY = rect.bottom - containerRect.top;
    zones.push({ y: relativeY - 10, height: 20 });
  });

  dropZones.value = zones;
};

const getDropZoneIndex = (y: number): number => {
  for (let i = 0; i < dropZones.value.length; i++) {
    const zone = dropZones.value[i];
    if (y >= zone.y && y <= zone.y + zone.height) {
      return i;
    }
  }
  return dropZones.value.length;
};

const sendTestEmail = async () => {
  if (!testEmails.value.trim()) return;

  const emails = testEmails.value
    .split(",")
    .map((email) => email.trim())
    .filter((email) => email);

  try {
    await sendTest(newsletter.value, emails);
    showSendTestDialog.value = false;
    testEmails.value = "";
  } catch (error) {
    console.error("Failed to send test email:", error);
  }
};

const addBlockFromPicker = (blockType: BlockType) => {
  addBlock(blockType);
  showBlockPicker.value = false;
};

// Lifecycle
onMounted(async () => {
  await fetchBlockTypes();

  // Initialize GSAP animations
  if (import.meta.client && newsletterCanvas.value) {
    // Setup any additional GSAP animations here
    gsap.set(".newsletter-block", { scale: 1 });
  }
});

onUnmounted(() => {
  // Cleanup GSAP instances
  draggableInstances.forEach((instance) => {
    if (instance && instance.kill) {
      instance.kill();
    }
  });
});
</script>

<style scoped>
.newsletter-editor {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    sans-serif;
}

.drop-zone {
  position: absolute;
  left: 0;
  right: 0;
  height: 4px;
  border-radius: 2px;
  transition: all 0.2s ease;
  z-index: 10;
  pointer-events: none;
}

.drop-zone.active {
  height: 8px;
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.block-enter-active,
.block-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.block-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

.block-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.block-move {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
