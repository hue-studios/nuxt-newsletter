// src/runtime/composables/ui/usePreview.ts
import { ref, computed } from "vue";
import type { Newsletter, PreviewOptions } from "../../types/newsletter";

export const usePreview = () => {
  const previewOptions = ref<PreviewOptions>({
    device: "desktop",
    showCode: false,
    autoRefresh: true,
  });

  const isPreviewMode = ref(false);
  const previewHtml = ref("");
  const isCompiling = ref(false);
  const compileError = ref<string | null>(null);

  const deviceClasses = computed(() => {
    const baseClasses = "preview-container transition-all duration-300";

    switch (previewOptions.value.device) {
      case "mobile":
        return `${baseClasses} max-w-sm mx-auto`;
      case "desktop":
      default:
        return `${baseClasses} max-w-2xl mx-auto`;
    }
  });

  const toggleDevice = () => {
    previewOptions.value.device =
      previewOptions.value.device === "desktop" ? "mobile" : "desktop";
  };

  const toggleCodeView = () => {
    previewOptions.value.showCode = !previewOptions.value.showCode;
  };

  const toggleAutoRefresh = () => {
    previewOptions.value.autoRefresh = !previewOptions.value.autoRefresh;
  };

  const compilePreview = async (newsletter: Newsletter) => {
    try {
      isCompiling.value = true;
      compileError.value = null;

      // Implementation will go here
      // This would compile the newsletter blocks into HTML
      previewHtml.value = `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h1>${newsletter.title}</h1>
          <p>Preview of newsletter content...</p>
        </div>
      `;

      return previewHtml.value;
    } catch (err: any) {
      compileError.value = err.message || "Failed to compile preview";
      throw err;
    } finally {
      isCompiling.value = false;
    }
  };

  const downloadPreview = (newsletter: Newsletter) => {
    if (!previewHtml.value) return;

    const blob = new Blob([previewHtml.value], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${newsletter.slug || newsletter.title}-preview.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const copyPreviewHtml = async () => {
    if (!previewHtml.value) return;

    try {
      await navigator.clipboard.writeText(previewHtml.value);
      console.log("Preview HTML copied to clipboard");
    } catch (err) {
      console.error("Failed to copy preview HTML:", err);
    }
  };

  const refreshPreview = async (newsletter: Newsletter) => {
    if (previewOptions.value.autoRefresh) {
      await compilePreview(newsletter);
    }
  };

  return {
    previewOptions,
    isPreviewMode,
    previewHtml,
    isCompiling,
    compileError,
    deviceClasses,
    toggleDevice,
    toggleCodeView,
    toggleAutoRefresh,
    compilePreview,
    downloadPreview,
    copyPreviewHtml,
    refreshPreview,
  };
};
