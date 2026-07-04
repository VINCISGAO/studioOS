import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { assertAuthSecuritySecret } from "@/lib/auth/admin-security-config";

const SETUP_TTL_MS = 30 * 60 * 1000;

function sign(payload: string) {
  return createHmac("sha256", assertAuthSecuritySecret()).update(payload).digest("base64url");
}

export function createAdminSetupToken(adminProfileId: string) {
  const nonce = randomBytes(16).toString("base64url");
  const expiresAt = Date.now() + SETUP_TTL_MS;
  const body = `${adminProfileId}.${expiresAt}.${nonce}`;
  return `${body}.${sign(body)}`;
}

export function verifyAdminSetupToken(token: string): { adminProfileId: string } | null {
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [adminProfileId, expiresRaw, nonce, signature] = parts;
  if (!adminProfileId || !expiresRaw || !nonce || !signature) return null;

  const expiresAt = Number(expiresRaw);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return null;

  const body = `${adminProfileId}.${expiresRaw}.${nonce}`;
  const expected = sign(body);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;

  return { adminProfileId };
}

export function hashSetupToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
