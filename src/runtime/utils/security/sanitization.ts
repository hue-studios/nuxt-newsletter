// src/runtime/utils/security/sanitization.ts

export interface SanitizationOptions {
  allowHtml?: boolean;
  allowedTags?: string[];
  allowedAttributes?: string[];
  maxLength?: number;
}

export function sanitizeInput(
  input: string,
  options: SanitizationOptions = {}
): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  let sanitized = input.trim();

  // Apply length limit
  if (options.maxLength && sanitized.length > options.maxLength) {
    sanitized = sanitized.substring(0, options.maxLength);
  }

  // If HTML is not allowed, escape it completely
  if (!options.allowHtml) {
    return escapeHtml(sanitized);
  }

  // If HTML is allowed, sanitize based on allowed tags and attributes
  return sanitizeHtml(sanitized, options);
}

export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function sanitizeHtml(
  html: string,
  options: SanitizationOptions = {}
): string {
  const allowedTags = options.allowedTags || [
    "p",
    "br",
    "strong",
    "em",
    "u",
    "a",
    "img",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "ul",
    "ol",
    "li",
    "blockquote",
    "div",
    "span",
  ];

  const allowedAttributes = options.allowedAttributes || [
    "href",
    "src",
    "alt",
    "title",
    "class",
    "id",
    "style",
  ];

  // Remove script tags and their content
  html = html.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    ""
  );

  // Remove iframe tags
  html = html.replace(
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    ""
  );

  // Remove javascript: protocols
  html = html.replace(/javascript:/gi, "");

  // Remove event handlers
  html = html.replace(/on\w+\s*=/gi, "");

  // Remove data: protocols except for images
  html = html.replace(/data:(?!image\/[a-z]+;base64,)/gi, "");

  // Basic tag filtering (this is simplified - use a proper library in production)
  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;
  html = html.replace(tagRegex, (match, tagName) => {
    if (!allowedTags.includes(tagName.toLowerCase())) {
      return "";
    }
    return match;
  });

  return html;
}

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

export function sanitizeEmail(email: string): string {
  return email
    .toLowerCase()
    .trim()
    .replace(/[^a-zA-Z0-9@._-]/g, "");
}

export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);

    // Only allow http and https protocols
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return "";
    }

    return parsed.toString();
  } catch {
    return "";
  }
}

export function validateCsrf(token: string, sessionToken: string): boolean {
  return token === sessionToken;
}

export function generateCsrfToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function hashPassword(password: string): string {
  // This is a placeholder - use proper password hashing like bcrypt in production
  return btoa(password).split("").reverse().join("");
}

export function verifyPassword(password: string, hash: string): boolean {
  // This is a placeholder - use proper password verification in production
  return hashPassword(password) === hash;
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  constructor(private config: RateLimitConfig) {}

  isAllowed(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Get existing requests for this key
    let keyRequests = this.requests.get(key) || [];

    // Filter out requests outside the current window
    keyRequests = keyRequests.filter((time) => time > windowStart);

    // Check if we're within the limit
    if (keyRequests.length >= this.config.maxRequests) {
      return false;
    }

    // Add current request
    keyRequests.push(now);
    this.requests.set(key, keyRequests);

    return true;
  }

  reset(key: string): void {
    this.requests.delete(key);
  }

  cleanup(): void {
    const now = Date.now();

    for (const [key, requests] of this.requests.entries()) {
      const windowStart = now - this.config.windowMs;
      const validRequests = requests.filter((time) => time > windowStart);

      if (validRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validRequests);
      }
    }
  }
}

export function getClientIp(event: any): string {
  // Get client IP from various headers
  const headers = event.node?.req?.headers || event.headers || {};

  return (
    headers["x-forwarded-for"]?.split(",")[0] ||
    headers["x-real-ip"] ||
    headers["x-client-ip"] ||
    event.node?.req?.connection?.remoteAddress ||
    event.node?.req?.socket?.remoteAddress ||
    "unknown"
  );
}

export function isValidOrigin(
  origin: string,
  allowedOrigins: string[]
): boolean {
  if (!origin) return false;
  return allowedOrigins.includes(origin) || allowedOrigins.includes("*");
}

export function sanitizeUserAgent(userAgent: string): string {
  return userAgent.replace(/[<>]/g, "").substring(0, 500);
}

export function detectSqlInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
    /(--|\/\*|\*\/)/,
    /('|(\\')|(;))/,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
  ];

  return sqlPatterns.some((pattern) => pattern.test(input));
}

export function detectXss(input: string): boolean {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /eval\s*\(/i,
    /expression\s*\(/i,
  ];

  return xssPatterns.some((pattern) => pattern.test(input));
}

export function detectPathTraversal(input: string): boolean {
  const pathPatterns = [
    /\.\.\//,
    /\.\.\\/,
    /%2e%2e%2f/i,
    /%2e%2e%5c/i,
    /\.\.%2f/i,
    /\.\.%5c/i,
  ];

  return pathPatterns.some((pattern) => pattern.test(input));
}
