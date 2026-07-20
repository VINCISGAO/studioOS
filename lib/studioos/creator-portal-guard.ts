import { getCurrentCreatorId, getCurrentSession } from "@/features/auth/session-context";
import { type Locale, withLocale } from "@/lib/i18n";

const CREATOR_LOGIN_PATH = "/login?role=creator";
const CREATOR_ONBOARDING_PATH = "/studio/onboarding";

/**
 * Linear creator portal entry: login → profile check → onboarding → studio.
 * Returns a redirect path when access must be blocked; null when the request may proceed.
 */
export async function resolveCreatorPortalGuardRedirect(
  locale: Locale,
  pathname = ""
): Promise<string | null> {
  const session = await getCurrentSession();
  if (!session || session.role !== "creator") {
    return withLocale(CREATOR_LOGIN_PATH, locale);
  }

  const creatorId = await getCurrentCreatorId();
  if (!creatorId) {
    if (pathname === CREATOR_ONBOARDING_PATH || pathname.startsWith(`${CREATOR_ONBOARDING_PATH}/`)) {
      return null;
    }
    return withLocale(CREATOR_ONBOARDING_PATH, locale);
  }

  return null;
}
