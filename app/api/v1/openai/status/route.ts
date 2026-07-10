import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { NextResponse } from "next/server";
import { hasOpenAI, openAIApiKey, resolveOpenAIModel } from "@/lib/core/config/ai";

function readKeyDirectFromEnvLocal() {
  const envLocalPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envLocalPath)) return "";

  const content = readFileSync(envLocalPath, "utf8").replace(/^\uFEFF/u, "");
  for (const rawLine of content.split(/\r?\n/u)) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    if (trimmed.slice(0, eq).trim() !== "OPENAI_API_KEY") continue;
    return trimmed.slice(eq + 1).trim();
  }

  return "";
}

/** Dev-only OpenAI wiring check — never expose in production. */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  const key = openAIApiKey() || readKeyDirectFromEnvLocal();
  const envLocalPath = resolve(process.cwd(), ".env.local");
  const fileKeyLength = readKeyDirectFromEnvLocal().length;

  return NextResponse.json({
    ok: true,
    configured: Boolean(key),
    model: resolveOpenAIModel(),
    keyPreview: key ? `${key.slice(0, 8)}…${key.slice(-4)}` : null,
    keyLength: key.length,
    cwd: process.cwd(),
    envLocalExists: existsSync(envLocalPath),
    fileKeyLength
  });
}
