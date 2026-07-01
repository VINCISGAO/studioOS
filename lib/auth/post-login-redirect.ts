import { demoRedirectForRole, type DemoRole } from "@/lib/demo-auth";
import { withLocale, type Locale } from "@/lib/i18n";

export function resolvePostLoginDestination(
  session: { role: DemoRole },
  nextPath: string,
  locale: Locale
) {
  if (!nextPath.startsWith("/")) {
    return withLocale(demoRedirectForRole(session.role), locale);
  }

  const isBrandPath = nextPath.startsWith("/brand");
  const isStudioPath =
    nextPath.startsWith("/studio") ||
    nextPath.startsWith("/creator") ||
    nextPath.startsWith("/workspace/studio");

  if (isBrandPath && session.role !== "client") {
    return withLocale(demoRedirectForRole(session.role), locale);
  }

  if (isStudioPath && session.role === "client") {
    return withLocale("/brand", locale);
  }

  return withLocale(nextPath, locale);
}
