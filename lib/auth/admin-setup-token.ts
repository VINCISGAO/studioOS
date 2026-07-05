import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { assertAuthSecuritySecret } from "@/lib/auth/admin-security-config";

const SETUP_TTL_MS = 30 * 60 * 1000;

function sign(payload: string) {
  return createHmac("sha256", assertAuthSecuritySecret()).update(payload).digest("base64url");
}

export function createAdminSetupToken(adminUserId: string) {
  const nonce = randomBytes(16).toString("base64url");
  const expiresAt = Date.now() + SETUP_TTL_MS;
  const body = `${adminUserId}.${expiresAt}.${nonce}`;
  return `${body}.${sign(body)}`;
}

export function verifyAdminSetupToken(token: string): { adminUserId: string } | null {
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [adminUserId, expiresRaw, nonce, signature] = parts;
  if (!adminUserId || !expiresRaw || !nonce || !signature) return null;

  const expiresAt = Number(expiresRaw);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return null;

  const body = `${adminUserId}.${expiresRaw}.${nonce}`;
  const expected = sign(body);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;

  return { adminUserId };
}

export function hashSetupToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
