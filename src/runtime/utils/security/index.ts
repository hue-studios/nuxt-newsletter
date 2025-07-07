// src/runtime/utils/security/index.ts
/**
 * Security utilities for newsletter content
 * Authentication functions have been removed - use Directus for authentication
 */

// Export sanitization utilities
export * from "./sanitization";

// Export validation utilities
export * from "./validation";

// Re-export commonly used functions for convenience
export {
  sanitizeHtml,
  sanitizeText,
  sanitizeNewsletterContent,
  escapeHtml,
} from "./sanitization";

export {
  validateEmail,
  validateNewsletterContent,
  validateFileUpload,
  validateMJMLTemplate,
  validateNewsletterSend,
  validateXSSSafety,
  validateSqlSafety,
  VALIDATION_PATTERNS,
} from "./validation";
