import type {
  Newsletter,
  NewsletterBlock,
  BlockType,
} from "~/types/newsletter";

/**
 * Newsletter utility functions
 */

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateNewsletterData(
  newsletter: Partial<Newsletter>
): string[] {
  const errors: string[] = [];

  if (!newsletter.title?.trim()) {
    errors.push("Title is required");
  }

  if (!newsletter.subject_line?.trim()) {
    errors.push("Subject line is required");
  }

  if (!newsletter.from_email?.trim()) {
    errors.push("From email is required");
  } else if (!validateEmail(newsletter.from_email)) {
    errors.push("From email is not valid");
  }

  if (!newsletter.from_name?.trim()) {
    errors.push("From name is required");
  }

  return errors;
}

export function calculateReadingTime(blocks: NewsletterBlock[]): number {
  const wordsPerMinute = 200;
  let totalWords = 0;

  blocks.forEach((block) => {
    if (block.title) {
      totalWords += block.title.split(" ").length;
    }
    if (block.subtitle) {
      totalWords += block.subtitle.split(" ").length;
    }
    if (block.text_content) {
      // Strip HTML tags and count words
      const text = block.text_content.replace(/<[^>]*>/g, "");
      totalWords += text
        .split(" ")
        .filter((word: string | any[]) => word.length > 0).length;
    }
  });

  return Math.max(1, Math.ceil(totalWords / wordsPerMinute));
}

export function estimateEmailSize(compiledHtml: string): {
  kb: number;
  isLarge: boolean;
} {
  const sizeInBytes = new Blob([compiledHtml]).size;
  const sizeInKb = Math.round(sizeInBytes / 1024);
  const isLarge = sizeInKb > 100; // Gmail clips emails over 102KB

  return { kb: sizeInKb, isLarge };
}

export function generatePreviewText(
  blocks: NewsletterBlock[],
  maxLength = 150
): string {
  let previewText = "";

  for (const block of blocks) {
    if (block.text_content) {
      const text = block.text_content.replace(/<[^>]*>/g, "").trim();
      if (text) {
        previewText += text + " ";
        if (previewText.length >= maxLength) break;
      }
    }
  }

  return (
    previewText.substring(0, maxLength).trim() +
    (previewText.length > maxLength ? "..." : "")
  );
}

export function getBlockTypeIcon(category: string): string {
  const iconMap: Record<string, string> = {
    content: "lucide:type",
    layout: "lucide:layout",
    media: "lucide:image",
    interactive: "lucide:mouse-pointer-click",
  };

  return iconMap[category] || "lucide:square";
}

export function formatNewsletterStatus(status: Newsletter["status"]): string {
  const statusMap: Record<Newsletter["status"], string> = {
    draft: "Draft",
    ready: "Ready to Send",
    scheduled: "Scheduled",
    sending: "Sending",
    sent: "Sent",
    paused: "Paused",
  };

  return statusMap[status] || status;
}

export function getStatusColor(status: Newsletter["status"]): string {
  const colorMap: Record<Newsletter["status"], string> = {
    draft: "gray",
    ready: "blue",
    scheduled: "yellow",
    sending: "blue",
    sent: "green",
    paused: "red",
  };

  return colorMap[status] || "gray";
}

export function canSendNewsletter(newsletter: Newsletter): {
  canSend: boolean;
  reason?: string;
} {
  if (newsletter.status !== "ready") {
    return { canSend: false, reason: "Newsletter must be in ready status" };
  }

  if (!newsletter.compiled_html) {
    return { canSend: false, reason: "Newsletter must be compiled first" };
  }

  if (!newsletter.mailing_list_id) {
    return { canSend: false, reason: "Mailing list must be selected" };
  }

  if (!newsletter.blocks || newsletter.blocks.length === 0) {
    return {
      canSend: false,
      reason: "Newsletter must have at least one block",
    };
  }

  return { canSend: true };
}

export function sortBlocksByOrder(
  blocks: NewsletterBlock[]
): NewsletterBlock[] {
  return [...blocks].sort((a, b) => a.sort - b.sort);
}

export function findBlockTypeBySlug(
  blockTypes: BlockType[],
  slug: string
): BlockType | undefined {
  return blockTypes.find((bt) => bt.slug === slug);
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let lastFunc: NodeJS.Timeout;
  let lastRan: number;

  return (...args: Parameters<T>) => {
    if (!lastRan) {
      func(...args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if (Date.now() - lastRan >= limit) {
          func(...args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
}

export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof Array)
    return obj.map((item) => deepClone(item)) as unknown as T;

  const cloned = {} as T;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }

  return cloned;
}

export function sanitizeHtml(html: string): string {
  // Basic HTML sanitization - in production, use a proper library like DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "");
}

export function exportNewsletterData(newsletter: Newsletter) {
  const exportData = {
    newsletter: {
      title: newsletter.title,
      subject_line: newsletter.subject_line,
      from_name: newsletter.from_name,
      from_email: newsletter.from_email,
      category: newsletter.category,
      tags: newsletter.tags,
    },
    blocks:
      newsletter.blocks?.map(
        (block: {
          block_type: { slug: any };
          sort: any;
          title: any;
          subtitle: any;
          text_content: any;
          image_url: any;
          image_alt_text: any;
          image_caption: any;
          button_text: any;
          button_url: any;
          background_color: any;
          text_color: any;
          text_align: any;
          padding: any;
          font_size: any;
        }) => ({
          block_type_slug: block.block_type.slug,
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
        })
      ) || [],
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${generateSlug(newsletter.title)}-export.json`;
  a.click();

  URL.revokeObjectURL(url);
}
