import { aiGatewayService } from "@/features/ai/ai-gateway.service";
import { SUPPORTED_LANGUAGE_SEEDS } from "@/features/i18n/language.constants";
import { logger } from "@/lib/core/logger";

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

export async function translateMarketingCopyJson<T extends Record<string, unknown>>(input: {
  namespace: string;
  sourceLocale: string;
  targetLocale: string;
  source: T;
}): Promise<T | null> {
  const target = SUPPORTED_LANGUAGE_SEEDS.find((item) => item.code === input.targetLocale);
  if (!target) return null;

  const completion = await aiGatewayService.chatCompletion({
    system: [
      "You are a professional SaaS marketing translator for VINCIS, an AI-powered advertising production platform.",
      "Translate user-facing marketing copy with native fluency and professional B2B tone.",
      "Rules:",
      "- Preserve JSON keys exactly.",
      "- Preserve brand name VINCIS untranslated.",
      "- Preserve URLs, paths, slugs, email addresses, HTML/Markdown structure, and placeholders like {count}.",
      "- Preserve category IDs (account, publish, creators, ai, payment, partners) untranslated.",
      "- Do not add or remove fields.",
      "- Return JSON only."
    ].join("\n"),
    user: [
      `Namespace: ${input.namespace}`,
      `Translate from ${languageLabel(input.sourceLocale)} (${input.sourceLocale}) to ${target.nativeName} (${target.code}).`,
      "SOURCE JSON:",
      JSON.stringify(input.source, null, 2)
    ].join("\n"),
    jsonMode: true,
    temperature: 0.2,
    language: target.nativeName
  });

  const parsed = parseJsonObject<T>(completion.content);
  if (!parsed) {
    logger.warn("marketing.i18n_translate_empty", {
      service: "MarketingI18nTranslateService",
      namespace: input.namespace,
      targetLocale: input.targetLocale
    });
    return null;
  }

  return parsed;
}
