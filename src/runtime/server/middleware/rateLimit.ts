// src/runtime/server/middleware/rateLimit.ts
import { RateLimiter } from "~/utils/security/authentication";

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (event: any) => string;
}

// Different rate limiters for different endpoints
const rateLimiters = new Map<string, RateLimiter>();

// Default configurations for different endpoint types
const defaultConfigs: Record<string, RateLimitConfig> = {
  // General API endpoints
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: "Too many requests, please try again later",
  },

  // Email sending endpoints (more restrictive)
  email: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50,
    message: "Email sending rate limit exceeded",
  },

  // File upload endpoints
  upload: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 20,
    message: "Upload rate limit exceeded",
  },

  // Webhook endpoints (more lenient)
  webhook: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 1000,
    message: "Webhook rate limit exceeded",
  },

  // Analytics endpoints
  analytics: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 200,
    message: "Analytics rate limit exceeded",
  },

  // Test email endpoints (very restrictive)
  test: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10,
    message: "Test email rate limit exceeded",
  },
};

export function createRateLimitMiddleware(config?: Partial<RateLimitConfig>) {
  return defineEventHandler(async (event) => {
    // Skip rate limiting for non-newsletter API routes
    if (!event.node.req.url?.startsWith("/api/newsletter")) {
      return;
    }

    // Determine the appropriate config based on endpoint
    const endpoint = event.node.req.url;
    let rateLimitConfig: RateLimitConfig;

    if (endpoint.includes("/send-test")) {
      rateLimitConfig = { ...defaultConfigs.test, ...config };
    } else if (endpoint.includes("/send")) {
      rateLimitConfig = { ...defaultConfigs.email, ...config };
    } else if (endpoint.includes("/upload")) {
      rateLimitConfig = { ...defaultConfigs.upload, ...config };
    } else if (endpoint.includes("/webhook")) {
      rateLimitConfig = { ...defaultConfigs.webhook, ...config };
    } else if (endpoint.includes("/analytics")) {
      rateLimitConfig = { ...defaultConfigs.analytics, ...config };
    } else {
      rateLimitConfig = { ...defaultConfigs.general, ...config };
    }

    // Generate a unique key for this configuration
    const configKey = JSON.stringify({
      windowMs: rateLimitConfig.windowMs,
      maxRequests: rateLimitConfig.maxRequests,
    });

    // Get or create rate limiter for this configuration
    if (!rateLimiters.has(configKey)) {
      rateLimiters.set(
        configKey,
        new RateLimiter(rateLimitConfig.maxRequests, rateLimitConfig.windowMs)
      );
    }

    const rateLimiter = rateLimiters.get(configKey)!;

    // Generate identifier for rate limiting
    const identifier = rateLimitConfig.keyGenerator
      ? rateLimitConfig.keyGenerator(event)
      : getClientIdentifier(event);

    // Check rate limit
    if (!rateLimiter.isAllowed(identifier)) {
      const resetTime = rateLimiter.getResetTime(identifier);
      const remainingRequests = rateLimiter.getRemainingRequests(identifier);

      // Set rate limit headers
      setHeader(
        event,
        "X-RateLimit-Limit",
        rateLimitConfig.maxRequests.toString()
      );
      setHeader(event, "X-RateLimit-Remaining", remainingRequests.toString());
      setHeader(
        event,
        "X-RateLimit-Reset",
        resetTime ? Math.ceil(resetTime / 1000).toString() : ""
      );

      throw createError({
        statusCode: 429,
        statusMessage: rateLimitConfig.message || "Rate limit exceeded",
        data: {
          limit: rateLimitConfig.maxRequests,
          remaining: remainingRequests,
          reset: resetTime,
          retryAfter: resetTime
            ? Math.ceil((resetTime - Date.now()) / 1000)
            : null,
        },
      });
    }

    // Set success headers
    const remainingRequests = rateLimiter.getRemainingRequests(identifier);
    const resetTime = rateLimiter.getResetTime(identifier);

    setHeader(
      event,
      "X-RateLimit-Limit",
      rateLimitConfig.maxRequests.toString()
    );
    setHeader(event, "X-RateLimit-Remaining", remainingRequests.toString());
    setHeader(
      event,
      "X-RateLimit-Reset",
      resetTime ? Math.ceil(resetTime / 1000).toString() : ""
    );
  });
}

// Default rate limit middleware
export default createRateLimitMiddleware();

// Helper function to generate client identifier
function getClientIdentifier(event: any): string {
  // Try to get user ID from context (if authenticated)
  const userId = event.context.user?.id;
  if (userId) {
    return `user:${userId}`;
  }

  // Try to get API key
  const apiKey = getHeader(event, "x-api-key");
  if (apiKey) {
    return `api:${apiKey}`;
  }

  // Fall back to IP address
  const ip = getClientIP(event);
  return `ip:${ip}`;
}

// Helper function to get client IP
function getClientIP(event: any): string {
  return (
    getHeader(event, "x-forwarded-for")?.split(",")[0]?.trim() ||
    getHeader(event, "x-real-ip") ||
    getHeader(event, "cf-connecting-ip") || // Cloudflare
    getHeader(event, "x-client-ip") ||
    event.node.req.socket?.remoteAddress ||
    "unknown"
  );
}

// Specialized rate limiters for specific use cases
export const emailRateLimit = createRateLimitMiddleware({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 100,
  message:
    "Email sending rate limit exceeded. Please wait before sending more emails.",
});

export const uploadRateLimit = createRateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 50,
  message:
    "File upload rate limit exceeded. Please wait before uploading more files.",
});

export const testEmailRateLimit = createRateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 20,
  message:
    "Test email rate limit exceeded. Please wait before sending more test emails.",
});

export const webhookRateLimit = createRateLimitMiddleware({
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 2000,
  message: "Webhook rate limit exceeded.",
});

// Adaptive rate limiting based on user type
export const adaptiveRateLimit = createRateLimitMiddleware({
  keyGenerator: (event) => {
    const user = event.context.user;

    if (user?.roles?.includes("admin")) {
      // Admins get higher limits
      return `admin:${user.id}`;
    } else if (user?.roles?.includes("premium")) {
      // Premium users get higher limits
      return `premium:${user.id}`;
    } else if (user) {
      // Regular authenticated users
      return `user:${user.id}`;
    } else {
      // Anonymous users (by IP)
      return `ip:${getClientIP(event)}`;
    }
  },
  maxRequests: 200, // This will be overridden based on user type
});

// Cleanup function to remove expired rate limit entries
export function cleanupRateLimiters() {
  rateLimiters.forEach((limiter) => {
    limiter.cleanup();
  });
}

// Automatic cleanup every hour
if (process.env.NODE_ENV === "production") {
  setInterval(cleanupRateLimiters, 60 * 60 * 1000);
}
