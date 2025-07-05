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

    scheduled_at: z.string().datetime().optional(),

    is_ab_test: z.boolean().default(false),

    ab_test_percentage: z.number().min(1).max(50).optional(),
  }),

  // Block creation/update
  block: z.object({
    newsletter_id: commonSchemas.newsletterId,

    block_type_id: z.coerce.number().positive("Block type ID is required"),

    sort: z.coerce.number().min(0).default(0),

    field_data: z.record(z.any()).transform((data) => {
      // Sanitize HTML content in field data
      const sanitized: Record<string, any> = {};

      for (const [key, value] of Object.entries(data)) {
        if (typeof value === "string") {
          // Sanitize HTML for content fields
          if (
            key.includes("content") ||
            key.includes("text") ||
            key.includes("html")
          ) {
            sanitized[key] = sanitizeHtml(value);
          } else {
            sanitized[key] = sanitizeInput(value);
          }
        } else {
          sanitized[key] = value;
        }
      }

      return sanitized;
    }),

    status: z.enum(["published", "draft"]).default("published"),
  }),

  // Send test email
  sendTest: z.object({
    newsletter_id: commonSchemas.newsletterId,

    test_emails: z
      .array(commonSchemas.email)
      .min(1, "At least one test email is required")
      .max(10, "Maximum 10 test emails allowed"),

    include_analytics: z.boolean().default(false),
  }),

  // Send newsletter
  sendNewsletter: z.object({
    newsletter_id: commonSchemas.newsletterId,

    mailing_list_ids: z
      .array(z.coerce.number().positive())
      .min(1, "At least one mailing list is required")
      .max(10, "Maximum 10 mailing lists allowed"),

    scheduled_at: z.string().datetime().optional(),

    send_immediately: z.boolean().default(false),

    ab_test_config: z
      .object({
        enabled: z.boolean().default(false),
        percentage: z.number().min(1).max(50).default(10),
        variant_subject: z.string().max(998).optional(),
      })
      .optional(),
  }),

  // File upload
  fileUpload: z.object({
    folder: z
      .string()
      .regex(/^[a-zA-Z0-9_-]+$/, "Invalid folder name")
      .max(50)
      .default("newsletter-assets"),

    title: z.string().max(200).optional(),

    description: z.string().max(500).optional(),
  }),

  // Template operations
  template: z.object({
    name: z
      .string()
      .min(1, "Template name is required")
      .max(100, "Template name too long")
      .transform(sanitizeInput),

    description: z
      .string()
      .max(500, "Description too long")
      .transform(sanitizeInput)
      .optional(),

    category: z.enum([
      "general",
      "marketing",
      "newsletter",
      "announcement",
      "event",
      "product",
      "seasonal",
    ]),

    tags: z.array(z.string().max(50)).max(10).default([]),

    is_public: z.boolean().default(false),

    featured: z.boolean().default(false),
  }),

  // Subscriber operations
  subscriber: z.object({
    email: commonSchemas.email,

    name: z
      .string()
      .max(100, "Name too long")
      .transform(sanitizeInput)
      .optional(),

    status: z
      .enum(["active", "inactive", "unsubscribed", "bounced"])
      .default("active"),

    metadata: z.record(z.any()).optional(),

    preferences: z
      .object({
        frequency: z.enum(["daily", "weekly", "monthly"]).optional(),
        categories: z.array(z.string()).max(20).optional(),
      })
      .optional(),
  }),

  // Webhook validation
  webhook: z.object({
    event: z.string().min(1, "Event type is required"),

    timestamp: z.coerce.number().positive(),

    email: commonSchemas.email.optional(),

    newsletter_id: z.coerce.number().positive().optional(),

    url: z.string().url().optional(),

    user_agent: z.string().max(500).optional(),

    ip: z.string().ip().optional(),
  }),
};

// Validation middleware factory
export function createValidationMiddleware(
  schema: z.ZodSchema,
  source: "body" | "query" | "params" = "body"
) {
  return defineEventHandler(async (event) => {
    // Skip validation for non-newsletter API routes
    if (!event.node.req.url?.startsWith("/api/newsletter")) {
      return;
    }

    // Skip validation for GET requests unless it's query validation
    if (event.node.req.method === "GET" && source === "body") {
      return;
    }

    try {
      let data: any;

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

      // Validate and sanitize data
      const validatedData = schema.parse(data);

      // Store validated data in context
      event.context.validated = {
        ...event.context.validated,
        [source]: validatedData,
      };
    } catch (error: any) {
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

// Webhook signature validation
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
