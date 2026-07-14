import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";

export const KNOWLEDGE_ADMIN_RESERVED_IDS = new Set(["new", "seo", "citations"]);

export function isKnowledgeAdminNewArticleId(id: string) {
  return id === "new";
}

export function resolveKnowledgeAdminReservedPath(id: string) {
  if (isKnowledgeAdminNewArticleId(id)) return null;
  if (id === "seo") return adminPortalRoutes.knowledgeSeo;
  if (id === "citations") return adminPortalRoutes.knowledgeCitations;
  return null;
}
