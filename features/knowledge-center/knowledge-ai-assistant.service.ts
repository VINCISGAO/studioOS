import "server-only";

import { aiGatewayService } from "@/features/ai/ai-gateway.service";
import { assertKnowledgeAiRateLimit } from "@/features/knowledge-center/knowledge-ai-assistant.rate-limit";
import type {
  KnowledgeAiAssistantAction,
  KnowledgeAiAssistantResult,
  KnowledgeAiDraftContext,
  KnowledgeAiFaqItem,
  KnowledgeAiInternalLink
} from "@/features/knowledge-center/knowledge-ai-assistant.types";
import { knowledgeCenterRepository } from "@/features/knowledge-center/knowledge-center.repository";
import { logger } from "@/lib/core/logger";
import { appError } from "@/lib/core/errors";

const SYSTEM_PROMPT =
  "You are VINCIS Knowledge Center SEO editor. Write clear, factual English for brands and AI video creators. Return only the requested output.";

function usageFrom(result: {
  provider: string;
  model: string;
  tokenInput: number;
  tokenOutput: number;
  cost: number;
  latencyMs: number;
}) {
  return {
    provider: result.provider,
    model: result.model,
    tokenInput: result.tokenInput,
    tokenOutput: result.tokenOutput,
    cost: result.cost,
    latencyMs: result.latencyMs
  };
}

function excerptFromBody(body: string, max = 155) {
  const plain = body.replace(/[#>*`\[\]()!-]/g, " ").replace(/\s+/g, " ").trim();
  if (plain.length <= max) return plain;
  return `${plain.slice(0, max - 1).trim()}…`;
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

function templateResult(
  action: KnowledgeAiAssistantAction,
  draft: KnowledgeAiDraftContext
): KnowledgeAiAssistantResult {
  const keywords = [draft.category_slug, ...(draft.tags ?? []), "AI advertising", "VINCIS"].filter(
    (item): item is string => Boolean(item)
  );
  const base = {
    ok: true,
    action,
    usage: {
      provider: "template",
      model: "template",
      tokenInput: 0,
      tokenOutput: 0,
      cost: 0,
      latencyMs: 0
    }
  };

  switch (action) {
    case "generate_seo_title":
      return { ...base, seo_title: draft.seo_title?.trim() || draft.title.trim() };
    case "generate_meta_description":
    case "generate_summary":
      return {
        ...base,
        meta_description: draft.meta_description?.trim() || draft.subtitle?.trim() || excerptFromBody(draft.body_markdown),
        summary: draft.subtitle?.trim() || excerptFromBody(draft.body_markdown)
      };
    case "generate_keywords":
      return { ...base, keywords: Array.from(new Set(keywords)).slice(0, 8) };
    case "generate_faq":
      return {
        ...base,
        faqs: [
          {
            question: `What is ${draft.title}?`,
            answer: excerptFromBody(draft.body_markdown, 220)
          },
          {
            question: "Who is this guide for?",
            answer: "Brands and creators using VINCIS for AI-native video production."
          }
        ]
      };
    case "improve_writing":
      return { ...base, body_markdown: draft.body_markdown.trim() };
    case "suggest_internal_links":
      return { ...base, internal_links: [] };
    case "generate_lucien_summary":
      return {
        ...base,
        lucien_summary: draft.meta_description?.trim() || excerptFromBody(draft.body_markdown),
        lucien_keywords: Array.from(new Set(keywords)).slice(0, 10)
      };
    default:
      return { ...base, ok: false, error: "Unsupported action" };
  }
}

async function publishedArticlesForLinks(excludeSlug?: string) {
  const rows = await knowledgeCenterRepository.listPublished("en", 30);
  return rows
    .filter((row) => row.slug !== excludeSlug)
    .map((row) => {
      const translation = row.translations.find((item) => item.languageCode === "en");
      return {
        slug: row.slug,
        title: translation?.title ?? row.slug,
        category_slug: row.category?.slug ?? undefined
      };
    });
}

export class KnowledgeAiAssistantService {
  async run(input: {
    adminUserId: string;
    action: KnowledgeAiAssistantAction;
    draft: KnowledgeAiDraftContext;
  }): Promise<KnowledgeAiAssistantResult> {
    assertKnowledgeAiRateLimit(input.adminUserId);

    if (!input.draft.title.trim() || !input.draft.body_markdown.trim()) {
      throw appError("VALIDATION_ERROR", "Title and body are required for AI assistant actions.");
    }

    if (!aiGatewayService.isConfigured()) {
      return templateResult(input.action, input.draft);
    }

    const started = Date.now();
    try {
      const result = await this.runWithOpenAi(input.action, input.draft);
      logger.info("Knowledge AI assistant usage", {
        service: "KnowledgeAiAssistantService",
        adminUserId: input.adminUserId,
        action: input.action,
        provider: result.usage.provider,
        model: result.usage.model,
        tokenInput: result.usage.tokenInput,
        tokenOutput: result.usage.tokenOutput,
        cost: result.usage.cost,
        latencyMs: result.usage.latencyMs || Date.now() - started
      });
      return result;
    } catch (error) {
      logger.error("Knowledge AI assistant failed", {
        service: "KnowledgeAiAssistantService",
        adminUserId: input.adminUserId,
        action: input.action,
        error: error instanceof Error ? error.message : String(error)
      });
      const fallback = templateResult(input.action, input.draft);
      return { ...fallback, error: error instanceof Error ? error.message : "AI request failed" };
    }
  }

  private async runWithOpenAi(
    action: KnowledgeAiAssistantAction,
    draft: KnowledgeAiDraftContext
  ): Promise<KnowledgeAiAssistantResult> {
    const context = [
      `Title: ${draft.title}`,
      draft.subtitle ? `Subtitle: ${draft.subtitle}` : null,
      draft.slug ? `Slug: ${draft.slug}` : null,
      draft.category_slug ? `Category: ${draft.category_slug}` : null,
      draft.tags?.length ? `Tags: ${draft.tags.join(", ")}` : null,
      "",
      "Body markdown:",
      draft.body_markdown
    ]
      .filter(Boolean)
      .join("\n");

    switch (action) {
      case "generate_seo_title": {
        const completion = await aiGatewayService.chatCompletion({
          system: SYSTEM_PROMPT,
          user: `${context}\n\nGenerate one SEO title (≤60 chars). Return plain text only.`,
          temperature: 0.3
        });
        return {
          ok: true,
          action,
          seo_title: completion.content.replace(/^["']|["']$/g, "").trim(),
          usage: usageFrom(completion)
        };
      }
      case "generate_meta_description": {
        const completion = await aiGatewayService.chatCompletion({
          system: SYSTEM_PROMPT,
          user: `${context}\n\nGenerate one meta description (120-160 chars). Return plain text only.`,
          temperature: 0.35
        });
        return {
          ok: true,
          action,
          meta_description: completion.content.trim(),
          usage: usageFrom(completion)
        };
      }
      case "generate_summary": {
        const completion = await aiGatewayService.chatCompletion({
          system: SYSTEM_PROMPT,
          user: `${context}\n\nGenerate a 2-sentence article summary for editors. Return plain text only.`,
          temperature: 0.35
        });
        return {
          ok: true,
          action,
          summary: completion.content.trim(),
          usage: usageFrom(completion)
        };
      }
      case "generate_keywords": {
        const completion = await aiGatewayService.chatCompletion({
          system: SYSTEM_PROMPT,
          user: `${context}\n\nReturn JSON: {"keywords":["..."]} with 5-8 focus keywords.`,
          jsonMode: true,
          temperature: 0.2
        });
        const parsed = parseJsonObject<{ keywords?: string[] }>(completion.content);
        return {
          ok: true,
          action,
          keywords: (parsed?.keywords ?? []).map((item) => item.trim()).filter(Boolean).slice(0, 8),
          usage: usageFrom(completion)
        };
      }
      case "generate_faq": {
        const completion = await aiGatewayService.chatCompletion({
          system: SYSTEM_PROMPT,
          user: `${context}\n\nReturn JSON: {"faqs":[{"question":"...","answer":"..."}]} with 3-5 FAQs grounded in the article.`,
          jsonMode: true,
          temperature: 0.35
        });
        const parsed = parseJsonObject<{ faqs?: KnowledgeAiFaqItem[] }>(completion.content);
        return {
          ok: true,
          action,
          faqs: (parsed?.faqs ?? []).filter((item) => item.question?.trim() && item.answer?.trim()).slice(0, 6),
          usage: usageFrom(completion)
        };
      }
      case "improve_writing": {
        const completion = await aiGatewayService.chatCompletion({
          system: SYSTEM_PROMPT,
          user: `${context}\n\nImprove clarity and structure. Keep markdown headings and links. Return only the revised markdown body.`,
          temperature: 0.4
        });
        return {
          ok: true,
          action,
          body_markdown: completion.content.trim() || draft.body_markdown,
          usage: usageFrom(completion)
        };
      }
      case "suggest_internal_links": {
        const articles = await publishedArticlesForLinks(draft.slug);
        const completion = await aiGatewayService.chatCompletion({
          system: SYSTEM_PROMPT,
          user: `${context}\n\nPublished articles:\n${articles.map((item) => `- ${item.slug}: ${item.title}`).join("\n")}\n\nReturn JSON: {"links":[{"slug":"...","title":"...","suggested_anchor":"...","reason":"..."}]} with up to 4 relevant internal links.`,
          jsonMode: true,
          temperature: 0.25
        });
        const parsed = parseJsonObject<{ links?: KnowledgeAiInternalLink[] }>(completion.content);
        const allowed = new Set(articles.map((item) => item.slug));
        return {
          ok: true,
          action,
          internal_links: (parsed?.links ?? [])
            .filter((item) => allowed.has(item.slug) && item.suggested_anchor?.trim())
            .slice(0, 4),
          usage: usageFrom(completion)
        };
      }
      case "generate_lucien_summary": {
        const completion = await aiGatewayService.chatCompletion({
          system: SYSTEM_PROMPT,
          user: `${context}\n\nReturn JSON: {"ai_summary":"...","ai_keywords":["..."]} for Lucien knowledge indexing.`,
          jsonMode: true,
          temperature: 0.3
        });
        const parsed = parseJsonObject<{ ai_summary?: string; ai_keywords?: string[] }>(completion.content);
        return {
          ok: true,
          action,
          lucien_summary: parsed?.ai_summary?.trim() || excerptFromBody(draft.body_markdown),
          lucien_keywords: (parsed?.ai_keywords ?? []).map((item) => item.trim()).filter(Boolean).slice(0, 10),
          usage: usageFrom(completion)
        };
      }
      default:
        throw appError("VALIDATION_ERROR", "Unsupported knowledge AI action");
    }
  }
}

export const knowledgeAiAssistantService = new KnowledgeAiAssistantService();
