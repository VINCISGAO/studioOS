import "server-only";

import type { Prisma } from "@prisma/client";
import { Prisma as PrismaRuntime } from "@prisma/client";

/** Published translations with a persisted JSON-LD schema blob. */
export const knowledgeTranslationWithJsonLdWhere: Prisma.KnowledgeTranslationWhereInput = {
  schema: {
    is: {
      jsonLd: { not: PrismaRuntime.DbNull }
    }
  }
};
