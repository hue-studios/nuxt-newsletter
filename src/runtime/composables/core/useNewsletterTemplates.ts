// src/runtime/composables/core/useNewsletterTemplates.ts
import { z } from "zod";
import type {
  NewsletterTemplate,
  Newsletter,
  NewsletterBlock,
} from "~/types/newsletter";

// Validation schemas
const TemplateSchema = z.object({
  name: z
    .string()
    .min(1, "Template name is required")
    .max(100, "Name too long"),
  description: z.string().max(500, "Description too long").optional(),
  category: z.enum([
    "general",
    "marketing",
    "newsletter",
    "announcement",
    "event",
    "product",
    "seasonal",
  ]),
  tags: z.array(z.string()).optional(),
  is_public: z.boolean().default(false),
});

const CreateFromTemplateSchema = z.object({
  template_id: z.number().positive("Template ID is required"),
  title: z.string().min(1, "Title is required"),
  subject_line: z.string().min(1, "Subject line is required").optional(),
  from_email: z.string().email("Invalid email address").optional(),
  from_name: z.string().min(1, "From name is required").optional(),
});

interface UseNewsletterTemplatesOptions {
  cacheKey?: string;
  defaultCategory?: string;
}

export const useNewsletterTemplates = (
  options: UseNewsletterTemplatesOptions = {}
) => {
  const { cacheKey = "newsletter-templates", defaultCategory = "general" } =
    options;

  const { directus } = useDirectus();
  const toast = useToast();

  // Enhanced state management
  const state = reactive({
    templates: [] as NewsletterTemplate[],
    featuredTemplates: [] as NewsletterTemplate[],
    currentTemplate: null as NewsletterTemplate | null,
    isLoading: false,
    isSaving: false,
    isCreating: false,
    error: null as string | null,
    filters: {
      category: "all" as string,
      tags: [] as string[],
      search: "",
      isPublic: null as boolean | null,
    },
    categories: [
      { value: "all", label: "All Templates", icon: "lucide:grid-3x3" },
      { value: "general", label: "General", icon: "lucide:file-text" },
      { value: "marketing", label: "Marketing", icon: "lucide:megaphone" },
      { value: "newsletter", label: "Newsletter", icon: "lucide:mail" },
      { value: "announcement", label: "Announcement", icon: "lucide:bell" },
      { value: "event", label: "Event", icon: "lucide:calendar" },
      { value: "product", label: "Product", icon: "lucide:package" },
      { value: "seasonal", label: "Seasonal", icon: "lucide:snowflake" },
    ],
  });

  // Enhanced error handling
  const handleError = (error: any, operation: string) => {
    console.error(`Template ${operation} error:`, error);

    let message = `Failed to ${operation}`;
    if (error.statusCode === 404) {
      message = "Template not found";
    } else if (error.statusCode === 403) {
      message = "Permission denied";
    } else if (error.statusCode === 422) {
      message = "Invalid template data";
    } else if (error.message) {
      message = error.message;
    }

    state.error = message;
    toast.error(message);
    throw error;
  };

  // Computed filtered templates
  const filteredTemplates = computed(() => {
    let filtered = [...state.templates];

    // Filter by category
    if (state.filters.category !== "all") {
      filtered = filtered.filter((t) => t.category === state.filters.category);
    }

    // Filter by search
    if (state.filters.search.trim()) {
      const search = state.filters.search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(search) ||
          t.description?.toLowerCase().includes(search) ||
          t.tags?.some((tag) => tag.toLowerCase().includes(search))
      );
    }

    // Filter by tags
    if (state.filters.tags.length > 0) {
      filtered = filtered.filter((t) =>
        state.filters.tags.every((tag) => t.tags?.includes(tag))
      );
    }

    // Filter by public status
    if (state.filters.isPublic !== null) {
      filtered = filtered.filter((t) => t.is_public === state.filters.isPublic);
    }

    return filtered;
  });

  // Get all available tags
  const availableTags = computed(() => {
    const tags = new Set<string>();
    state.templates.forEach((template) => {
      template.tags?.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).sort();
  });

  // Fetch templates with caching and filtering
  const fetchTemplates = async (options: any = {}) => {
    const cache = `${cacheKey}-list`;

    try {
      state.isLoading = true;
      state.error = null;

      // Try cache first
      const cached = await $fetch(`/api/_cache/${cache}`, {
        method: "GET",
        ignoreResponseError: true,
      });

      if (cached && !options.force) {
        state.templates = cached;
        return cached;
      }

      const response = await directus.request(
        readItems("newsletter_templates", {
          fields: [
            "*",
            "preview_image.id",
            "preview_image.filename_download",
            "blocks.id",
            "blocks.sort",
            "blocks.block_type.name",
            "blocks.block_type.slug",
            "blocks.field_data",
          ],
          filter: {
            status: { _eq: "published" },
            ...(options.filter || {}),
          },
          sort: ["-featured", "-updated_at"],
          ...options,
        })
      );

      state.templates = response as NewsletterTemplate[];

      // Separate featured templates
      state.featuredTemplates = state.templates.filter((t) => t.featured);

      // Cache the result
      await $fetch(`/api/_cache/${cache}`, {
        method: "POST",
        body: { data: response, ttl: 600 }, // 10 minute cache
      });

      return state.templates;
    } catch (error: any) {
      handleError(error, "fetch templates");
    } finally {
      state.isLoading = false;
    }
  };

  // Fetch single template with full details
  const fetchTemplate = async (id: number) => {
    const cache = `${cacheKey}-${id}`;

    try {
      state.isLoading = true;
      state.error = null;

      // Try cache first
      const cached = await $fetch(`/api/_cache/${cache}`, {
        method: "GET",
        ignoreResponseError: true,
      });

      if (cached) {
        state.currentTemplate = cached;
        return cached;
      }

      const response = await directus.request(
        readItem("newsletter_templates", id, {
          fields: [
            "*",
            "preview_image.id",
            "preview_image.filename_download",
            "blocks.id",
            "blocks.sort",
            "blocks.block_type.*",
            "blocks.field_data",
          ],
        })
      );

      state.currentTemplate = response as NewsletterTemplate;

      // Cache the result
      await $fetch(`/api/_cache/${cache}`, {
        method: "POST",
        body: { data: response, ttl: 600 },
      });

      return state.currentTemplate;
    } catch (error: any) {
      handleError(error, "fetch template");
    } finally {
      state.isLoading = false;
    }
  };

  // Create newsletter from template
  const createFromTemplate = async (
    templateId: number,
    newsletterData: Partial<Newsletter>
  ) => {
    try {
      state.isCreating = true;
      state.error = null;

      // Validate input
      const validated = CreateFromTemplateSchema.parse({
        template_id: templateId,
        ...newsletterData,
      });

      // Fetch template with blocks if not already loaded
      let template = state.currentTemplate;
      if (!template || template.id !== templateId) {
        template = await fetchTemplate(templateId);
      }

      if (!template) {
        throw new Error("Template not found");
      }

      // Create newsletter
      const { createNewsletter } = useNewsletter();
      const newsletter = await createNewsletter({
        title: validated.title,
        subject_line:
          validated.subject_line || template.default_subject || validated.title,
        from_email: validated.from_email,
        from_name: validated.from_name,
        category: template.category as any,
        template_id: templateId,
        status: "draft",
      });

      // Create blocks from template
      if (template.blocks && template.blocks.length > 0) {
        const { createBlock } = useNewsletterBlocks();

        const blockPromises = template.blocks
          .sort((a, b) => (a.sort || 0) - (b.sort || 0))
          .map((templateBlock, index) =>
            createBlock({
              newsletter_id: newsletter.id,
              block_type_id: templateBlock.block_type_id,
              field_data: { ...templateBlock.field_data },
              sort: index,
            })
          );

        await Promise.all(blockPromises);
      }

      toast.success(`Newsletter created from template "${template.name}"`);

      return newsletter;
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const message = error.errors.map((e) => e.message).join(", ");
        state.error = message;
        toast.error(message);
        throw new Error(message);
      }
      handleError(error, "create from template");
    } finally {
      state.isCreating = false;
    }
  };

  // Save newsletter as template
  const saveAsTemplate = async (
    newsletter: Newsletter,
    templateData: Partial<NewsletterTemplate>
  ) => {
    try {
      state.isSaving = true;
      state.error = null;

      // Validate input
      const validated = TemplateSchema.parse({
        name: templateData.name || newsletter.title,
        description: templateData.description,
        category: templateData.category || defaultCategory,
        tags: templateData.tags || [],
        is_public: templateData.is_public || false,
      });

      // Create template
      const templateResponse = await directus.request(
        createItem("newsletter_templates", {
          ...validated,
          status: "published",
          featured: false,
          usage_count: 0,
          default_subject: newsletter.subject_line,
        })
      );

      const template = templateResponse as NewsletterTemplate;

      // Copy blocks from newsletter
      if (newsletter.blocks && newsletter.blocks.length > 0) {
        const blockPromises = newsletter.blocks.map((block) =>
          directus.request(
            createItem("newsletter_template_blocks", {
              template_id: template.id,
              block_type_id: block.block_type_id,
              field_data: { ...block.field_data },
              sort: block.sort,
            })
          )
        );

        await Promise.all(blockPromises);
      }

      // Add to state
      state.templates.unshift(template);

      toast.success(`Template "${template.name}" created successfully`);

      // Clear cache
      await $fetch(`/api/_cache/${cacheKey}-list`, { method: "DELETE" });

      return template;
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const message = error.errors.map((e) => e.message).join(", ");
        state.error = message;
        toast.error(message);
        throw new Error(message);
      }
      handleError(error, "save as template");
    } finally {
      state.isSaving = false;
    }
  };

  // Delete template
  const deleteTemplate = async (id: number) => {
    try {
      state.isLoading = true;
      state.error = null;

      const template = state.templates.find((t) => t.id === id);
      if (!template) {
        throw new Error("Template not found");
      }

      await directus.request(deleteItem("newsletter_templates", id));

      // Remove from state
      state.templates = state.templates.filter((t) => t.id !== id);
      state.featuredTemplates = state.featuredTemplates.filter(
        (t) => t.id !== id
      );

      // Clear selected template if it was deleted
      if (state.currentTemplate?.id === id) {
        state.currentTemplate = null;
      }

      toast.success(`Template "${template.name}" deleted successfully`);

      // Clear cache
      await $fetch(`/api/_cache/${cacheKey}-list`, { method: "DELETE" });
      await $fetch(`/api/_cache/${cacheKey}-${id}`, { method: "DELETE" });

      return true;
    } catch (error: any) {
      handleError(error, "delete template");
    } finally {
      state.isLoading = false;
    }
  };

  // Duplicate template
  const duplicateTemplate = async (id: number, newName?: string) => {
    try {
      const originalTemplate = await fetchTemplate(id);
      if (!originalTemplate) {
        throw new Error("Template not found");
      }

      const duplicatedData = {
        name: newName || `${originalTemplate.name} (Copy)`,
        description: originalTemplate.description,
        category: originalTemplate.category,
        tags: [...(originalTemplate.tags || [])],
        is_public: false, // Always make copies private initially
      };

      // Create new template
      const newTemplate = await directus.request(
        createItem("newsletter_templates", {
          ...duplicatedData,
          status: "published",
          featured: false,
          usage_count: 0,
          default_subject: originalTemplate.default_subject,
        })
      );

      // Copy blocks
      if (originalTemplate.blocks && originalTemplate.blocks.length > 0) {
        const blockPromises = originalTemplate.blocks.map((block) =>
          directus.request(
            createItem("newsletter_template_blocks", {
              template_id: newTemplate.id,
              block_type_id: block.block_type_id,
              field_data: { ...block.field_data },
              sort: block.sort,
            })
          )
        );

        await Promise.all(blockPromises);
      }

      // Add to state
      state.templates.unshift(newTemplate as NewsletterTemplate);

      toast.success(`Template duplicated as "${duplicatedData.name}"`);

      // Clear cache
      await $fetch(`/api/_cache/${cacheKey}-list`, { method: "DELETE" });

      return newTemplate as NewsletterTemplate;
    } catch (error: any) {
      handleError(error, "duplicate template");
    }
  };

  // Filter management
  const setCategory = (category: string) => {
    state.filters.category = category;
  };

  const setSearch = (search: string) => {
    state.filters.search = search;
  };

  const toggleTag = (tag: string) => {
    const index = state.filters.tags.indexOf(tag);
    if (index === -1) {
      state.filters.tags.push(tag);
    } else {
      state.filters.tags.splice(index, 1);
    }
  };

  const clearFilters = () => {
    state.filters.category = "all";
    state.filters.tags = [];
    state.filters.search = "";
    state.filters.isPublic = null;
  };

  // Get template preview URL
  const getPreviewUrl = (template: NewsletterTemplate) => {
    if (template.preview_image?.id) {
      const config = useRuntimeConfig();
      return `${config.public.newsletter.directusUrl}/assets/${template.preview_image.id}`;
    }
    return null;
  };

  return {
    // State (readonly)
    ...toRefs(readonly(state)),

    // Computed
    filteredTemplates: readonly(filteredTemplates),
    availableTags: readonly(availableTags),

    // Methods
    fetchTemplates,
    fetchTemplate,
    createFromTemplate,
    saveAsTemplate,
    deleteTemplate,
    duplicateTemplate,

    // Filter management
    setCategory,
    setSearch,
    toggleTag,
    clearFilters,

    // Utilities
    getPreviewUrl,
  };
};
