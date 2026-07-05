#!/usr/bin/env node
/** One-off diagnostic: verify admin TOTP decrypt + current code for an email. */
import { createRequire } from "node:module";
import { createDecipheriv, createHash, createHmac } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const require = createRequire(import.meta.url);
require("./helpers/load-env.cjs");

const DEFAULT_DEV_SECRET = "studioos-dev-auth-security-secret";
const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function resolveSecret() {
  return (
    process.env.AUTH_SECURITY_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim() ||
    process.env.AUTH_SECRET?.trim() ||
    DEFAULT_DEV_SECRET
  );
}

function encryptionKey(secret) {
  return createHash("sha256").update(`admin-totp:${secret}`).digest();
}

function decryptTotpSecret(payload, secret) {
  const [ivRaw, tagRaw, dataRaw] = payload.split(".");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(secret), Buffer.from(ivRaw, "base64url"));
  decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataRaw, "base64url")),
    decipher.final()
  ]).toString("utf8");
}

function base32ToBuffer(input) {
  const normalized = input.replace(/=+$/g, "").toUpperCase();
  let bits = 0;
  let value = 0;
  const bytes = [];
  for (const char of normalized) {
    const index = BASE32.indexOf(char);
    if (index === -1) throw new Error("Invalid base32");
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

function hotp(secretBuf, counter) {
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac("sha1", secretBuf).update(counterBuffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);
  return String(binary % 1_000_000).padStart(6, "0");
}

async function main() {
  const email = process.argv[2]?.trim().toLowerCase() ?? "gwxaxxw@gmail.com";
  const codeArg = process.argv[3]?.replace(/\s/g, "") ?? "";
  const prisma = new PrismaClient();
  try {
    const profile = await prisma.adminUser.findFirst({
      where: { email, deletedAt: null }
    });
    if (!profile) {
      console.error("No admin user for", email);
      process.exit(1);
    }
    console.log("Profile:", {
      id: profile.id,
      status: profile.status,
      totpEnabled: profile.totpEnabled,
      isMaster: profile.isMaster,
      failedAttempts: profile.failedAttempts,
      lockedUntil: profile.lockedUntil,
      encPrefix: profile.totpSecretEnc?.slice(0, 20)
    });

    const secretUsed = resolveSecret();
    const authMeta = {
      hasAuthSecuritySecret: Boolean(process.env.AUTH_SECURITY_SECRET?.trim()),
      hasNextAuthSecret: Boolean(process.env.NEXTAUTH_SECRET?.trim()),
      usingDefault: secretUsed === DEFAULT_DEV_SECRET
    };
    console.log("Resolved AUTH key source:", authMeta);

    if (authMeta.usingDefault) {
      console.warn(
        "\n⚠️  AUTH_SECURITY_SECRET not set locally — DB TOTP was likely encrypted with dev default.\n" +
          "   Production Vercel requires a real AUTH_SECURITY_SECRET. Set it in .env.local and Vercel,\n" +
          "   then re-run: npm run bootstrap:admin -- --master " +
          email +
          "\n"
      );
    }

    let plain;
    try {
      plain = decryptTotpSecret(profile.totpSecretEnc, secretUsed);
      console.log("Decrypt OK. TOTP secret length:", plain.length);
    } catch (err) {
      console.error("Decrypt FAILED with current env secret:", err.message);
      if (secretUsed !== DEFAULT_DEV_SECRET) {
        try {
          plain = decryptTotpSecret(profile.totpSecretEnc, DEFAULT_DEV_SECRET);
          console.log("\n❌ DB was encrypted with DEV default secret, but .env.local AUTH differs.");
          console.log("   Fix: re-bootstrap after AUTH_SECURITY_SECRET is final:\n");
          console.log("   export ADMIN_TOTP_SECRET=<your authenticator base32>");
          console.log("   npm run bootstrap:admin -- --master " + email + "\n");
        } catch {
          console.error("Also failed with default dev secret — re-bootstrap required.");
        }
      }
      process.exit(1);
    }

    const key = base32ToBuffer(plain);
    const counter = Math.floor(Date.now() / 1000 / 30);
    const codes = {
      prev: hotp(key, counter - 1),
      now: hotp(key, counter),
      next: hotp(key, counter + 1)
    };
    console.log("Expected codes now:", codes);

    if (/^\d{6}$/.test(codeArg)) {
      const match =
        codeArg === codes.now || codeArg === codes.prev || codeArg === codes.next;
      console.log(match ? "\n✅ Code matches — login should work if Vercel uses the SAME AUTH_SECURITY_SECRET." : "\n❌ Code does NOT match — re-scan otpauth URI or re-bootstrap ADMIN_TOTP_SECRET.");
    } else if (codeArg) {
      console.warn("\n⚠️  Pass a 6-digit code as 3rd argument to verify a specific attempt.");
    }

    console.log(
      "\nProduction checklist:\n" +
        "  1. Vercel → AUTH_SECURITY_SECRET = same value as .env.local (Value field only, no KEY=)\n" +
        "  2. Redeploy after saving env\n" +
        "  3. Use a fresh 6-digit code (never reuse within 2 minutes)\n"
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
