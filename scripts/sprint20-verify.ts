/**
 * Sprint 20 — OpenAPI contract + SDK
 * Run: npm run sprint20:verify
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

type Check = { name: string; ok: boolean; detail?: string };

function read(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

function main() {
  const checks: Check[] = [];

  checks.push({
    name: "spec.exists",
    ok: existsSync("docs/openapi/openapi.yaml"),
    detail: "docs/openapi/openapi.yaml"
  });

  const yaml = read("docs/openapi/openapi.yaml");
  const requiredPaths = [
    "/api/v1/health:",
    "/api/v1/campaigns:",
    "/api/v1/auth/me:",
    "/api/v1/wallet:",
    "/api/v1/me/membership:",
    "/api/v1/admin/overview:",
    "/api/v1/admin/payments:",
    "/api/v1/webhooks/stripe:",
    "/api/v1/openapi:"
  ];

  for (const path of requiredPaths) {
    checks.push({
      name: `spec.${path.replace(/[^\w]/g, "_")}`,
      ok: yaml.includes(path),
      detail: path
    });
  }

  checks.push({
    name: "route.serve_openapi",
    ok: read("app/api/v1/openapi/route.ts").includes("openapi.yaml"),
    detail: "GET /api/v1/openapi"
  });

  checks.push({
    name: "client.studioos_api",
    ok: read("lib/api-client/studioos-api.ts").includes("StudioOsApiClient"),
    detail: "lib/api-client"
  });

  checks.push({
    name: "script.generate",
    ok: existsSync("scripts/generate-openapi-sdk.mjs"),
    detail: "openapi:generate"
  });

  report(checks);
  process.exit(checks.some((c) => !c.ok) ? 1 : 0);
}

function report(checks: Check[]) {
  console.log("\nSprint 20 — OpenAPI verification\n");
  for (const check of checks) {
    console.log(`${check.ok ? "✅" : "❌"} ${check.name}${check.detail ? ` — ${check.detail}` : ""}`);
  }
  const failed = checks.filter((c) => !c.ok).length;
  console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
}

main();
