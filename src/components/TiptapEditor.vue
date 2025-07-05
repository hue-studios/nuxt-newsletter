<!-- components/TiptapEditor.vue -->
<template>
  <div class="tiptap-editor border border-gray-300 rounded-lg overflow-hidden">
    <!-- Toolbar -->
    <div class="border-b border-gray-200 bg-gray-50 p-2">
      <div class="flex items-center space-x-1">
        <Button
          variant="ghost"
          size="sm"
          :class="{ 'bg-gray-200': editor?.isActive('bold') }"
          @click="editor?.chain().focus().toggleBold().run()"
          :disabled="!editor?.can().chain().focus().toggleBold().run()"
        >
          <Icon name="lucide:bold" class="w-4 h-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          :class="{ 'bg-gray-200': editor?.isActive('italic') }"
          @click="editor?.chain().focus().toggleItalic().run()"
          :disabled="!editor?.can().chain().focus().toggleItalic().run()"
        >
          <Icon name="lucide:italic" class="w-4 h-4" />
        </Button>

        <div class="w-px h-6 bg-gray-300 mx-2"></div>

        <Button
          variant="ghost"
          size="sm"
          :class="{ 'bg-gray-200': editor?.isActive('heading', { level: 1 }) }"
          @click="editor?.chain().focus().toggleHeading({ level: 1 }).run()"
        >
          H1
        </Button>

        <Button
          variant="ghost"
          size="sm"
          :class="{ 'bg-gray-200': editor?.isActive('heading', { level: 2 }) }"
          @click="editor?.chain().focus().toggleHeading({ level: 2 }).run()"
        >
          H2
        </Button>

        <Button
          variant="ghost"
          size="sm"
          :class="{ 'bg-gray-200': editor?.isActive('heading', { level: 3 }) }"
          @click="editor?.chain().focus().toggleHeading({ level: 3 }).run()"
        >
          H3
        </Button>

        <div class="w-px h-6 bg-gray-300 mx-2"></div>

        <Button
          variant="ghost"
          size="sm"
          :class="{ 'bg-gray-200': editor?.isActive('bulletList') }"
          @click="editor?.chain().focus().toggleBulletList().run()"
        >
          <Icon name="lucide:list" class="w-4 h-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          :class="{ 'bg-gray-200': editor?.isActive('orderedList') }"
          @click="editor?.chain().focus().toggleOrderedList().run()"
        >
          <Icon name="lucide:list-ordered" class="w-4 h-4" />
        </Button>

        <div class="w-px h-6 bg-gray-300 mx-2"></div>

        <Button
          variant="ghost"
          size="sm"
          @click="setLink"
          :class="{ 'bg-gray-200': editor?.isActive('link') }"
        >
          <Icon name="lucide:link" class="w-4 h-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          @click="editor?.chain().focus().unsetLink().run()"
          :disabled="!editor?.isActive('link')"
        >
          <Icon name="lucide:link-2-off" class="w-4 h-4" />
        </Button>
      </div>
    </div>

    <!-- Editor Content -->
    <EditorContent
      :editor="editor"
      class="prose prose-sm max-w-none p-4 min-h-[100px] focus:outline-none"
    />

    <!-- Link Dialog -->
    <Dialog v-model:open="showLinkDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Link</DialogTitle>
          <DialogDescription> Enter the URL for the link </DialogDescription>
        </DialogHeader>

        <div class="space-y-4">
          <div>
            <Label for="link-url">URL</Label>
            <Input
              id="link-url"
              v-model="linkUrl"
              placeholder="https://example.com"
              @keydown.enter="confirmLink"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="showLinkDialog = false">
            Cancel
          </Button>
          <Button @click="confirmLink"> Add Link </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { Editor, EditorContent } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";

interface Props {
  modelValue: string;
  placeholder?: string;
}

interface Emits {
  (e: "update:modelValue", value: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// State
const showLinkDialog = ref(false);
const linkUrl = ref("");

// Create editor
const editor = ref<Editor>();

onMounted(() => {
  editor.value = new Editor({
    content: props.modelValue,
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 underline hover:text-blue-800",
        },
      }),
    ],
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      emit("update:modelValue", editor.getHTML());
    },
  });
});

onBeforeUnmount(() => {
  editor.value?.destroy();
});

// Watch for prop changes
watch(
  () => props.modelValue,
  (value) => {
    const isSame = editor.value?.getHTML() === value;
    if (isSame) return;

    editor.value?.commands.setContent(value, false);
  }
);

// Methods
const setLink = () => {
  const previousUrl = editor.value?.getAttributes("link").href;
  linkUrl.value = previousUrl || "";
  showLinkDialog.value = true;
};

const confirmLink = () => {
  if (linkUrl.value) {
    editor.value
      ?.chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: linkUrl.value })
      .run();
  }

  showLinkDialog.value = false;
  linkUrl.value = "";
};
</script>

<style>
.tiptap-editor .ProseMirror {
  outline: none;
}

.tiptap-editor .ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: #adb5bd;
  pointer-events: none;
  height: 0;
}
</style>

<!-- components/BlockPicker.vue -->
<template>
  <div class="block-picker">
    <!-- Search -->
    <div class="mb-6">
      <div class="relative">
        <Icon
          name="lucide:search"
          class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"
        />
        <Input
          v-model="searchQuery"
          placeholder="Search block types..."
          class="pl-10"
        />
      </div>
    </div>

    <!-- Categories -->
    <div class="space-y-6">
      <div
        v-for="category in filteredCategories"
        :key="category.name"
        class="space-y-4"
      >
        <h3 class="text-sm font-medium text-gray-700 uppercase tracking-wide">
          {{ category.name }} ({{ category.blocks.length }})
        </h3>

        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div
            v-for="blockType in category.blocks"
            :key="blockType.id"
            class="block-type-card group cursor-pointer border border-gray-200 rounded-lg p-4 hover:border-blue-400 hover:shadow-md transition-all"
            @click="$emit('select', blockType)"
          >
            <div class="flex flex-col items-center text-center space-y-3">
              <!-- Icon -->
              <div
                class="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-blue-50 transition-colors"
              >
                <Icon
                  :name="blockType.icon || 'lucide:square'"
                  class="w-6 h-6 text-gray-600 group-hover:text-blue-600"
                />
              </div>

              <!-- Name -->
              <div>
                <h4 class="font-medium text-gray-900 group-hover:text-blue-700">
                  {{ blockType.name }}
                </h4>
                <p class="text-xs text-gray-600 mt-1 leading-tight">
                  {{ blockType.description }}
                </p>
              </div>

              <!-- Category Badge -->
              <Badge variant="secondary" class="text-xs">
                {{ blockType.category }}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="filteredCategories.length === 0" class="text-center py-12">
      <Icon
        name="lucide:search-x"
        class="w-16 h-16 text-gray-400 mx-auto mb-4"
      />
      <h3 class="text-lg font-medium text-gray-900 mb-2">No blocks found</h3>
      <p class="text-gray-600">Try a different search term</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BlockType } from "~/types/newsletter";

interface Props {
  blockTypes: BlockType[];
}

interface Emits {
  (e: "select", blockType: BlockType): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// State
const searchQuery = ref("");

// Computed
const filteredCategories = computed(() => {
  const categories = new Map();

  // Filter block types by search query
  const filteredBlocks = props.blockTypes.filter((blockType) => {
    if (!searchQuery.value) return true;

    const query = searchQuery.value.toLowerCase();
    return (
      blockType.name.toLowerCase().includes(query) ||
      blockType.description.toLowerCase().includes(query) ||
      blockType.category.toLowerCase().includes(query)
    );
  });

  // Group by category
  filteredBlocks.forEach((blockType) => {
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
</script>

<style scoped>
.block-type-card:hover {
  transform: translateY(-1px);
}
</style>
