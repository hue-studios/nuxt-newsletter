// src/runtime/server/utils/auth.ts
import { createDirectus, rest, authentication, staticToken } from '@directus/sdk'
import type { H3Event } from 'h3'
import jwt from 'jsonwebtoken'

// Get auth token from various sources
export async function getAuthToken(event: H3Event): Promise<string | null> {
  const config = useRuntimeConfig()
  const authConfig = config.public.newsletter?.directus?.auth

  // Static token
  if (authConfig?.type === 'static' && authConfig.token) {
    return authConfig.token
  }

  // From Authorization header
  const authHeader = getHeader(event, 'authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  // From cookie
  const tokenCookie = getCookie(event, 'directus-token')
  if (tokenCookie) {
    return tokenCookie
  }

  // From session
  const session = await getUserSession(event)
  if (session?.directusToken) {
    return session.directusToken
  }

  return null
}

// Create authenticated Directus client
export async function createAuthenticatedDirectus(event: H3Event) {
  const config = useRuntimeConfig()
  const directusUrl = config.public.newsletter?.directus?.url

  if (!directusUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Directus URL not configured'
    })
  }

  const token = await getAuthToken(event)
  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication
