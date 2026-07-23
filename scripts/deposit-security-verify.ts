#!/usr/bin/env tsx
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  assertDemoDepositPaymentsAllowed,
  isDemoDepositPaymentsEnabled
} from "../lib/deposit/deposit-env";

function read(relPath: string) {
  return readFileSync(join(process.cwd(), relPath), "utf8");
}

function walkSourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next") continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walkSourceFiles(full, acc);
    } else if (/\.(ts|tsx)$/.test(entry)) {
      acc.push(full);
    }
  }
  return acc;
}

function productionSourceFiles() {
  return ["app", "features", "lib"].flatMap((dir) => walkSourceFiles(dir));
}

function withNodeEnv<T>(value: string | undefined, run: () => T): T {
  const env = process.env as Record<string, string | undefined>;
  const previous = env.NODE_ENV;
  if (value === undefined) {
    delete env.NODE_ENV;
  } else {
    env.NODE_ENV = value;
  }
  try {
    return run();
  } finally {
    if (previous === undefined) {
      delete env.NODE_ENV;
    } else {
      env.NODE_ENV = previous;
    }
  }
}

const checks: Array<{ name: string; ok: boolean; detail?: string }> = [];

checks.push({
  name: "deposit-service.no-json-store",
  ok: !read("lib/studioos/deposit-service.ts").includes("deposit-store.json")
});

checks.push({
  name: "deposit-service.uses-prisma-facade",
  ok: read("lib/studioos/deposit-service.ts").includes("assertProductionDepositDatabase")
});

checks.push({
  name: "deposit-service.no-fs-read",
  ok: !read("lib/studioos/deposit-service.ts").includes("readFile")
});

checks.push({
  name: "demo-module.fail-closed",
  ok: read("lib/deposit/demo-deposit-payments.ts").includes("assertDemoDepositPaymentsAllowed")
});

checks.push({
  name: "demo-module.dynamic-import-only",
  ok:
    read("features/deposit/deposit.service.ts").includes('await import("@/lib/deposit/demo-deposit-payments")') &&
    !read("lib/studioos/deposit-service.ts").includes("demo-deposit-payments")
});

checks.push({
  name: "reconcile.service.ownership-404",
  ok:
    read("features/deposit/deposit-reconcile.service.ts").includes('appError("NOT_FOUND"') &&
    read("features/deposit/deposit-reconcile.service.ts").includes("account.userId !== input.authenticatedUserId")
});

checks.push({
  name: "reconcile.service.metadata-cross-check",
  ok:
    read("features/deposit/deposit-reconcile.service.ts").includes("metadataIdentity.userId") &&
    read("features/deposit/deposit-reconcile.service.ts").includes("payment.amountMinor !== amountMinor")
});

checks.push({
  name: "repository.amount-minor",
  ok: read("features/deposit/deposit.repository.ts").includes("amountMinor")
});

checks.push({
  name: "repository.prisma-transaction",
  ok: read("features/deposit/deposit.repository.ts").includes("prisma.$transaction")
});

checks.push({
  name: "repository.deposit-ledger-entry",
  ok:
    read("features/deposit/deposit.repository.ts").includes("creatorDepositLedgerEntry.create") &&
    read("features/deposit/deposit.repository.ts").includes("DEPOSIT_CREDIT")
});

checks.push({
  name: "schema.deposit-ledger-unique",
  ok: read("prisma/schema.prisma").includes("@@unique([provider, externalReferenceId, entryType])")
});

const ledgerModelBlock =
  read("prisma/schema.prisma").split("model CreatorDepositLedgerEntry")[1]?.split("\nmodel ")[0] ?? "";

checks.push({
  name: "schema.deposit-ledger-no-updated-at",
  ok: ledgerModelBlock.length > 0 && !ledgerModelBlock.includes("updatedAt")
});

checks.push({
  name: "schema.deposit-ledger-audit-fields",
  ok:
    ledgerModelBlock.includes("actorUserId") &&
    ledgerModelBlock.includes("reason              String?")
});

checks.push({
  name: "schema.deposit-ledger-entry-types",
  ok:
    read("prisma/schema.prisma").includes("DEPOSIT_REFUND") &&
    read("prisma/schema.prisma").includes("MANUAL_ADJUSTMENT")
});

const forbiddenLedgerMutations = [
  "creatorDepositLedgerEntry.update",
  "creatorDepositLedgerEntry.delete",
  "creatorDepositLedgerEntry.updateMany",
  "creatorDepositLedgerEntry.deleteMany"
];

for (const pattern of forbiddenLedgerMutations) {
  const hits = productionSourceFiles().filter((file) => readFileSync(file, "utf8").includes(pattern));
  checks.push({
    name: `ledger.forbidden.${pattern.split(".").pop()}`,
    ok: hits.length === 0,
    detail: hits.length ? hits.map((file) => file.replace(`${process.cwd()}/`, "")).join(", ") : undefined
  });
}

checks.push({
  name: "production-ready.includes-deposit-security",
  ok: read("scripts/production-ready-verify.ts").includes("deposit:security:verify")
});

checks.push({
  name: "production-ready.includes-deposit-reconcile",
  ok: read("scripts/production-ready-verify.ts").includes("deposit:reconcile:verify")
});

checks.push({
  name: "repository.unique-stripe-intent",
  ok: read("prisma/schema.prisma").includes("stripePaymentIntentId String?                     @unique")
});

checks.push({
  name: "stripe-intent.metadata.user-id",
  ok: read("features/payment/stripe-embedded-payment.service.ts").includes("creator_id: user.id")
});

checks.push({
  name: "reconcile-api.creator-role",
  ok:
    read("app/api/v1/payments/stripe/deposit/reconcile/route.ts").includes('user.role !== "CREATOR"') &&
    read("app/api/v1/payments/stripe/deposit/reconcile/route.ts").includes("requireApiUser")
});

checks.push({
  name: "env.example.demo-payments-false",
  ok: read(".env.example").includes("ENABLE_DEMO_PAYMENTS=false")
});

checks.push({
  name: "demo-disabled-by-default",
  ok: isDemoDepositPaymentsEnabled() === false
});

let demoThrows = false;
try {
  assertDemoDepositPaymentsAllowed("deposit-security-verify");
} catch {
  demoThrows = true;
}
checks.push({
  name: "demo.assert-throws-without-flag",
  ok: demoThrows
});

let demoBlockedInProduction = false;
withNodeEnv("production", () => {
  try {
    assertDemoDepositPaymentsAllowed("deposit-security-verify-production");
  } catch {
    demoBlockedInProduction = true;
  }
});
checks.push({
  name: "demo.blocked-in-production",
  ok: demoBlockedInProduction
});

const passed = checks.filter((item) => item.ok).length;
const failed = checks.filter((item) => !item.ok);

for (const item of checks) {
  console.log(item.ok ? "PASS" : "FAIL", item.name, item.detail ?? "");
}

console.log(
  JSON.stringify(
    {
      suite: "deposit-security-verify",
      total: checks.length,
      passed,
      failed: failed.length,
      skipped: 0
    },
    null,
    2
  )
);

if (failed.length) {
  process.exit(1);
}

console.log("deposit-security-verify: all checks passed");
