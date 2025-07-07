// src/runtime/utils/security/validation.ts
/**
 * Security-focused validation utilities for newsletter content
 * Authentication-related functions have been removed
 */

// Input validation patterns
export const VALIDATION_PATTERNS = {
  email: /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/,
  // Fixed: More efficient URL regex that avoids super-linear backtracking
  url: /^https?:\/\/[\da-z.-]+\.[a-z.]{2,6}(?:\/[\w.-]*)*\/?$/i,
  slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  hexColor: /^#(?:[A-F0-9]{6}|[A-F0-9]{3})$/i,
  phoneNumber: /^\+?[\d\s\-()]{10,}$/,
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
      content.button_url.includes("javascript:")
      || content.button_url.includes("data:")
    ) {
      errors.push("Potentially unsafe button URL detected");
    }
  }

  // Check for suspicious image URLs
  if (content.image_url) {
    if (
      !VALIDATION_PATTERNS.url.test(content.image_url)
      && !content.image_url.startsWith("/")
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
    content.background_color
    && !VALIDATION_PATTERNS.hexColor.test(content.background_color)
  ) {
    errors.push("Invalid background color format");
  }

  if (
    content.text_color
    && !VALIDATION_PATTERNS.hexColor.test(content.text_color)
  ) {
    errors.push("Invalid text color format");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Email validation specifically for newsletters
export function validateEmail(email: string): boolean {
  if (!VALIDATION_PATTERNS.email.test(email)) {
    return false;
  }

  // Additional checks for newsletter context
  const disposableEmailDomains = [
    "10minutemail.com",
    "guerrillamail.com",
    "mailinator.com",
    "tempmail.org",
  ];

  const domain = email.toLowerCase().split("@")[1];
  if (disposableEmailDomains.includes(domain)) {
    return false; // Optionally reject disposable emails
  }

  return true;
}

// MJML template validation
export function validateMJMLTemplate(mjml: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check for required MJML structure
  if (!mjml.includes("<mjml>")) {
    errors.push("MJML template must contain <mjml> root element");
  }

  if (!mjml.includes("<mj-head>") && !mjml.includes("<mj-body>")) {
    errors.push("MJML template must contain <mj-head> or <mj-body> elements");
  }

  // Check for potentially dangerous elements
  const dangerousPatterns = [
    /<script/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
  ];

  dangerousPatterns.forEach((pattern) => {
    if (pattern.test(mjml)) {
      errors.push("MJML template contains potentially unsafe elements");
    }
  });

  // Validate Handlebars syntax (basic check)
  const handlebarsPattern = /\{\{([^}]+)\}\}/g;
  const matches = mjml.match(handlebarsPattern);

  if (matches) {
    matches.forEach((match) => {
      // Check for potentially dangerous Handlebars expressions
      if (match.includes("eval") || match.includes("require")) {
        errors.push(`Potentially unsafe Handlebars expression: ${match}`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Newsletter sending validation
export function validateNewsletterSend(
  newsletter: {
    subject_line?: string;
    from_email?: string;
    from_name?: string;
  },
  subscribers: Array<{ email: string }>
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check newsletter completeness
  if (!newsletter.subject_line?.trim()) {
    errors.push("Newsletter must have a subject line");
  }

  if (!newsletter.from_email?.trim()) {
    errors.push("Newsletter must have a from email");
  }

  if (!newsletter.from_name?.trim()) {
    errors.push("Newsletter must have a from name");
  }

  // Check subscriber list
  if (!subscribers || subscribers.length === 0) {
    errors.push("No subscribers found for this newsletter");
  }

  // Validate subscriber emails
  const invalidEmails = subscribers.filter((sub) => !validateEmail(sub.email));
  if (invalidEmails.length > 0) {
    warnings.push(
      `${invalidEmails.length} subscribers have invalid email addresses`
    );
  }

  // Check for reasonable subject line length
  if (newsletter.subject_line && newsletter.subject_line.length > 50) {
    warnings.push(
      "Subject line is longer than 50 characters - may be truncated in some email clients"
    );
  }

  // Check for spam trigger words (basic check)
  const spamWords = ["free", "urgent", "limited time", "act now", "!!!"];
  const subjectLower = newsletter.subject_line?.toLowerCase() || "";
  const foundSpamWords = spamWords.filter((word) =>
    subjectLower.includes(word)
  );

  if (foundSpamWords.length > 0) {
    warnings.push(
      `Subject line contains potential spam trigger words: ${foundSpamWords.join(
        ", "
      )}`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
