import "server-only";

import { KNOWLEDGE_LANGUAGE_OPTIONS } from "@/features/knowledge-center/knowledge-center.constants";
import { knowledgeCenterRepository } from "@/features/knowledge-center/knowledge-center.repository";
import { knowledgeTranslationWithJsonLdWhere } from "@/features/knowledge-center/knowledge-prisma.filters";
import { prisma } from "@/lib/core/database/prisma";
import type { KnowledgeSeoDashboardDto } from "@/features/knowledge-center/knowledge-center.types";

const ORIGIN = "https://vincis.app";

function surfaceStatus(ratio: number): "ok" | "warn" | "error" {
  if (ratio >= 0.9) return "ok";
  if (ratio >= 0.6) return "warn";
  return "error";
}

export class KnowledgeSeoDashboardService {
  async build(): Promise<KnowledgeSeoDashboardDto> {
    if (!knowledgeCenterRepository.isAvailable()) {
      return {
        surfaces: {
          sitemap: { status: "error", url: `${ORIGIN}/sitemap.xml`, entries: 0 },
          robots: { status: "error", url: `${ORIGIN}/robots.txt` },
          llms: { status: "error", url: `${ORIGIN}/llms.txt`, entries: 0 },
          schema: { status: "error", covered: 0, total: 0 }
        },
        indexes: { google: 0, baidu: 0, bing: 0 },
        articles: [],
        published_translations: 0,
        note:
          "Knowledge Center tables are unavailable. SEO dashboard will populate after migrations and published articles exist."
      };
    }

    const [
      publishedTranslations,
      googleReady,
      baiduReady,
      bingReady,
      schemaCovered,
      searchIndexed,
      articleRows
    ] = await Promise.all([
      prisma.knowledgeTranslation.count({ where: { status: "PUBLISHED", article: { deletedAt: null } } }),
      prisma.knowledgeTranslation.count({
        where: {
          status: "PUBLISHED",
          article: { deletedAt: null },
          seo: { googleScore: { gte: 60 }, metaDescription: { not: null } },
          ...knowledgeTranslationWithJsonLdWhere
        }
      }),
      prisma.knowledgeTranslation.count({
        where: {
          status: "PUBLISHED",
          article: { deletedAt: null },
          seo: { baiduScore: { gte: 55 }, metaDescription: { not: null } }
        }
      }),
      prisma.knowledgeTranslation.count({
        where: {
          status: "PUBLISHED",
          article: { deletedAt: null },
          seo: { seoScore: { gte: 65 } },
          ...knowledgeTranslationWithJsonLdWhere
        }
      }),
      prisma.knowledgeTranslation.count({
        where: {
          status: "PUBLISHED",
          article: { deletedAt: null },
          ...knowledgeTranslationWithJsonLdWhere
        }
      }),
      prisma.knowledgeSearchIndex.count({
        where: { translation: { status: "PUBLISHED", article: { deletedAt: null } } }
      }),
      knowledgeCenterRepository.listSeoDashboardArticles()
    ]);

    const sitemapEntries =
      publishedTranslations +
      KNOWLEDGE_LANGUAGE_OPTIONS.length +
      1;
    const llmsEntries = publishedTranslations;
    const schemaRatio = publishedTranslations ? schemaCovered / publishedTranslations : 0;

    return {
      surfaces: {
        sitemap: {
          status: publishedTranslations > 0 ? "ok" : "warn",
          url: `${ORIGIN}/sitemap.xml`,
          entries: sitemapEntries
        },
        robots: {
          status: "ok",
          url: `${ORIGIN}/robots.txt`
        },
        llms: {
          status: llmsEntries > 0 ? "ok" : "warn",
          url: `${ORIGIN}/llms.txt`,
          entries: llmsEntries
        },
        schema: {
          status: surfaceStatus(schemaRatio),
          covered: schemaCovered,
          total: publishedTranslations
        }
      },
      indexes: {
        google: googleReady,
        baidu: baiduReady,
        bing: bingReady
      },
      articles: articleRows,
      published_translations: publishedTranslations,
      site_search_indexed: searchIndexed,
      note:
        "「SEO 技术就绪」为站内自动检测结果（Schema、Meta、评分达标），不代表 Google / 百度 / Bing 已实际收录。真实收录需接入 Search Console / 站长平台。"
    };
  }
}

export const knowledgeSeoDashboardService = new KnowledgeSeoDashboardService();
