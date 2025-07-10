// src/runtime/composables/core/useNewsletterBlocks.ts
import { useNuxtApp } from "#app";
import { ref } from "vue";
import type { NewsletterBlock, BlockType } from "../../types/newsletter";

export const useNewsletterBlocks = () => {
  const blockTypes = ref<BlockType[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const fetchBlockTypes = async () => {
    try {
      isLoading.value = true;
      error.value = null;

      const { $directusHelpers } = useNuxtApp();
      const result = await $directusHelpers.blockTypes.list();

      if (result.success) {
        blockTypes.value = result.data || [];
      } else {
        throw new Error(result.error?.message || "Failed to fetch block types");
      }
    } catch (err: any) {
      error.value = err.message || "Failed to fetch block types";
      console.error("Failed to fetch block types:", err);
      // Fallback to mock block types for development
      blockTypes.value = [
        {
          id: 1,
          name: "Text Block",
          slug: "text",
          description: "Simple text content block",
          mjml_template: "<mj-text>{{text_content}}</mj-text>",
          status: "published",
          icon: "lucide:type",
          category: "content",
        },
        {
          id: 2,
          name: "Image Block",
          slug: "image",
          description: "Image with optional caption",
          mjml_template:
            '<mj-image src="{{image_url}}" alt="{{image_alt_text}}" />',
          status: "published",
          icon: "lucide:image",
          category: "media",
        },
        {
          id: 3,
          name: "Button Block",
          slug: "button",
          description: "Call-to-action button",
          mjml_template:
            '<mj-button href="{{button_url}}">{{button_text}}</mj-button>',
          status: "published",
          icon: "lucide:mouse-pointer-click",
          category: "interactive",
        },
      ] as BlockType[];
    } finally {
      isLoading.value = false;
    }
  };

  const createBlock = async (data: Partial<NewsletterBlock>) => {
    try {
      error.value = null;

      const { $directusHelpers } = useNuxtApp();
      const result = await $directusHelpers.createItem("newsletter_blocks", {
        ...data,
        sort: data.sort || 0,
        background_color: data.background_color || "#ffffff",
        text_color: data.text_color || "#000000",
        text_align: data.text_align || "left",
        padding: data.padding || "20px",
        font_size: data.font_size || "16px",
      });

      if (result.success) {
        return result.data as NewsletterBlock;
      } else {
        throw new Error(result.error?.message || "Failed to create block");
      }
    } catch (err: any) {
      error.value = err.message || "Failed to create block";
      console.error("Failed to create block:", err);
      // Fallback to mock creation for development
      return {
        id: Date.now(),
        ...data,
        sort: data.sort || 0,
        background_color: data.background_color || "#ffffff",
        text_color: data.text_color || "#000000",
        text_align: data.text_align || "left",
        padding: data.padding || "20px",
        font_size: data.font_size || "16px",
      } as NewsletterBlock;
    }
  };

  const updateBlock = async (id: number, data: Partial<NewsletterBlock>) => {
    try {
      error.value = null;

      const { $directusHelpers } = useNuxtApp();
      const result = await $directusHelpers.updateItem(
        "newsletter_blocks",
        id,
        data
      );

      if (result.success) {
        return result.data as NewsletterBlock;
      } else {
        throw new Error(result.error?.message || "Failed to update block");
      }
    } catch (err: any) {
      error.value = err.message || "Failed to update block";
      console.error("Failed to update block:", err);
      throw err;
    }
  };

  const deleteBlock = async (id: number) => {
    try {
      error.value = null;

      const { $directusHelpers } = useNuxtApp();
      const result = await $directusHelpers.deleteItem("newsletter_blocks", id);

      if (!result.success) {
        throw new Error(result.error?.message || "Failed to delete block");
      }
    } catch (err: any) {
      error.value = err.message || "Failed to delete block";
      console.error("Failed to delete block:", err);
      throw err;
    }
  };

  const duplicateBlock = async (block: NewsletterBlock) => {
    try {
      error.value = null;

      const duplicatedData = {
        ...block,
        id: undefined,
        sort: block.sort ? +1 : 0,
      };

      return await createBlock(duplicatedData);
    } catch (err: any) {
      error.value = err.message || "Failed to duplicate block";
      console.error("Failed to duplicate block:", err);
      throw err;
    }
  };

  const reorderBlocks = async (blocks: NewsletterBlock[]) => {
    try {
      error.value = null;

      // Update sort order for each block
      const updatePromises = blocks.map((block, index) =>
        updateBlock(block.id as number, { sort: index })
      );

      await Promise.all(updatePromises);
    } catch (err: any) {
      error.value = err.message || "Failed to reorder blocks";
      console.error("Failed to reorder blocks:", err);
      throw err;
    }
  };

  const getBlockTypeBySlug = (slug: string) => {
    return blockTypes.value.find((type) => type.slug === slug);
  };

  const getBlocksByCategory = (category: BlockType["category"]) => {
    return blockTypes.value.filter((type) => type.category === category);
  };

  const validateBlock = (block: NewsletterBlock) => {
    const errors: string[] = [];

    // Required fields validation
    if (!block.block_type) {
      errors.push("Block type is required");
    }

    // Category-specific validation
    if (
      block.block_type?.category === "content" &&
      !block.text_content?.trim()
    ) {
      errors.push("Content blocks require text content");
    }

    if (block.block_type?.category === "media" && !block.image_url?.trim()) {
      errors.push("Media blocks require an image");
    }

    if (
      block.block_type?.category === "interactive" &&
      !block.button_url?.trim()
    ) {
      errors.push("Interactive blocks require a URL");
    }

    return errors;
  };

  // ADD THIS MISSING METHOD:
  const getBlockFieldConfig = (blockType: BlockType) => {
    if (!blockType) return [];

    // Define field configurations based on block type
    const baseConfig = [
      {
        field: "title",
        type: "text",
        label: "Title",
        placeholder: "Enter title...",
        required: false,
      },
      {
        field: "text_content",
        type: "rich-text",
        label: "Content",
        placeholder: "Enter content...",
        required: false,
      },
    ];

    // Category-specific fields
    const categoryFields: Record<string, any[]> = {
      content: [
        ...baseConfig,
        {
          field: "subtitle",
          type: "text",
          label: "Subtitle",
          placeholder: "Enter subtitle...",
          required: false,
        },
      ],
      media: [
        {
          field: "image_url",
          type: "file",
          label: "Image",
          placeholder: "Upload image or enter URL...",
          required: true,
        },
        {
          field: "image_alt_text",
          type: "text",
          label: "Alt Text",
          placeholder: "Describe the image...",
          required: false,
        },
        {
          field: "title",
          type: "text",
          label: "Caption",
          placeholder: "Image caption...",
          required: false,
        },
      ],
      interactive: [
        {
          field: "button_text",
          type: "text",
          label: "Button Text",
          placeholder: "Click here",
          required: true,
        },
        {
          field: "button_url",
          type: "url",
          label: "Button URL",
          placeholder: "https://example.com",
          required: true,
        },
        {
          field: "title",
          type: "text",
          label: "Title",
          placeholder: "Enter title...",
          required: false,
        },
        {
          field: "text_content",
          type: "textarea",
          label: "Description",
          placeholder: "Enter description...",
          required: false,
        },
      ],
      layout: [
        {
          field: "title",
          type: "text",
          label: "Section Title",
          placeholder: "Enter section title...",
          required: false,
        },
      ],
    };

    // Get fields for this block type's category
    const fields = categoryFields[blockType.category] || baseConfig;

    // Add any custom fields from block type configuration
    if (blockType.custom_fields) {
      fields.push(...blockType.custom_fields);
    }

    return fields;
  };

  return {
    blockTypes,
    isLoading,
    error,
    fetchBlockTypes,
    createBlock,
    updateBlock,
    deleteBlock,
    duplicateBlock,
    reorderBlocks,
    getBlockTypeBySlug,
    getBlocksByCategory,
    validateBlock,
    getBlockFieldConfig, // ADD THIS TO THE RETURN
  };
};
