/**
 * Knowledge Center publish pipeline smoke checks.
 * Run: npm run knowledge:verify
 */
import { KNOWLEDGE_LANGUAGE_OPTIONS } from "../features/knowledge-center/knowledge-center.constants";
import { KNOWLEDGE_PUBLISH_STEPS } from "../features/knowledge-center/knowledge-publish.pipeline.shared";
import { buildKnowledgeJsonLd } from "../features/knowledge-center/knowledge-seo.heuristics";
import { buildKnowledgeLlmsTxtDocument } from "../lib/knowledge/knowledge-llms-document";
import { resolveKnowledgeCoverSources } from "../lib/knowledge/knowledge-cover-process.shared";
import { renderKnowledgeMarkdown } from "../lib/knowledge/knowledge-markdown";
import { buildKnowledgeRssXml } from "../lib/knowledge/knowledge-rss";
import { validateKnowledgeSlug } from "../lib/knowledge/knowledge-editor-validation";

type Step = { name: string; ok: boolean; detail?: string };

function checkMarkdownRenderer(): Step {
  const markdown = [
    "| Feature | Status |",
    "| --- | --- |",
    "| Tables | yes |",
    "",
    "- [ ] Draft checklist",
    "- [x] Done checklist",
    "",
    "> Blockquote line",
    "",
    "![Alt text](https://vincis.app/images/demo.png)",
    "",
    "---",
    "",
    "```ts",
    "const ok = true;",
    "```",
    "",
    "Visit [VINCIS](https://vincis.app) for more."
  ].join("\n");

  const html = renderKnowledgeMarkdown(markdown);
  const checks = [
    ["table", html.includes("<table")],
    ["checklist", html.includes("☑") || html.includes("☐")],
    ["blockquote", html.includes("<blockquote")],
    ["image", html.includes("<img")],
    ["hr", html.includes("<hr")],
    ["code", html.includes("<pre")],
    ["external link", html.includes('target="_blank"') && html.includes("https://vincis.app")]
  ] as const;

  const missing = checks.filter(([, ok]) => !ok).map(([name]) => name);
  return {
    name: "knowledge.markdown_renderer",
    ok: missing.length === 0,
    detail: missing.length ? `Missing: ${missing.join(", ")}` : "All markdown elements render"
  };
}

function checkCoverSources(): Step {
  const coverUrl = "/api/admin/knowledge/assets/abc-123.webp";
  const resolved = resolveKnowledgeCoverSources(coverUrl);
  const ok = Boolean(
    resolved &&
      resolved.sources.length > 0 &&
      resolved.sources.some((item) => item.type === "image/avif") &&
      resolved.sources.some((item) => item.type === "image/webp")
  );
  return {
    name: "knowledge.cover_variants",
    ok,
    detail: ok ? "WebP cover resolves AVIF/WebP sources" : "Cover variant resolver failed"
  };
}

function checkPublishPipelineSteps(): Step {
  const required = ["json_ld", "sitemap", "rss", "llms_txt", "lucien_learning", "multilingual_sync"];
  const missing = required.filter((step) => !KNOWLEDGE_PUBLISH_STEPS.includes(step as (typeof KNOWLEDGE_PUBLISH_STEPS)[number]));
  return {
    name: "knowledge.publish_pipeline",
    ok: missing.length === 0,
    detail: missing.length ? `Missing steps: ${missing.join(", ")}` : `${KNOWLEDGE_PUBLISH_STEPS.length} publish steps registered`
  };
}

function checkMultilingualLocales(): Step {
  const ok = KNOWLEDGE_LANGUAGE_OPTIONS.length === 11;
  return {
    name: "knowledge.multilingual_locales",
    ok,
    detail: ok ? "11 public locales configured for GPT sync" : `Expected 11 locales, found ${KNOWLEDGE_LANGUAGE_OPTIONS.length}`
  };
}

function checkJsonLdBundle(): Step {
  const graph = buildKnowledgeJsonLd({
    title: "AI Video Brief Guide",
    description: "How brands brief AI creators on VINCIS.",
    url: "https://vincis.app/en/resources/ai-video-brief",
    authorName: "VINCIS",
    publishedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    imageUrl: "/api/admin/knowledge/assets/demo-original.jpg",
    pathPrefix: "en",
    categoryName: "AI Advertising",
    categorySlug: "ai-advertising",
    origin: "https://vincis.app",
    faqs: [{ question: "What is a brief?", answer: "A campaign direction document.", sort_order: 0 }]
  });

  const serialized = JSON.stringify(graph);
  const ok =
    serialized.includes("Article") &&
    serialized.includes("FAQPage") &&
    serialized.includes("BreadcrumbList") &&
    serialized.includes("ai-video-brief");
  return {
    name: "knowledge.json_ld",
    ok,
    detail: ok ? "Article + FAQ + breadcrumb JSON-LD generated" : "JSON-LD bundle incomplete"
  };
}

function checkRssAndLlms(): Step {
  const rss = buildKnowledgeRssXml({
    title: "VINCIS Resources",
    link: "https://vincis.app/en/resources/rss.xml",
    description: "Official knowledge articles",
    language: "en",
    items: [
      {
        title: "AI Video Brief Guide",
        link: "https://vincis.app/en/resources/ai-video-brief",
        description: "Guide",
        pubDate: new Date().toUTCString(),
        guid: "https://vincis.app/en/resources/ai-video-brief"
      }
    ]
  });

  const englishLang = KNOWLEDGE_LANGUAGE_OPTIONS.find((item) => item.code === "en") ?? KNOWLEDGE_LANGUAGE_OPTIONS[0];

  const llms = buildKnowledgeLlmsTxtDocument({
    articlesByLanguage: [
      {
        lang: englishLang,
        articles: [
          {
            id: "1",
            slug: "ai-video-brief",
            title: "AI Video Brief Guide",
            category: "AI Advertising",
            status: "PUBLISHED",
            language_code: "en",
            author_name: "VINCIS",
            updated_at: new Date().toISOString(),
            seo_score: 80,
            lucien_indexed: true,
            view_count: 0
          }
        ]
      }
    ]
  });

  const ok = rss.includes("<rss") && rss.includes("<item>") && llms.includes("Published knowledge articles");
  return {
    name: "knowledge.rss_llms",
    ok,
    detail: ok ? "RSS and llms.txt builders ready" : "RSS or llms.txt builder failed"
  };
}

function checkSlugValidation(): Step {
  const valid = validateKnowledgeSlug("ai-video-brief").ok;
  const invalid = !validateKnowledgeSlug("Bad Slug").ok;
  return {
    name: "knowledge.slug_validation",
    ok: valid && invalid,
    detail: valid && invalid ? "Slug validation rules enforced" : "Slug validation mismatch"
  };
}

function checkSeoHeuristics(): Step {
  const jsonLd = buildKnowledgeJsonLd({
    title: "Test",
    description: "Desc",
    url: "https://vincis.app/en/resources/test",
    authorName: "VINCIS",
    publishedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    imageUrl: "https://vincis.app/demo.png",
    pathPrefix: "en",
    categoryName: "AI Advertising",
    categorySlug: "ai-advertising",
    origin: "https://vincis.app",
    faqs: []
  });
  const ok = JSON.stringify(jsonLd).includes("@graph");
  return {
    name: "knowledge.seo_heuristics",
    ok,
    detail: ok ? "SEO JSON-LD graph builder ok" : "SEO heuristics failed"
  };
}

function main() {
  const steps: Step[] = [
    checkMarkdownRenderer(),
    checkCoverSources(),
    checkSlugValidation(),
    checkMultilingualLocales(),
    checkPublishPipelineSteps(),
    checkJsonLdBundle(),
    checkRssAndLlms(),
    checkSeoHeuristics()
  ];

  console.log("\nKnowledge publish verification\n");
  for (const step of steps) {
    console.log(step.ok ? `✅ ${step.name}` : `❌ ${step.name}`);
    if (step.detail) console.log(`   ${step.detail}`);
  }

  const failed = steps.filter((step) => !step.ok);
  if (failed.length) {
    console.log(`\n${failed.length} check(s) failed.\n`);
    process.exit(1);
  }
  console.log("\nAll knowledge publish checks passed.\n");
}

main();
