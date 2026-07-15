#!/usr/bin/env node
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const log = join(root, "scripts/.git-homepage-status.txt");

function run(cmd) {
  try {
    return execSync(cmd, { cwd: root, encoding: "utf8" });
  } catch (e) {
    return (e.stdout || "") + (e.stderr || "") + `\nexit ${e.status}\n`;
  }
}

const paths = [
  "app/page.tsx",
  "app/globals.css",
  "app/layout.tsx",
  "components/marketing",
  "components/language-switcher.tsx",
  "lib/marketing",
].join(" ");

let out = "";
out += run("git fetch origin main 2>&1 || true");
out += run(`git status -sb -- ${paths}`);
out += "\n---DIFF---\n";
out += run(`git diff -- ${paths}\n`);
out += "\n---CHECKOUT origin/main---\n";
out += run(`git checkout origin/main -- ${paths}\n`);
out += "\n---AFTER---\n";
out += run(`git status -sb -- ${paths}\n`);

writeFileSync(log, out);
console.log("wrote", log);
