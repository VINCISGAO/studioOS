/**
 * Production readiness gate — compile + critical module smoke checks
 * Run: npm run production:verify
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, appendFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const FAILURE_LOG = join(ROOT, "verify-failure.log");

/** Large enough for verbose lint output; default execSync buffer (1MB) can throw while exit code is 0. */
const MAX_CMD_BUFFER = 64 * 1024 * 1024;

type Step = { name: string; ok: boolean; detail?: string };

function runCmd(label: string, cmd: string, options?: { retries?: number }): Step {
  const maxAttempts = 1 + (options?.retries ?? 0);
  let lastStep: Step = { name: label, ok: false, detail: "command failed" };

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    if (attempt > 1) {
      console.log(`\n↻ Retrying ${label} (attempt ${attempt}/${maxAttempts})…`);
    }
    lastStep = runCmdOnce(label, cmd);
    if (lastStep.ok) return lastStep;

    const transientBuildRace =
      label === "build" &&
      (lastStep.detail?.includes("PageNotFoundError") ||
        lastStep.detail?.includes("Cannot find module for page"));
    if (!transientBuildRace || attempt >= maxAttempts) {
      return lastStep;
    }
  }

  return lastStep;
}

function runCmdOnce(label: string, cmd: string): Step {
  console.log(`\n▶ Running ${label}…`);
  const started = Date.now();
  const result = spawnSync(cmd, {
    cwd: ROOT,
    shell: true,
    encoding: "utf8",
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: MAX_CMD_BUFFER
  });
  const elapsedSec = ((Date.now() - started) / 1000).toFixed(1);

  if (result.status === 0) {
    console.log(`✅ ${label} (${elapsedSec}s)`);
    return { name: label, ok: true };
  }

  console.log(`❌ ${label} (${elapsedSec}s)`);

  const detail = [
    result.status != null ? `exit: ${result.status}` : null,
    result.signal ? `signal: ${result.signal}` : null,
    result.error?.message,
    result.stdout,
    result.stderr
  ]
    .filter(Boolean)
    .join("\n")
    .slice(-4000);

  if (detail) {
    console.log("\n--- Failure output ---");
    console.log(detail);
    console.log("--- End failure output ---\n");
    appendFileSync(
      FAILURE_LOG,
      `\n=== ${label} ${new Date().toISOString()} ===\n${detail}\n`,
      "utf8"
    );
  }

  return { name: label, ok: false, detail: detail || "command failed" };
}

function runCheck(label: string, check: () => Step): Step {
  console.log(`\n▶ Running ${label}…`);
  const step = check();
  console.log(step.ok ? `✅ ${label}` : `❌ ${label}`);
  return step;
}

function checkMigrationFiles(): Step {
  const supabaseDir = join(ROOT, "supabase", "migrations");
  const paymentMigration = join(supabaseDir, "010_payment_collection.sql");
  if (!existsSync(paymentMigration)) {
    return { name: "migrations.payment_collection", ok: false, detail: "Missing 010_payment_collection.sql" };
  }
  const files = readFileSync(paymentMigration, "utf8");
  const ok =
    files.includes("PaymentCollectionStatus") &&
    files.includes("CreatorPayoutStatus") &&
    files.includes("escrow_payments");
  return {
    name: "migrations.payment_collection",
    ok,
    detail: ok ? "010_payment_collection.sql present" : "Invalid migration content"
  };
}

function checkPrismaSchema(): Step {
  const schema = readFileSync(join(ROOT, "prisma", "schema.prisma"), "utf8");
  const ok =
    schema.includes("enum PaymentCollectionStatus") &&
    schema.includes("enum CreatorPayoutStatus") &&
    schema.includes("paymentStatus") &&
    schema.includes("creatorPayoutStatus");
  return {
    name: "prisma.payment_fields",
    ok,
    detail: ok ? "Escrow payment collection fields defined" : "Missing payment fields in schema"
  };
}

function checkPaymentService(): Step {
  const service = join(ROOT, "features", "payment", "payment-collection.service.ts");
  const webhook = join(ROOT, "features", "payment", "payment-webhook.service.ts");
  const adminApi = join(ROOT, "app", "api", "v1", "admin", "payments", "route.ts");
  const ok = [service, webhook, adminApi].every((path) => existsSync(path));
  return {
    name: "payment.mvp_files",
    ok,
    detail: ok ? "Payment collection + webhook + admin API present" : "Missing payment MVP files"
  };
}

function checkAdminSecrets(): Step {
  const forbiddenPublic = Object.keys(process.env).filter((key) => {
    if (!key.startsWith("NEXT_PUBLIC_")) return false;
    const upper = key.toUpperCase();
    return (
      upper.includes("SECRET") ||
      upper.includes("DATABASE") ||
      upper.includes("PASSWORD") ||
      upper.includes("TOTP")
    );
  });

  if (forbiddenPublic.length > 0) {
    return {
      name: "admin.secrets_not_public",
      ok: false,
      detail: `Remove public env vars: ${forbiddenPublic.join(", ")}`
    };
  }

  if (process.env.NEXT_PUBLIC_DATABASE_URL?.trim()) {
    return {
      name: "admin.secrets_not_public",
      ok: false,
      detail: "NEXT_PUBLIC_DATABASE_URL must not exist — use server-only DATABASE_URL"
    };
  }

  const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  const dedicated = process.env.AUTH_SECURITY_SECRET?.trim() ?? "";

  if (isProd && (dedicated.length < 32 || dedicated === "studioos-dev-auth-security-secret")) {
    return {
      name: "admin.auth_security_secret",
      ok: false,
      detail: "Set AUTH_SECURITY_SECRET explicitly in Vercel (32+ random chars) — not dev default or NEXTAUTH fallback"
    };
  }

  if (isProd && !process.env.DATABASE_URL?.trim()) {
    return {
      name: "admin.database_url",
      ok: false,
      detail: "DATABASE_URL must be set in production (Neon connection string, server-only)"
    };
  }

  if (isProd && !process.env.RESEND_API_KEY?.trim()) {
    return {
      name: "admin.resend_api_key",
      ok: false,
      detail: "RESEND_API_KEY required in production — sub-admin setup links are emailed directly"
    };
  }

  return {
    name: "admin.secrets_config",
    ok: true,
    detail: isProd ? "Production secrets configured" : "Dev secrets check passed"
  };
}

function main() {
  console.log("\nProduction readiness verification");
  console.log("(build alone can take 1–3 minutes — progress prints below)\n");
  if (existsSync(FAILURE_LOG)) {
    appendFileSync(FAILURE_LOG, `\n--- New verify run ${new Date().toISOString()} ---\n`, "utf8");
  }

  const steps: Step[] = [];

  steps.push(runCmd("prisma.generate", "npx prisma generate"));
  steps.push(runCmd("typecheck", "npm run typecheck"));
  steps.push(runCmd("lint", "npm run lint"));
  steps.push(runCmd("build", "npm run build", { retries: 1 }));
  steps.push(runCheck("migrations.payment_collection", checkMigrationFiles));
  steps.push(runCheck("prisma.payment_fields", checkPrismaSchema));
  steps.push(runCheck("payment.mvp_files", checkPaymentService));
  steps.push(runCheck("admin.secrets_config", checkAdminSecrets));

  if (process.env.DATABASE_URL) {
    steps.push(runCmd("prisma.migrate_deploy", "npm run db:migrate:deploy"));
    steps.push(runCmd("payment.verify", "npm run payment:verify"));
    steps.push(runCmd("sprint1.verify", "npm run sprint1:verify"));
  } else {
    console.log("\n▶ Skipping DB checks (DATABASE_URL not set)");
    steps.push({
      name: "db.verify_skipped",
      ok: true,
      detail: "DATABASE_URL not set — skipped DB integration checks"
    });
  }

  console.log("\n--- Summary ---");
  for (const step of steps) {
    if (step.ok) {
      console.log(`✅ ${step.name}${step.detail ? ` — ${step.detail}` : ""}`);
      continue;
    }
    console.log(`❌ ${step.name}`);
    if (step.detail) {
      console.log(step.detail);
    }
  }

  const failedSteps = steps.filter((step) => !step.ok);
  const failed = failedSteps.length;
  if (failed) {
    console.log(`\n${failed} step(s) failed: ${failedSteps.map((step) => step.name).join(", ")}`);
  } else {
    console.log("\nAll production gates passed");
  }
  process.exit(failed ? 1 : 0);
}

main();
