// src/runtime/utils/newsletter-validation.ts
import type {
  Newsletter,
  NewsletterBlock,
  ValidationError,
  ValidationResult,
} from "../types/newsletter";

export interface ValidationSummary {
  isValid: boolean;
  totalErrors: number;
  criticalErrors: number;
  warningCount: number;
  errorsByCategory: Record<string, ValidationError[]>;
}

export function validateNewsletter(newsletter: Newsletter): ValidationResult {
  const errors: ValidationError[] = [];

  // Required fields validation
  if (!newsletter.title?.trim()) {
    errors.push({
      field: "title",
      message: "Newsletter title is required",
      code: "REQUIRED_FIELD",
    });
  }

  if (!newsletter.subject_line?.trim()) {
    errors.push({
      field: "subject_line",
      message: "Subject line is required",
      code: "REQUIRED_FIELD",
    });
  }

  if (!newsletter.from_email?.trim()) {
    errors.push({
      field: "from_email",
      message: "From email is required",
      code: "REQUIRED_FIELD",
    });
  }

  if (!newsletter.from_name?.trim()) {
    errors.push({
      field: "from_name",
      message: "From name is required",
      code: "REQUIRED_FIELD",
    });
  }

  // Email validation
  if (newsletter.from_email && !isValidEmail(newsletter.from_email)) {
    errors.push({
      field: "from_email",
      message: "Invalid email format",
      code: "INVALID_EMAIL",
    });
  }

  // Subject line length validation
  if (newsletter.subject_line && newsletter.subject_line.length > 150) {
    errors.push({
      field: "subject_line",
      message: "Subject line should be under 150 characters",
      code: "SUBJECT_TOO_LONG",
    });
  }

  // Content validation
  if (!newsletter.blocks || newsletter.blocks.length === 0) {
    errors.push({
      field: "blocks",
      message: "Newsletter must have at least one content block",
      code: "NO_CONTENT",
    });
  }

  // Validate individual blocks
  if (newsletter.blocks) {
    newsletter.blocks.forEach((block, index) => {
      const blockErrors = validateBlock(block);
      blockErrors.forEach((error) => {
        errors.push({
          ...error,
          field: `blocks.${index}.${error.field}`,
        });
      });
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateBlock(block: NewsletterBlock): ValidationError[] {
  const errors: ValidationError[] = [];

  // Block type validation
  if (!block.block_type_id && !block.block_type) {
    errors.push({
      field: "block_type",
      message: "Block type is required",
      code: "REQUIRED_FIELD",
    });
  }

  // Content-specific validation based on block type
  if (block.block_type?.category === "content") {
    if (!block.text_content?.trim()) {
      errors.push({
        field: "text_content",
        message: "Content blocks require text content",
        code: "REQUIRED_CONTENT",
      });
    }
  }

  if (block.block_type?.category === "media") {
    if (!block.image_url?.trim()) {
      errors.push({
        field: "image_url",
        message: "Media blocks require an image",
        code: "REQUIRED_IMAGE",
      });
    } else if (!isValidUrl(block.image_url)) {
      errors.push({
        field: "image_url",
        message: "Invalid image URL format",
        code: "INVALID_URL",
      });
    }
  }

  if (block.block_type?.category === "interactive") {
    if (!block.button_url?.trim()) {
      errors.push({
        field: "button_url",
        message: "Interactive blocks require a URL",
        code: "REQUIRED_URL",
      });
    } else if (!isValidUrl(block.button_url)) {
      errors.push({
        field: "button_url",
        message: "Invalid button URL format",
        code: "INVALID_URL",
      });
    }

    if (!block.button_text?.trim()) {
      errors.push({
        field: "button_text",
        message: "Button text is required",
        code: "REQUIRED_FIELD",
      });
    }
  }

  // Style validation
  if (block.background_color && !isValidColor(block.background_color)) {
    errors.push({
      field: "background_color",
      message: "Invalid color format",
      code: "INVALID_COLOR",
    });
  }

  if (block.text_color && !isValidColor(block.text_color)) {
    errors.push({
      field: "text_color",
      message: "Invalid color format",
      code: "INVALID_COLOR",
    });
  }

  return errors;
}

export function getValidationSummary(
  errors: ValidationError[]
): ValidationSummary {
  const criticalCodes = [
    "REQUIRED_FIELD",
    "REQUIRED_CONTENT",
    "INVALID_EMAIL",
    "NO_CONTENT",
  ];

  const criticalErrors = errors.filter((error) =>
    criticalCodes.includes(error.code || "")
  ).length;

  const errorsByCategory: Record<string, ValidationError[]> = {};

  errors.forEach((error) => {
    const category = getCategoryFromField(error.field);
    if (!errorsByCategory[category]) {
      errorsByCategory[category] = [];
    }
    errorsByCategory[category].push(error);
  });

  return {
    isValid: errors.length === 0,
    totalErrors: errors.length,
    criticalErrors,
    warningCount: errors.length - criticalErrors,
    errorsByCategory,
  };
}

// Helper functions
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function isValidColor(color: string): boolean {
  // Check for hex colors
  if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
    return true;
  }

  // Check for rgb/rgba colors
  if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+)?\s*\)$/.test(color)) {
    return true;
  }

  // Check for named colors (basic set)
  const namedColors = [
    "transparent",
    "black",
    "white",
    "red",
    "green",
    "blue",
    "yellow",
    "orange",
    "purple",
    "pink",
    "gray",
    "grey",
  ];

  return namedColors.includes(color.toLowerCase());
}

function getCategoryFromField(field: string): string {
  if (field.includes("email")) return "Email";
  if (field.includes("subject")) return "Subject";
  if (field.includes("content") || field.includes("text")) return "Content";
  if (field.includes("image") || field.includes("media")) return "Media";
  if (field.includes("button") || field.includes("url")) return "Links";
  if (field.includes("color") || field.includes("style")) return "Styling";
  if (field.includes("block")) return "Blocks";
  return "General";
}

// Security utilities
export function sanitizeHtml(html: string): string {
  // Basic HTML sanitization - in production, use a proper library like DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "");
}

export function validateCsrfToken(token: string, expected: string): boolean {
  return token === expected;
}

export function rateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): boolean {
  // Basic rate limiting - in production, use Redis or similar
  const now = Date.now();
  const windowStart = now - windowMs;

  // This is a simplified implementation
  // In real usage, you'd store this in a persistent store
  return true;
}
