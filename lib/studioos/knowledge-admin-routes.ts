import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";

export const KNOWLEDGE_ADMIN_RESERVED_IDS = new Set(["new", "seo", "citations"]);

export function resolveKnowledgeAdminReservedPath(id: string) {
  if (id === "new") return adminPortalRoutes.knowledgeNew;
  if (id === "seo") return adminPortalRoutes.knowledgeSeo;
  if (id === "citations") return adminPortalRoutes.knowledgeCitations;
  return null;
}
