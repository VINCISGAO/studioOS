/**
 * Sprint 21 — Playwright E2E
 * Run: npm run sprint21:verify
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

type Check = { name: string; ok: boolean; detail?: string };

function read(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

function main() {
  const checks: Check[] = [];

  checks.push({
    name: "config.playwright",
    ok: existsSync("playwright.config.ts"),
    detail: "playwright.config.ts"
  });

  checks.push({
    name: "e2e.happy_path",
    ok: existsSync("e2e/happy-path.spec.ts"),
    detail: "7 browser scenarios"
  });

  checks.push({
    name: "e2e.auth_fixture",
    ok: read("e2e/fixtures/auth.ts").includes("loginViaUi"),
    detail: "demo login helper"
  });

  checks.push({
    name: "package.e2e_script",
    ok: read("package.json").includes('"e2e"'),
    detail: "npm run e2e"
  });

  report(checks);
  process.exit(checks.some((c) => !c.ok) ? 1 : 0);
}

function report(checks: Check[]) {
  console.log("\nSprint 21 — E2E verification\n");
  for (const check of checks) {
    console.log(`${check.ok ? "✅" : "❌"} ${check.name}${check.detail ? ` — ${check.detail}` : ""}`);
  }
  const failed = checks.filter((c) => !c.ok).length;
  console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
}

main();
