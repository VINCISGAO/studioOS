#!/usr/bin/env node
/**
 * Admin login diagnostic — DB, AUTH key, TOTP decrypt, next fix command.
 * Usage: npm run admin:diagnose [-- email]
 */
import { createRequire } from "node:module";
import { createDecipheriv, createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const require = createRequire(import.meta.url);
require("./helpers/load-env.cjs");

const DEFAULT_DEV_SECRET = "studioos-dev-auth-security-secret";
const DEFAULT_EMAIL = (process.env.ADMIN_LOGIN_EMAIL ?? "gwxaxxw@gmail.com").trim().toLowerCase();

function resolveAuthSecret() {
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
  if (!ivRaw || !tagRaw || !dataRaw) throw new Error("Invalid encrypted TOTP payload");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(secret), Buffer.from(ivRaw, "base64url"));
  decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataRaw, "base64url")),
    decipher.final()
  ]).toString("utf8");
}

function maskDatabaseUrl(url) {
  if (!url) return "(none)";
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}${parsed.pathname}`;
  } catch {
    return "(invalid DATABASE_URL)";
  }
}

function printSection(title) {
  console.log(`\n=== ${title} ===`);
}

async function main() {
  const email = (process.argv[2] ?? DEFAULT_EMAIL).trim().toLowerCase();
  const dbUrl =
    process.env.DATABASE_URL?.trim() ||
    process.env.POSTGRES_URL_NON_POOLING?.trim() ||
    process.env.POSTGRES_URL?.trim() ||
    "";
  const authSecret = resolveAuthSecret();
  const authFromEnv = Boolean(process.env.AUTH_SECURITY_SECRET?.trim());
  const hasTotpEnv = Boolean(process.env.ADMIN_TOTP_SECRET?.trim());

  printSection("Environment");
  console.log("Email:", email);
  console.log("DATABASE_URL host:", maskDatabaseUrl(dbUrl));
  console.log("AUTH_SECURITY_SECRET from env:", authFromEnv ? "yes" : "no (using fallback)");
  console.log("AUTH key is dev default:", authSecret === DEFAULT_DEV_SECRET ? "yes" : "no");
  console.log("ADMIN_TOTP_SECRET set:", hasTotpEnv ? "yes" : "no");

  if (!dbUrl) {
    console.error("\n❌ No DATABASE_URL — set it in .env.local (same DB as Next.js dev server).");
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    printSection("Database");
    let totalAdminUsers = 0;
    let activeTotpAdminUsers = 0;
    try {
      totalAdminUsers = await prisma.adminUser.count({ where: { deletedAt: null } });
      activeTotpAdminUsers = await prisma.adminUser.count({
        where: { deletedAt: null, status: "ACTIVE", totpEnabled: true }
      });
      console.log("admin_users (not deleted):", totalAdminUsers);
      console.log("ACTIVE + totpEnabled:", activeTotpAdminUsers);
    } catch (err) {
      console.error("❌ admin_users query failed:", err instanceof Error ? err.message : err);
      console.error("   Run: npm run db:migrate:deploy");
      process.exit(1);
    }

    const profile = await prisma.adminUser.findFirst({ where: { email, deletedAt: null } });
    printSection("Your account");
    if (!profile) {
      console.log("❌ No admin row for", email);
      console.log("\nFix (local):");
      console.log("  npm run bootstrap:admin:restore-master");
      console.log("\nFix (production Neon):");
      console.log("  export AUTH_SECURITY_SECRET=\"<same as Vercel>\"");
      console.log("  export ADMIN_TOTP_SECRET=\"<same as Vercel, if keeping Authenticator>\"");
      console.log("  npm run bootstrap:admin:restore-master:production");
      process.exit(1);
    }

    console.log({
      status: profile.status,
      totpEnabled: profile.totpEnabled,
      isMaster: profile.isMaster,
      failedAttempts: profile.failedAttempts,
      lockedUntil: profile.lockedUntil?.toISOString() ?? null
    });

    if (profile.status !== "ACTIVE" || !profile.totpEnabled || !profile.totpSecretEnc) {
      console.log("\n❌ Account not ready for TOTP login.");
      console.log("Fix: npm run bootstrap:admin -- --master", email);
      process.exit(1);
    }

    if (profile.lockedUntil && profile.lockedUntil > new Date()) {
      console.log("\n❌ Account locked until", profile.lockedUntil.toISOString());
      console.log("Wait or clear lockedUntil in DB / contact ops.");
      process.exit(1);
    }

    printSection("TOTP decrypt");
    try {
      decryptTotpSecret(profile.totpSecretEnc, authSecret);
      console.log("✅ Decrypt OK with current AUTH key.");
    } catch {
      console.log("❌ Decrypt FAILED with current AUTH key.");
      let devDefaultWorks = false;
      if (authSecret !== DEFAULT_DEV_SECRET) {
        try {
          decryptTotpSecret(profile.totpSecretEnc, DEFAULT_DEV_SECRET);
          devDefaultWorks = true;
          console.log("   ⚠️  DB was encrypted with DEV default secret — your .env.local AUTH differs.");
        } catch {
          /* neither matches */
        }
      }
      if (!devDefaultWorks) {
        console.log(
          "   ⚠️  DB was encrypted with a DIFFERENT AUTH_SECURITY_SECRET (likely Vercel production).\n" +
            "   Your .env.local AUTH must match the key used at bootstrap time, OR re-bootstrap with ADMIN_TOTP_SECRET."
        );
      }
      console.log("\nFix:");
      console.log("  1. Vercel → copy AUTH_SECURITY_SECRET + ADMIN_TOTP_SECRET into .env.local");
      console.log("     (If ADMIN_TOTP_SECRET missing on Vercel, see step 2b)");
      console.log("  2a. npm run bootstrap:admin -- --master", email);
      console.log("  2b. No saved TOTP secret? Generate new Authenticator entry:");
      console.log("      node scripts/generate-admin-totp-secret.mjs", email);
      console.log("      → export ADMIN_TOTP_SECRET=... then scan otpauth URI, then step 2a");
      console.log("  3. npm run admin:diagnose --", email);
      console.log("  4. npm run verify:admin-totp --", email, "<6-digit-code>");
      process.exit(1);
    }

    printSection("Login checklist");
    console.log("✅ Schema + admin + decrypt look OK.");
    console.log("\nIf browser login still fails:");
    console.log("  • Open /api/admin/auth-health?email=" + encodeURIComponent(email));
    console.log("  • Confirm databaseHost matches Prisma Studio DATABASE_URL");
    console.log("  • Use a fresh 6-digit code: npm run verify:admin-totp --", email, "<code>");
    console.log("  • Clear stale ?error= — use /admin/login without query params");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
