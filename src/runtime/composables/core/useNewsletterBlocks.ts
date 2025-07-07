// src/runtime/composables/core/useNewsletterBlocks.ts
import { z } from "zod";
import { reactive, onBeforeUnmount } from "vue";
import type {
  NewsletterBlock,
  BlockType,
  BlockFieldConfig,
} from "../../types/newsletter";
import { toRefs, useDebounceFn } from "@vueuse/core";

// Validation schemas
const BlockSchema = z.object({
  newsletter_id: z.number().positive("Newsletter ID is required"),
  block_type_id: z.number().positive("Block type is required"),
  sort: z.number().min(0),
  field_data: z.record(z.any()).optional(),
});

const BlockUpdateSchema = z.object({
  sort: z.number().min(0).optional(),
  field_data: z.record(z.any()).optional(),
  status: z.enum(["published", "draft"]).optional(),
});

interface UseNewsletterBlocksOptions {
  autoSave?: boolean;
  autoSaveDelay?: number;
  cacheKey?: string;
}

export const useNewsletterBlocks = (
  options: UseNewsletterBlocksOptions = {}
) => {
  const {
    autoSave = true,
    autoSaveDelay = 1500,
    cacheKey = "newsletter-blocks",
  } = options;

  const { directus } = useDirectus();
  const toast = useToast();

  // Enhanced state management
  const state = reactive({
    blocks: [] as NewsletterBlock[],
    blockTypes: [] as BlockType[],
    currentBlock: null as NewsletterBlock | null,
    isLoading: false,
    isSaving: false,
    isDragging: false,
    error: null as string | null,
    lastSaved: null as Date | null,
    dragState: {
      draggedBlock: null as NewsletterBlock | null,
      dropZone: null as number | null,
      dragPreview: null as HTMLElement | null,
    },
  });

  // Enhanced error handling
  const handleError = (error: any, operation: string) => {
    console.error(`Block ${operation} error:`, error);

    let message = `Failed to ${operation}`;
    if (error.statusCode === 404) {
      message = "Block not found";
    } else if (error.statusCode === 403) {
      message = "Permission denied";
    } else if (error.statusCode === 422) {
      message = "Invalid block data";
    } else if (error.message) {
      message = error.message;
    }

    state.error = message;
    toast.error(message);
    throw error;
  };

  // Fetch block types with caching
  const fetchBlockTypes = async (options: any = {}) => {
    const cache = `${cacheKey}-types`;

    try {
      state.isLoading = true;
      state.error = null;

      // Try cache first
      const cached = await fetch(`/api/_cache/${cache}`, {
        method: "GET",
        ignoreResponseError: true,
      });

      if (cached && !options.force) {
        state.blockTypes = cached;
        return cached;
      }

      const response = await directus.request(
        (readItems as any)("newsletter_block_types", {
          fields: ["*"],
          filter: { status: { _eq: "published" } },
          sort: ["category", "sort"],
          ...options,
        })
      );

      state.blockTypes = response as BlockType[];

      // Cache the result
      await fetch(`/api/_cache/${cache}`, {
        method: "POST",
        body: { data: response, ttl: 600 }, // 10 minute cache
      });

      return state.blockTypes;
    } catch (error: any) {
      handleError(error, "fetch block types");
    } finally {
      state.isLoading = false;
    }
  };

  // Fetch blocks for a newsletter
  const fetchBlocks = async (newsletterId: number, options: any = {}) => {
    const cache = `${cacheKey}-${newsletterId}`;

    try {
      state.isLoading = true;
      state.error = null;

      const response = await directus.request(
        (readItems as any)("newsletter_blocks", {
          fields: [
            "*",
            "block_type.id",
            "block_type.name",
            "block_type.slug",
            "block_type.icon",
            "block_type.category",
            "block_type.mjml_template",
            "block_type.field_visibility_config",
            "block_type.default_values",
          ],
          filter: { newsletter_id: { _eq: newsletterId } },
          sort: ["sort"],
          ...options,
        })
      );

      state.blocks = response as NewsletterBlock[];
      return state.blocks;
    } catch (error: any) {
      handleError(error, "fetch blocks");
    } finally {
      state.isLoading = false;
    }
  };

  // Create new block with validation
  const createBlock = async (data: Partial<NewsletterBlock>) => {
    try {
      state.isLoading = true;
      state.error = null;

      // Validate input
      const validated = BlockSchema.parse(data);

      // Get current max sort order
      const maxSort = Math.max(0, ...state.blocks.map((b) => b.sort || 0));

      const response = await directus.request(
        (createItem as any)("newsletter_blocks", {
          status: "published",
          sort: maxSort + 1,
          field_data: {},
          ...validated,
        })
      );

      const block = response as NewsletterBlock;

      // Add to state with block type data
      const blockType = state.blockTypes.find(
        (bt) => bt.id === block.block_type_id
      );
      if (blockType) {
        block.block_type = blockType;
      }

      state.blocks.push(block);
      state.blocks.sort((a, b) => (a.sort || 0) - (b.sort || 0));

      toast.success("Block added successfully");

      // Clear newsletter cache
      await fetch(`/api/_cache/newsletters-${validated.newsletter_id}`, {
        method: "DELETE",
      });

      return block;
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const message = error.errors.map((e) => e.message).join(", ");
        state.error = message;
        toast.error(message);
        throw new Error(message);
      }
      handleError(error, "create block");
    } finally {
      state.isLoading = false;
    }
  };

  // Update block with optimistic updates
  const updateBlock = async (id: number, data: Partial<NewsletterBlock>) => {
    try {
      state.isSaving = true;
      state.error = null;

      // Validate input
      const validated = BlockUpdateSchema.parse(data);

      // Optimistic update
      const index = state.blocks.findIndex((b) => b.id === id);
      if (index !== -1) {
        Object.assign(state.blocks[index], validated);
      }

      if (state.currentBlock?.id === id) {
        Object.assign(state.currentBlock, validated);
      }

      const response = await directus.request(
        (updateItem as any)("newsletter_blocks", id, validated)
      );

      state.lastSaved = new Date();

      // Clear caches
      const block = state.blocks.find((b) => b.id === id);
      if (block) {
        await fetch(`/api/_cache/newsletters-${block.newsletter_id}`, {
          method: "DELETE",
        });
      }

      return response as NewsletterBlock;
    } catch (error: any) {
      // Revert optimistic update on error
      if (index !== -1) {
        await fetchBlocks(state.blocks[index].newsletter_id);
      }
      handleError(error, "update block");
    } finally {
      state.isSaving = false;
    }
  };

  // Auto-save with debouncing
  const autoSaveFunction = useDebounceFn(
    async (id: number, data: Partial<NewsletterBlock>) => {
      if (!autoSave) return;

      try {
        await updateBlock(id, data);
      } catch (error) {
        console.warn("Block auto-save failed:", error);
      }
    },
    autoSaveDelay
  );

  // Delete block
  const deleteBlock = async (id: number) => {
    try {
      state.isLoading = true;
      state.error = null;

      const block = state.blocks.find((b) => b.id === id);
      if (!block) {
        throw new Error("Block not found");
      }

      await directus.request(deleteItem("newsletter_blocks", id));

      // Remove from state
      state.blocks = state.blocks.filter((b) => b.id !== id);

      // Clear selected block if it was deleted
      if (state.currentBlock?.id === id) {
        state.currentBlock = null;
      }

      toast.success("Block deleted successfully");

      // Clear newsletter cache
      await fetch(`/api/_cache/newsletters-${block.newsletter_id}`, {
        method: "DELETE",
      });

      return true;
    } catch (error: any) {
      handleError(error, "delete block");
    } finally {
      state.isLoading = false;
    }
  };

  // Duplicate block
  const duplicateBlock = async (id: number) => {
    try {
      const originalBlock = state.blocks.find((b) => b.id === id);
      if (!originalBlock) {
        throw new Error("Block not found");
      }

      const duplicatedData = {
        newsletter_id: originalBlock.newsletter_id,
        block_type_id: originalBlock.block_type_id,
        field_data: { ...originalBlock.field_data },
        sort: (originalBlock.sort || 0) + 1,
      };

      // Adjust sort order of subsequent blocks
      await reorderBlocks(
        originalBlock.newsletter_id,
        state.blocks.map((b, index) => ({
          id: b.id,
          sort:
            b.id === id
              ? b.sort
              : index >= duplicatedData.sort
              ? (b.sort || 0) + 1
              : b.sort || 0,
        }))
      );

      return await createBlock(duplicatedData);
    } catch (error: any) {
      handleError(error, "duplicate block");
    }
  };

  // Reorder blocks
  const reorderBlocks = async (
    newsletterId: number,
    reorderedBlocks: { id: number; sort: number }[]
  ) => {
    try {
      state.isDragging = false;
      state.isSaving = true;
      state.error = null;

      // Optimistic update
      reorderedBlocks.forEach(({ id, sort }) => {
        const block = state.blocks.find((b) => b.id === id);
        if (block) {
          block.sort = sort;
        }
      });

      state.blocks.sort((a, b) => (a.sort || 0) - (b.sort || 0));

      // Batch update in Directus
      const updates = reorderedBlocks.map(({ id, sort }) => ({
        id,
        sort,
      }));

      await Promise.all(
        updates.map((update) =>
          directus.request(
            (updateItem as any)("newsletter_blocks", update.id, {
              sort: update.sort,
            })
          )
        )
      );

      toast.success("Blocks reordered successfully");

      // Clear newsletter cache
      await fetch(`/api/_cache/newsletters-${newsletterId}`, {
        method: "DELETE",
      });

      return true;
    } catch (error: any) {
      // Revert optimistic update
      await fetchBlocks(newsletterId);
      handleError(error, "reorder blocks");
    } finally {
      state.isSaving = false;
    }
  };

  // Get field configuration for a block type
  const getBlockFieldConfig = (blockType: BlockType): FieldConfig[] => {
    const configs: FieldConfig[] = [];

    if (!blockType.field_visibility_config) {
      return configs;
    }

    // Define field configurations based on common fields
    const fieldDefinitions: Record<string, FieldConfig> = {
      title: {
        field: "title",
        label: "Title",
        type: "text",
        placeholder: "Enter title...",
        required: true,
      },
      content: {
        field: "content",
        label: "Content",
        type: "rich-text",
        placeholder: "Enter content...",
        required: false,
      },
      image_url: {
        field: "image_url",
        label: "Image",
        type: "file",
        placeholder: "Select image...",
        required: false,
      },
      button_text: {
        field: "button_text",
        label: "Button Text",
        type: "text",
        placeholder: "Click here",
        required: false,
      },
      button_url: {
        field: "button_url",
        label: "Button URL",
        type: "url",
        placeholder: "https://example.com",
        required: false,
      },
      background_color: {
        field: "background_color",
        label: "Background Color",
        type: "color",
        placeholder: "#ffffff",
        required: false,
      },
      text_color: {
        field: "text_color",
        label: "Text Color",
        type: "color",
        placeholder: "#000000",
        required: false,
      },
      alignment: {
        field: "alignment",
        label: "Alignment",
        type: "select",
        placeholder: "Choose alignment...",
        required: false,
        options: [
          { value: "left", label: "Left" },
          { value: "center", label: "Center" },
          { value: "right", label: "Right" },
        ],
      },
    };

    // Build configuration based on visibility config
    blockType.field_visibility_config.forEach((field) => {
      if (fieldDefinitions[field]) {
        configs.push(fieldDefinitions[field]);
      }
    });

    return configs;
  };

  // Set current block
  const setCurrentBlock = (block: NewsletterBlock | null) => {
    state.currentBlock = block;
  };

  // Drag and drop helpers
  const startDrag = (block: NewsletterBlock) => {
    state.isDragging = true;
    state.dragState.draggedBlock = block;
  };

  const endDrag = () => {
    state.isDragging = false;
    state.dragState.draggedBlock = null;
    state.dragState.dropZone = null;
  };

  const setDropZone = (sort: number | null) => {
    state.dragState.dropZone = sort;
  };

  // Cleanup
  onBeforeUnmount(() => {
    // Save any pending changes
    if (state.currentBlock && state.isSaving) {
      autoSaveFunction.flush();
    }
  });

  return {
    // State (readonly)
    ...toRefs(readonly(state)),

    // Methods
    fetchBlockTypes,
    fetchBlocks,
    createBlock,
    updateBlock,
    deleteBlock,
    duplicateBlock,
    reorderBlocks,
    getBlockFieldConfig,

    // Block management
    setCurrentBlock,

    // Drag and drop
    startDrag,
    endDrag,
    setDropZone,

    // Auto-save
    autoSave: autoSaveFunction,
  };
};
function readonly(state: {
  blocks: {
    id: number;
    newsletter_id: number;
    block_type: {
      id: number;
      name: string;
      slug: string;
      description: string;
      mjml_template: string;
      status: "published" | "draft" | "archived";
      field_visibility_config?: string[] | undefined;
      icon?: string | undefined;
      category: "content" | "layout" | "media" | "interactive";
    };
    sort: number;
    title?: string | undefined;
    subtitle?: string | undefined;
    text_content?: string | undefined;
    image_url?: string | undefined;
    image_alt_text?: string | undefined;
    image_caption?: string | undefined;
    button_text?: string | undefined;
    button_url?: string | undefined;
    background_color: string;
    text_color: string;
    text_align: "left" | "center" | "right";
    padding: string;
    font_size: string;
    content?: Record<string, any> | undefined;
    mjml_output?: string | undefined;
  }[];
  blockTypes: {
    id: number;
    name: string;
    slug: string;
    description: string;
    mjml_template: string;
    status: "published" | "draft" | "archived";
    field_visibility_config?: string[] | undefined;
    icon?: string | undefined;
    category: "content" | "layout" | "media" | "interactive";
  }[];
  currentBlock: {
    id: number;
    newsletter_id: number;
    block_type: {
      id: number;
      name: string;
      slug: string;
      description: string;
      mjml_template: string;
      status: "published" | "draft" | "archived";
      field_visibility_config?: string[] | undefined;
      icon?: string | undefined;
      category: "content" | "layout" | "media" | "interactive";
    };
    sort: number;
    title?: string | undefined;
    subtitle?: string | undefined;
    text_content?: string | undefined;
    image_url?: string | undefined;
    image_alt_text?: string | undefined;
    image_caption?: string | undefined;
    button_text?: string | undefined;
    button_url?: string | undefined;
    background_color: string;
    text_color: string;
    text_align: "left" | "center" | "right";
    padding: string;
    font_size: string;
    content?: Record<string, any> | undefined;
    mjml_output?: string | undefined;
  } | null;
  isLoading: boolean;
  isSaving: boolean;
  isDragging: boolean;
  error: string | null;
  lastSaved: Date | null;
  dragState: {
    draggedBlock: {
      id: number;
      newsletter_id: number;
      block_type: {
        id: number;
        name: string;
        slug: string;
        description: string;
        mjml_template: string;
        status: "published" | "draft" | "archived";
        field_visibility_config?: string[] | undefined;
        icon?: string | undefined;
        category: "content" | "layout" | "media" | "interactive";
      };
      sort: number;
      title?: string | undefined;
      subtitle?: string | undefined;
      text_content?: string | undefined;
      image_url?: string | undefined;
      image_alt_text?: string | undefined;
      image_caption?: string | undefined;
      button_text?: string | undefined;
      button_url?: string | undefined;
      background_color: string;
      text_color: string;
      text_align: "left" | "center" | "right";
      padding: string;
      font_size: string;
      content?: Record<string, any> | undefined;
      mjml_output?: string | undefined;
    } | null;
    dropZone: number | null;
    dragPreview: HTMLElement | null;
  };
}): any {
  throw new Error("Function not implemented.");
}
