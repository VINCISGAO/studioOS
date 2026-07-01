import { demoRedirectForRole, type DemoRole } from "@/lib/demo-auth";
import { isAdminRouteRole } from "@/lib/auth/route-access";
import { withLocale, type Locale } from "@/lib/i18n";

function adminLoginDestination(nextPath: string, locale: Locale) {
  const next = nextPath.startsWith("/") ? nextPath : "/admin";
  return withLocale(`/admin/login?next=${encodeURIComponent(next)}`, locale);
}

export function resolvePostLoginDestination(
  session: { role: DemoRole },
  nextPath: string,
  locale: Locale
) {
  if (!nextPath.startsWith("/")) {
    return withLocale(demoRedirectForRole(session.role), locale);
  }

  const isAdminPath = nextPath.startsWith("/admin");
  const isBrandPath = nextPath.startsWith("/brand");
  const isStudioPath =
    nextPath.startsWith("/studio") ||
    nextPath.startsWith("/creator") ||
    nextPath.startsWith("/workspace/studio");

  if (isAdminPath && !isAdminRouteRole(session.role)) {
    return adminLoginDestination(nextPath, locale);
  }

  if (isBrandPath && session.role !== "client" && !isAdminRouteRole(session.role)) {
    return withLocale(demoRedirectForRole(session.role), locale);
  }

  if (isStudioPath && session.role === "client") {
    return withLocale("/brand", locale);
  }

  return withLocale(nextPath, locale);
}
