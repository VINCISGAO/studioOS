import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const PROJECT_ROOT = resolve(__dirname, "../../..");

function readPackageName() {
  try {
    const pkg = JSON.parse(readFileSync(join(PROJECT_ROOT, "package.json"), "utf8"));
    return pkg.name ?? "VINCIS";
  } catch {
    return "VINCIS";
  }
}

export const BACKUP_PROJECT_NAME =
  process.env.BACKUP_PROJECT_NAME ?? capitalize(readPackageName());

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Default: sibling folder outside the repo — not served by Next.js */
export const BACKUP_ROOT = resolve(
  process.env.BACKUP_ROOT ?? join(homedir(), "VINCIS-Backups")
);

export const BACKUP_DIRS = {
  project: join(BACKUP_ROOT, "project"),
  database: join(BACKUP_ROOT, "database"),
  logs: join(BACKUP_ROOT, "logs"),
  protected: join(BACKUP_ROOT, ".protected")
};

export const RETENTION_COUNT = Number(process.env.BACKUP_RETENTION_COUNT ?? 30);

/** Paths excluded from project ZIP (relative to project root) */
export const PROJECT_ZIP_EXCLUDES = [
  "node_modules",
  ".git",
  ".next",
  "out",
  "dist",
  "build",
  "coverage",
  ".vercel",
  ".data",
  ".cache",
  ".turbo",
  ".studioos-backups",
  "backups",
  ".DS_Store",
  "*.log",
  ".env",
  ".env.local",
  ".env.production",
  ".env.development",
  "*.sql",
  "*.sql.gz",
  "*.dump",
  "*.zip",
  "*.bak",
  "tsconfig.tsbuildinfo"
];

export function timestamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}`;
}

export function loadEnvFiles() {
  for (const name of [".env.local", ".env"]) {
    const path = join(PROJECT_ROOT, name);
    try {
      const text = readFileSync(path, "utf8");
      for (const line of text.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eq = trimmed.indexOf("=");
        if (eq <= 0) continue;
        const key = trimmed.slice(0, eq).trim();
        let value = trimmed.slice(eq + 1).trim();
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        if (process.env[key] == null) {
          process.env[key] = value;
        }
      }
    } catch {
      // optional
    }
  }
}

export function cloudConfig() {
  return {
    enabled: process.env.BACKUP_CLOUD_ENABLED === "1" || process.env.BACKUP_CLOUD_ENABLED === "true",
    endpoint: process.env.BACKUP_S3_ENDPOINT || process.env.R2_ENDPOINT || undefined,
    region: process.env.BACKUP_S3_REGION || process.env.R2_REGION || "auto",
    bucket: process.env.BACKUP_S3_BUCKET || process.env.R2_BUCKET || "",
    accessKeyId: process.env.BACKUP_S3_ACCESS_KEY || process.env.R2_ACCESS_KEY || "",
    secretAccessKey: process.env.BACKUP_S3_SECRET_KEY || process.env.R2_SECRET_KEY || "",
    projectPrefix: process.env.BACKUP_S3_PROJECT_PREFIX || "backups/project/",
    databasePrefix: process.env.BACKUP_S3_DATABASE_PREFIX || "backups/database/"
  };
}
