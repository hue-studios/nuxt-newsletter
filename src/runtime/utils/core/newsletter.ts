import type { Newsletter, NewsletterBlock } from "../../types/newsletter";

export function processNewsletterBlocks(newsletter: Newsletter) {
  if (!newsletter.blocks) return [];

  return newsletter.blocks.map((block: NewsletterBlock) => ({
    block_type_slug: block.block_type?.slug || "",
    sort: block.sort || 0,
    title: block.title || "",
    subtitle: block.subtitle || "",
    text_content: block.text_content || "",
    image_url: block.image_url || "",
    image_alt_text: block.image_alt_text || "",
    image_caption: block.image_caption || "",
    button_text: block.button_text || "",
    button_url: block.button_url || "",
    background_color: block.background_color || "",
    text_color: block.text_color || "",
    text_align: block.text_align || "left",
    padding: block.padding || "",
    font_size: block.font_size || "",
  }));
}

export function validateNewsletterStructure(newsletter: Newsletter): boolean {
  if (!newsletter.title || !newsletter.subject_line) return false;
  if (!newsletter.from_email || !newsletter.from_name) return false;
  return true;
}

export function generateNewsletterPreview(newsletter: Newsletter): string {
  // Generate a text preview of the newsletter
  let preview = `${newsletter.title}\n${newsletter.subject_line}\n\n`;

  if (newsletter.blocks) {
    newsletter.blocks.forEach((block) => {
      if (block.title) preview += `${block.title}\n`;
      if (block.text_content) preview += `${block.text_content}\n\n`;
    });
  }

  return preview.substring(0, 500) + (preview.length > 500 ? "..." : "");
}

// src/runtime/utils/performance/optimization.ts - Fixed version
export interface ThrottleOptions {
  leading?: boolean;
  trailing?: boolean;
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: ThrottleOptions = {}
): T {
  let timeout: NodeJS.Timeout | null = null;
  let previous = 0;
  let result: ReturnType<T>;

  const { leading = true, trailing = true } = options;

  const throttled = function (this: any, ...args: Parameters<T>) {
    const now = Date.now();

    if (!previous && !leading) previous = now;

    const remaining = wait - (now - previous);

    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      result = func.apply(this, args);
    } else if (!timeout && trailing) {
      timeout = setTimeout(() => {
        previous = !leading ? 0 : Date.now();
        timeout = null;
        result = func.apply(this, args);
      }, remaining);
    }

    return result;
  };

  throttled.cancel = function () {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    previous = 0;
  };

  return throttled as unknown as T;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): T {
  let timeout: NodeJS.Timeout | null = null;

  const debounced = function (this: any, ...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(this, args);
    };

    const callNow = immediate && !timeout;

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) func.apply(this, args);
  };

  debounced.cancel = function () {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  return debounced as unknown as T;
}

export function memoize<T extends (...args: any[]) => any>(
  func: T,
  resolver?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  const memoized = function (this: any, ...args: Parameters<T>): ReturnType<T> {
    const key = resolver ? resolver(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = func.apply(this, args);
    cache.set(key, result);
    return result;
  };

  memoized.cache = cache;
  memoized.clear = () => cache.clear();

  return memoized as unknown as T;
}
