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
          :disabled="!editor?.can().chain().focus().toggleBold().run()"
          @click="editor?.chain().focus().toggleBold().run()"
        >
          <Icon name="lucide:bold" class="w-4 h-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          :class="{ 'bg-gray-200': editor?.isActive('italic') }"
          :disabled="!editor?.can().chain().focus().toggleItalic().run()"
          @click="editor?.chain().focus().toggleItalic().run()"
        >
          <Icon name="lucide:italic" class="w-4 h-4" />
        </Button>

        <div class="w-px h-6 bg-gray-300 mx-2" />

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

        <div class="w-px h-6 bg-gray-300 mx-2" />

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

        <div class="w-px h-6 bg-gray-300 mx-2" />

        <Button
          variant="ghost"
          size="sm"
          :class="{ 'bg-gray-200': editor?.isActive('link') }"
          @click="setLink"
        >
          <Icon name="lucide:link" class="w-4 h-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          :disabled="!editor?.isActive('link')"
          @click="editor?.chain().focus().unsetLink().run()"
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
          <DialogDescription>Enter the URL for the link</DialogDescription>
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
import { onMounted, ref, watch, onBeforeUnmount } from "vue";
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
