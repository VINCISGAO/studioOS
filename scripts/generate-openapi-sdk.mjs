#!/usr/bin/env node
/**
 * Generate / refresh API client from OpenAPI spec.
 * Usage: npm run openapi:generate
 */
import { readFileSync, writeFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const specPath = join(ROOT, "docs/openapi/openapi.yaml");
const clientPath = join(ROOT, "lib/api-client/studioos-api.ts");

const yaml = readFileSync(specPath, "utf8");
const pathMatches = [...yaml.matchAll(/^\s+(\/api\/v1\/[^\s:]+):/gm)].map((m) => m[1]);
const uniquePaths = [...new Set(pathMatches)];

console.log(`OpenAPI spec: ${uniquePaths.length} paths documented`);

const existing = readFileSync(clientPath, "utf8");
if (!existing.includes("StudioOsApiClient")) {
  console.error("Client template missing at lib/api-client/studioos-api.ts");
  process.exit(1);
}

const stamp = new Date().toISOString();
const metaPath = join(ROOT, "lib/api-client/openapi-meta.json");
writeFileSync(
  metaPath,
  JSON.stringify({ generatedAt: stamp, pathCount: uniquePaths.length, paths: uniquePaths }, null, 2)
);

console.log(`Updated ${metaPath}`);
console.log("Client: lib/api-client/studioos-api.ts (hand-maintained typed wrapper)");

try {
  statSync(specPath);
  console.log("OK");
} catch {
  process.exit(1);
}
