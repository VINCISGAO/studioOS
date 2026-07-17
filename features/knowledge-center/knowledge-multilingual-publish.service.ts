import "server-only";

import { aiGatewayService } from "@/features/ai/ai-gateway.service";
import { KNOWLEDGE_LANGUAGE_OPTIONS } from "@/features/knowledge-center/knowledge-center.constants";
import type { UpsertKnowledgeArticleInput } from "@/features/knowledge-center/knowledge-center.types";
import type {
  KnowledgeMultilingualSourceBundle,
  KnowledgeMultilingualSyncResult
} from "@/features/knowledge-center/knowledge-multilingual.types";
import { translateKnowledgeArticleLocale } from "@/features/knowledge-center/knowledge-multilingual-translate.service";
import { logger } from "@/lib/core/logger";

const TRANSLATION_CONCURRENCY = 3;

async function runPool<T>(items: T[], limit: number, worker: (item: T) => Promise<void>) {
  let index = 0;
  async function next() {
    while (index < items.length) {
      const current = items[index];
      index += 1;
      await worker(current);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => next()));
}

export async function syncKnowledgeArticleTranslations(input: {
  base: UpsertKnowledgeArticleInput;
  persist: (payload: UpsertKnowledgeArticleInput) => Promise<void>;
  /** When set, only translate these locale codes (still excludes source language). */
  onlyTargetCodes?: string[];
  concurrency?: number;
}): Promise<KnowledgeMultilingualSyncResult> {
  const source = input.base.translation;
  const sourceCode = source.language_code;
  const onlyTargets = input.onlyTargetCodes?.length
    ? new Set(input.onlyTargetCodes.filter((code) => code !== sourceCode))
    : null;
  const targetCodes = KNOWLEDGE_LANGUAGE_OPTIONS.map((item) => item.code).filter(
    (code) => code !== sourceCode && (!onlyTargets || onlyTargets.has(code))
  );

  const bundle: KnowledgeMultilingualSourceBundle = {
    language_code: sourceCode,
    title: source.title,
    subtitle: source.subtitle,
    body_markdown: source.body_markdown,
    excerpt: source.excerpt,
    seo: source.seo,
    faqs: source.faqs,
    lucien: source.lucien
  };

  const synced = [sourceCode];
  const errors: string[] = [];

  if (!aiGatewayService.isConfigured()) {
    return {
      translations_synced: 1,
      translation_languages: synced,
      errors: ["OPENAI_API_KEY is not configured — only the source language was published"]
    };
  }

  await runPool(targetCodes, input.concurrency ?? TRANSLATION_CONCURRENCY, async (targetCode) => {
    try {
      const translation = await translateKnowledgeArticleLocale(bundle, targetCode);
      if (!translation) {
        errors.push(`Translation empty for ${targetCode}`);
        return;
      }

      await input.persist({
        ...input.base,
        title: translation.title,
        status: "PUBLISHED",
        translation
      });
      synced.push(targetCode);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${targetCode}: ${message}`);
      logger.error("knowledge.multilingual_translate_failed", {
        service: "KnowledgeMultilingualPublishService",
        targetCode,
        error: message
      });
    }
  });

  return {
    translations_synced: synced.length,
    translation_languages: synced,
    errors
  };
}
