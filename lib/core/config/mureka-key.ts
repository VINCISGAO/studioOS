import "server-only";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

let cachedApiKey: string | null = null;

function parseEnvValue(raw: string) {
  let value = raw.trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  return value.trim();
}

function readFromEnvLocal(key: string) {
  const filePath = resolve(process.cwd(), ".env.local");
  if (!existsSync(filePath)) return "";

  const content = readFileSync(filePath, "utf8").replace(/^\uFEFF/u, "");
  for (const rawLine of content.split(/\r?\n/u)) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const lineKey = trimmed.slice(0, eq).trim();
    if (lineKey !== key) continue;
    return parseEnvValue(trimmed.slice(eq + 1));
  }

  return "";
}

/** Read Mureka API key from runtime env, falling back to `.env.local`. */
export function readMurekaApiKey() {
  if (cachedApiKey) return cachedApiKey;

  const fromProcess = (process.env["MUREKA_API_KEY"] ?? "").trim();
  if (fromProcess) {
    cachedApiKey = fromProcess;
    return fromProcess;
  }

  const fromFile = readFromEnvLocal("MUREKA_API_KEY");
  if (fromFile) {
    process.env["MUREKA_API_KEY"] = fromFile;
    cachedApiKey = fromFile;
    return fromFile;
  }

  return "";
}

export const MUREKA_API_BASE_URL = (process.env["MUREKA_API_BASE_URL"] ?? "https://api.mureka.ai").replace(
  /\/+$/,
  ""
);
