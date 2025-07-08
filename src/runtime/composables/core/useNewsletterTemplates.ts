// src/runtime/composables/core/useNewsletterTemplates.ts
import { ref } from "vue";
import type { NewsletterTemplate } from "../../types/newsletter";
import { useNuxtApp } from "nuxt/app";

export const useNewsletterTemplates = () => {
  const templates = ref<NewsletterTemplate[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const fetchTemplates = async () => {
    try {
      isLoading.value = true;
      error.value = null;

      const { $directusHelpers } = useNuxtApp();
      const result = await $directusHelpers.templates.list();

      if (result.success) {
        templates.value = result.items;
      } else {
        throw new Error(result.error?.message || "Failed to fetch templates");
      }
    } catch (err: any) {
      error.value = err.message || "Failed to fetch templates";
      console.error("Failed to fetch templates:", err);
      // Fallback to mock templates for development
      templates.value = [
        {
          id: 1,
          name: "Weekly Update",
          description: "A simple template for weekly newsletters",
          category: "weekly",
          thumbnail_url: "/templates/weekly-update.png",
          blocks_config: {
            header: { enabled: true },
            content: { blocks: 3 },
            footer: { enabled: true },
          },
          default_subject_pattern: "Weekly Update - {{date}}",
          default_from_name: "Newsletter Team",
          status: "published",
          usage_count: 45,
          tags: ["weekly", "update", "simple"],
        },
        {
          id: 2,
          name: "Product Launch",
          description: "Template for product announcements",
          category: "product",
          thumbnail_url: "/templates/product-launch.png",
          blocks_config: {
            hero: { enabled: true },
            features: { blocks: 4 },
            cta: { enabled: true },
          },
          default_subject_pattern: "🚀 New Product: {{product_name}}",
          default_from_name: "Product Team",
          status: "published",
          usage_count: 23,
          tags: ["product", "launch", "announcement"],
        },
      ] as NewsletterTemplate[];
    } finally {
      isLoading.value = false;
    }
  };

  const createTemplate = async (data: Partial<NewsletterTemplate>) => {
    try {
      error.value = null;

      const { $directusHelpers } = useNuxtApp();
      const result = await $directusHelpers.createItem("newsletter_templates", {
        ...data,
        status: "draft",
        usage_count: 0,
        tags: data.tags || [],
      });

      if (result.success) {
        const template = result.item as NewsletterTemplate;
        templates.value.unshift(template);
        return template;
      } else {
        throw new Error(result.error?.message || "Failed to create template");
      }
    } catch (err: any) {
      error.value = err.message || "Failed to create template";
      console.error("Failed to create template:", err);
      // Fallback to mock creation
      const template = {
        id: Date.now(),
        ...data,
        status: "draft" as const,
        usage_count: 0,
        tags: data.tags || [],
      } as NewsletterTemplate;
      templates.value.unshift(template);
      return template;
    }
  };

  const updateTemplate = async (
    id: number,
    data: Partial<NewsletterTemplate>
  ) => {
    try {
      error.value = null;

      const { $directusHelpers } = useNuxtApp();
      const result = await $directusHelpers.updateItem(
        "newsletter_templates",
        id,
        data
      );

      if (result.success) {
        const updatedTemplate = result.item as NewsletterTemplate;
        const index = templates.value.findIndex((t) => t.id === id);
        if (index !== -1) {
          templates.value[index] = updatedTemplate;
        }
        return updatedTemplate;
      } else {
        throw new Error(result.error?.message || "Failed to update template");
      }
    } catch (err: any) {
      error.value = err.message || "Failed to update template";
      console.error("Failed to update template:", err);
      throw err;
    }
  };

  const deleteTemplate = async (id: number) => {
    try {
      error.value = null;

      const { $directusHelpers } = useNuxtApp();
      const result = await $directusHelpers.deleteItem(
        "newsletter_templates",
        id
      );

      if (result.success) {
        templates.value = templates.value.filter((t) => t.id !== id);
      } else {
        throw new Error(result.error?.message || "Failed to delete template");
      }
    } catch (err: any) {
      error.value = err.message || "Failed to delete template";
      console.error("Failed to delete template:", err);
      throw err;
    }
  };

  const applyTemplate = async (templateId: number, newsletterId: number) => {
    try {
      error.value = null;

      const template = templates.value.find((t) => t.id === templateId);
      if (!template) {
        throw new Error("Template not found");
      }

      // Update usage count
      await updateTemplate(templateId, {
        usage_count: template.usage_count + 1,
      });

      // Apply template configuration to newsletter
      const { updateNewsletter } = useNewsletter();
      const updatedNewsletter = await updateNewsletter(newsletterId, {
        template_id: templateId,
        // Apply template defaults if not already set
        from_name: template.default_from_name,
      });

      return updatedNewsletter;
    } catch (err: any) {
      error.value = err.message || "Failed to apply template";
      console.error("Failed to apply template:", err);
      throw err;
    }
  };

  const getTemplatesByCategory = (category: string) => {
    return templates.value.filter(
      (t: { category: string }) => t.category === category
    );
  };

  const getPopularTemplates = (limit: number = 5) => {
    return [...templates.value]
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, limit);
  };

  return {
    templates,
    isLoading,
    error,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    applyTemplate,
    getTemplatesByCategory,
    getPopularTemplates,
  };
};
