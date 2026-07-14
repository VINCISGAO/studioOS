# VINCIS AI Knowledge Center — Developer Spec

Canonical architecture for the official VINCIS knowledge hub.

## Goal

One content system powers:

- Google SEO
- Baidu SEO
- AI SEO (ChatGPT, Gemini, Claude, Perplexity)
- Lucien knowledge retrieval (RAG)
- Help Center
- Creator Academy
- Brand Academy

**One article, many surfaces.**

## Route map

| Surface | Path |
|---------|------|
| Admin CMS | `/admin/knowledge` |
| AI Citation Monitor | `/admin/knowledge/citations` |
| Public articles (locale prefix) | `/{lang}/resources/{slug}` |
| Lucien sync source | `AiKnowledgeQa.sourceType = knowledge_center` |
| LLM crawl list | `/llms.txt` |
| Sitemap | `/sitemap.xml` |

Supported locale prefixes: `en`, `zh`, `ja`, `ko`, `th`, `vi`, `fr`, `es`.

> Note: `/resources` (no locale prefix) remains the **Partners** marketing page. Knowledge articles use `/{lang}/resources/...`.

## Data model (Prisma)

| Table | Purpose |
|-------|---------|
| `KnowledgeArticle` | Master record (slug, status, author, schedule) |
| `KnowledgeCategory` | Taxonomy |
| `KnowledgeTag` + `KnowledgeArticleTag` | Tags |
| `KnowledgeTranslation` | Per-locale title/body/status |
| `KnowledgeRevision` | Version snapshots |
| `KnowledgeAsset` | Media |
| `KnowledgeSeo` | SEO + score heuristics |
| `KnowledgeFaq` | FAQ blocks |
| `KnowledgeSchema` | JSON-LD |
| `KnowledgeLucien` | AI metadata + sync state |
| `KnowledgeAnalytics` | Views / helpful votes |
| `KnowledgeEmbedding` | RAG chunks (future vectors) |
| `KnowledgeSearchIndex` | Denormalized full-text |

## Feature layer

```
features/knowledge-center/
  knowledge-center.types.ts
  knowledge-center.constants.ts
  knowledge-center.repository.ts
  knowledge-center.service.ts
  knowledge-center.mappers.ts
  knowledge-center.api-parser.ts
  knowledge-seo.heuristics.ts
  knowledge-lucien.mapper.ts
  knowledge-lucien-sync.service.ts
```

Flow: **Admin API → Service → Repository → Prisma**. Publish triggers Lucien upsert into `AiKnowledgeQa`.

## Lucien integration

- `sourceType`: `knowledge_center`
- `visibility`: `public` for published articles with `lucien_learning = true`
- `knowledgeType`: `PRODUCT_HELP` | `WORKFLOW_GUIDE` | `FAQ` (by category)
- Stable `sourceKey`: `knowledge_center_{slug}_{languageCode}`
- Public Lucien scope includes `knowledge_center` alongside `marketing_faq`

Sync command:

```bash
npm run knowledge:sync-lucien
```

## Admin UX (MVP shipped)

- Knowledge Center home: stats + article table
- New / Edit article: Markdown editor, SEO sidebar, Lucien sidebar
- AI Citation Monitor: topic coverage gaps

## Public UX (MVP shipped)

- Apple-style article page: title, subtitle, cover, TOC, Markdown body, FAQ, related articles
- JSON-LD injected from `KnowledgeSchema`
- Open Graph from `KnowledgeSeo`

## Publish pipeline (one click)

Clicking **Publish** in admin runs `runKnowledgePublishPipeline()`:

| Step | What happens |
|------|----------------|
| Article page | `/{lang}/resources/{slug}` live |
| Category index | `/{lang}/resources/category/{slug}` revalidated |
| Search index | `KnowledgeSearchIndex` updated on save |
| Schema.org | Article + FAQPage JSON-LD |
| sitemap.xml | Dynamic sitemap includes new URL |
| RSS | `/feed.xml` + `/{lang}/resources/rss.xml` |
| llms.txt | Public LLM crawl list updated |
| Lucien | Upsert into `AiKnowledgeQa` (`knowledge_center`) |
| Cache | Next.js `revalidatePath` for all surfaces |

Admin only needs: **New Article → edit → Publish**.

## One-time setup (new domain)

Google Search Console:

1. Verify `vincis.app`
2. Submit `https://vincis.app/sitemap.xml`
3. Monitor coverage / crawl errors

Baidu 搜索资源平台:

1. Verify site
2. Submit same sitemap URL
3. Monitor indexing

Optional first-article boost: share flagship posts (LinkedIn, X) once — not per-article.

## Phase 2 (not yet implemented)

- Block editor (Notion-style)
- AI toolbar (outline, rewrite, translate, EEAT check)
- Scheduled publish worker
- RSS feed
- Image upload pipeline + WebP/AVIF
- Vector embeddings for RAG
- Multi-locale editor tabs in one screen
- Import Markdown bulk
- Helpful 👍/👎 feedback API on public pages

## Engineering rules

- Do not delete `marketing_faq` Lucien rows when syncing Knowledge Center
- AI Learning Foundation assets remain upgrade-only
- Homepage marketing remains frozen
- New business tables use optional `campaign_id` where applicable (system CMS content may omit)
