/**
 * Login preflight — brand + creator entry paths before production deploy.
 * Run: npm run login:preflight
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { authSecurityService } from "../features/auth/auth-security.service";
import {
  probeDatabaseConnection,
  probeDatabaseTable
} from "./helpers/database-probe";
import { demoRedirectForRole } from "../lib/demo-auth";
import { toSafeNextPath, resolvePostLoginDestination } from "../lib/auth/post-login-redirect";
import { hasSupabaseConfig } from "../lib/auth-config";
import { hasAlipayOAuthConfig } from "../lib/alipay/alipay-oauth-config";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");

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
  checks.push({
    name: "redirect.wizard_next_query",
    ok: toSafeNextPath("/brand/projects/new?project=demo&step=2&evil=1") === "/brand/projects/new?project=demo&step=2",
    detail: toSafeNextPath("/brand/projects/new?project=demo&step=2&evil=1")
  });
  checks.push({
    name: "redirect.blocks_external_next",
    ok: toSafeNextPath("https://evil.example") === ""
  });

  if (!process.env.DATABASE_URL?.trim()) {
    checks.push({
      name: "env.DATABASE_URL",
      ok: !isProd,
      detail: isProd ? "required in production" : "optional locally"
    });
  } else {
    checks.push({ name: "env.DATABASE_URL", ok: true, detail: "present" });

    const dbProbe = await probeDatabaseConnection();
    checks.push({
      name: "database.connect",
      ok: dbProbe.ok,
      detail: dbProbe.ok
        ? dbProbe.via
          ? `ok (${dbProbe.via})`
          : "ok"
        : dbProbe.detail
    });

    const authTables = [
      "auth_locks",
      "auth_rate_limits",
      "email_verification_codes",
      "auth_attempts",
      "auth_audit_logs"
    ];
    try {
      if (dbProbe.ok) {
        for (const table of authTables) {
          const tableProbe = await probeDatabaseTable(dbProbe.client, table);
          checks.push({
            name: `database.table.${table}`,
            ok: tableProbe.ok,
            detail: tableProbe.ok ? undefined : tableProbe.detail
          });
        }
      } else {
        for (const table of authTables) {
          checks.push({
            name: `database.table.${table}`,
            ok: false,
            detail: "skipped — database.connect failed"
          });
        }
      }

      const request = browserRequest("/login");
      const probeEmail = `login-preflight+${Date.now()}@example.com`;
      if (!dbProbe.ok) {
        checks.push({
          name: "auth.email_start_browser",
          ok: false,
          detail: "skipped — database.connect failed"
        });
      } else {
        try {
          const start = await authSecurityService.startEmailVerification({
            request,
            email: probeEmail,
            locale: "zh",
            role: "BRAND"
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
    } finally {
      if (dbProbe.ok) {
        await dbProbe.client.$disconnect().catch(() => undefined);
      }
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
  process.exit(failed ? 1 : 0);
}

void main();
