import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SUPPORTED_LANGUAGE_SEEDS } from "../features/i18n/language.constants";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const bundlesDir = path.join(root, "lib/marketing/i18n/bundles");
const knowledgeBundlesDir = path.join(root, "lib/knowledge/i18n/bundles");

type NamespaceConfig = {
  id: string;
  bundleDir?: string;
  loadSource: () => Promise<{ en: Record<string, unknown>; "zh-CN": Record<string, unknown> }>;
};

const namespaces: NamespaceConfig[] = [
  {
    id: "faq",
    loadSource: async () => {
      const mod = await import("../lib/marketing/faq-copy.sources");
      return { en: mod.faqCopyEn, "zh-CN": mod.faqCopyZhCN };
    }
  },
  {
    id: "about",
    loadSource: async () => {
      const mod = await import("../lib/marketing/about-copy.sources");
      return { en: mod.aboutCopyEn, "zh-CN": mod.aboutCopyZhCN };
    }
  },
  {
    id: "pricing",
    loadSource: async () => {
      const mod = await import("../lib/marketing/pricing-copy.sources");
      return { en: mod.pricingCopyEn, "zh-CN": mod.pricingCopyZhCN };
    }
  },
  {
    id: "process",
    loadSource: async () => {
      const mod = await import("../lib/marketing/process-copy.sources");
      return { en: mod.processCopyEn, "zh-CN": mod.processCopyZhCN };
    }
  },
  {
    id: "partners",
    loadSource: async () => {
      const mod = await import("../lib/marketing/partners-copy.sources");
      return { en: mod.partnersCopyEn, "zh-CN": mod.partnersCopyZhCN };
    }
  },
  {
    id: "cases",
    loadSource: async () => {
      const mod = await import("../lib/marketing/cases-copy.sources");
      return { en: mod.casesCopyEn, "zh-CN": mod.casesCopyZhCN };
    }
  },
  {
    id: "nav",
    loadSource: async () => {
      const mod = await import("../lib/marketing/marketing-site-nav.sources");
      return { en: mod.marketingSiteNavEn, "zh-CN": mod.marketingSiteNavZhCN };
    }
  },
  {
    id: "docs-nav",
    loadSource: async () => {
      const mod = await import("../lib/marketing/marketing-docs-nav.sources");
      return { en: mod.marketingDocsNavEn, "zh-CN": mod.marketingDocsNavZhCN };
    }
  },
  {
    id: "login",
    loadSource: async () => {
      const mod = await import("../lib/marketing/login-copy.sources");
      return { en: mod.loginCopyEn, "zh-CN": mod.loginCopyZhCN };
    }
  },
  {
    id: "contact",
    loadSource: async () => {
      const mod = await import("../lib/marketing/contact-copy.sources");
      return { en: mod.contactCopyEn, "zh-CN": mod.contactCopyZhCN };
    }
  },
  {
    id: "landing-home",
    loadSource: async () => {
      const mod = await import("../lib/marketing/landing-home-copy.sources");
      return { en: mod.landingHomeCopyEn, "zh-CN": mod.landingHomeCopyZhCN };
    }
  },
  {
    id: "cinematic-home",
    loadSource: async () => {
      const mod = await import("../lib/marketing/cinematic-home-copy.sources");
      return { en: mod.cinematicHomeCopyEn, "zh-CN": mod.cinematicHomeCopyZhCN };
    }
  },
  {
    id: "knowledge-center-home",
    bundleDir: knowledgeBundlesDir,
    loadSource: async () => {
      const mod = await import("../lib/knowledge/knowledge-center-home-copy.sources");
      return { en: mod.knowledgeCenterHomeCopyEn, "zh-CN": mod.knowledgeCenterHomeCopyZhCN };
    }
  },
  {
    id: "knowledge-article-chrome",
    bundleDir: knowledgeBundlesDir,
    loadSource: async () => {
      const mod = await import("../lib/knowledge/knowledge-article-chrome-copy.sources");
      return { en: mod.knowledgeArticleChromeCopyEn, "zh-CN": mod.knowledgeArticleChromeCopyZhCN };
    }
  }
];

const POOL = 2;

const PRESERVED_TRANSLATION_FIELDS = new Set(["theme", "id", "key", "icon", "number", "slug", "href", "iconClassName"]);

function restorePreservedFields(source: unknown, translated: unknown): unknown {
  if (Array.isArray(source) && Array.isArray(translated)) {
    return translated.map((item, index) => restorePreservedFields(source[index], item));
  }

  if (
    source &&
    typeof source === "object" &&
    translated &&
    typeof translated === "object" &&
    !Array.isArray(source)
  ) {
    const sourceRecord = source as Record<string, unknown>;
    const translatedRecord = translated as Record<string, unknown>;
    const result: Record<string, unknown> = { ...translatedRecord };

    for (const [key, sourceValue] of Object.entries(sourceRecord)) {
      if (PRESERVED_TRANSLATION_FIELDS.has(key)) {
        result[key] = sourceValue;
        continue;
      }

      if (key in result) {
        result[key] = restorePreservedFields(sourceValue, result[key]);
      }
    }

    return result;
  }

  return translated;
}

function openAIApiKey() {
  return process.env.OPENAI_API_KEY?.trim() || process.env.VINCIS_OPENAI_API_KEY?.trim() || "";
}

function openAIModel() {
  return process.env.OPENAI_MODEL?.trim() || process.env.VINCIS_OPENAI_MODEL?.trim() || "gpt-4o-mini";
}

function parseJsonObject<T>(content: string): T | null {
  try {
    return JSON.parse(content) as T;
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as T;
    } catch {
      return null;
    }
  }
}

function languageLabel(code: string) {
  return SUPPORTED_LANGUAGE_SEEDS.find((item) => item.code === code)?.nativeName ?? code;
}

async function translateMarketingCopyJson<T extends Record<string, unknown>>(input: {
  namespace: string;
  sourceLocale: string;
  targetLocale: string;
  source: T;
}): Promise<T | null> {
  const target = SUPPORTED_LANGUAGE_SEEDS.find((item) => item.code === input.targetLocale);
  if (!target) return null;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAIApiKey()}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: openAIModel(),
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: [
            "You are a professional SaaS marketing translator for VINCIS, an AI-powered advertising production platform.",
            `Output language: ${target.nativeName}. All user-facing text must be written in this language.`,
            "Preserve JSON keys exactly.",
            "Preserve brand name VINCIS, URLs, paths, slugs, email addresses, placeholders like {count}, and category IDs.",
            "Never translate enum-like values for fields named theme, id, key, icon, or number — keep them identical to the source JSON.",
            "Do not add or remove fields.",
            "Return JSON only."
          ].join("\n")
        },
        {
          role: "user",
          content: [
            `Namespace: ${input.namespace}`,
            `Translate from ${languageLabel(input.sourceLocale)} (${input.sourceLocale}) to ${target.nativeName} (${target.code}).`,
            "SOURCE JSON:",
            JSON.stringify(input.source, null, 2)
          ].join("\n")
        }
      ]
    }),
    signal: AbortSignal.timeout(120_000)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI error ${response.status}: ${text}`);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content ?? "";
  return parseJsonObject<T>(content);
}

async function mapPool<T, R>(items: T[], worker: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;

  async function runWorker() {
    while (index < items.length) {
      const current = index;
      index += 1;
      results[current] = await worker(items[current] as T);
    }
  }

  await Promise.all(Array.from({ length: Math.min(POOL, items.length) }, () => runWorker()));
  return results;
}

function bundlePath(namespace: string, bundleDir = bundlesDir) {
  return path.join(bundleDir, `${namespace}.json`);
}

function readExistingBundle(namespace: string, bundleDir = bundlesDir): Record<string, Record<string, unknown>> {
  try {
    return JSON.parse(readFileSync(bundlePath(namespace, bundleDir), "utf8")) as Record<
      string,
      Record<string, unknown>
    >;
  } catch {
    return {};
  }
}

async function syncNamespace(config: NamespaceConfig, force: boolean) {
  const bundleDir = config.bundleDir ?? bundlesDir;
  const { en, "zh-CN": zhCN } = await config.loadSource();
  const existing = readExistingBundle(config.id, bundleDir);
  const bundle: Record<string, Record<string, unknown>> = {
    ...existing,
    en,
    "zh-CN": zhCN
  };

  const targets = SUPPORTED_LANGUAGE_SEEDS.map((item) => item.code).filter(
    (code) => code !== "en" && code !== "zh-CN"
  );

  await mapPool(targets, async (targetLocale) => {
    if (!force && bundle[targetLocale]) {
      console.log(`[marketing-i18n-sync] skip ${config.id}/${targetLocale} (exists)`);
      return;
    }

    const sourceLocale = targetLocale === "zh-TW" ? "zh-CN" : "en";
    const source = sourceLocale === "zh-CN" ? zhCN : en;

    console.log(`[marketing-i18n-sync] translate ${config.id} ${sourceLocale} -> ${targetLocale}`);
    const translated = await translateMarketingCopyJson({
      namespace: config.id,
      sourceLocale,
      targetLocale,
      source
    });

    if (!translated) {
      throw new Error(`Failed to translate ${config.id} -> ${targetLocale}`);
    }

    bundle[targetLocale] = restorePreservedFields(source, translated) as Record<string, unknown>;
  });

  mkdirSync(bundleDir, { recursive: true });
  writeFileSync(bundlePath(config.id, bundleDir), `${JSON.stringify(bundle, null, 2)}\n`, "utf8");
  console.log(`[marketing-i18n-sync] wrote ${config.id}.json (${Object.keys(bundle).length} locales)`);
}

async function main() {
  if (!openAIApiKey()) {
    console.error("[marketing-i18n-sync] OpenAI is not configured. Set OPENAI_API_KEY.");
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const only = args.find((arg) => arg.startsWith("--only="))?.slice("--only=".length);
  const selected = only ? namespaces.filter((item) => item.id === only) : namespaces;

  if (only && selected.length === 0) {
    console.error(`[marketing-i18n-sync] unknown namespace "${only}"`);
    process.exit(1);
  }

  for (const config of selected) {
    await syncNamespace(config, force);
  }

  console.log("[marketing-i18n-sync] done");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
