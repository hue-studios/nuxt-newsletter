// src/runtime/composables/core/useNewsletterTemplates.ts
import { useNuxtApp } from "#imports";
import { ref, readonly } from "vue";
import type { NewsletterTemplate, Newsletter } from "../../types/newsletter";
import { useNewsletter } from "#imports";

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
        templates.value = result.data || [];
      } else {
        throw new Error(result.error?.message || "Failed to fetch templates");
      }
    } catch (err: any) {
      error.value = err.message || "Failed to fetch templates";
      console.error("Failed to fetch templates:", err);
      // Fallback templates
      templates.value = [
        {
          id: 1,
          name: "Basic Newsletter",
          description: "Simple newsletter template",
          mjml_template:
            "<mjml><mj-body><mj-section><mj-column><mj-text>Hello World</mj-text></mj-column></mj-section></mj-body></mjml>",
          category: "basic",
          status: "active",
          tags: ["basic", "simple"],
        },
      ];
    } finally {
      isLoading.value = false;
    }
  };

  const createTemplate = async (data: Partial<NewsletterTemplate>) => {
    try {
      isLoading.value = true;
      error.value = null;

      const { $directusHelpers } = useNuxtApp();
      const result = await $directusHelpers.createItem("newsletter_templates", {
        ...data,
        status: data.status || "active",
        date_created: new Date(),
      });

      if (result.success) {
        templates.value.push(result.data);
        return result.data;
      } else {
        throw new Error(result.error?.message || "Failed to create template");
      }
    } catch (err: any) {
      error.value = err.message || "Failed to create template";
      console.error("Failed to create template:", err);
      throw err;
    } finally {
      isLoading.value = false;
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
        {
          ...data,
          date_updated: new Date(),
        }
      );

      if (result.success) {
        const index = templates.value.findIndex((t) => t.id === id);
        if (index !== -1) {
          templates.value[index] = {
            ...templates.value[index],
            ...result.data,
          };
        }
        return result.data;
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

  const createNewsletterFromTemplate = async (
    templateId: number,
    newsletterData: Partial<Newsletter>
  ) => {
    try {
      const template = templates.value.find((t) => t.id === templateId);
      if (!template) {
        throw new Error("Template not found");
      }

      const { updateNewsletter } = useNewsletter();

      const newsletter: Partial<Newsletter> = {
        ...newsletterData,
        mjml_template: template.mjml_template,
        blocks: template.blocks ? [...template.blocks] : [],
      };

      // If updating existing newsletter
      if (newsletterData.id) {
        const result = await updateNewsletter(newsletterData.id, newsletter);
        return result;
      } else {
        // Creating new newsletter from template is handled by useNewsletter
        throw new Error("Newsletter ID required for template application");
      }
    } catch (err: any) {
      error.value = err.message || "Failed to create newsletter from template";
      console.error("Failed to create newsletter from template:", err);
      throw err;
    }
  };

  return {
    templates: readonly(templates),
    isLoading: readonly(isLoading),
    error: readonly(error),
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    createNewsletterFromTemplate,
  };
};
