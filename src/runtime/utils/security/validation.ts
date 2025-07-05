// src/runtime/utils/security/validation.ts
/**
 * Security-focused validation utilities
 */

// Input validation patterns
export const VALIDATION_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  url: /^https?:\/\/([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
  slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  hexColor: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  phoneNumber: /^\+?[\d\s\-\(\)]{10,}$/,
  strongPassword:
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
};

// Validate against common injection attacks
export function validateSqlSafety(input: string): boolean {
  const sqlInjectionPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
    /('|(\\')|(;)|(\\)|(--)|(%)|(\*)|(\+)|(\|)|(\?)|(<)|(>)|(\{)|(\})|(\[)|(\])|(\^)|(\$)|(\()|(\)))/,
    /(script|javascript|vbscript|onload|onerror|onclick)/i,
  ];

  return !sqlInjectionPatterns.some((pattern) => pattern.test(input));
}

export function validateXSSSafety(input: string): boolean {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /<form/gi,
  ];

  return !xssPatterns.some((pattern) => pattern.test(input));
}

// File upload validation
export function validateFileUpload(
  file: {
    name: string;
    size: number;
    type: string;
  },
  options: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
    allowedExtensions?: string[];
  } = {}
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ],
    allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"],
  } = options;

  // Check file size
  if (file.size > maxSize) {
    errors.push(
      `File size (${(file.size / 1024 / 1024).toFixed(
        2
      )}MB) exceeds maximum allowed size (${(maxSize / 1024 / 1024).toFixed(
        2
      )}MB)`
    );
  }

  // Check MIME type
  if (!allowedTypes.includes(file.type)) {
    errors.push(`File type "${file.type}" is not allowed`);
  }

  // Check file extension
  const extension = file.name
    .toLowerCase()
    .substring(file.name.lastIndexOf("."));
  if (!allowedExtensions.includes(extension)) {
    errors.push(`File extension "${extension}" is not allowed`);
  }

  // Check for potential malicious files
  const dangerousExtensions = [
    ".exe",
    ".bat",
    ".cmd",
    ".scr",
    ".pif",
    ".jar",
    ".zip",
  ];
  if (
    dangerousExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))
  ) {
    errors.push("Potentially dangerous file type detected");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Content validation for newsletters
export function validateNewsletterContent(content: any): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check for suspicious URLs
  if (content.button_url) {
    if (!VALIDATION_PATTERNS.url.test(content.button_url)) {
      errors.push("Invalid button URL format");
    }

    if (
      content.button_url.includes("javascript:") ||
      content.button_url.includes("data:")
    ) {
      errors.push("Potentially unsafe button URL detected");
    }
  }

  // Check for suspicious image URLs
  if (content.image_url) {
    if (
      !VALIDATION_PATTERNS.url.test(content.image_url) &&
      !content.image_url.startsWith("/")
    ) {
      errors.push("Invalid image URL format");
    }
  }

  // Validate text content
  if (content.text_content && !validateXSSSafety(content.text_content)) {
    errors.push("Potentially unsafe content detected in text");
  }

  // Check color values
  if (
    content.background_color &&
    !VALIDATION_PATTERNS.hexColor.test(content.background_color)
  ) {
    errors.push("Invalid background color format");
  }

  if (
    content.text_color &&
    !VALIDATION_PATTERNS.hexColor.test(content.text_color)
  ) {
    errors.push("Invalid text color format");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Rate limiting validation
export function validateRateLimit(
  identifier: string,
  limits: { requests: number; windowMs: number }
): { allowed: boolean; remaining: number; resetTime: number | null } {
  // This would integrate with your rate limiter instance
  const rateLimiter = new RateLimiter(limits.requests, limits.windowMs);

  return {
    allowed: rateLimiter.isAllowed(identifier),
    remaining: rateLimiter.getRemainingRequests(identifier),
    resetTime: rateLimiter.getResetTime(identifier),
  };
}
