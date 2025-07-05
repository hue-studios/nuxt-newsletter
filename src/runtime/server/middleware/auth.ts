// src/runtime/server/middleware/auth.ts
import { verifyJWT, RateLimiter } from "~/utils/security/authentication";

interface AuthOptions {
  required?: boolean;
  roles?: string[];
  permissions?: string[];
}

// Rate limiter for auth attempts
const authRateLimiter = new RateLimiter(5, 15 * 60 * 1000); // 5 attempts per 15 minutes

export function createAuthMiddleware(options: AuthOptions = {}) {
  return defineEventHandler(async (event) => {
    const { required = false, roles = [], permissions = [] } = options;

    // Skip auth for non-newsletter API routes
    if (!event.node.req.url?.startsWith("/api/newsletter")) {
      return;
    }

    // Skip auth for public endpoints
    const publicEndpoints = [
      "/api/newsletter/webhook/",
      "/api/newsletter/unsubscribe",
      "/api/newsletter/preferences",
    ];

    const isPublicEndpoint = publicEndpoints.some((endpoint) =>
      event.node.req.url?.startsWith(endpoint)
    );

    if (isPublicEndpoint) {
      return;
    }

    try {
      const config = useRuntimeConfig();
      const authHeader = getHeader(event, "authorization");

      if (!authHeader && !required) {
        return;
      }

      if (!authHeader) {
        throw createError({
          statusCode: 401,
          statusMessage: "Authorization header required",
        });
      }

      // Extract token
      const token = authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : authHeader;

      if (!token) {
        throw createError({
          statusCode: 401,
          statusMessage: "Invalid authorization format",
        });
      }

      // Rate limiting for auth attempts
      const clientIP = getClientIP(event);
      if (!authRateLimiter.isAllowed(clientIP)) {
        throw createError({
          statusCode: 429,
          statusMessage: "Too many authentication attempts",
        });
      }

      // Verify JWT token
      const secret =
        config.newsletter?.webhookSecret || config.newsletter?.authSecret;
      if (!secret) {
        throw createError({
          statusCode: 500,
          statusMessage: "Authentication not configured",
        });
      }

      const payload = verifyJWT(token, secret);

      // Check if user exists and is active
      if (payload.sub) {
        // You can add Directus user verification here if needed
        // const user = await directus.request(readUser(payload.sub));
        // if (!user || user.status !== 'active') {
        //   throw createError({
        //     statusCode: 403,
        //     statusMessage: 'User not found or inactive'
        //   });
        // }
      }

      // Role-based access control
      if (roles.length > 0) {
        const userRoles = payload.roles || [];
        const hasRequiredRole = roles.some((role) => userRoles.includes(role));

        if (!hasRequiredRole) {
          throw createError({
            statusCode: 403,
            statusMessage: "Insufficient permissions",
          });
        }
      }

      // Permission-based access control
      if (permissions.length > 0) {
        const userPermissions = payload.permissions || [];
        const hasRequiredPermission = permissions.some((permission) =>
          userPermissions.includes(permission)
        );

        if (!hasRequiredPermission) {
          throw createError({
            statusCode: 403,
            statusMessage: "Missing required permissions",
          });
        }
      }

      // Add user context to event
      event.context.user = {
        id: payload.sub,
        email: payload.email,
        roles: payload.roles || [],
        permissions: payload.permissions || [],
        ...payload,
      };
    } catch (error: any) {
      console.error("Auth middleware error:", error);

      if (error.statusCode) {
        throw error;
      }

      throw createError({
        statusCode: 401,
        statusMessage: "Authentication failed",
      });
    }
  });
}

// Default auth middleware for newsletter routes
export default createAuthMiddleware({
  required: false, // Set to true if you want all routes to require auth
  roles: [], // Add required roles: ['admin', 'editor']
  permissions: [], // Add required permissions: ['newsletter:write']
});

// Helper function to get client IP
function getClientIP(event: any): string {
  return (
    getHeader(event, "x-forwarded-for") ||
    getHeader(event, "x-real-ip") ||
    event.node.req.socket?.remoteAddress ||
    "unknown"
  );
}

// Helper function to check if user has permission for specific newsletter
export async function checkNewsletterPermission(
  event: any,
  newsletterId: number,
  action: "read" | "write" | "delete" = "read"
) {
  const user = event.context.user;

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Authentication required",
    });
  }

  // Admin users have all permissions
  if (user.roles?.includes("admin")) {
    return true;
  }

  // Check if user is owner or has explicit permission
  // You can implement your own logic here
  const hasPermission =
    user.permissions?.includes(`newsletter:${action}`) ||
    user.permissions?.includes(`newsletter:${newsletterId}:${action}`);

  if (!hasPermission) {
    throw createError({
      statusCode: 403,
      statusMessage: "Insufficient permissions for this newsletter",
    });
  }

  return true;
}

// Helper to validate API key
export function validateApiKey(event: any): boolean {
  const config = useRuntimeConfig();
  const apiKey = getHeader(event, "x-api-key") || getQuery(event).api_key;

  if (!apiKey) {
    return false;
  }

  // You can implement your own API key validation logic
  const validApiKeys = config.newsletter?.apiKeys || [];
  return validApiKeys.includes(apiKey);
}
