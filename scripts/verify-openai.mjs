/**
 * Verify OpenAI API connectivity.
 * Run: npm run openai:verify
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, "utf8");
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

loadEnvFile(path.join(root, ".env.local"));
loadEnvFile(path.join(root, ".env"));

const apiKey = process.env.OPENAI_API_KEY?.trim();
const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";

if (!apiKey) {
  console.error("[openai:verify] OPENAI_API_KEY is missing.");
  console.error("");
  console.error("1. cp .env.example .env.local");
  console.error("2. Set OPENAI_API_KEY=sk-... in .env.local");
  console.error("3. Restart dev server and run: npm run openai:verify");
  process.exit(1);
}

if (!apiKey.startsWith("sk-")) {
  console.warn("[openai:verify] Warning: key does not start with sk- — double-check the value.");
}

console.log(`[openai:verify] Testing model: ${model}`);

const response = await fetch("https://api.openai.com/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    model,
    temperature: 0,
    max_tokens: 16,
    messages: [
      { role: "system", content: "Reply with exactly: VINCIS_OK" },
      { role: "user", content: "ping" }
    ]
  }),
  signal: AbortSignal.timeout(30_000)
});

const raw = await response.text();
let data;
try {
  data = JSON.parse(raw);
} catch {
  data = null;
}

if (!response.ok) {
  console.error(`[openai:verify] Failed (HTTP ${response.status})`);
  console.error(data?.error?.message ?? raw.slice(0, 500));
  process.exit(1);
}

const content = data?.choices?.[0]?.message?.content?.trim() ?? "";
const usage = data?.usage;

console.log("[openai:verify] Connected successfully.");
console.log(`[openai:verify] Response: ${content || "(empty)"}`);
if (usage) {
  console.log(
    `[openai:verify] Tokens: prompt=${usage.prompt_tokens ?? 0}, completion=${usage.completion_tokens ?? 0}`
  );
}
