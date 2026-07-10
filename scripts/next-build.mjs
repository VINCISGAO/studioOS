import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const MAX_ATTEMPTS = 2;

function ensurePagesManifest() {
  const serverDir = join(ROOT, ".next", "server");
  const manifestPath = join(serverDir, "pages-manifest.json");
  if (existsSync(manifestPath)) return;

  mkdirSync(serverDir, { recursive: true });
  writeFileSync(manifestPath, "{}\n", "utf8");
  console.log("[next-build] wrote fallback pages-manifest.json");
}

function runNextBuild() {
  return spawnSync("next", ["build"], {
    cwd: ROOT,
    stdio: "inherit",
    env: {
      ...process.env,
      NEXT_PRIVATE_WORKER_THREADS: "false"
    }
  });
}

for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
  if (attempt > 1) {
    console.log(`[next-build] retrying production build (${attempt}/${MAX_ATTEMPTS})…`);
  }

  const result = runNextBuild();
  if (result.status === 0) {
    ensurePagesManifest();
    process.exit(0);
  }

  if (attempt >= MAX_ATTEMPTS) {
    process.exit(result.status ?? 1);
  }
}
