// composables/useNewsletter.ts
import type {
  Newsletter,
  NewsletterBlock,
  BlockType,
  NewsletterTemplate,
  MailingList,
  EditorState,
} from "~/types/newsletter";

export const useNewsletter = () => {
  const { directus } = useDirectus();

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

  // Fetch newsletters with enhanced fields
  const fetchNewsletters = async (options: any = {}) => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await directus.request(
        readItems("newsletters", {
          fields: [
            "*",
            "blocks.id",
            "blocks.sort",
            "blocks.block_type.name",
            "blocks.block_type.slug",
            "blocks.block_type.icon",
            "template_id.name",
            "mailing_list_id.name",
          ],
          sort: ["-updated_at"],
          ...options,
        })
      );

      newsletters.value = response as Newsletter[];
      return newsletters.value;
    } catch (err: any) {
      error.value = err.message || "Failed to fetch newsletters";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Fetch single newsletter with full details
  const fetchNewsletter = async (id: number) => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await directus.request(
        readItem("newsletters", id, {
          fields: [
            "*",
            "blocks.id",
            "blocks.sort",
            "blocks.title",
            "blocks.subtitle",
            "blocks.text_content",
            "blocks.image_url",
            "blocks.image_alt_text",
            "blocks.image_caption",
            "blocks.button_text",
            "blocks.button_url",
            "blocks.background_color",
            "blocks.text_color",
            "blocks.text_align",
            "blocks.padding",
            "blocks.font_size",
            "blocks.content",
            "blocks.mjml_output",
            "blocks.block_type.id",
            "blocks.block_type.name",
            "blocks.block_type.slug",
            "blocks.block_type.description",
            "blocks.block_type.mjml_template",
            "blocks.block_type.icon",
            "blocks.block_type.category",
            "blocks.block_type.field_visibility_config",
            "template_id.name",
            "template_id.category",
            "mailing_list_id.name",
          ],
        })
      );

      currentNewsletter.value = response as Newsletter;
      return currentNewsletter.value;
    } catch (err: any) {
      error.value = err.message || "Failed to fetch newsletter";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Create newsletter
  const createNewsletter = async (data: Partial<Newsletter>) => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await directus.request(
        createItem("newsletters", {
          status: "draft",
          priority: "normal",
          is_ab_test: false,
          total_opens: 0,
          approval_status: "pending",
          ...data,
        })
      );

      const newsletter = response as Newsletter;
      newsletters.value.unshift(newsletter);
      return newsletter;
    } catch (err: any) {
      error.value = err.message || "Failed to create newsletter";
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

      const response = await directus.request(
        updateItem("newsletters", id, data)
      );

      const updatedNewsletter = response as Newsletter;

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
    } catch (err: any) {
      error.value = err.message || "Failed to update newsletter";
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

      await directus.request(deleteItem("newsletters", id));

      // Remove from newsletters list
      newsletters.value = newsletters.value.filter((n) => n.id !== id);

      // Clear current newsletter if it was deleted
      if (currentNewsletter.value?.id === id) {
        currentNewsletter.value = null;
      }
    } catch (err: any) {
      error.value = err.message || "Failed to delete newsletter";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Duplicate newsletter
  const duplicateNewsletter = async (id: number) => {
    try {
      const original = await fetchNewsletter(id);
      if (!original) throw new Error("Newsletter not found");

      const duplicated = await createNewsletter({
        title: `${original.title} (Copy)`,
        subject_line: original.subject_line,
        from_name: original.from_name,
        from_email: original.from_email,
        category: original.category,
        tags: original.tags,
        template_id: original.template_id,
      });

      // Duplicate blocks
      if (original.blocks?.length) {
        for (const block of original.blocks) {
          await createBlock({
            newsletter_id: duplicated.id,
            block_type: block.block_type.id,
            sort: block.sort,
            title: block.title,
            subtitle: block.subtitle,
            text_content: block.text_content,
            image_url: block.image_url,
            image_alt_text: block.image_alt_text,
            image_caption: block.image_caption,
            button_text: block.button_text,
            button_url: block.button_url,
            background_color: block.background_color,
            text_color: block.text_color,
            text_align: block.text_align,
            padding: block.padding,
            font_size: block.font_size,
          });
        }
      }

      return duplicated;
    } catch (err: any) {
      error.value = err.message || "Failed to duplicate newsletter";
      throw err;
    }
  };

  // MJML compilation
  const compileMJML = async (newsletterId: number) => {
    try {
      editorState.value.isCompiling = true;
      error.value = null;

      const response = await $fetch("/api/newsletter/compile-mjml", {
        method: "POST",
        body: { newsletter_id: newsletterId },
      });

      // Refresh newsletter data to get compiled HTML
      if (currentNewsletter.value?.id === newsletterId) {
        await fetchNewsletter(newsletterId);
      }

      return response;
    } catch (err: any) {
      error.value = err.message || "Failed to compile MJML";
      throw err;
    } finally {
      editorState.value.isCompiling = false;
    }
  };

  // Send test email
  const sendTestEmail = async (newsletterId: number, emails: string[]) => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await $fetch("/api/newsletter/send-test", {
        method: "POST",
        body: {
          newsletter_id: newsletterId,
          test_emails: emails,
        },
      });

      return response;
    } catch (err: any) {
      error.value = err.message || "Failed to send test email";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Auto-save functionality
  const autoSave = debounce(async (id: number, data: Partial<Newsletter>) => {
    try {
      await updateNewsletter(id, data);
    } catch (err) {
      console.error("Auto-save failed:", err);
    }
  }, 2000);

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

  return {
    // State
    currentNewsletter: readonly(currentNewsletter),
    newsletters: readonly(newsletters),
    isLoading: readonly(isLoading),
    error: readonly(error),
    editorState,

    // Methods
    fetchNewsletters,
    fetchNewsletter,
    createNewsletter,
    updateNewsletter,
    deleteNewsletter,
    duplicateNewsletter,
    compileMJML,
    sendTestEmail,
    autoSave,

    // Editor methods
    selectBlock,
    togglePreview,
    toggleTemplateLibrary,
    toggleContentLibrary,
  };
};

// composables/useNewsletterBlocks.ts
export const useNewsletterBlocks = () => {
  const { directus } = useDirectus();

  // Block state
  const blocks = ref<NewsletterBlock[]>([]);
  const blockTypes = ref<BlockType[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Fetch block types
  const fetchBlockTypes = async () => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await directus.request(
        readItems("block_types", {
          filter: { status: { _eq: "published" } },
          sort: ["category", "name"],
        })
      );

      blockTypes.value = response as BlockType[];
      return blockTypes.value;
    } catch (err: any) {
      error.value = err.message || "Failed to fetch block types";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Create block
  const createBlock = async (data: Partial<NewsletterBlock>) => {
    try {
      error.value = null;

      const response = await directus.request(
        createItem("newsletter_blocks", {
          background_color: "#ffffff",
          text_color: "#333333",
          text_align: "center",
          padding: "20px 0",
          font_size: "14px",
          ...data,
        })
      );

      const block = response as NewsletterBlock;
      blocks.value.push(block);
      return block;
    } catch (err: any) {
      error.value = err.message || "Failed to create block";
      throw err;
    }
  };

  // Update block
  const updateBlock = async (id: number, data: Partial<NewsletterBlock>) => {
    try {
      error.value = null;

      const response = await directus.request(
        updateItem("newsletter_blocks", id, data)
      );

      const updatedBlock = response as NewsletterBlock;

      // Update in blocks array
      const index = blocks.value.findIndex((b) => b.id === id);
      if (index !== -1) {
        blocks.value[index] = { ...blocks.value[index], ...updatedBlock };
      }

      return updatedBlock;
    } catch (err: any) {
      error.value = err.message || "Failed to update block";
      throw err;
    }
  };

  // Delete block
  const deleteBlock = async (id: number) => {
    try {
      error.value = null;

      await directus.request(deleteItem("newsletter_blocks", id));

      // Remove from blocks array
      blocks.value = blocks.value.filter((b) => b.id !== id);
    } catch (err: any) {
      error.value = err.message || "Failed to delete block";
      throw err;
    }
  };

  // Reorder blocks
  const reorderBlocks = async (newsletterId: number, blockIds: number[]) => {
    try {
      error.value = null;

      const updates = blockIds.map((id, index) =>
        directus.request(
          updateItem("newsletter_blocks", id, { sort: index + 1 })
        )
      );

      await Promise.all(updates);

      // Update local blocks array
      blocks.value.sort((a, b) => {
        const aIndex = blockIds.indexOf(a.id);
        const bIndex = blockIds.indexOf(b.id);
        return aIndex - bIndex;
      });
    } catch (err: any) {
      error.value = err.message || "Failed to reorder blocks";
      throw err;
    }
  };

  // Duplicate block
  const duplicateBlock = async (block: NewsletterBlock) => {
    try {
      const duplicated = await createBlock({
        newsletter_id: block.newsletter_id,
        block_type: block.block_type.id,
        sort: block.sort + 1,
        title: block.title,
        subtitle: block.subtitle,
        text_content: block.text_content,
        image_url: block.image_url,
        image_alt_text: block.image_alt_text,
        image_caption: block.image_caption,
        button_text: block.button_text,
        button_url: block.button_url,
        background_color: block.background_color,
        text_color: block.text_color,
        text_align: block.text_align,
        padding: block.padding,
        font_size: block.font_size,
      });

      return duplicated;
    } catch (err: any) {
      error.value = err.message || "Failed to duplicate block";
      throw err;
    }
  };

  // Get block field configuration
  const getBlockFieldConfig = (blockType: BlockType) => {
    const config = blockType.field_visibility_config || [];
    const fieldConfigs: BlockFieldConfig[] = [];

    config.forEach((field) => {
      switch (field) {
        case "title":
          fieldConfigs.push({
            field: "title",
            type: "text",
            label: "Title",
            placeholder: "Enter title...",
          });
          break;
        case "subtitle":
          fieldConfigs.push({
            field: "subtitle",
            type: "text",
            label: "Subtitle",
            placeholder: "Enter subtitle...",
          });
          break;
        case "text_content":
          fieldConfigs.push({
            field: "text_content",
            type: "rich-text",
            label: "Content",
            placeholder: "Enter content...",
          });
          break;
        case "image_url":
          fieldConfigs.push({
            field: "image_url",
            type: "file",
            label: "Image",
            placeholder: "Select image...",
          });
          break;
        case "button_text":
          fieldConfigs.push({
            field: "button_text",
            type: "text",
            label: "Button Text",
            placeholder: "Enter button text...",
          });
          break;
        case "button_url":
          fieldConfigs.push({
            field: "button_url",
            type: "url",
            label: "Button URL",
            placeholder: "https://...",
          });
          break;
        case "background_color":
          fieldConfigs.push({
            field: "background_color",
            type: "color",
            label: "Background Color",
          });
          break;
        case "text_color":
          fieldConfigs.push({
            field: "text_color",
            type: "color",
            label: "Text Color",
          });
          break;
        case "text_align":
          fieldConfigs.push({
            field: "text_align",
            type: "select",
            label: "Text Alignment",
            options: [
              { value: "left", label: "Left" },
              { value: "center", label: "Center" },
              { value: "right", label: "Right" },
            ],
          });
          break;
      }
    });

    return fieldConfigs;
  };

  return {
    // State
    blocks: readonly(blocks),
    blockTypes: readonly(blockTypes),
    isLoading: readonly(isLoading),
    error: readonly(error),

    // Methods
    fetchBlockTypes,
    createBlock,
    updateBlock,
    deleteBlock,
    reorderBlocks,
    duplicateBlock,
    getBlockFieldConfig,
  };
};

// composables/useNewsletterTemplates.ts
export const useNewsletterTemplates = () => {
  const { directus } = useDirectus();

  // Template state
  const templates = ref<NewsletterTemplate[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Fetch templates
  const fetchTemplates = async () => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await directus.request(
        readItems("newsletter_templates", {
          filter: { status: { _eq: "published" } },
          sort: ["-usage_count", "-created_at"],
        })
      );

      templates.value = response as NewsletterTemplate[];
      return templates.value;
    } catch (err: any) {
      error.value = err.message || "Failed to fetch templates";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Create newsletter from template
  const createFromTemplate = async (
    template: NewsletterTemplate,
    overrides: Partial<Newsletter> = {}
  ) => {
    const { createNewsletter } = useNewsletter();
    const { createBlock, fetchBlockTypes } = useNewsletterBlocks();

    try {
      // Create newsletter
      const newsletter = await createNewsletter({
        title:
          overrides.title ||
          `${template.name} - ${new Date().toLocaleDateString()}`,
        category: template.category as Newsletter["category"],
        subject_line:
          overrides.subject_line ||
          template.default_subject_pattern?.replace(
            "{{date}}",
            new Date().toLocaleDateString()
          ),
        from_name: overrides.from_name || template.default_from_name,
        from_email: overrides.from_email || template.default_from_email,
        template_id: template.id,
        ...overrides,
      });

      // Create blocks from template config
      if (template.blocks_config?.blocks) {
        const blockTypes = await fetchBlockTypes();

        for (let i = 0; i < template.blocks_config.blocks.length; i++) {
          const blockConfig = template.blocks_config.blocks[i];

          // Find matching block type
          const blockType = blockTypes.find(
            (bt) => bt.slug === blockConfig.type
          );

          if (blockType) {
            await createBlock({
              newsletter_id: newsletter.id,
              block_type: blockType.id,
              sort: i + 1,
              ...blockConfig.content,
            });
          }
        }
      }

      // Update template usage count
      await directus.request(
        updateItem("newsletter_templates", template.id, {
          usage_count: (template.usage_count || 0) + 1,
        })
      );

      return newsletter;
    } catch (err: any) {
      error.value = err.message || "Failed to create newsletter from template";
      throw err;
    }
  };

  return {
    // State
    templates: readonly(templates),
    isLoading: readonly(isLoading),
    error: readonly(error),

    // Methods
    fetchTemplates,
    createFromTemplate,
  };
};
