/** Load DATABASE_URL from .env.local / .env for TypeScript scripts (Next.js uses .env.local). */
const fs = require("node:fs");
const path = require("node:path");

const DEFAULT_DATABASE_URL = "postgresql://studioos:studioos@localhost:5432/studioos";

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

const root = path.join(__dirname, "..", "..");
loadEnvFile(path.join(root, ".env.local"));
loadEnvFile(path.join(root, ".env"));

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = DEFAULT_DATABASE_URL;
}

if (!process.env.DIRECT_DATABASE_URL) {
  const dbUrl = process.env.DATABASE_URL ?? "";
  process.env.DIRECT_DATABASE_URL = dbUrl.includes("-pooler.")
    ? dbUrl.replace("-pooler.", ".")
    : dbUrl;
}

function appendQueryParam(url, param) {
  const key = param.split("=")[0];
  if (url.includes(`${key}=`)) return url;
  return url.includes("?") ? `${url}&${param}` : `${url}?${param}`;
}

process.env.DIRECT_DATABASE_URL = appendQueryParam(
  process.env.DIRECT_DATABASE_URL,
  "connect_timeout=30"
);

module.exports = { DEFAULT_DATABASE_URL, loadEnvFile };
