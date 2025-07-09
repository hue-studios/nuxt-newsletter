// src/runtime/composables/core/useNewsletter.ts
import { useNuxtApp } from "nuxt/app";
import { ref, readonly, shallowReadonly } from "vue";
import { $fetch } from "ofetch";
import type {
  Newsletter,
  NewsletterBlock,
  PaginationParams,
  SendResult,
  UseNewsletterReturn,
} from "../../types/newsletter";
import { useNewsletterBlocks } from "#imports";

const newsletters = ref<Newsletter[]>([]);
const currentNewsletter = ref<Newsletter | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);

export const useNewsletter = (): UseNewsletterReturn => {
  const { $directusHelpers } = useNuxtApp();

  const fetchNewsletters = async (params?: PaginationParams) => {
    try {
      isLoading.value = true;
      error.value = null;

      const result = await $directusHelpers.newsletters.list(params);
      if (result.success) {
        newsletters.value = result.data || [];
      } else {
        throw new Error(result.error?.message || "Failed to fetch newsletters");
      }
    } catch (err: any) {
      error.value = err.message || "Failed to fetch newsletters";
      console.error("Failed to fetch newsletters:", err);
    } finally {
      isLoading.value = false;
    }
  };

  const fetchNewsletter = async (id: number): Promise<Newsletter | null> => {
    try {
      isLoading.value = true;
      error.value = null;

      const result = await $directusHelpers.newsletters.get(id);
      if (result.success) {
        currentNewsletter.value = result.data || null;
        return result.data || null;
      } else {
        throw new Error(result.error?.message || "Failed to fetch newsletter");
      }
    } catch (err: any) {
      error.value = err.message || "Failed to fetch newsletter";
      console.error("Failed to fetch newsletter:", err);
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  const createNewsletter = async (
    data: Partial<Newsletter>
  ): Promise<Newsletter> => {
    try {
      isLoading.value = true;
      error.value = null;

      const result = await $directusHelpers.newsletters.create(data);
      if (result.success && result.data) {
        newsletters.value.unshift(result.data);
        return result.data;
      } else {
        throw new Error(result.error?.message || "Failed to create newsletter");
      }
    } catch (err: any) {
      error.value = err.message || "Failed to create newsletter";
      console.error("Failed to create newsletter:", err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const updateNewsletter = async (
    id: number,
    data: Partial<Newsletter>
  ): Promise<Newsletter> => {
    try {
      isLoading.value = true;
      error.value = null;

      const result = await $directusHelpers.newsletters.update(id, data);
      if (result.success && result.data) {
        // Update in the list
        const index = newsletters.value.findIndex((n) => n.id === id);
        if (index !== -1) {
          newsletters.value[index] = {
            ...newsletters.value[index],
            ...result.data,
          };
        }

        // Update current newsletter if it's the same
        if (currentNewsletter.value?.id === id) {
          currentNewsletter.value = {
            ...currentNewsletter.value,
            ...result.data,
          };
        }

        return result.data;
      } else {
        throw new Error(result.error?.message || "Failed to update newsletter");
      }
    } catch (err: any) {
      error.value = err.message || "Failed to update newsletter";
      console.error("Failed to update newsletter:", err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const deleteNewsletter = async (id: number): Promise<void> => {
    try {
      isLoading.value = true;
      error.value = null;

      const result = await $directusHelpers.newsletters.delete(id);
      if (result.success) {
        newsletters.value = newsletters.value.filter((n) => n.id !== id);
        if (currentNewsletter.value?.id === id) {
          currentNewsletter.value = null;
        }
      } else {
        throw new Error(result.error?.message || "Failed to delete newsletter");
      }
    } catch (err: any) {
      error.value = err.message || "Failed to delete newsletter";
      console.error("Failed to delete newsletter:", err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const duplicateNewsletter = async (id: number): Promise<Newsletter> => {
    try {
      const original = await fetchNewsletter(id);
      if (!original) {
        throw new Error("Newsletter not found");
      }

      const duplicateData = {
        ...original,
        title: `${original.title} (Copy)`,
        status: "draft" as const,
        id: undefined,
        date_created: undefined,
        date_updated: undefined,
      };

      return await createNewsletter(duplicateData);
    } catch (err: any) {
      error.value = err.message || "Failed to duplicate newsletter";
      console.error("Failed to duplicate newsletter:", err);
      throw err;
    }
  };

  const sendNewsletter = async (
    id: number,
    options?: any
  ): Promise<SendResult> => {
    try {
      isLoading.value = true;
      error.value = null;

      const result = await $fetch<SendResult>("/api/newsletter/core/send", {
        method: "POST",
        body: { newsletter_id: id, ...options },
      });

      // Update newsletter status
      await updateNewsletter(id, {
        status: "sent",
        sent_at: new Date(),
      });

      return result;
    } catch (err: any) {
      error.value = err.message || "Failed to send newsletter";
      console.error("Failed to send newsletter:", err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const addBlock = async (
    newsletterId: number,
    blockData: Partial<NewsletterBlock>
  ): Promise<NewsletterBlock> => {
    try {
      error.value = null;

      const { createBlock } = useNewsletterBlocks();
      const block = await createBlock({
        ...blockData,
        newsletter_id: newsletterId,
      });

      // Update current newsletter if it matches
      if (currentNewsletter.value?.id === newsletterId) {
        if (!currentNewsletter.value.blocks) {
          currentNewsletter.value.blocks = [];
        }
        currentNewsletter.value.blocks.push(block);
      }

      return block;
    } catch (err: any) {
      error.value = err.message || "Failed to add block";
      console.error("Failed to add block:", err);
      throw err;
    }
  };

  const updateBlock = async (
    blockId: number,
    data: Partial<NewsletterBlock>
  ): Promise<NewsletterBlock> => {
    try {
      error.value = null;

      const { updateBlock: updateBlockHelper } = useNewsletterBlocks();
      const block = await updateBlockHelper(blockId, data);

      // Update in current newsletter
      if (currentNewsletter.value?.blocks) {
        const blockIndex = currentNewsletter.value.blocks.findIndex(
          (b) => b.id === blockId
        );
        if (blockIndex !== -1) {
          currentNewsletter.value.blocks[blockIndex] = {
            ...currentNewsletter.value.blocks[blockIndex],
            ...block,
          };
        }
      }

      return block;
    } catch (err: any) {
      error.value = err.message || "Failed to update block";
      console.error("Failed to update block:", err);
      throw err;
    }
  };

  const deleteBlock = async (blockId: number): Promise<void> => {
    try {
      error.value = null;

      const { deleteBlock: deleteBlockHelper } = useNewsletterBlocks();
      await deleteBlockHelper(blockId);

      // Remove from current newsletter
      if (currentNewsletter.value?.blocks) {
        currentNewsletter.value.blocks = currentNewsletter.value.blocks.filter(
          (b) => b.id !== blockId
        );
      }
    } catch (err: any) {
      error.value = err.message || "Failed to delete block";
      console.error("Failed to delete block:", err);
      throw err;
    }
  };

  const reorderBlocks = async (blocks: NewsletterBlock[]): Promise<void> => {
    try {
      error.value = null;

      const { reorderBlocks: reorderBlocksHelper } = useNewsletterBlocks();
      await reorderBlocksHelper(blocks);

      // Update current newsletter blocks order
      if (currentNewsletter.value) {
        currentNewsletter.value.blocks = blocks;
      }
    } catch (err: any) {
      error.value = err.message || "Failed to reorder blocks";
      console.error("Failed to reorder blocks:", err);
      throw err;
    }
  };

  return {
    newsletters: shallowReadonly(newsletters),
    currentNewsletter: shallowReadonly(currentNewsletter),
    isLoading: readonly(isLoading),
    error: readonly(error),
    fetchNewsletters,
    fetchNewsletter,
    createNewsletter,
    updateNewsletter,
    deleteNewsletter,
    duplicateNewsletter,
    sendNewsletter,
    addBlock,
    updateBlock,
    deleteBlock,
    reorderBlocks,
  };
};
