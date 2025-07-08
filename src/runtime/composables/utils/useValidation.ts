// src/runtime/composables/utils/useValidation.ts
import { ref } from "vue";
import type {
  Newsletter,
  NewsletterBlock,
  ValidationError,
} from "../../types/newsletter";

const VALIDATION_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  url: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
  hexColor: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  phone: /^\+?[\d\s\-\(\)]+$/,
  slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
};

export const useValidation = () => {
  const errors = ref<ValidationError[]>([]);
  const isValidating = ref(false);

  const validateEmail = (email: string): boolean => {
    if (!email) return false;
    return VALIDATION_PATTERNS.email.test(email.trim());
  };

  const validateUrl = (url: string): boolean => {
    if (!url) return false;
    return VALIDATION_PATTERNS.url.test(url.trim());
  };

  const validateHexColor = (color: string): boolean => {
    if (!color) return false;
    return VALIDATION_PATTERNS.hexColor.test(color.trim());
  };

  const validateSlug = (slug: string): boolean => {
    if (!slug) return false;
    return VALIDATION_PATTERNS.slug.test(slug.trim());
  };

  const validateRequired = (
    value: any,
    fieldName: string
  ): ValidationError | null => {
    if (!value || (typeof value === "string" && !value.trim())) {
      return {
        field: fieldName,
        message: `${fieldName} is required`,
        severity: "error",
      };
    }
    return null;
  };

  const validateLength = (
    value: string,
    fieldName: string,
    min?: number,
    max?: number
  ): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (min && value.length < min) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must be at least ${min} characters`,
        severity: "error",
      });
    }

    if (max && value.length > max) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must be no more than ${max} characters`,
        severity: max > 50 ? "warning" : "error",
      });
    }

    return errors;
  };

  const validateNewsletter = (newsletter: Newsletter): ValidationError[] => {
    const validationErrors: ValidationError[] = [];

    // Required fields
    const requiredError = validateRequired(newsletter.title, "title");
    if (requiredError) validationErrors.push(requiredError);

    const subjectError = validateRequired(
      newsletter.subject_line,
      "subject_line"
    );
    if (subjectError) validationErrors.push(subjectError);

    const fromEmailError = validateRequired(
      newsletter.from_email,
      "from_email"
    );
    if (fromEmailError) validationErrors.push(fromEmailError);

    const fromNameError = validateRequired(newsletter.from_name, "from_name");
    if (fromNameError) validationErrors.push(fromNameError);

    // Email validation
    if (newsletter.from_email && !validateEmail(newsletter.from_email)) {
      validationErrors.push({
        field: "from_email",
        message: "From email is not valid",
        severity: "error",
      });
    }

    if (newsletter.reply_to && !validateEmail(newsletter.reply_to)) {
      validationErrors.push({
        field: "reply_to",
        message: "Reply to email is not valid",
        severity: "error",
      });
    }

    // Length validations
    if (newsletter.title) {
      validationErrors.push(
        ...validateLength(newsletter.title, "title", 1, 100)
      );
    }

    if (newsletter.subject_line) {
      validationErrors.push(
        ...validateLength(newsletter.subject_line, "subject_line", 1, 150)
      );

      // Subject line best practices
      if (newsletter.subject_line.length > 50) {
        validationErrors.push({
          field: "subject_line",
          message:
            "Subject line is longer than 50 characters and may be truncated",
          severity: "warning",
        });
      }

      if (newsletter.subject_line.includes("!".repeat(3))) {
        validationErrors.push({
          field: "subject_line",
          message:
            "Avoid excessive exclamation marks to prevent spam filtering",
          severity: "warning",
        });
      }
    }

    // Slug validation
    if (newsletter.slug && !validateSlug(newsletter.slug)) {
      validationErrors.push({
        field: "slug",
        message:
          "Slug can only contain lowercase letters, numbers, and hyphens",
        severity: "error",
      });
    }

    // Content validation
    if (!newsletter.blocks || newsletter.blocks.length === 0) {
      validationErrors.push({
        field: "blocks",
        message: "Newsletter must have at least one content block",
        severity: "error",
      });
    } else {
      // Validate individual blocks
      newsletter.blocks.forEach((block, index) => {
        const blockErrors = validateBlock(block, index);
        validationErrors.push(...blockErrors);
      });
    }

    // Test emails validation
    if (newsletter.test_emails && newsletter.test_emails.length > 0) {
      newsletter.test_emails.forEach((email, index) => {
        if (!validateEmail(email)) {
          validationErrors.push({
            field: `test_emails[${index}]`,
            message: `Test email "${email}" is not valid`,
            severity: "error",
          });
        }
      });
    }

    return validationErrors;
  };

  const validateBlock = (
    block: NewsletterBlock,
    index?: number
  ): ValidationError[] => {
    const validationErrors: ValidationError[] = [];
    const fieldPrefix = index !== undefined ? `blocks[${index}]` : "block";

    // Block type validation
    if (!block.block_type) {
      validationErrors.push({
        field: `${fieldPrefix}.block_type`,
        message: "Block type is required",
        severity: "error",
      });
      return validationErrors; // Can't validate further without block type
    }

    // Category-specific validation
    switch (block.block_type.category) {
      case "content":
        if (!block.text_content?.trim()) {
          validationErrors.push({
            field: `${fieldPrefix}.text_content`,
            message: "Content block requires text content",
            severity: "error",
          });
        }
        break;

      case "media":
        if (!block.image_url?.trim()) {
          validationErrors.push({
            field: `${fieldPrefix}.image_url`,
            message: "Media block requires an image URL",
            severity: "error",
          });
        } else if (!validateUrl(block.image_url)) {
          validationErrors.push({
            field: `${fieldPrefix}.image_url`,
            message: "Image URL is not valid",
            severity: "error",
          });
        }

        if (!block.image_alt_text?.trim()) {
          validationErrors.push({
            field: `${fieldPrefix}.image_alt_text`,
            message: "Image blocks should have alt text for accessibility",
            severity: "warning",
          });
        }
        break;

      case "interactive":
        if (!block.button_url?.trim()) {
          validationErrors.push({
            field: `${fieldPrefix}.button_url`,
            message: "Interactive block requires a URL",
            severity: "error",
          });
        } else if (!validateUrl(block.button_url)) {
          validationErrors.push({
            field: `${fieldPrefix}.button_url`,
            message: "Button URL is not valid",
            severity: "error",
          });
        }

        if (!block.button_text?.trim()) {
          validationErrors.push({
            field: `${fieldPrefix}.button_text`,
            message: "Interactive block requires button text",
            severity: "error",
          });
        }
        break;
    }

    // Color validation
    if (block.background_color && !validateHexColor(block.background_color)) {
      validationErrors.push({
        field: `${fieldPrefix}.background_color`,
        message: "Background color must be a valid hex color",
        severity: "error",
      });
    }

    if (block.text_color && !validateHexColor(block.text_color)) {
      validationErrors.push({
        field: `${fieldPrefix}.text_color`,
        message: "Text color must be a valid hex color",
        severity: "error",
      });
    }

    return validationErrors;
  };

  const validateSubscriber = (subscriber: any): ValidationError[] => {
    const validationErrors: ValidationError[] = [];

    // Required fields
    const emailError = validateRequired(subscriber.email, "email");
    if (emailError) validationErrors.push(emailError);

    const nameError = validateRequired(subscriber.name, "name");
    if (nameError) validationErrors.push(nameError);

    // Email validation
    if (subscriber.email && !validateEmail(subscriber.email)) {
      validationErrors.push({
        field: "email",
        message: "Email address is not valid",
        severity: "error",
      });
    }

    return validationErrors;
  };

  const validateForm = async (data: any, rules: Record<string, any>) => {
    try {
      isValidating.value = true;
      errors.value = [];

      const validationErrors: ValidationError[] = [];

      for (const [field, fieldRules] of Object.entries(rules)) {
        const value = data[field];

        if (fieldRules.required && !value) {
          validationErrors.push({
            field,
            message: `${field} is required`,
            severity: "error",
          });
          continue;
        }

        if (!value) continue; // Skip validation if not required and empty

        if (fieldRules.email && !validateEmail(value)) {
          validationErrors.push({
            field,
            message: `${field} must be a valid email`,
            severity: "error",
          });
        }

        if (fieldRules.url && !validateUrl(value)) {
          validationErrors.push({
            field,
            message: `${field} must be a valid URL`,
            severity: "error",
          });
        }

        if (fieldRules.minLength && value.length < fieldRules.minLength) {
          validationErrors.push({
            field,
            message: `${field} must be at least ${fieldRules.minLength} characters`,
            severity: "error",
          });
        }

        if (fieldRules.maxLength && value.length > fieldRules.maxLength) {
          validationErrors.push({
            field,
            message: `${field} must be no more than ${fieldRules.maxLength} characters`,
            severity: "error",
          });
        }

        if (fieldRules.pattern && !fieldRules.pattern.test(value)) {
          validationErrors.push({
            field,
            message: fieldRules.patternMessage || `${field} format is invalid`,
            severity: "error",
          });
        }
      }

      errors.value = validationErrors;
      return {
        isValid: validationErrors.length === 0,
        errors: validationErrors,
      };
    } catch (err: any) {
      const error = {
        field: "general",
        message: err.message || "Validation failed",
        severity: "error" as const,
      };
      errors.value = [error];
      return { isValid: false, errors: [error] };
    } finally {
      isValidating.value = false;
    }
  };

  const clearErrors = () => {
    errors.value = [];
  };

  const getFieldErrors = (fieldName: string) => {
    return errors.value.filter(
      (error: { field: string }) => error.field === fieldName
    );
  };

  const hasFieldError = (fieldName: string) => {
    return errors.value.some(
      (error: { field: string }) => error.field === fieldName
    );
  };

  const hasErrors = () => {
    return errors.value.length > 0;
  };

  const hasErrorsOfSeverity = (severity: "error" | "warning") => {
    return errors.value.some(
      (error: { severity: string }) => error.severity === severity
    );
  };

  return {
    errors,
    isValidating,
    validateEmail,
    validateUrl,
    validateHexColor,
    validateSlug,
    validateRequired,
    validateLength,
    validateNewsletter,
    validateBlock,
    validateSubscriber,
    validateForm,
    clearErrors,
    getFieldErrors,
    hasFieldError,
    hasErrors,
    hasErrorsOfSeverity,
  };
};
