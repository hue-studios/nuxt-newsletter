// src/runtime/server/middleware/validation.ts
import { z } from "zod";
import {
  sanitizeHtml,
  sanitizeInput,
  validateEmail,
} from "~/utils/security/sanitization";

// Common validation schemas
export const commonSchemas = {
  email: z
    .string()
    .email("Invalid email address")
    .refine(validateEmail, "Invalid email format"),

  newsletterId: z.coerce.number().positive("Newsletter ID must be positive"),

  pagination: z.object({
    limit: z.coerce.number().min(1).max(100).default(25),
    offset: z.coerce.number().min(0).default(0),
  }),

  sort: z.object({
    field: z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, "Invalid sort field"),
    direction: z.enum(["asc", "desc"]).default("desc"),
  }),
};

// Request validation schemas for different endpoints
export const validationSchemas = {
  // Newsletter creation/update
  newsletter: z.object({
    title: z
      .string()
      .min(1, "Title is required")
      .max(200, "Title too long")
      .transform(sanitizeInput),

    subject_line: z
      .string()
      .min(1, "Subject line is required")
      .max(998, "Subject line too long") // RFC 2822 limit
      .transform(sanitizeInput),

    from_email: commonSchemas.email,

    from_name: z
      .string()
      .min(1, "From name is required")
      .max(100, "From name too long")
      .transform(sanitizeInput),

    category: z.enum([
      "company",
      "product",
      "weekly",
      "monthly",
      "event",
      "offer",
      "announcement",
      "newsletter",
    ]),

    priority: z.enum(["low", "normal", "high"]).default("normal"),

    mailing_list_id: z.coerce.number().positive().optional(),

    template_id: z.coerce.number().positive().optional(),

    preview_text: z
      .string()
      .max(150)
      .optional()
      .transform((val) => (val ? sanitizeInput(val) : val)),

    reply_to: z.string().email().optional(),

    status: z.enum(["draft", "scheduled", "sending", "sent"]).default("draft"),
  }),

  // Block creation/update
  block: z.object({
    type: z.string().min(1, "Block type is required"),

    content: z.record(z.any()).transform((content) => {
      // Sanitize HTML content fields
      if (content.text_content) {
        content.text_content = sanitizeHtml(content.text_content);
      }
      if (content.title) {
        content.title = sanitizeInput(content.title);
      }
      if (content.subtitle) {
        content.subtitle = sanitizeInput(content.subtitle);
      }
      return content;
    }),

    order: z.coerce.number().min(0).default(0),

    newsletter_id: commonSchemas.newsletterId,
  }),

  // Test email sending
  sendTest: z.object({
    test_emails: z
      .array(commonSchemas.email)
      .min(1, "At least one test email required"),
    newsletter_id: commonSchemas.newsletterId,
  }),

  // Newsletter sending
  sendNewsletter: z.object({
    newsletter_id: commonSchemas.newsletterId,
    send_at: z.string().datetime().optional(),
    mailing_list_ids: z.array(z.coerce.number().positive()).optional(),
  }),

  // Template creation/update
  template: z.object({
    name: z
      .string()
      .min(1, "Template name is required")
      .transform(sanitizeInput),
    description: z
      .string()
      .optional()
      .transform((val) => (val ? sanitizeInput(val) : val)),
    mjml_template: z.string().min(1, "MJML template is required"),
    category: z.string().optional(),
    is_default: z.boolean().default(false),
  }),

  // Subscriber creation/update
  subscriber: z.object({
    email: commonSchemas.email,
    first_name: z
      .string()
      .optional()
      .transform((val) => (val ? sanitizeInput(val) : val)),
    last_name: z
      .string()
      .optional()
      .transform((val) => (val ? sanitizeInput(val) : val)),
    status: z
      .enum(["active", "unsubscribed", "bounced", "complained"])
      .default("active"),
    mailing_lists: z.array(z.coerce.number().positive()).optional(),
    metadata: z.record(z.any()).optional(),
  }),

  // Webhook validation (newsletter-specific)
  webhook: z.object({
    event_type: z.string().min(1, "Event type is required"),
    timestamp: z.coerce.number().positive("Valid timestamp required"),
    email: commonSchemas.email.optional(),
    newsletter_id: z.coerce.number().positive().optional(),
    data: z.record(z.any()).optional(),
  }),
};

// Create validation middleware function
export function createValidationMiddleware(
  schema: z.ZodSchema,
  source: "body" | "query" | "params" = "body"
) {
  return defineEventHandler(async (event) => {
    try {
      let data;

      switch (source) {
        case "body":
          data = await readBody(event);
          break;
        case "query":
          data = getQuery(event);
          break;
        case "params":
          data = getRouterParams(event);
          break;
      }

      const validatedData = schema.parse(data);

      // Store validated data in context
      if (!event.context.validated) {
        event.context.validated = {};
      }
      event.context.validated[source] = validatedData;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
          code: err.code,
        }));

        throw createError({
          statusCode: 422,
          statusMessage: "Validation failed",
          data: {
            errors,
            message: "Invalid input data",
          },
        });
      }

      throw createError({
        statusCode: 400,
        statusMessage: "Invalid request data",
      });
    }
  });
}

// Content Security Policy validation
export function validateCSP(event: any) {
  const cspHeader = getHeader(event, "content-security-policy");

  if (!cspHeader) {
    setHeader(
      event,
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:;"
    );
  }
}

// MIME type validation for file uploads
export function validateMimeType(file: any, allowedTypes: string[]): boolean {
  if (!file || !file.type) {
    return false;
  }

  return allowedTypes.includes(file.type);
}

// File size validation
export function validateFileSize(file: any, maxSizeBytes: number): boolean {
  if (!file || typeof file.size !== "number") {
    return false;
  }

  return file.size <= maxSizeBytes;
}

// Webhook signature validation (newsletter-specific)
export function validateWebhookSignature(
  event: any,
  payload: string,
  signature: string,
  secret: string
): boolean {
  const crypto = require("crypto");

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  const providedSignature = signature.startsWith("sha256=")
    ? signature.slice(7)
    : signature;

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, "hex"),
    Buffer.from(providedSignature, "hex")
  );
}

// Helper to get validated data from context
export function getValidatedData(
  event: any,
  source: "body" | "query" | "params" = "body"
) {
  return event.context.validated?.[source];
}

// Specialized validators for common use cases
export const validators = {
  newsletterId: createValidationMiddleware(
    z.object({ id: commonSchemas.newsletterId }),
    "params"
  ),

  pagination: createValidationMiddleware(commonSchemas.pagination, "query"),

  newsletter: createValidationMiddleware(validationSchemas.newsletter, "body"),

  block: createValidationMiddleware(validationSchemas.block, "body"),

  sendTest: createValidationMiddleware(validationSchemas.sendTest, "body"),

  sendNewsletter: createValidationMiddleware(
    validationSchemas.sendNewsletter,
    "body"
  ),

  template: createValidationMiddleware(validationSchemas.template, "body"),

  subscriber: createValidationMiddleware(validationSchemas.subscriber, "body"),

  webhook: createValidationMiddleware(validationSchemas.webhook, "body"),
};

// Default validation middleware that applies basic security measures
export default defineEventHandler(async (event) => {
  // Skip for non-newsletter API routes
  if (!event.node.req.url?.startsWith("/api/newsletter")) {
    return;
  }

  // Apply CSP headers
  validateCSP(event);

  // Validate Content-Type for POST/PUT/PATCH requests
  if (["POST", "PUT", "PATCH"].includes(event.node.req.method || "")) {
    const contentType = getHeader(event, "content-type");

    if (!contentType) {
      throw createError({
        statusCode: 400,
        statusMessage: "Content-Type header is required",
      });
    }

    // Allow specific content types
    const allowedTypes = [
      "application/json",
      "multipart/form-data",
      "application/x-www-form-urlencoded",
    ];

    const isAllowed = allowedTypes.some((type) => contentType.includes(type));

    if (!isAllowed) {
      throw createError({
        statusCode: 415,
        statusMessage: "Unsupported Media Type",
      });
    }
  }
});
