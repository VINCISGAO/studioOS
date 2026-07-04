#!/usr/bin/env node
/**
 * Bootstrap a pre-whitelisted admin with TOTP (one-time ops script).
 * Usage: npm run bootstrap:admin -- [--master] [--rotate-totp] <admin-email>
 *
 * Re-running without --rotate-totp preserves the existing Authenticator secret.
 * Set ADMIN_TOTP_SECRET=<base32> to force a known secret (e.g. after AUTH key change).
 *
 * Production requires: ADMIN_BOOTSTRAP_CONFIRM=yes-i-own-this-server
 * Production requires: AUTH_SECURITY_SECRET (strong random value)
 */
import { createRequire } from "node:module";
import { randomBytes, createHash, createCipheriv, createDecipheriv } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const require = createRequire(import.meta.url);
require("./helpers/load-env.cjs");

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const DEFAULT_DEV_SECRET = "studioos-dev-auth-security-secret";

function isProductionRuntime() {
  return process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
}

function resolveAuthSecuritySecret() {
  return (
    process.env.AUTH_SECURITY_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim() ||
    process.env.AUTH_SECRET?.trim() ||
    DEFAULT_DEV_SECRET
  );
}

function assertAuthSecuritySecret() {
  const secret = resolveAuthSecuritySecret();
  if (isProductionRuntime() && secret === DEFAULT_DEV_SECRET) {
    throw new Error(
      "AUTH_SECURITY_SECRET must be set to a strong random value in production (admin TOTP encryption depends on it)."
    );
  }
  return secret;
}

function isBootstrapAllowedInProduction() {
  return process.env.ADMIN_BOOTSTRAP_CONFIRM === "yes-i-own-this-server";
}

function toBase32(bytes) {
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += BASE32[(value << (5 - bits)) & 31];
  return output;
}

function encryptionKey() {
  return createHash("sha256").update(`admin-totp:${assertAuthSecuritySecret()}`).digest();
}

function encryptTotpSecret(plain) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

function decryptTotpSecret(payload) {
  const [ivRaw, tagRaw, dataRaw] = payload.split(".");
  if (!ivRaw || !tagRaw || !dataRaw) throw new Error("Invalid encrypted TOTP payload");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivRaw, "base64url"));
  decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataRaw, "base64url")),
    decipher.final()
  ]).toString("utf8");
}

function permissionsWithoutBackupCodes(permissions) {
  if (!permissions || typeof permissions !== "object") return {};
  const { backupCodeHashes: _removed, ...rest } = permissions;
  return rest;
}

const BASE32_TOTP_PATTERN = /^[A-Z2-7]+=*$/;

function assertValidAdminTotpSecret(secret, source) {
  const normalized = secret.replace(/\s/g, "").toUpperCase();
  if (normalized.length < 16) {
    console.error(
      `\nInvalid ADMIN_TOTP_SECRET from ${source}: too short (${normalized.length} chars).\n` +
        "Do NOT paste placeholder text like「你的验证器密钥」.\n" +
        "Run: node scripts/generate-admin-totp-secret.mjs gwxaxxw@gmail.com\n" +
        "Then export the ADMIN_TOTP_SECRET=... line from that output.\n"
    );
    process.exit(1);
  }
  if (!BASE32_TOTP_PATTERN.test(normalized)) {
    console.error(
      `\nInvalid ADMIN_TOTP_SECRET from ${source}: must be Base32 (A-Z and 2-7 only).\n` +
        "Run: node scripts/generate-admin-totp-secret.mjs gwxaxxw@gmail.com\n"
    );
    process.exit(1);
  }
  return normalized;
}

async function main() {
  if (isProductionRuntime() && !isBootstrapAllowedInProduction()) {
    console.error(
      "\nRefusing bootstrap in production without ADMIN_BOOTSTRAP_CONFIRM=yes-i-own-this-server\n"
    );
    process.exit(1);
  }

  assertAuthSecuritySecret();

  const argv = process.argv.slice(2);
  const isMaster = argv.includes("--master");
  const rotateTotp = argv.includes("--rotate-totp");
  const email = (argv.find((arg) => arg.includes("@")) ?? process.env.ADMIN_LOGIN_EMAIL ?? "")
    .trim()
    .toLowerCase();
  if (!email) {
    console.error("Usage: npm run bootstrap:admin -- [--master] [--rotate-totp] <admin-email>");
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          role: "ADMIN",
          fullName: "Platform Admin",
          emailVerified: true
        }
      });
      console.log("Created admin user:", user.id);
    } else if (user.role !== "ADMIN" && user.role !== "SUPPORT" && user.role !== "SYSTEM") {
      user = await prisma.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
      console.log("Upgraded user role to ADMIN");
    }

    const existingProfile = await prisma.adminProfile.findUnique({ where: { userId: user.id } });
    const permissions = permissionsWithoutBackupCodes(existingProfile?.permissions);

    let secret;
    let preservedTotp = false;
    const envSecret = process.env.ADMIN_TOTP_SECRET?.replace(/\s/g, "").toUpperCase();
    if (envSecret) {
      secret = assertValidAdminTotpSecret(envSecret, "environment");
      console.log("Using ADMIN_TOTP_SECRET from environment.");
    } else if (!rotateTotp && existingProfile?.totpSecretEnc) {
      try {
        secret = decryptTotpSecret(existingProfile.totpSecretEnc);
        preservedTotp = true;
        console.log("Preserved existing TOTP secret (Authenticator entry unchanged).");
      } catch {
        console.error(
          "\nCannot decrypt existing TOTP secret with current AUTH_SECURITY_SECRET.\n" +
            "Set ADMIN_TOTP_SECRET to the key in your Authenticator app, then re-run bootstrap.\n" +
            "Or use --rotate-totp to generate a new secret (you must re-add Authenticator).\n"
        );
        process.exit(1);
      }
    } else {
      secret = toBase32(randomBytes(20));
      assertValidAdminTotpSecret(secret, "generator");
      console.log(rotateTotp ? "Generated new TOTP secret (--rotate-totp)." : "Generated new TOTP secret.");
    }

    const totpSecretEnc = encryptTotpSecret(secret);
    await prisma.adminProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        isMaster,
        status: "ACTIVE",
        totpSecretEnc,
        totpEnabled: true,
        totpBoundAt: new Date(),
        permissions
      },
      update: {
        isMaster,
        status: "ACTIVE",
        totpSecretEnc,
        totpEnabled: true,
        totpBoundAt: preservedTotp ? existingProfile?.totpBoundAt ?? new Date() : new Date(),
        failedAttempts: 0,
        lockedUntil: null,
        permissions
      }
    });

    if (isMaster) {
      await prisma.adminProfile.updateMany({
        where: { userId: { not: user.id } },
        data: { isMaster: false, status: "SUSPENDED", totpEnabled: false }
      });
      console.log("Master account set. Other admin profiles suspended.");
    }

    const label = encodeURIComponent(`StudioOS Admin:${email}`);
    const params = new URLSearchParams({
      secret,
      issuer: "StudioOS Admin",
      algorithm: "SHA1",
      digits: "6",
      period: "30"
    });

    console.log("\nAdmin profile ready.");
    console.log("Email:", email);
    if (isMaster) console.log("Role: MASTER (only this account can provision other admins)");
    if (isProductionRuntime()) {
      console.log("TOTP secret: not printed in production. Use existing Authenticator or set ADMIN_TOTP_SECRET.");
    } else if (!preservedTotp) {
      console.log("TOTP secret (store securely):", secret);
    } else {
      console.log("TOTP secret: (unchanged — use existing Authenticator entry)");
    }
    if (!isProductionRuntime() && (!preservedTotp || rotateTotp)) {
      console.log("\nGoogle Authenticator URI:\n");
      console.log(`otpauth://totp/${label}?${params.toString()}\n`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  if (String(error?.message ?? "").includes("Unknown argument `isMaster`")) {
    console.error(
      "\nMissing admin master migration. Run:\n  npm run db:migrate:deploy\n  npm run db:generate\n  npm run bootstrap:admin -- --master <email>\n"
    );
  }
  console.error(error);
  process.exit(1);
});
