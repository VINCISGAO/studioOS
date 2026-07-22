import {
  LUCIEN_ALLOWED_KNOWLEDGE_TYPES,
  LUCIEN_BUSINESS_SOURCE_TYPES,
  type LucienKnowledgeVisibility
} from "@/features/ai-copilot/lucien-knowledge-boundary.constants";

export type LucienKnowledgeRetrievalScope = "public_marketing" | "authenticated_business";

export type LucienKnowledgeRetrievalFilter = {
  knowledgeTypes: string[];
  visibilities: LucienKnowledgeVisibility[];
  allowedSourceTypes: string[];
  blockedSourceTypes: string[];
};

const AUTHENTICATED_KNOWLEDGE_TYPES = [...LUCIEN_ALLOWED_KNOWLEDGE_TYPES];

export const LUCIEN_KNOWLEDGE_SCOPE_FILTERS: Record<
  LucienKnowledgeRetrievalScope,
  LucienKnowledgeRetrievalFilter
> = {
  public_marketing: {
    knowledgeTypes: ["FAQ", "PRODUCT_HELP", "WORKFLOW_GUIDE", "BUSINESS_POLICY"],
    visibilities: ["public"],
    allowedSourceTypes: ["marketing_faq", "knowledge_center", "business_policy"],
    blockedSourceTypes: ["dev_seed", "engineering_doc", "security_report"]
  },
  authenticated_business: {
    knowledgeTypes: AUTHENTICATED_KNOWLEDGE_TYPES,
    visibilities: ["public", "authenticated"],
    allowedSourceTypes: [...LUCIEN_BUSINESS_SOURCE_TYPES],
    blockedSourceTypes: ["dev_seed", "engineering_doc", "security_report"]
  }
};

export function isProductionKnowledgeEnvironment() {
  return process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
}
