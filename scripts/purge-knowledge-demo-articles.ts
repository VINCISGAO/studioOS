/**
 * Soft-delete legacy AI advertising demo articles from the database.
 * Run: npx tsx scripts/purge-knowledge-demo-articles.ts
 */
import { KNOWLEDGE_DEMO_ARTICLE_SLUGS } from "@/features/knowledge-center/knowledge-public.filters";
import { prisma } from "@/lib/core/database/prisma";

async function main() {
  const result = await prisma.knowledgeArticle.updateMany({
    where: {
      slug: { in: [...KNOWLEDGE_DEMO_ARTICLE_SLUGS] },
      deletedAt: null
    },
    data: {
      deletedAt: new Date(),
      status: "ARCHIVED"
    }
  });
  console.log(`Archived ${result.count} demo knowledge article(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
