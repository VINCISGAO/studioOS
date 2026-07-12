import { copyFileSync, existsSync, mkdirSync } from "fs";
import path from "path";

const root = process.cwd();
const source = process.argv[2];
const dest = path.join(root, "public/images/background.png");

if (!source || !existsSync(source)) {
  console.error("Usage: node scripts/sync-home-hero-background.mjs <source-png>");
  process.exit(1);
}

mkdirSync(path.dirname(dest), { recursive: true });
copyFileSync(source, dest);
console.log(`[sync-home-hero-background] ${source} -> ${dest}`);
