// src/runtime/server/utils/auth.ts
import { createDirectus, rest, staticToken } from '@directus/sdk'
import type { H3Event } from 'h3'

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

  // From session (if using H3 sessions)
  const session = await getSession(event, {
    password: process.env.SESSION_SECRET || 'newsletter-session-secret'
  })
  
  if (session?.data?.directusToken) {
    return session.data.directusToken
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
      statusMessage: 'Authentication required'
    })
  }

  const directus = createDirectus(directusUrl)
    .with(rest())
    .with(staticToken(token))

  return directus
}

// Verify user has permission to access newsletter resources
export async function verifyNewsletterAccess(event: H3Event, resource?: string) {
  const directus = await createAuthenticatedDirectus(event)
  
  try {
    // Test access by reading newsletter permissions
    const response = await directus.request(
      rest.readMe({
        fields: ['id', 'email', 'role.name']
      })
    )

    // You can add custom role checks here
    // For example, checking if user has 'editor' or 'admin' role
    
    return {
      userId: response.id,
      email: response.email,
      role: response.role?.name
    }
  } catch (error) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied to newsletter resources'
    })
  }
}

// Get admin token for system operations (webhooks, etc)
export function getAdminToken(): string {
  const config = useRuntimeConfig()
  const adminToken = config.directusAdminToken || process.env.DIRECTUS_ADMIN_TOKEN

  if (!adminToken) {
    throw new Error('Directus admin token not configured for system operations')
  }

  return adminToken
}

// Create admin Directus client for system operations
export function createAdminDirectus() {
  const config = useRuntimeConfig()
  const directusUrl = config.public.newsletter?.directus?.url

  if (!directusUrl) {
    throw new Error('Directus URL not configured')
  }

  const adminToken = getAdminToken()

  return createDirectus(directusUrl)
    .with(rest())
    .with(staticToken(adminToken))
}