// src/runtime/utils/security/sanitization.ts
/**
 * HTML and content sanitization utilities
 */

// DOMPurify-like sanitization for HTML content
export function sanitizeHtml(
  html: string,
  options: {
    allowedTags?: string[];
    allowedAttributes?: Record<string, string[]>;
    removeScripts?: boolean;
    removeIframes?: boolean;
  } = {}
): string {
  const {
    allowedTags = [
      "p",
      "br",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "ul",
      "ol",
      "li",
      "a",
      "img",
      "div",
      "span",
      "blockquote",
      "pre",
      "code",
    ],
    allowedAttributes = {
      a: ["href", "title", "target"],
      img: ["src", "alt", "width", "height", "title"],
      div: ["class"],
      span: ["class"],
      p: ["class"],
      h1: ["class"],
      h2: ["class"],
      h3: ["class"],
      h4: ["class"],
      h5: ["class"],
      h6: ["class"],
    },
    removeScripts = true,
    removeIframes = true,
  } = options;

  let sanitized = html;

  // Remove script tags and their content
  if (removeScripts) {
    sanitized = sanitized.replace(
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      ""
    );
  }

  // Remove iframe tags and their content
  if (removeIframes) {
    sanitized = sanitized.replace(
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      ""
    );
  }

  // Remove javascript: URLs
  sanitized = sanitized.replace(/javascript:/gi, "");

  // Remove event handlers
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, "");

  // Remove style attributes that could contain expressions
  sanitized = sanitized.replace(
    /\s*style\s*=\s*["'][^"']*expression[^"']*["']/gi,
    ""
  );

  // Simple tag and attribute filtering
  sanitized = sanitized.replace(
    /<(\/?)(\w+)([^>]*)>/g,
    (match, slash, tagName, attributes) => {
      const tag = tagName.toLowerCase();

      // Check if tag is allowed
      if (!allowedTags.includes(tag)) {
        return "";
      }

      // Filter attributes with a safer regex
      if (attributes && allowedAttributes[tag]) {
        const filteredAttrs = attributes.replace(
          /\s*([\w-]+)\s*=\s*"([^"]*)"/g, // Simplified, non-backtracking regex
          (attrMatch: string, attrName: string, attrValue: string) => {
            if (allowedAttributes[tag]?.includes(attrName.toLowerCase())) {
              // Additional validation for href attributes
              if (attrName.toLowerCase() === "href") {
                if (
                  attrValue.startsWith("javascript:")
                  || attrValue.startsWith("data:")
                ) {
                  return "";
                }
              }
              return ` ${attrName}="${attrValue}"`;
            }
            return "";
          }
        );
        return `<${slash}${tag}${filteredAttrs}>`;
      }

      return `<${slash}${tag}>`;
    }
  );

  return sanitized;
}

// Sanitize text content (remove HTML entirely)
export function sanitizeText(text: string): string {
  return text
    .replace(/<[^>]*>/g, "") // Remove all HTML tags
    .replace(/&[#\w]+;/g, "") // Remove HTML entities
    .trim();
}

// Sanitize email content for newsletter compilation
export function sanitizeNewsletterContent(content: string): string {
  return sanitizeHtml(content, {
    allowedTags: [
      "p",
      "br",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "ul",
      "ol",
      "li",
      "a",
      "img",
      "div",
      "span",
      "blockquote",
      "table",
      "tr",
      "td",
      "th",
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "style"],
      img: ["src", "alt", "width", "height", "title", "style"],
      div: ["class", "style"],
      span: ["class", "style"],
      p: ["class", "style"],
      td: ["style", "colspan", "rowspan"],
      th: ["style", "colspan", "rowspan"],
      table: ["style", "width", "cellpadding", "cellspacing"],
    },
  });
}

// Escape special characters for various contexts
export function escapeHtml(text: string): string {
  const escapeMap: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  };
  return text.replace(/[&<>"']/g, (char) => escapeMap[char]);
}

export function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function escapeCsv(text: string): string {
  if (text.includes(",") || text.includes("\"") || text.includes("\n")) {
    return "\"" + text.replace(/"/g, "\"\"") + "\"";
  }
  return text;
}

// Content Security Policy helpers
export function generateCSPNonce(): string {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    // Fallback for Node.js
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return btoa(String.fromCharCode(...bytes));
}

export function buildCSPHeader(
  options: {
    allowInlineStyles?: boolean;
    allowInlineScripts?: boolean;
    allowEval?: boolean;
    allowedDomains?: string[];
    nonce?: string;
  } = {}
): string {
  const {
    allowInlineStyles = false,
    allowInlineScripts = false,
    allowEval = false,
    allowedDomains = [],
    nonce,
  } = options;

  const directives: string[] = [];

  // Default src
  directives.push("default-src 'self'");

  // Script src
  let scriptSrc = "'self'";
  if (allowInlineScripts) scriptSrc += " 'unsafe-inline'";
  if (allowEval) scriptSrc += " 'unsafe-eval'";
  if (nonce) scriptSrc += ` 'nonce-${nonce}'`;
  if (allowedDomains.length > 0) scriptSrc += ` ${allowedDomains.join(" ")}`;
  directives.push(`script-src ${scriptSrc}`);

  // Style src
  let styleSrc = "'self'";
  if (allowInlineStyles) styleSrc += " 'unsafe-inline'";
  if (nonce) styleSrc += ` 'nonce-${nonce}'`;
  directives.push(`style-src ${styleSrc}`);

  // Image src
  directives.push("img-src 'self' data: https:");

  // Font src
  directives.push("font-src 'self' https:");

  // Connect src
  directives.push("connect-src 'self' https:");

  return directives.join("; ");
}
