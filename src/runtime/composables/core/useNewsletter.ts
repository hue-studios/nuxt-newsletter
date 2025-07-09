// src/runtime/composables/core/useNewsletter.ts
import { ref, watch, readonly } from "vue";
import { useNuxtApp, useDebounceFn } from "#imports";
import type {
  Newsletter,
  NewsletterBlock,
  EditorState,
} from "../../types/newsletter";

export const useNewsletter = () => {
  const { $directusHelpers } = useNuxtApp();

  // Newsletter state
  const currentNewsletter = ref<Newsletter | null>(null);
  const newsletters = ref<Newsletter[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Editor state
  const editorState = ref<EditorState>({
    selectedBlock: null,
    draggedBlock: null,
    isPreviewMode: false,
    showTemplateLibrary: false,
    showContentLibrary: false,
    isCompiling: false,
    isSaving: false,
  });

  // Fetch newsletters with enhanced error handling
  const fetchNewsletters = async (options: any = {}) => {
    try {
      isLoading.value = true;
      error.value = null;

      const result = await $directusHelpers.newsletters.list(options);

      if (result.success) {
        newsletters.value = result.items as Newsletter[];
        return newsletters.value;
      } else {
        throw new Error(result.error || "Failed to fetch newsletters");
      }
    } catch (err: any) {
      error.value = err.message || "Failed to fetch newsletters";
      console.error("Failed to fetch newsletters:", err);
      return [];
    } finally {
      isLoading.value = false;
    }
  };

  // Fetch single newsletter with full details
  const fetchNewsletter = async (id: number) => {
    try {
      isLoading.value = true;
      error.value = null;

      const result = await $directusHelpers.newsletters.get(id);

      if (result.success) {
        currentNewsletter.value = result.item as Newsletter;
        return currentNewsletter.value;
      } else {
        throw new Error(result.error || "Failed to fetch newsletter");
      }
    } catch (err: any) {
      error.value = err.message || "Failed to fetch newsletter";
      console.error("Failed to fetch newsletter:", err);
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  // Create newsletter
  const createNewsletter = async (data: Partial<Newsletter>) => {
    try {
      isLoading.value = true;
      error.value = null;

      const result = await $directusHelpers.newsletters.create({
        ...data,
        status: "draft",
        priority: "normal",
        is_ab_test: false,
        total_opens: 0,
        approval_status: "pending",
        test_emails: [],
        tags: data.tags || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (result.success) {
        const newsletter = result.item as Newsletter;
        newsletters.value.unshift(newsletter);
        currentNewsletter.value = newsletter;
        return newsletter;
      } else {
        throw new Error(result.error || "Failed to create newsletter");
      }
    } catch (err: any) {
      error.value = err.message || "Failed to create newsletter";
      console.error("Failed to create newsletter:", err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Update newsletter
  const updateNewsletter = async (id: number, data: Partial<Newsletter>) => {
    try {
      editorState.value.isSaving = true;
      error.value = null;

      const result = await $directusHelpers.newsletters.update(id, data);

      if (result.success) {
        const updatedNewsletter = result.item as Newsletter;

        // Update current newsletter if it's the one being edited
        if (currentNewsletter.value?.id === id) {
          currentNewsletter.value = {
            ...currentNewsletter.value,
            ...updatedNewsletter,
          };
        }

        // Update in newsletters list
        const index = newsletters.value.findIndex((n) => n.id === id);
        if (index !== -1) {
          newsletters.value[index] = {
            ...newsletters.value[index],
            ...updatedNewsletter,
          };
        }

        return updatedNewsletter;
      } else {
        throw new Error(result.error || "Failed to update newsletter");
      }
    } catch (err: any) {
      error.value = err.message || "Failed to update newsletter";
      console.error("Failed to update newsletter:", err);
      throw err;
    } finally {
      editorState.value.isSaving = false;
    }
  };

  // Delete newsletter
  const deleteNewsletter = async (id: number) => {
    try {
      isLoading.value = true;
      error.value = null;

      const result = await $directusHelpers.newsletters.delete(id);

      if (result.success) {
        newsletters.value = newsletters.value.filter((n) => n.id !== id);
        if (currentNewsletter.value?.id === id) {
          currentNewsletter.value = null;
        }
        return true;
      } else {
        throw new Error(result.error || "Failed to delete newsletter");
      }
    } catch (err: any) {
      error.value = err.message || "Failed to delete newsletter";
      console.error("Failed to delete newsletter:", err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Block operations
  const addBlock = async (
    newsletterId: number,
    blockData: Partial<NewsletterBlock>
  ) => {
    try {
      const result = await $directusHelpers.blocks.create({
        ...blockData,
        newsletter_id: newsletterId,
        sort: currentNewsletter.value?.blocks?.length || 0,
      });

      if (result.success && currentNewsletter.value) {
        if (!currentNewsletter.value.blocks) {
          currentNewsletter.value.blocks = [];
        }
        currentNewsletter.value.blocks.push(result.item as NewsletterBlock);
        return result.item;
      } else {
        throw new Error(result.error || "Failed to add block");
      }
    } catch (err: any) {
      error.value = err.message || "Failed to add block";
      throw err;
    }
  };

  const updateBlock = async (
    blockId: number,
    data: Partial<NewsletterBlock>
  ) => {
    try {
      const result = await $directusHelpers.blocks.update(blockId, data);

      if (result.success && currentNewsletter.value) {
        const blockIndex = currentNewsletter.value.blocks?.findIndex(
          (b) => b.id === blockId
        );
        if (blockIndex !== -1 && currentNewsletter.value.blocks) {
          currentNewsletter.value.blocks[blockIndex] = {
            ...currentNewsletter.value.blocks[blockIndex],
            ...result.item,
          };
        }
        return result.item;
      } else {
        throw new Error(result.error || "Failed to update block");
      }
    } catch (err: any) {
      error.value = err.message || "Failed to update block";
      throw err;
    }
  };

  const deleteBlock = async (blockId: number) => {
    try {
      const result = await $directusHelpers.blocks.delete(blockId);

      if (result.success && currentNewsletter.value) {
        currentNewsletter.value.blocks =
          currentNewsletter.value.blocks?.filter((b) => b.id !== blockId) || [];
        return true;
      } else {
        throw new Error(result.error || "Failed to delete block");
      }
    } catch (err: any) {
      error.value = err.message || "Failed to delete block";
      throw err;
    }
  };

  const reorderBlocks = async (blocks: NewsletterBlock[]) => {
    try {
      const blocksWithSort = blocks.map((block, index) => ({
        id: block.id,
        sort: index,
      }));

      const result = await $directusHelpers.blocks.batchUpdate(blocksWithSort);

      if (result.success && currentNewsletter.value) {
        currentNewsletter.value.blocks = blocks;
        return true;
      } else {
        throw new Error(result.error || "Failed to reorder blocks");
      }
    } catch (err: any) {
      error.value = err.message || "Failed to reorder blocks";
      throw err;
    }
  };

  // Editor state management
  const selectBlock = (block: NewsletterBlock | null) => {
    editorState.value.selectedBlock = block;
  };

  const togglePreview = () => {
    editorState.value.isPreviewMode = !editorState.value.isPreviewMode;
  };

  const toggleTemplateLibrary = () => {
    editorState.value.showTemplateLibrary =
      !editorState.value.showTemplateLibrary;
  };

  const toggleContentLibrary = () => {
    editorState.value.showContentLibrary =
      !editorState.value.showContentLibrary;
  };

  // Auto-save functionality
  const autoSave = useDebounceFn(async () => {
    if (currentNewsletter.value) {
      await updateNewsletter(currentNewsletter.value.id, {
        updated_at: new Date().toISOString(),
      });
    }
  }, 2000);

  // Watchers
  watch(currentNewsletter, autoSave, { deep: true });

  return {
    // State
    currentNewsletter: readonly(currentNewsletter),
    newsletters: readonly(newsletters),
    isLoading: readonly(isLoading),
    error: readonly(error),
    editorState: readonly(editorState),

    // Newsletter operations
    fetchNewsletters,
    fetchNewsletter,
    createNewsletter,
    updateNewsletter,
    deleteNewsletter,

    // Block operations
    addBlock,
    updateBlock,
    deleteBlock,
    reorderBlocks,

    // Editor state management
    selectBlock,
    togglePreview,
    toggleTemplateLibrary,
    toggleContentLibrary,
    autoSave,
  };
};
