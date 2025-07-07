import type { Newsletter, NewsletterBlock } from "../../types/newsletter";

export interface ValidationError {
  field: string;
  message: string;
  severity: "error" | "warning";
}

export function validateNewsletter(newsletter: Newsletter): ValidationError[] {
  const errors: ValidationError[] = [];

  // Required fields
  if (!newsletter.title?.trim()) {
    errors.push({
      field: "title",
      message: "Newsletter title is required",
      severity: "error",
    });
  }

  if (!newsletter.subject_line?.trim()) {
    errors.push({
      field: "subject_line",
      message: "Subject line is required",
      severity: "error",
    });
  }

  if (!newsletter.from_email?.trim()) {
    errors.push({
      field: "from_email",
      message: "From email is required",
      severity: "error",
    });
  } else if (!isValidEmail(newsletter.from_email)) {
    errors.push({
      field: "from_email",
      message: "From email is not valid",
      severity: "error",
    });
  }

  if (!newsletter.from_name?.trim()) {
    errors.push({
      field: "from_name",
      message: "From name is required",
      severity: "error",
    });
  }

  // Content validation
  if (!newsletter.blocks || newsletter.blocks.length === 0) {
    errors.push({
      field: "blocks",
      message: "Newsletter must have at least one content block",
      severity: "error",
    });
  } else {
    // Validate individual blocks
    newsletter.blocks.forEach((block, index) => {
      const blockErrors = validateBlock(block, index);
      errors.push(...blockErrors);
    });
  }

  // Subject line best practices
  if (newsletter.subject_line) {
    if (newsletter.subject_line.length > 50) {
      errors.push({
        field: "subject_line",
        message:
          "Subject line is longer than 50 characters and may be truncated",
        severity: "warning",
      });
    }

    if (newsletter.subject_line.includes("!".repeat(3))) {
      errors.push({
        field: "subject_line",
        message: "Avoid excessive exclamation marks in subject line",
        severity: "warning",
      });
    }

    const spamWords = [
      "free",
      "urgent",
      "limited time",
      "act now",
      "click here",
    ];
    const hasSpamWords = spamWords.some((word) =>
      newsletter.subject_line.toLowerCase().includes(word)
    );

    if (hasSpamWords) {
      errors.push({
        field: "subject_line",
        message: "Subject line contains words that may trigger spam filters",
        severity: "warning",
      });
    }
  }

  // Preview text
  if (!newsletter.preview_text) {
    errors.push({
      field: "preview_text",
      message: "Preview text helps improve open rates",
      severity: "warning",
    });
  } else if (newsletter.preview_text.length > 90) {
    errors.push({
      field: "preview_text",
      message: "Preview text is longer than 90 characters and may be truncated",
      severity: "warning",
    });
  }

  // Sending requirements
  if (newsletter.status === "ready") {
    if (!newsletter.mailing_list_id) {
      errors.push({
        field: "mailing_list_id",
        message: "Mailing list must be selected before sending",
        severity: "error",
      });
    }

    if (!newsletter.compiled_html) {
      errors.push({
        field: "compiled_html",
        message: "Newsletter must be compiled before sending",
        severity: "error",
      });
    }
  }

  return errors;
}

export function validateBlock(
  block: NewsletterBlock,
  index: number
): ValidationError[] {
  const errors: ValidationError[] = [];
  const fieldPrefix = `blocks[${index}]`;

  switch (block.block_type.slug) {
    case "hero":
      if (!block.title?.trim()) {
        errors.push({
          field: `${fieldPrefix}.title`,
          message: "Hero block needs a title",
          severity: "warning",
        });
      }
      break;

    case "text":
      if (!block.text_content?.trim()) {
        errors.push({
          field: `${fieldPrefix}.text_content`,
          message: "Text block is empty",
          severity: "warning",
        });
      }
      break;

    case "image":
      if (!block.image_url?.trim()) {
        errors.push({
          field: `${fieldPrefix}.image_url`,
          message: "Image block needs an image",
          severity: "error",
        });
      }

      if (!block.image_alt_text?.trim()) {
        errors.push({
          field: `${fieldPrefix}.image_alt_text`,
          message: "Image needs alt text for accessibility",
          severity: "warning",
        });
      }
      break;

    case "button":
      if (!block.button_text?.trim()) {
        errors.push({
          field: `${fieldPrefix}.button_text`,
          message: "Button needs text",
          severity: "error",
        });
      }

      if (!block.button_url?.trim()) {
        errors.push({
          field: `${fieldPrefix}.button_url`,
          message: "Button needs a URL",
          severity: "error",
        });
      } else if (!isValidUrl(block.button_url)) {
        errors.push({
          field: `${fieldPrefix}.button_url`,
          message: "Button URL is not valid",
          severity: "error",
        });
      }
      break;
  }

  // Color contrast validation
  if (block.background_color && block.text_color) {
    const contrast = calculateColorContrast(
      block.background_color,
      block.text_color
    );
    if (contrast < 4.5) {
      errors.push({
        field: `${fieldPrefix}.colors`,
        message: "Text may be hard to read due to low color contrast",
        severity: "warning",
      });
    }
  }

  return errors;
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function calculateColorContrast(bg: string, text: string): number {
  // Simplified contrast calculation
  // In a real implementation, you'd use the WCAG contrast formula
  const bgLightness = hexToLightness(bg);
  const textLightness = hexToLightness(text);

  const lighter = Math.max(bgLightness, textLightness);
  const darker = Math.min(bgLightness, textLightness);

  return (lighter + 0.05) / (darker + 0.05);
}

function hexToLightness(hex: string): number {
  // Convert hex to RGB, then to relative luminance
  const r = parseInt(hex.substr(1, 2), 16) / 255;
  const g = parseInt(hex.substr(3, 2), 16) / 255;
  const b = parseInt(hex.substr(5, 2), 16) / 255;

  return 0.299 * r + 0.587 * g + 0.114 * b;
}

export function getValidationSummary(errors: ValidationError[]) {
  const errorCount = errors.filter((e) => e.severity === "error").length;
  const warningCount = errors.filter((e) => e.severity === "warning").length;

  return {
    hasErrors: errorCount > 0,
    hasWarnings: warningCount > 0,
    errorCount,
    warningCount,
    canSend: errorCount === 0,
    summary:
      errorCount > 0
        ? `${errorCount} error${
            errorCount > 1 ? "s" : ""
          } must be fixed before sending`
        : warningCount > 0
        ? `${warningCount} warning${warningCount > 1 ? "s" : ""} to review`
        : "Newsletter is ready to send",
  };
}
