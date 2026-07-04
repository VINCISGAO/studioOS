import { createHmac, timingSafeEqual } from "node:crypto";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32ToBuffer(input: string): Buffer {
  const normalized = input.replace(/=+$/g, "").toUpperCase();
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (const char of normalized) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) {
      throw new Error("Invalid base32 secret");
    }
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

function safeEqualString(left: string, right: string) {
  const leftBuf = Buffer.from(left);
  const rightBuf = Buffer.from(right);
  return leftBuf.length === rightBuf.length && timingSafeEqual(leftBuf, rightBuf);
}

function hotp(secret: Buffer, counter: number) {
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));

  const digest = createHmac("sha1", secret).update(counterBuffer).digest();
  const offset = digest[digest.length - 1]! & 0x0f;
  const binary =
    ((digest[offset]! & 0x7f) << 24) |
    ((digest[offset + 1]! & 0xff) << 16) |
    ((digest[offset + 2]! & 0xff) << 8) |
    (digest[offset + 3]! & 0xff);

  return String(binary % 1_000_000).padStart(6, "0");
}

/** Verify a 6-digit Google Authenticator / TOTP code (RFC 6238, 30s step). */
export function verifyAdminTotpCode(secret: string, token: string, windowSteps = 2) {
  return findAdminTotpTimeStep(secret, token, windowSteps) !== null;
}

/** Returns the matched TOTP counter step, or null if invalid. */
export function findAdminTotpTimeStep(secret: string, token: string, windowSteps = 2): number | null {
  const normalizedToken = token.replace(/\s/g, "");
  if (!/^\d{6}$/.test(normalizedToken)) {
    return null;
  }

  let key: Buffer;
  try {
    key = base32ToBuffer(secret);
  } catch {
    return null;
  }

  const counter = Math.floor(Date.now() / 1000 / 30);
  for (let offset = -windowSteps; offset <= windowSteps; offset += 1) {
    if (safeEqualString(hotp(key, counter + offset), normalizedToken)) {
      return counter + offset;
    }
  }

  return null;
}

export function buildAdminTotpOtpAuthUri(email: string, secret: string, issuer = "StudioOS Admin") {
  const label = encodeURIComponent(`${issuer}:${email}`);
  const params = new URLSearchParams({
    secret: secret.replace(/\s/g, "").toUpperCase(),
    issuer,
    algorithm: "SHA1",
    digits: "6",
    period: "30"
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}
