// src/runtime/utils/security.ts
import DOMPurify from "isomorphic-dompurify";
import rateLimit from "express-rate-limit";

export interface SecurityConfig {
  maxFileSize: number;
  allowedFileTypes: string[];
  rateLimitWindow: number;
  rateLimitMax: number;
}

export const defaultSecurityConfig: SecurityConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  rateLimitWindow: 15 * 60 * 1000, // 15 minutes
  rateLimitMax: 100, // requests per window
};

// Enhanced HTML sanitization
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "p",
      "br",
      "strong",
      "em",
      "u",
      "s",
      "ul",
      "ol",
      "li",
      "a",
      "img",
    ],
    ALLOWED_ATTR: ["href", "src", "alt", "title"],
    ALLOW_DATA_ATTR: false,
  });
}

// Rate limiting middleware
export const createRateLimiter = (config = defaultSecurityConfig) => {
  return rateLimit({
    windowMs: config.rateLimitWindow,
    max: config.rateLimitMax,
    message: "Too many requests, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// File validation
export function validateFile(
  file: File,
  config = defaultSecurityConfig
): { valid: boolean; error?: string } {
  if (file.size > config.maxFileSize) {
    return {
      valid: false,
      error: `File size exceeds ${config.maxFileSize / 1024 / 1024}MB limit`,
    };
  }

  if (!config.allowedFileTypes.includes(file.type)) {
    return { valid: false, error: "File type not allowed" };
  }

  return { valid: true };
}

// Webhook signature verification
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const crypto = require("crypto");
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
