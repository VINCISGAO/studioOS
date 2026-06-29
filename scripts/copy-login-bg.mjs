import { copyFileSync, existsSync, mkdirSync } from "fs";
import path from "path";

const root = process.cwd();
const fileName = "2026_6_29__02_06_45-61ae13a4-0fa5-47a1-902c-92fa594e614f.png";
const candidates = [
  path.join(root, "../../.cursor/projects/Users-linkele-Documents-Codex-2026-06-28-build-a-production-ready-mvp-web/assets", fileName),
  path.join(
    process.env.HOME ?? "",
    ".cursor/projects/Users-linkele-Documents-Codex-2026-06-28-build-a-production-ready-mvp-web/assets",
    fileName
  )
];
const destDir = path.join(root, "public/images");
const dest = path.join(destDir, "login-space-bg.png");

mkdirSync(destDir, { recursive: true });

const input = candidates.find((candidate) => existsSync(candidate));
if (!input) {
  console.warn("[copy-login-bg] source image not found, skipping");
  process.exit(0);
}

copyFileSync(input, dest);
console.log("[copy-login-bg] copied to", dest);
