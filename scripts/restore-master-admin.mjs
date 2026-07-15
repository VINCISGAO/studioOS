#!/usr/bin/env node
/**
 * Restore owner master admin after accidental wipe.
 * Uses ADMIN_LOGIN_EMAIL from .env.local, else gwxaxxw@gmail.com.
 * Preserves TOTP when ADMIN_TOTP_SECRET is set (existing Authenticator entry).
 */
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
require("./helpers/load-env.cjs");

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const email = (process.env.ADMIN_LOGIN_EMAIL ?? "gwxaxxw@gmail.com").trim().toLowerCase();

if (!process.env.ADMIN_TOTP_SECRET?.trim()) {
  console.warn(
    "\n⚠️  ADMIN_TOTP_SECRET not set — bootstrap will generate a NEW Authenticator secret.\n" +
      "   Your existing Google Authenticator codes will NOT work until you re-scan or set ADMIN_TOTP_SECRET from Vercel.\n"
  );
}

const result = spawnSync(
  process.execPath,
  ["scripts/bootstrap-admin-profile.mjs", "--", "--master", email],
  { cwd: root, stdio: "inherit", env: process.env }
);

process.exit(result.status ?? 1);
