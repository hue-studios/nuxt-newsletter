// src/runtime/composables/core/useNewsletter.ts
import { z } from "zod";
import type { Newsletter, NewsletterBlock } from "~/types/newsletter";

// Validation schemas
const NewsletterSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  subject_line: z
    .string()
    .min(1, "Subject line is required")
    .max(78, "Subject line too long"),
  from_email: z.string().email("Invalid email address"),
  from_name: z.string().min(1, "From name is required"),
  category: z.enum([
    "company",
    "product",
    "weekly",
    "monthly",
    "event",
    "offer",
  ]),
});

interface UseNewsletterOptions {
  autoSave?: boolean;
  autoSaveDelay?: number;
  cacheKey?: string;
}

export const useNewsletter = (options: UseNewsletterOptions = {}) => {
  const {
    autoSave = true,
    autoSaveDelay = 2000,
    cacheKey = "newsletters",
  } = options;

  const { directus } = useDirectus();
  const toast = useToast();

  // Enhanced state management
  const state = reactive({
    newsletters: [] as Newsletter[],
    currentNewsletter: null as Newsletter | null,
    isLoading: false,
    isSaving: false,
    isCompiling: false,
    error: null as string | null,
    lastSaved: null as Date | null,
    editorState: {
      selectedBlock: null as NewsletterBlock | null,
      draggedBlock: null as NewsletterBlock | null,
      isPreviewMode: false,
      showTemplateLibrary: false,
      showContentLibrary: false,
      zoom: 100,
      device: "desktop" as "desktop" | "mobile",
    },
  });

  // Enhanced error handling
  const handleError = (error: any, operation: string) => {
    console.error(`Newsletter ${operation} error:`, error);

    let message = `Failed to ${operation}`;
    if (error.statusCode === 404) {
      message = "Newsletter not found";
    } else if (error.statusCode === 403) {
      message = "Permission denied";
    } else if (error.statusCode === 422) {
      message = "Invalid data provided";
    } else if (error.message) {
      message = error.message;
    }

    state.error = message;
    toast.error(message);
    throw error;
  };

  // Fetch newsletters with caching
  const fetchNewsletters = async (options: any = {}) => {
    const cacheKey = `${cacheKey}-list`;

    try {
      state.isLoading = true;
      state.error = null;

      // Try cache first
      const cached = await $fetch(`/api/_cache/${cacheKey}`, {
        method: "GET",
        ignoreResponseError: true,
      });

      if (cached && !options.force) {
        state.newsletters = cached;
        return cached;
      }

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

      state.newsletters = response as Newsletter[];

      // Cache the result
      await $fetch(`/api/_cache/${cacheKey}`, {
        method: "POST",
        body: { data: response, ttl: 300 }, // 5 minute cache
      });

      return state.newsletters;
    } catch (error: any) {
      handleError(error, "fetch newsletters");
    } finally {
      state.isLoading = false;
    }
  };

  // Enhanced newsletter creation with validation
  const createNewsletter = async (data: Partial<Newsletter>) => {
    try {
      state.isLoading = true;
      state.error = null;

      // Validate input
      const validated = NewsletterSchema.partial().parse(data);

      const response = await directus.request(
        createItem("newsletters", {
          status: "draft",
          priority: "normal",
          is_ab_test: false,
          total_opens: 0,
          approval_status: "pending",
          slug: generateSlug(validated.title || "untitled"),
          ...validated,
        })
      );

      const newsletter = response as Newsletter;
      state.newsletters.unshift(newsletter);

      toast.success("Newsletter created successfully");

      // Clear cache
      await $fetch(`/api/_cache/${cacheKey}-list`, { method: "DELETE" });

      return newsletter;
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const message = error.errors.map((e) => e.message).join(", ");
        state.error = message;
        toast.error(message);
        throw new Error(message);
      }
      handleError(error, "create newsletter");
    } finally {
      state.isLoading = false;
    }
  };

  // Enhanced update with optimistic updates
  const updateNewsletter = async (id: number, data: Partial<Newsletter>) => {
    try {
      state.isSaving = true;
      state.error = null;

      // Optimistic update
      if (state.currentNewsletter?.id === id) {
        Object.assign(state.currentNewsletter, data);
      }

      const index = state.newsletters.findIndex((n) => n.id === id);
      if (index !== -1) {
        Object.assign(state.newsletters[index], data);
      }

      const response = await directus.request(
        updateItem("newsletters", id, data)
      );

      state.lastSaved = new Date();

      // Clear relevant caches
      await $fetch(`/api/_cache/${cacheKey}-list`, { method: "DELETE" });
      await $fetch(`/api/_cache/${cacheKey}-${id}`, { method: "DELETE" });

      return response as Newsletter;
    } catch (error: any) {
      // Revert optimistic update on error
      if (state.currentNewsletter?.id === id) {
        await fetchNewsletter(id); // Refresh from server
      }
      handleError(error, "update newsletter");
    } finally {
      state.isSaving = false;
    }
  };

  // Auto-save with debouncing
  const autoSaveFunction = useDebounceFn(
    async (id: number, data: Partial<Newsletter>) => {
      if (!autoSave) return;

      try {
        await updateNewsletter(id, data);
      } catch (error) {
        console.warn("Auto-save failed:", error);
      }
    },
    autoSaveDelay
  );

  // Enhanced compilation with progress tracking
  const compileMJML = async (newsletterId: number) => {
    try {
      state.isCompiling = true;
      state.error = null;

      const response = await $fetch("/api/newsletter/compile-mjml", {
        method: "POST",
        body: { newsletter_id: newsletterId },
      });

      if (response.warnings?.length) {
        toast.warning(`Compiled with ${response.warnings.length} warnings`);
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
