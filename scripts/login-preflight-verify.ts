/**
 * Login preflight — brand + creator entry paths before production deploy.
 * Run: npm run login:preflight
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { authSecurityService } from "../features/auth/auth-security.service";
import { demoRedirectForRole } from "../lib/demo-auth";
import { resolvePostLoginDestination } from "../lib/auth/post-login-redirect";
import { hasSupabaseConfig } from "../lib/auth-config";
import { hasAlipayOAuthConfig } from "../lib/alipay/alipay-oauth-config";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const prisma = new PrismaClient();

type Check = { name: string; ok: boolean; detail?: string };

function report(checks: Check[]) {
  console.log("\nLogin preflight verify\n");
  for (const check of checks) {
    console.log(`${check.ok ? "✅" : "❌"} ${check.name}${check.detail ? ` — ${check.detail}` : ""}`);
  }
  const failed = checks.filter((item) => !item.ok).length;
  console.log(failed ? `\n${failed} check(s) failed` : "\nLogin preflight ready");
  return failed;
}

function browserRequest(pathname: string) {
  const origin = process.env.VINCIS_APP_URL?.trim() || "https://vincis.app";
  return new Request(`${origin}${pathname}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin,
      referer: `${origin}/login`,
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "x-forwarded-for": "203.0.113.10",
      "x-forwarded-proto": "https",
      "x-forwarded-host": new URL(origin).host
    }
  });
}

async function main() {
  const checks: Check[] = [];
  const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";

  checks.push({
    name: "files.login_page",
    ok: existsSync(join(ROOT, "app", "login", "page.tsx")),
    detail: "/login page"
  });
  checks.push({
    name: "files.email_start_api",
    ok: existsSync(join(ROOT, "app", "api", "auth", "email", "start", "route.ts")),
    detail: "POST /api/auth/email/start"
  });
  checks.push({
    name: "files.continue_api",
    ok: existsSync(join(ROOT, "app", "api", "auth", "continue", "route.ts")),
    detail: "POST /api/auth/continue"
  });
  checks.push({
    name: "files.oauth_google",
    ok: existsSync(join(ROOT, "app", "api", "auth", "oauth", "[provider]", "route.ts")),
    detail: "GET /api/auth/oauth/google"
  });
  checks.push({
    name: "files.oauth_callback",
    ok: existsSync(join(ROOT, "app", "auth", "callback", "route.ts")),
    detail: "/auth/callback"
  });
  checks.push({
    name: "files.alipay_callback",
    ok: existsSync(join(ROOT, "app", "auth", "alipay", "callback", "route.ts")),
    detail: "/auth/alipay/callback"
  });
  checks.push({
    name: "files.brand_workspace",
    ok: existsSync(join(ROOT, "app", "brand", "page.tsx")),
    detail: "/brand"
  });
  checks.push({
    name: "files.creator_workspace",
    ok: existsSync(join(ROOT, "app", "studio", "page.tsx")) || existsSync(join(ROOT, "app", "creator", "page.tsx")),
    detail: "/studio or /creator"
  });

  checks.push({
    name: "redirect.brand",
    ok: resolvePostLoginDestination({ role: "client" }, "", "zh").includes("/brand"),
    detail: resolvePostLoginDestination({ role: "client" }, "", "zh")
  });
  checks.push({
    name: "redirect.creator",
    ok: resolvePostLoginDestination({ role: "creator" }, "", "zh").includes("/studio"),
    detail: resolvePostLoginDestination({ role: "creator" }, "", "zh")
  });
  checks.push({
    name: "redirect.demo_role_map",
    ok: demoRedirectForRole("client") === "/brand" && demoRedirectForRole("creator") === "/studio",
    detail: "client→/brand, creator→/studio"
  });

  if (!process.env.DATABASE_URL?.trim()) {
    checks.push({
      name: "env.DATABASE_URL",
      ok: !isProd,
      detail: isProd ? "required in production" : "optional locally"
    });
  } else {
    checks.push({ name: "env.DATABASE_URL", ok: true, detail: "present" });

    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.push({ name: "database.connect", ok: true });
    } catch (error) {
      checks.push({
        name: "database.connect",
        ok: false,
        detail: error instanceof Error ? error.message : String(error)
      });
    }

    const authTables = [
      "auth_locks",
      "auth_rate_limits",
      "email_verification_codes",
      "auth_attempts",
      "auth_audit_logs"
    ];
    for (const table of authTables) {
      try {
        await prisma.$queryRawUnsafe(`SELECT 1 FROM "${table}" LIMIT 1`);
        checks.push({ name: `database.table.${table}`, ok: true });
      } catch (error) {
        checks.push({
          name: `database.table.${table}`,
          ok: false,
          detail: error instanceof Error ? error.message : "missing — run npm run db:migrate:deploy"
        });
      }
    }

    const request = browserRequest("/login");
    const probeEmail = `login-preflight+${Date.now()}@example.com`;
    try {
      const start = await authSecurityService.startEmailVerification({
        request,
        email: probeEmail,
        locale: "zh"
      });
      const securityOk = start.ok || !("turnstileRequired" in start && start.turnstileRequired);
      checks.push({
        name: "auth.email_start_browser",
        ok: securityOk,
        detail: start.ok
          ? "verification started"
          : "error" in start
            ? start.error
            : "blocked by security"
      });
    } catch (error) {
      checks.push({
        name: "auth.email_start_browser",
        ok: false,
        detail: error instanceof Error ? error.message : String(error)
      });
    }
  }

  checks.push({
    name: "env.RESEND_API_KEY",
    ok: Boolean(process.env.RESEND_API_KEY?.trim()) || !isProd,
    detail: process.env.RESEND_API_KEY?.trim() ? "present" : isProd ? "required for email login" : "optional locally"
  });

  const authSecret = process.env.AUTH_SECURITY_SECRET?.trim() ?? "";
  checks.push({
    name: "env.AUTH_SECURITY_SECRET",
    ok:
      !isProd ||
      (authSecret.length >= 32 && authSecret !== "studioos-dev-auth-security-secret"),
    detail: isProd ? (authSecret ? "present" : "missing") : "dev OK"
  });

  checks.push({
    name: "env.supabase_google",
    ok: hasSupabaseConfig() || !isProd,
    detail: hasSupabaseConfig()
      ? "Google OAuth configured"
      : isProd
        ? "NEXT_PUBLIC_SUPABASE_* missing"
        : "optional locally"
  });

  checks.push({
    name: "env.alipay",
    ok: hasAlipayOAuthConfig() || !isProd,
    detail: hasAlipayOAuthConfig()
      ? "Alipay OAuth configured"
      : isProd
        ? "VINCIS_ALIPAY_* missing"
        : "optional locally"
  });

  const turnstileConfigured = Boolean(
    process.env.TURNSTILE_SECRET_KEY?.trim() && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim()
  );
  checks.push({
    name: "turnstile.widget_absent_ok",
    ok: true,
    detail: turnstileConfigured
      ? "Turnstile keys set — browser requests bypass widget until UI added"
      : "Turnstile not configured"
  });

  const failed = report(checks);
  await prisma.$disconnect();
  process.exit(failed ? 1 : 0);
}

void main();
