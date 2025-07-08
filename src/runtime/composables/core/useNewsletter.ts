// src/runtime/composables/core/useNewsletter.ts
import { useNuxtApp } from "nuxt/app";

import { ref, computed } from "vue";
import type {
  Newsletter,
  NewsletterBlock,
  EditorState,
} from "../../types/newsletter";

export const useNewsletter = () => {
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

  // Computed
  const selectedNewsletter = computed(() => currentNewsletter.value);
  const hasUnsavedChanges = computed(() => editorState.value.isSaving);
  const canPreview = computed(
    () =>
      currentNewsletter.value &&
      currentNewsletter.value.blocks &&
      currentNewsletter.value.blocks.length > 0
  );

  // Methods
  const fetchNewsletters = async (options: any = {}) => {
    try {
      isLoading.value = true;
      error.value = null;

      const { $directusHelpers } = useNuxtApp();
      const result = await $directusHelpers.newsletters.list(options);

      if (result.success) {
        newsletters.value = result.items;
        return newsletters.value;
      } else {
        throw new Error(result.error?.message || "Failed to fetch newsletters");
      }
    } catch (err: any) {
      error.value = err.message || "Failed to fetch newsletters";
      console.error("Failed to fetch newsletters:", err);
      // Fallback to mock data for development
      newsletters.value = [];
      return newsletters.value;
    } finally {
      isLoading.value = false;
    }
  };

  const fetchNewsletter = async (id: number) => {
    try {
      isLoading.value = true;
      error.value = null;

      const { $directusHelpers } = useNuxtApp();
      const result = await $directusHelpers.newsletters.get(id);

      if (result.success) {
        currentNewsletter.value = result.item;
        return result.item;
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

  const createNewsletter = async (data: Partial<Newsletter>) => {
    try {
      isLoading.value = true;
      error.value = null;

      const { $directusHelpers } = useNuxtApp();
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
        const newsletter = result.item;
        newsletters.value.unshift(newsletter);
        currentNewsletter.value = newsletter;
        return newsletter;
      } else {
        throw new Error(result.error?.message || "Failed to create newsletter");
      }
    } catch (err: any) {
      error.value = err.message || "Failed to create newsletter";
      console.error("Failed to create newsletter:", err);
      // Fallback to mock creation for development
      const newsletter = {
        id: Date.now(),
        ...data,
        status: "draft" as const,
        priority: "normal" as const,
        is_ab_test: false,
        total_opens: 0,
        approval_status: "pending" as const,
        test_emails: [],
        tags: data.tags || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Newsletter;
      newsletters.value.unshift(newsletter);
      currentNewsletter.value = newsletter;
      return newsletter;
    } finally {
      isLoading.value = false;
    }
  };

  const updateNewsletter = async (id: number, data: Partial<Newsletter>) => {
    try {
      isLoading.value = true;
      error.value = null;

      const { $directusHelpers } = useNuxtApp();
      const result = await $directusHelpers.newsletters.update(id, {
        ...data,
        updated_at: new Date().toISOString(),
      });

      if (result.success) {
        const updatedNewsletter = result.item;
        const index = newsletters.value.findIndex((n) => n.id === id);
        if (index !== -1) {
          newsletters.value[index] = updatedNewsletter;
        }
        if (currentNewsletter.value?.id === id) {
          currentNewsletter.value = updatedNewsletter;
        }
        return updatedNewsletter;
      } else {
        throw new Error(result.error?.message || "Failed to update newsletter");
      }
    } catch (err: any) {
      error.value = err.message || "Failed to update newsletter";
      console.error("Failed to update newsletter:", err);
      // Fallback update for development
      const index = newsletters.value.findIndex((n) => n.id === id);
      if (index !== -1) {
        newsletters.value[index] = {
          ...newsletters.value[index],
          ...data,
          updated_at: new Date().toISOString(),
        };
      }
      if (currentNewsletter.value?.id === id) {
        currentNewsletter.value = {
          ...currentNewsletter.value,
          ...data,
          updated_at: new Date().toISOString(),
        };
      }
      return currentNewsletter.value;
    } finally {
      isLoading.value = false;
    }
  };

  const deleteNewsletter = async (id: number) => {
    try {
      isLoading.value = true;
      error.value = null;

      const { $directusHelpers } = useNuxtApp();
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
      // Fallback delete for development
      newsletters.value = newsletters.value.filter((n) => n.id !== id);
      if (currentNewsletter.value?.id === id) {
        currentNewsletter.value = null;
      }
    } finally {
      isLoading.value = false;
    }
  };

  const duplicateNewsletter = async (newsletter: Newsletter) => {
    const duplicateData = {
      title: `${newsletter.title} (Copy)`,
      slug: `${newsletter.slug}-copy-${Date.now()}`,
      subject_line: newsletter.subject_line,
      from_name: newsletter.from_name,
      from_email: newsletter.from_email,
      category: newsletter.category,
      tags: [...newsletter.tags],
      blocks: newsletter.blocks || [],
    };

    return await createNewsletter(duplicateData);
  };

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

  const autoSave = async () => {
    if (currentNewsletter.value && !editorState.value.isSaving) {
      editorState.value.isSaving = true;
      try {
        await updateNewsletter(
          currentNewsletter.value.id,
          currentNewsletter.value
        );
      } finally {
        editorState.value.isSaving = false;
      }
    }
  };

  const compileMJML = async (newsletter: Newsletter) => {
    try {
      editorState.value.isCompiling = true;

      // Mock MJML compilation for now
      const mjmlContent = `
        <mjml>
          <mj-head>
            <mj-title>${newsletter.title}</mj-title>
            <mj-preview>${newsletter.preview_text || ""}</mj-preview>
          </mj-head>
          <mj-body>
            <mj-section>
              <mj-column>
                <mj-text>
                  <h1>${newsletter.title}</h1>
                  <p>Newsletter content would be compiled here...</p>
                </mj-text>
              </mj-column>
            </mj-section>
          </mj-body>
        </mjml>
      `;

      return mjmlContent;
    } finally {
      editorState.value.isCompiling = false;
    }
  };

  const sendTestEmail = async (newsletter: Newsletter, emails: string[]) => {
    try {
      error.value = null;

      const response = await $fetch("/api/newsletter/test", {
        method: "POST",
        body: {
          newsletter_id: newsletter.id,
          test_emails: emails,
          include_analytics: true,
        },
      });

      return response;
    } catch (err: any) {
      error.value = err.message || "Failed to send test email";
      console.error("Failed to send test email:", err);
      throw err;
    }
  };

  const scheduleNewsletter = async (
    newsletter: Newsletter,
    sendDate: string
  ) => {
    try {
      const updatedNewsletter = await updateNewsletter(newsletter.id, {
        status: "scheduled",
        scheduled_send_date: sendDate,
      });
      return updatedNewsletter;
    } catch (err: any) {
      error.value = err.message || "Failed to schedule newsletter";
      throw err;
    }
  };

  const cancelScheduled = async (newsletter: Newsletter) => {
    try {
      const updatedNewsletter = await updateNewsletter(newsletter.id, {
        status: "draft",
        scheduled_send_date: undefined,
      });
      return updatedNewsletter;
    } catch (err: any) {
      error.value = err.message || "Failed to cancel scheduled newsletter";
      throw err;
    }
  };

  return {
    // State
    currentNewsletter,
    newsletters,
    isLoading,
    error,
    editorState,

    // Computed
    selectedNewsletter,
    hasUnsavedChanges,
    canPreview,

    // Methods
    fetchNewsletters,
    fetchNewsletter,
    createNewsletter,
    updateNewsletter,
    deleteNewsletter,
    duplicateNewsletter,
    selectBlock,
    togglePreview,
    toggleTemplateLibrary,
    toggleContentLibrary,
    autoSave,
    compileMJML,
    sendTestEmail,
    scheduleNewsletter,
    cancelScheduled,
  };
};
