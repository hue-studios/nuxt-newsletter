// src/runtime/utils/security/authentication.ts
import crypto from "crypto";

/**
 * Authentication and token utilities
 */

// Generate secure random tokens
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

export function generateApiKey(prefix: string = "nl"): string {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(16).toString("hex");
  return `${prefix}_${timestamp}_${random}`;
}

// Password hashing (for admin features)
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  const bcrypt = await import("bcrypt");
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const bcrypt = await import("bcrypt");
  return bcrypt.compare(password, hash);
}

// JWT-like token creation and verification
export function createJWT(
  payload: any,
  secret: string,
  expiresIn: string = "24h"
): string {
  const header = {
    alg: "HS256",
    typ: "JWT",
  };

  const now = Math.floor(Date.now() / 1000);
  const expiry = now + parseTimeToSeconds(expiresIn);

  const jwtPayload = {
    ...payload,
    iat: now,
    exp: expiry,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(jwtPayload));
  const signature = createSignature(
    `${encodedHeader}.${encodedPayload}`,
    secret
  );

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifyJWT(token: string, secret: string): any {
  try {
    const [encodedHeader, encodedPayload, signature] = token.split(".");

    if (!encodedHeader || !encodedPayload || !signature) {
      throw new Error("Invalid token format");
    }

    // Verify signature
    const expectedSignature = createSignature(
      `${encodedHeader}.${encodedPayload}`,
      secret
    );
    if (signature !== expectedSignature) {
      throw new Error("Invalid token signature");
    }

    // Decode payload
    const payload = JSON.parse(base64UrlDecode(encodedPayload));

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error("Token expired");
    }

    return payload;
  } catch (error) {
    throw new Error(`Invalid token: ${error.message}`);
  }
}

// Helper functions
function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function base64UrlDecode(str: string): string {
  str += "=".repeat((4 - (str.length % 4)) % 4);
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(str, "base64").toString();
}

function createSignature(data: string, secret: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function parseTimeToSeconds(time: string): number {
  const units: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
    w: 604800,
  };

  const match = time.match(/^(\d+)([smhdw])$/);
  if (!match) {
    throw new Error("Invalid time format");
  }

  const [, amount, unit] = match;
  return parseInt(amount) * units[unit];
}

// Rate limiting helpers
export class RateLimiter {
  private requests = new Map<string, { count: number; resetTime: number }>();

  constructor(
    private maxRequests: number = 100,
    private windowMs: number = 15 * 60 * 1000 // 15 minutes
  ) {}

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const record = this.requests.get(identifier);

    if (!record || now > record.resetTime) {
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return true;
    }

    if (record.count >= this.maxRequests) {
      return false;
    }

    record.count++;
    return true;
  }

  getRemainingRequests(identifier: string): number {
    const record = this.requests.get(identifier);
    if (!record || Date.now() > record.resetTime) {
      return this.maxRequests;
    }
    return Math.max(0, this.maxRequests - record.count);
  }

  getResetTime(identifier: string): number | null {
    const record = this.requests.get(identifier);
    if (!record || Date.now() > record.resetTime) {
      return null;
    }
    return record.resetTime;
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.requests.entries()) {
      if (now > record.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

// CSRF protection
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function verifyCSRFToken(token: string, sessionToken: string): boolean {
  return crypto.timingSafeEqual(
    Buffer.from(token, "hex"),
    Buffer.from(sessionToken, "hex")
  );
}
