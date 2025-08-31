// src/lib/auth.ts
import { SignJWT, jwtVerify } from "jose";

export const AUTH_COOKIE_NAME = "rp_admin";
const DAY = 60 * 60 * 24;

function getJwtSecret(): Uint8Array {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("ADMIN_JWT_SECRET manquant ou trop court (>=32 chars).");
  }
  return new TextEncoder().encode(secret);
}

export type AdminClaims = {
  sub: string;       // username
  role: "admin";
};

export async function signAdminJWT(
  claims: AdminClaims,
  ttlSeconds = 7 * DAY
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return await new SignJWT({ ...claims })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt(now)
    .setExpirationTime(now + ttlSeconds)
    .sign(getJwtSecret());
}

export async function verifyAdminJWT(token: string) {
  const { payload } = await jwtVerify(token, getJwtSecret());
  if (payload.role !== "admin" || typeof payload.sub !== "string") {
    throw new Error("JWT invalide");
  }
  return payload as unknown as AdminClaims & { iat: number; exp: number };
}

export function isProd() {
  return process.env.NODE_ENV === "production";
}
