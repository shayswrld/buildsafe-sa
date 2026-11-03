import { SignJWT, jwtVerify } from "jose";

/**
 * Stateless session tokens (HS256 JWT) stored in an httpOnly cookie.
 * Uses `jose` + WebCrypto only, so it runs in both the Edge middleware and Node routes.
 */

export const SESSION_COOKIE = "buildsafe_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type UserRole = "HOMEOWNER" | "WORKER" | "DUAL" | "ADMIN";

export interface SessionClaims {
  /** User id */
  sub: string;
  role: UserRole;
  /** Profile completed? Drives the middleware "finish your profile" gate. */
  pc: boolean;
  /** Token version: must match User.tokenVersion, else the session was revoked. */
  tv: number;
}

const DEV_FALLBACK_SECRET = "dev-only-insecure-secret-change-me-0123456789abcdef";

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET must be set (>= 32 chars) in production.");
    }
    return new TextEncoder().encode(DEV_FALLBACK_SECRET);
  }
  return new TextEncoder().encode(secret);
}

const VALID_ROLES: UserRole[] = ["HOMEOWNER", "WORKER", "DUAL", "ADMIN"];

export async function signSession(claims: SessionClaims): Promise<string> {
  return new SignJWT({ role: claims.role, pc: claims.pc, tv: claims.tv })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySession(token: string | undefined | null): Promise<SessionClaims | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), { algorithms: ["HS256"] });
    if (
      typeof payload.sub !== "string" ||
      typeof payload.role !== "string" ||
      !VALID_ROLES.includes(payload.role as UserRole) ||
      typeof payload.pc !== "boolean" ||
      typeof payload.tv !== "number"
    ) {
      return null;
    }
    return { sub: payload.sub, role: payload.role as UserRole, pc: payload.pc, tv: payload.tv };
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}
