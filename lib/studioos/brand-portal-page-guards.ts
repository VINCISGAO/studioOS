import { notFound, redirect } from "next/navigation";
import { toSafeNextPath, toSafeNextPathname } from "@/lib/auth/post-login-redirect";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";

/** Unauthenticated brand users → login with a safe post-login destination. */
export function brandPortalRequireSession(
  clientEmail: string | null | undefined,
  locale: Locale,
  returnPath: string
): asserts clientEmail is string {
  if (clientEmail) return;

  const safeNext = toSafeNextPath(returnPath) || toSafeNextPathname(returnPath) || returnPath.split("?")[0];
  redirect(
    withLocale(`/login?role=brand&next=${encodeURIComponent(safeNext)}`, locale)
  );
}

/**
 * Missing resource or cross-tenant access → 404 (same response; no existence leak).
 */
export function brandPortalRequireOwnedResource<T extends { client_email: string }>(
  resource: T | null | undefined,
  clientEmail: string
): asserts resource is T {
  if (!resource || resource.client_email.toLowerCase() !== clientEmail.toLowerCase()) {
    notFound();
  }
}

/** Authenticated but workflow/state blocks the page → brand dashboard with error code. */
export function brandPortalDenyInvalidState(locale: Locale, code: string): never {
  redirect(withLocale(`/brand?error=${encodeURIComponent(code)}`, locale));
}
