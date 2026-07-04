import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { assertAuthSecuritySecret } from "@/lib/auth/admin-security-config";

function encryptionKey() {
  return createHash("sha256").update(`admin-totp:${assertAuthSecuritySecret()}`).digest();
}

export function encryptTotpSecret(plain: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptTotpSecret(payload: string) {
  const [ivRaw, tagRaw, dataRaw] = payload.split(".");
  if (!ivRaw || !tagRaw || !dataRaw) {
    throw new Error("Invalid encrypted TOTP secret");
  }
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivRaw, "base64url"));
  decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataRaw, "base64url")),
    decipher.final()
  ]);
  return decrypted.toString("utf8");
}
