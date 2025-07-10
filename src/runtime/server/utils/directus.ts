import { createError } from "h3";
import { useRuntimeConfig } from "#app";
import { createDirectus, rest, staticToken, readMe } from "@directus/sdk";

export async function createAuthenticatedDirectus(token: string) {
  const config = useRuntimeConfig();

  const client = createDirectus(config.public.newsletter.directusUrl)
    .with(rest())
    .with(staticToken(token));

  // Validate token by trying to read current user
  try {
    const user = await client.request(readMe());
    return { client, user };
  } catch (error) {
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid or expired Directus token",
    });
  }
}
