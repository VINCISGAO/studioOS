/**
 * Single import surface for server-side session / identity resolution.
 * Thin facade — underlying helpers stay in lib/ until call sites migrate.
 */
import "server-only";

export {
  getCurrentSession,
  getCurrentUserEmail,
  getCurrentAuthUser
} from "@/lib/session-user";

export { getSessionUser, getSessionMvpProfile } from "@/features/auth/session.service";

export {
  getCurrentClientEmail,
  requireBrandPortalClientEmail,
  resolveBrandBriefClientEmail,
  getOrCreateVisitorId,
  brandDraftEmailForSession
} from "@/lib/client-session";

export {
  getCurrentCreatorId,
  getCurrentCreator,
  getCreatorIdForDemoEmail,
  resolveCurrentCreatorIdFromEmail
} from "@/lib/creator-session";

export { requireApiUser } from "@/lib/core/api-route";

export type { DemoSession } from "@/lib/demo-session";
