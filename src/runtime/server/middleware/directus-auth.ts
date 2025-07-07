// src/runtime/server/middleware/directus-auth.ts
import { createDirectus, rest, staticToken, readMe } from "@directus/sdk";
import { getDirectusClient } from "~/server/middleware/directus-auth";

/**
 * Simplified authentication middleware that relies on Directus tokens
 * instead of handling authentication internally
 */
export default defineEventHandler(async (event) => {
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
    event.node.req.url?.startsWith(endpoint),
  );

  if (isPublicEndpoint) {
    return;
  }

  try {
    const config = useRuntimeConfig();

    // Get token from header or config
    const authHeader = getHeader(event, "authorization");
    const directusToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader || config.newsletter?.directusToken;

    if (!directusToken) {
      throw createError({
        statusCode: 401,
        statusMessage: "Directus authentication token required",
      });
    }

    // Validate token by creating a Directus client and testing it
    const client = createDirectus(config.public.newsletter.directusUrl)
      .with(rest())
      .with(staticToken(directusToken));

    // Test the token by trying to read the current user
    // This will throw if the token is invalid
    await client.request(
      readMe({
        fields: ["id", "email", "status", "role"],
      }),
    );

    // Store the validated token and client for use in API handlers
    event.context.directusToken = directusToken;
    event.context.directusClient = client;
  } catch (error: any) {
    console.error("Directus authentication error:", error.message);

    // Handle specific Directus errors
    if (error.errors?.[0]?.extensions?.code === "FORBIDDEN") {
      throw createError({
        statusCode: 403,
        statusMessage: "Invalid or expired Directus token",
      });
    }

    throw createError({
      statusCode: 401,
      statusMessage: "Directus authentication failed",
    });
  }
});

/**
 * Helper function to get authenticated Directus client from event context
 */
export function getDirectusClient(event: any) {
  const client = event.context.directusClient;
  if (!client) {
    throw createError({
      statusCode: 401,
      statusMessage: "No authenticated Directus client found",
    });
  }
  return client;
}

/**
 * Helper function to get Directus token from event context
 */
export function getDirectusToken(event: any): string {
  const token = event.context.directusToken;
  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: "No Directus token found",
    });
  }
  return token;
}
