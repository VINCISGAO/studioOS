import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const EXCLUDE = new Set(
  ["lib/client-session.ts", "lib/creator-session.ts", "features/auth/session-context.ts"].map((p) =>
    path.join(ROOT, p)
  )
);
const DIRS = ["app", "features", "lib"];

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file, out);
    else if (/\.(ts|tsx|js|jsx|mjs)$/.test(entry.name)) out.push(file);
  }
  return out;
}

const reps = [
  [/@\/lib\/client-session/g, "@/features/auth/session-context"],
  [/@\/lib\/creator-session/g, "@/features/auth/session-context"]
];

const changed = [];
for (const dir of DIRS) {
  const base = path.join(ROOT, dir);
  if (!fs.existsSync(base)) continue;
  for (const file of walk(base)) {
    if (EXCLUDE.has(path.normalize(file))) continue;
    const text = fs.readFileSync(file, "utf8");
    let next = text;
    for (const [from, to] of reps) next = next.replace(from, to);
    if (next !== text) {
      fs.writeFileSync(file, next);
      changed.push(path.relative(ROOT, file));
    }
  }
}

console.log(JSON.stringify({ changedCount: changed.length, changed }, null, 2));
