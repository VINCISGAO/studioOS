import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
try {
  execSync("npx prisma generate", { cwd: root, stdio: "pipe" });
  const out = execSync("npx tsc --noEmit 2>&1", { cwd: root, encoding: "utf8" });
  writeFileSync(join(root, "typecheck-errors.txt"), out || "OK\n");
  process.exit(out.includes("error TS") ? 1 : 0);
} catch (error) {
  const err = error;
  const text =
    (err && typeof err === "object" && "stdout" in err ? String(err.stdout) : "") +
    (err && typeof err === "object" && "stderr" in err ? String(err.stderr) : "") +
    (err instanceof Error ? err.message : String(err));
  writeFileSync(join(root, "typecheck-errors.txt"), text);
  process.exit(1);
}
