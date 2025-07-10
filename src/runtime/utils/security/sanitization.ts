// utils/security/sanitization.ts
import DOMPurify from "isomorphic-dompurify";

// Configuration for different content types
export const sanitizationConfigs = {
  // For newsletter content - allows most HTML for rich formatting
  newsletter: {
    ALLOWED_TAGS: [
      "div",
      "span",
      "p",
      "br",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "s",
      "strike",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "blockquote",
      "pre",
      "code",
      "ul",
      "ol",
      "li",
      "dl",
      "dt",
      "dd",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "a",
      "img",
      "figure",
      "figcaption",
      "hr",
      "sub",
      "sup",
      "small",
      "mj-section",
      "mj-column",
      "mj-text",
      "mj-button",
      "mj-image",
      "mj-divider",
      "mj-spacer",
      "mj-social",
      "mj-social-element",
      "mj-hero",
      "mj-wrapper",
    ],
    ALLOWED_ATTR: [
      "class",
      "id",
      "style",
      "href",
      "target",
      "src",
      "alt",
      "title",
      "width",
      "height",
      "data-*",
      "aria-*",
      "role",
      "align",
      "bgcolor",
      "border",
      "cellpadding",
      "cellspacing",
      "padding",
      "margin",
      "background-color",
      "color",
      "font-size",
      "font-family",
      "text-align",
      "vertical-align",
      "border-radius",
      "box-shadow",
      "text-decoration",
    ],
    ALLOWED_URI_REGEXP:
      /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_TRUSTED_TYPE: false,
  },

  // For user input - more restrictive
  userInput: {
    ALLOWED_TAGS: ["p", "br", "strong", "b", "em", "i", "a", "ul", "ol", "li"],
    ALLOWED_ATTR: ["href", "target", "class"],
    ALLOWED_URI_REGEXP:
      /^(?:(?:(?:f|ht)tps?|mailto):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    KEEP_CONTENT: true,
  },

  // For plain text with minimal formatting
  minimal: {
    ALLOWED_TAGS: ["strong", "b", "em", "i", "br"],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  },
};

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHtml(
  dirty: string,
  config: keyof typeof sanitizationConfigs = "userInput"
): string {
  if (!dirty || typeof dirty !== "string") {
    return "";
  }

  try {
    return DOMPurify.sanitize(dirty, sanitizationConfigs[config]);
  } catch (error) {
    console.error("Sanitization error:", error);
    return "";
  }
}

/**
 * Sanitize newsletter content (less restrictive for email formatting)
 */
export function sanitizeNewsletterContent(dirty: string): string {
  return sanitizeHtml(dirty, "newsletter");
}

/**
 * Sanitize user input (more restrictive)
 */
export function sanitizeUserInput(dirty: string): string {
  return sanitizeHtml(dirty, "userInput");
}

/**
 * Strip all HTML tags and return plain text
 */
export function stripHtml(dirty: string): string {
  if (!dirty || typeof dirty !== "string") {
    return "";
  }

  try {
    return DOMPurify.sanitize(dirty, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true,
    });
  } catch (error) {
    console.error("HTML stripping error:", error);
    return "";
  }
}

/**
 * Escape HTML entities
 */
export function escapeHtml(unsafe: string): string {
  if (!unsafe || typeof unsafe !== "string") {
    return "";
  }

  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Validate and sanitize email addresses
 */
export function sanitizeEmail(email: string): string | null {
  if (!email || typeof email !== "string") {
    return null;
  }

  const cleanEmail = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(cleanEmail)) {
    return null;
  }

  return cleanEmail;
}

/**
 * Sanitize URLs to prevent JavaScript injection
 */
export function sanitizeUrl(url: string): string | null {
  if (!url || typeof url !== "string") {
    return null;
  }

  const cleanUrl = url.trim();

  // Block javascript: and data: URLs (except safe data: image URLs)
  if (cleanUrl.match(/^javascript:/i)) {
    return null;
  }

  if (cleanUrl.match(/^data:/i) && !cleanUrl.match(/^data:image\//i)) {
    return null;
  }

  // Ensure the URL starts with http://, https://, or //
  if (!cleanUrl.match(/^(https?:\/\/|\/\/|\/)/i)) {
    return `https://${cleanUrl}`;
  }

  return cleanUrl;
}

/**
 * Sanitize newsletter block data
 */
export function sanitizeBlockData(
  blockData: Record<string, any>
): Record<string, any> {
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(blockData)) {
    if (value === null || value === undefined) {
      sanitized[key] = value;
      continue;
    }

    switch (key) {
      case "text_content":
      case "title":
      case "subtitle":
        sanitized[key] = sanitizeNewsletterContent(String(value));
        break;

      case "button_url":
      case "image_url":
        sanitized[key] = sanitizeUrl(String(value));
        break;

      case "button_text":
      case "image_alt_text":
      case "image_caption":
        sanitized[key] = sanitizeUserInput(String(value));
        break;

      default:
        // For other fields, apply basic sanitization
        if (typeof value === "string") {
          sanitized[key] = sanitizeUserInput(value);
        } else {
          sanitized[key] = value;
        }
    }
  }

  return sanitized;
}

/**
 * Content Security Policy helpers
 */
export const cspHelpers = {
  // Generate nonce for inline styles
  generateNonce: (): string => {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array));
  },

  // Get safe CSP header for newsletter preview
  getNewsletterCSP: (nonce?: string): string => {
    const directives = [
      "default-src 'self'",
      `style-src 'self' 'unsafe-inline' ${nonce ? `'nonce-${nonce}'` : ""}`,
      "img-src 'self' data: https:",
      "font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com",
      "script-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'none'",
    ];

    return directives.join("; ");
  },
};

/**
 * Input validation helpers
 */
export const validators = {
  isValidEmail: (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  },

  isValidUrl: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  isValidHexColor: (color: string): boolean => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  },

  isValidImageType: (mimeType: string): boolean => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
    ];
    return allowedTypes.includes(mimeType);
  },
};
