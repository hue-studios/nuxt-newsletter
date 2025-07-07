// src/runtime/composables/core/useNewsletter.ts
import { ref, reactive, computed, onBeforeUnmount } from "vue";
import { useDebounceFn } from "@vueuse/core";
import { z } from "zod";
import { toast } from "vue-sonner";
import type {
  Newsletter,
  NewsletterBlock,
  EditorState,
  CreateNewsletterData,
  UpdateNewsletterData,
} from "../../types/newsletter";

// Validation schemas
const NewsletterSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  subject_line: z.string().min(1, "Subject line is required").max(200),
  from_name: z.string().min(1, "From name is required").max(100),
  from_email: z.string().email("Invalid email address"),
  category: z.string().min(1, "Category is required"),
  tags: z.array(z.string()).optional(),
});

export const useNewsletter = () => {
  // Reactive state
  const state = reactive({
    newsletters: [] as Newsletter[],
    currentNewsletter: null as Newsletter | null,
    isLoading: false,
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
    isCompiling: false,
    isSaving: false,
    error: null as string | null,
    editorState: {
      selectedBlock: null,
      draggedBlock: null,
      isPreviewMode: false,
      showTemplateLibrary: false,
      showContentLibrary: false,
      isCompiling: false,
      isSaving: false,
      device: "desktop",
      zoom: 100,
    } as EditorState,
  });

  // Composables
  const { $directus } = useNuxtApp();
  const directus = $directus;

  // Helper function for error handling
  const handleError = (error: any, action: string) => {
    console.error(`Error ${action}:`, error);
    const message = error?.message || `Failed to ${action}`;
    state.error = message;
    toast.error(message);
    throw error;
  };

  // Computed
  const drafts = computed(() =>
    state.newsletters.filter((n) => n.status === "draft")
  );
  const scheduled = computed(() =>
    state.newsletters.filter((n) => n.status === "scheduled")
  );
  const sent = computed(() =>
    state.newsletters.filter((n) => n.status === "sent")
  );

  // Newsletter CRUD operations
  const fetchNewsletters = async (
    options: {
      limit?: number;
      offset?: number;
      status?: string;
      category?: string;
      search?: string;
    } = {}
  ) => {
    try {
      state.isLoading = true;
      state.error = null;

      const params = new URLSearchParams();
      if (options.limit) params.append("limit", options.limit.toString());
      if (options.offset) params.append("offset", options.offset.toString());
      if (options.status) params.append("status", options.status);
      if (options.category) params.append("category", options.category);
      if (options.search) params.append("search", options.search);

      const response = await $fetch(`/api/newsletter/list?${params}`);
      state.newsletters = response.data || [];

      return response;
    } catch (error: any) {
      handleError(error, "fetch newsletters");
    } finally {
      state.isLoading = false;
    }
  };

  const fetchNewsletter = async (id: number) => {
    try {
      state.isLoading = true;
      state.error = null;

      const newsletter = await $fetch(`/api/newsletter/${id}`);
      state.currentNewsletter = newsletter;

      return newsletter;
    } catch (error: any) {
      handleError(error, "fetch newsletter");
    } finally {
      state.isLoading = false;
    }
  };

  const createNewsletter = async (data: CreateNewsletterData) => {
    try {
      state.isCreating = true;
      state.error = null;

      // Validate input
      const validated = NewsletterSchema.parse(data);

      const newsletter = await $fetch("/api/newsletter/create", {
        method: "POST",
        body: validated,
      });

      // Add to newsletters list
      state.newsletters.unshift(newsletter);
      state.currentNewsletter = newsletter;

      toast.success("Newsletter created successfully", {
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
      handleError(error, "create newsletter");
    } finally {
      state.isCreating = false;
    }
  };

  const updateNewsletter = async (id: number, data: UpdateNewsletterData) => {
    try {
      state.isUpdating = true;
      state.error = null;

      const newsletter = await $fetch(`/api/newsletter/${id}`, {
        method: "PATCH",
        body: data,
      });

      // Update in newsletters list
      const index = state.newsletters.findIndex((n) => n.id === id);
      if (index !== -1) {
        state.newsletters[index] = newsletter;
      }

      // Update current newsletter if it matches
      if (state.currentNewsletter?.id === id) {
        state.currentNewsletter = newsletter;
      }

      return newsletter;
    } catch (error: any) {
      handleError(error, "update newsletter");
    } finally {
      state.isUpdating = false;
    }
  };

  const deleteNewsletter = async (id: number) => {
    try {
      state.isDeleting = true;
      state.error = null;

      const newsletter = state.newsletters.find((n) => n.id === id);
      const title = newsletter?.title || "Newsletter";

      await $fetch(`/api/newsletter/${id}`, {
        method: "DELETE",
      });

      // Remove from newsletters list
      state.newsletters = state.newsletters.filter((n) => n.id !== id);

      // Clear current newsletter if it was deleted
      if (state.currentNewsletter?.id === id) {
        state.currentNewsletter = null;
      }

      toast.success("Newsletter deleted", {
        description: `"${title}" has been permanently deleted`,
      });

      return true;
    } catch (error: any) {
      handleError(error, "delete newsletter");
    } finally {
      state.isDeleting = false;
    }
  };

  const duplicateNewsletter = async (id: number, newTitle?: string) => {
    try {
      state.isCreating = true;
      state.error = null;

      const originalNewsletter = state.newsletters.find((n) => n.id === id);
      if (!originalNewsletter) {
        throw new Error("Newsletter not found");
      }

      const newsletter = await $fetch(`/api/newsletter/${id}/duplicate`, {
        method: "POST",
        body: {
          title: newTitle || `${originalNewsletter.title} (Copy)`,
        },
      });

      // Add to newsletters list
      state.newsletters.unshift(newsletter);

      toast.success("Newsletter duplicated", {
        description: `"${newsletter.title}" is ready for editing`,
        action: {
          label: "Edit",
          onClick: () => navigateTo(`/newsletters/${newsletter.id}/edit`),
        },
      });

      return newsletter;
    } catch (error: any) {
      handleError(error, "duplicate newsletter");
    } finally {
      state.isCreating = false;
    }
  };

  // Auto-save functionality
  const autoSaveFunction = useDebounceFn(async () => {
    if (!state.currentNewsletter) return;

    try {
      state.isSaving = true;
      await updateNewsletter(state.currentNewsletter.id, {
        ...state.currentNewsletter,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Auto-save failed:", error);
    } finally {
      state.isSaving = false;
    }
  }, 2000);

  // Send test email
  const sendTestEmail = async (newsletter: Newsletter, emails: string[]) => {
    try {
      state.isLoading = true;
      state.error = null;

      await $fetch("/api/newsletter/send-test", {
        method: "POST",
        body: {
          newsletter_id: newsletter.id,
          test_emails: emails,
        },
      });

      toast.success("Test email sent", {
        description: `Sent to ${emails.length} recipient${
          emails.length > 1 ? "s" : ""
        }`,
      });
    } catch (error: any) {
      handleError(error, "send test email");
    } finally {
      state.isLoading = false;
    }
  };

  // MJML compilation
  const compileMJML = async (newsletterId: number) => {
    try {
      state.isCompiling = true;
      state.error = null;

      const response = await $fetch("/api/newsletter/compile-mjml", {
        method: "POST",
        body: { newsletter_id: newsletterId },
      });

      if (response.warnings?.length) {
        toast.warning("Compiled with warnings", {
          description: `${response.warnings.length} warnings found`,
        });
      } else {
        toast.success("Newsletter compiled successfully");
      }

      // Refresh newsletter data
      if (state.currentNewsletter?.id === newsletterId) {
        await fetchNewsletter(newsletterId);
      }

      return response;
    } catch (error: any) {
      handleError(error, "compile MJML");
    } finally {
      state.isCompiling = false;
    }
  };

  // Enhanced analytics fetching
  const fetchAnalytics = async (newsletterId: number) => {
    try {
      const response = await $fetch(
        `/api/newsletter/analytics/${newsletterId}`
      );
      return response;
    } catch (error: any) {
      handleError(error, "fetch analytics");
    }
  };

  // Editor state management
  const selectBlock = (block: NewsletterBlock | null) => {
    state.editorState.selectedBlock = block;
  };

  const setPreviewMode = (enabled: boolean) => {
    state.editorState.isPreviewMode = enabled;
  };

  const setDevice = (device: "desktop" | "mobile") => {
    state.editorState.device = device;
  };

  const setZoom = (zoom: number) => {
    state.editorState.zoom = Math.max(50, Math.min(200, zoom));
  };

  // Cleanup
  onBeforeUnmount(() => {
    // Save any pending changes
    if (state.currentNewsletter && state.isSaving) {
      autoSaveFunction.flush();
    }
  });

  return {
    // State (readonly)
    ...toRefs(readonly(state)),

    // Methods
    fetchNewsletters,
    fetchNewsletter,
    createNewsletter,
    updateNewsletter,
    deleteNewsletter,
    duplicateNewsletter,
    compileMJML,
    fetchAnalytics,
    sendTestEmail,

    // Editor methods
    selectBlock,
    setPreviewMode,
    setDevice,
    setZoom,

    // Auto-save
    autoSave: autoSaveFunction,
  };
};
