/**
 * Sync missing PUBLISHED Knowledge Center translations for one article slug.
 *
 * Run:
 *   npm run knowledge:sync-missing-translations -- --slug=ai-advertising-guide-2026
 *   npm run knowledge:sync-missing-translations -- --slug=ai-advertising-guide-2026 --source=en
 */
import { syncMissingKnowledgeArticleTranslations } from "@/features/knowledge-center/knowledge-multilingual-missing-sync.core";

function readArg(name: string) {
  const prefix = `--${name}=`;
  const match = process.argv.find((item) => item.startsWith(prefix));
  return match ? match.slice(prefix.length).trim() : undefined;
}

async function main() {
  const slug = readArg("slug");
  if (!slug) {
    console.error("Usage: npm run knowledge:sync-missing-translations -- --slug=<article-slug> [--source=en]");
    process.exit(1);
  }

  const sourceLanguage = readArg("source");
  const result = await syncMissingKnowledgeArticleTranslations(slug, {
    sourceLanguage
  });

  console.log("\nKnowledge missing-translation sync complete\n");
  console.log(`Slug: ${result.slug}`);
  console.log(`Article ID: ${result.articleId}`);
  console.log(`Missing before sync: ${result.missing.join(", ") || "(none)"}`);
  console.log(`Translations synced: ${result.translations_synced}`);
  console.log(`Languages: ${result.translation_languages.join(", ")}`);

  if (result.errors.length) {
    console.error("\nErrors:");
    for (const error of result.errors) console.error(`- ${error}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
