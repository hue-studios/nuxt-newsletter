// src/runtime/composables/ui/usePreview.ts
export const usePreview = () => {
  const previewState = ref({
    device: "desktop" as "desktop" | "tablet" | "mobile",
    emailClient: "generic" as "generic" | "gmail" | "outlook" | "apple",
    isLoading: false,
    showAccessibilityPanel: false,
    showPerformancePanel: false,
  });

  const previewData = ref({
    emailSize: { kb: 0, isLarge: false },
    readingTime: 0,
    imageCount: 0,
    linkCount: 0,
    accessibilityIssues: [] as string[],
  });

  // Device simulation
  const setDevice = (device: "desktop" | "tablet" | "mobile") => {
    previewState.value.device = device;
  };

  const getDeviceClass = () => {
    switch (previewState.value.device) {
      case "mobile":
        return "max-w-sm mx-auto";
      case "tablet":
        return "max-w-md mx-auto";
      case "desktop":
      default:
        return "max-w-2xl mx-auto";
    }
  };

  // Email client simulation
  const setEmailClient = (
    client: "generic" | "gmail" | "outlook" | "apple",
  ) => {
    previewState.value.emailClient = client;
  };

  const getClientStyles = () => {
    switch (previewState.value.emailClient) {
      case "gmail":
        return {
          header: "bg-red-50 border-red-100",
          styles: ".gmail-hide { display: none !important; }",
        };
      case "outlook":
        return {
          header: "bg-blue-50 border-blue-100",
          styles: ".outlook-only { display: block !important; }",
        };
      case "apple":
        return {
          header: "bg-gray-100 border-gray-200",
          styles:
            ".apple-mail { font-family: -apple-system, BlinkMacSystemFont, sans-serif; }",
        };
      default:
        return {
          header: "bg-gray-50 border-gray-200",
          styles: "",
        };
    }
  };

  // Performance analysis
  const analyzePerformance = (newsletter: any) => {
    if (!newsletter.compiled_html || !newsletter.blocks) {
      return;
    }

    // Calculate email size
    const size = new Blob([newsletter.compiled_html]).size;
    const sizeKb = Math.round(size / 1024);
    previewData.value.emailSize = {
      kb: sizeKb,
      isLarge: sizeKb > 100, // Gmail clips emails over 102KB
    };

    // Calculate reading time
    let totalWords = 0;
    newsletter.blocks.forEach((block: any) => {
      if (block.title) totalWords += block.title.split(" ").length;
      if (block.subtitle) totalWords += block.subtitle.split(" ").length;
      if (block.text_content) {
        const text = block.text_content.replace(/<[^>]*>/g, "");
        totalWords += text
          .split(" ")
          .filter((w: string) => w.length > 0).length;
      }
    });
    previewData.value.readingTime = Math.max(1, Math.ceil(totalWords / 200));

    // Count images and links
    previewData.value.imageCount = newsletter.blocks.filter(
      (b: any) => b.block_type.slug === "image" && b.image_url,
    ).length;

    previewData.value.linkCount = newsletter.blocks.filter(
      (b: any) =>
        b.button_url || (b.text_content && b.text_content.includes("<a")),
    ).length;
  };

  // Accessibility analysis
  const analyzeAccessibility = (newsletter: any) => {
    const issues: string[] = [];

    if (!newsletter.blocks) return issues;

    newsletter.blocks.forEach((block: any) => {
      // Check for images without alt text
      if (
        block.block_type.slug === "image"
        && block.image_url
        && !block.image_alt_text
      ) {
        issues.push("Image block missing alt text");
      }

      // Check for poor color contrast
      if (block.background_color && block.text_color) {
        const contrast = calculateColorContrast(
          block.background_color,
          block.text_color,
        );
        if (contrast < 4.5) {
          issues.push(`Poor color contrast in ${block.block_type.name} block`);
        }
      }

      // Check for buttons without descriptive text
      if (
        block.block_type.slug === "button"
        && (!block.button_text || block.button_text.length < 3)
      ) {
        issues.push("Button with insufficient descriptive text");
      }

      // Check for very small font sizes
      if (block.font_size && Number.parseInt(block.font_size) < 12) {
        issues.push(`Font size too small in ${block.block_type.name} block`);
      }
    });

    previewData.value.accessibilityIssues = issues;
    return issues;
  };

  // Color contrast calculation (simplified)
  const calculateColorContrast = (bg: string, text: string): number => {
    const getLuminance = (color: string) => {
      const hex = color.replace("#", "");
      const r = Number.parseInt(hex.substr(0, 2), 16) / 255;
      const g = Number.parseInt(hex.substr(2, 2), 16) / 255;
      const b = Number.parseInt(hex.substr(4, 2), 16) / 255;

      const toLinear = (c: number) =>
        c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

      return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
    };

    try {
      const bgLuminance = getLuminance(bg);
      const textLuminance = getLuminance(text);

      const lighter = Math.max(bgLuminance, textLuminance);
      const darker = Math.min(bgLuminance, textLuminance);

      return (lighter + 0.05) / (darker + 0.05);
    } catch {
      return 7; // Assume good contrast if calculation fails
    }
  };

  // Preview actions
  const refreshPreview = async () => {
    previewState.value.isLoading = true;
    await new Promise((resolve) => setTimeout(resolve, 500));
    previewState.value.isLoading = false;
  };

  const openInNewTab = (html: string) => {
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(html);
      newWindow.document.close();
    }
  };

  const downloadHtml = (html: string, filename: string) => {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyShareLink = async (newsletterId: number) => {
    const shareUrl = `${window.location.origin}/newsletter/${newsletterId}/preview`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      return shareUrl;
    } catch (error) {
      console.error("Failed to copy link:", error);
      throw error;
    }
  };

  return {
    previewState: readonly(previewState),
    previewData: readonly(previewData),
    setDevice,
    getDeviceClass,
    setEmailClient,
    getClientStyles,
    analyzePerformance,
    analyzeAccessibility,
    refreshPreview,
    openInNewTab,
    downloadHtml,
    copyShareLink,
  };
};
