// src/runtime/composables/core/useNewsletterTemplates.ts
import { ref, reactive, computed } from "vue";
import { z } from "zod";
import { toast } from "vue-sonner";
import type {
  NewsletterTemplate,
  Newsletter,
  NewsletterBlock,
  CreateNewsletterData,
} from "~/types/newsletter";

// Validation schemas
const TemplateSchema = z.object({
  name: z.string().min(1, "Template name is required").max(100),
  description: z.string().max(500).optional(),
  category: z.string().min(1, "Category is required"),
  tags: z.array(z.string()).optional(),
  is_public: z.boolean().optional(),
});

const defaultCategory = "General";

export const useNewsletterTemplates = () => {
  // Reactive state
  const state = reactive({
    templates: [] as NewsletterTemplate[],
    featuredTemplates: [] as NewsletterTemplate[],
    currentTemplate: null as NewsletterTemplate | null,
    isLoading: false,
    isCreating: false,
    isSaving: false,
    error: null as string | null,
  });

  // Composables
  const { $directus } = useNuxtApp();
  const directus = $directus;

  // Helper function for error handling
  const handleError = (error: any, action: string) => {
    console.error(`Error ${action}:`, error);
    const message = error?.message || `Failed to ${action}`;
    state.error = message;
    toast.error("Operation failed", {
      description: message,
    });
    throw error;
  };

  // Computed
  const templatesByCategory = computed(() => {
    const grouped = state.templates.reduce((acc, template) => {
      const category = template.category || defaultCategory;
      if (!acc[category]) acc[category] = [];
      acc[category].push(template);
      return acc;
    }, {} as Record<string, NewsletterTemplate[]>);

    return grouped;
  });

  const categories = computed(() => {
    return Object.keys(templatesByCategory.value).sort();
  });

  // Template operations
  const fetchTemplates = async (
    options: {
      category?: string;
      featured?: boolean;
      limit?: number;
      search?: string;
    } = {}
  ) => {
    try {
      state.isLoading = true;
      state.error = null;

      const params = new URLSearchParams();
      if (options.category) params.append("category", options.category);
      if (options.featured) params.append("featured", "true");
      if (options.limit) params.append("limit", options.limit.toString());
      if (options.search) params.append("search", options.search);

      const response = await $fetch(`/api/newsletter/templates?${params}`);

      if (options.featured) {
        state.featuredTemplates = response.data || [];
      } else {
        state.templates = response.data || [];
      }

      return response;
    } catch (error: any) {
      handleError(error, "fetch templates");
    } finally {
      state.isLoading = false;
    }
  };

  const fetchTemplate = async (id: number) => {
    try {
      state.isLoading = true;
      state.error = null;

      const template = await $fetch(`/api/newsletter/templates/${id}`);
      state.currentTemplate = template;

      return template;
    } catch (error: any) {
      handleError(error, "fetch template");
    } finally {
      state.isLoading = false;
    }
  };

  // Create newsletter from template
  const createFromTemplate = async (
    template: NewsletterTemplate,
    overrides: Partial<CreateNewsletterData> = {}
  ) => {
    try {
      state.isCreating = true;
      state.error = null;

      const newsletterData = {
        title: overrides.title || `${template.name} Newsletter`,
        subject_line:
          overrides.subject_line ||
          template.default_subject ||
          `Newsletter from ${template.name}`,
        from_name: overrides.from_name || "Newsletter",
        from_email: overrides.from_email || "newsletter@example.com",
        category: overrides.category || template.category || defaultCategory,
        tags: overrides.tags || template.tags || [],
        status: "draft" as const,
      };

      // Create the newsletter
      const newsletter = await $fetch("/api/newsletter/create", {
        method: "POST",
        body: newsletterData,
      });

      // Copy blocks from template if they exist
      if (template.blocks && template.blocks.length > 0) {
        const blockPromises = template.blocks
          .sort((a, b) => a.sort - b.sort)
          .map((templateBlock, index) =>
            $fetch("/api/newsletter/blocks", {
              method: "POST",
              body: {
                newsletter_id: newsletter.id,
                block_type_id: templateBlock.block_type_id,
                field_data: { ...templateBlock.field_data },
                sort: index,
              },
            })
          );

        await Promise.all(blockPromises);
      }

      // Update template usage count
      await $fetch(`/api/newsletter/templates/${template.id}/use`, {
        method: "POST",
      });

      toast.success("Newsletter created from template", {
        description: `"${newsletter.title}" is ready for editing`,
        action: {
          label: "Edit",
          onClick: () => navigateTo(`/newsletters/${newsletter.id}/edit`),
        },
      });

      return newsletter;
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const message = error.errors.map((e) => e.message).join(", ");
        state.error = message;
        toast.error("Validation failed", {
          description: message,
        });
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
      const templateResponse = await $fetch("/api/newsletter/templates", {
        method: "POST",
        body: {
          ...validated,
          status: "published",
          featured: false,
          usage_count: 0,
          default_subject: newsletter.subject_line,
        },
      });

      const template = templateResponse as NewsletterTemplate;

      // Copy blocks from newsletter
      if (newsletter.blocks && newsletter.blocks.length > 0) {
        const blockPromises = newsletter.blocks.map((block) =>
          $fetch("/api/newsletter/template-blocks", {
            method: "POST",
            body: {
              template_id: template.id,
              block_type_id: block.block_type_id,
              field_data: { ...block.field_data },
              sort: block.sort,
            },
          })
        );

        await Promise.all(blockPromises);
      }

      // Add to state
      state.templates.unshift(template);

      toast.success("Template created", {
        description: `"${template.name}" saved successfully`,
      });

      return template;
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const message = error.errors.map((e) => e.message).join(", ");
        state.error = message;
        toast.error("Validation failed", {
          description: message,
        });
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

      await $fetch(`/api/newsletter/templates/${id}`, {
        method: "DELETE",
      });

      // Remove from state
      state.templates = state.templates.filter((t) => t.id !== id);
      state.featuredTemplates = state.featuredTemplates.filter(
        (t) => t.id !== id
      );

      // Clear selected template if it was deleted
      if (state.currentTemplate?.id === id) {
        state.currentTemplate = null;
      }

      toast.success("Template deleted", {
        description: `"${template.name}" has been removed`,
      });

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
      const newTemplate = await $fetch("/api/newsletter/templates", {
        method: "POST",
        body: {
          ...duplicatedData,
          status: "published",
          featured: false,
          usage_count: 0,
          default_subject: originalTemplate.default_subject,
        },
      });

      // Copy blocks
      if (originalTemplate.blocks && originalTemplate.blocks.length > 0) {
        const blockPromises = originalTemplate.blocks.map((block) =>
          $fetch("/api/newsletter/template-blocks", {
            method: "POST",
            body: {
              template_id: newTemplate.id,
              block_type_id: block.block_type_id,
              field_data: { ...block.field_data },
              sort: block.sort,
            },
          })
        );

        await Promise.all(blockPromises);
      }

      // Add to state
      state.templates.unshift(newTemplate);

      toast.success("Template duplicated", {
        description: `"${newTemplate.name}" created successfully`,
      });

      return newTemplate;
    } catch (error: any) {
      handleError(error, "duplicate template");
    }
  };

  // Publish/unpublish template
  const toggleTemplateVisibility = async (id: number, isPublic: boolean) => {
    try {
      const template = await $fetch(`/api/newsletter/templates/${id}`, {
        method: "PATCH",
        body: { is_public: isPublic },
      });

      // Update in state
      const index = state.templates.findIndex((t) => t.id === id);
      if (index !== -1) {
        state.templates[index] = template;
      }

      if (state.currentTemplate?.id === id) {
        state.currentTemplate = template;
      }

      toast.success(isPublic ? "Template published" : "Template unpublished", {
        description: isPublic
          ? "Template is now visible to all users"
          : "Template is now private",
      });

      return template;
    } catch (error: any) {
      handleError(error, "update template visibility");
    }
  };

  return {
    // State (readonly)
    ...toRefs(readonly(state)),

    // Computed
    templatesByCategory,
    categories,

    // Methods
    fetchTemplates,
    fetchTemplate,
    createFromTemplate,
    saveAsTemplate,
    deleteTemplate,
    duplicateTemplate,
    toggleTemplateVisibility,
  };
};
