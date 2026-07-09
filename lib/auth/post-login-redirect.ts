import { demoRedirectForRole, type DemoRole } from "@/lib/demo-auth";
import { withLocale, type Locale } from "@/lib/i18n";

function safeUserRole(role: DemoRole): DemoRole {
  return role === "creator" ? "creator" : "client";
}

export function isSafeInternalPostLoginPath(path: string) {
  return path.startsWith("/") && !path.startsWith("//") && !path.includes("\\");
}

export function resolvePostLoginDestination(
  session: { role: DemoRole },
  nextPath: string,
  locale: Locale
) {
  const role = safeUserRole(session.role);

  if (!isSafeInternalPostLoginPath(nextPath) || nextPath.startsWith("/admin")) {
    return withLocale(demoRedirectForRole(role), locale);
  }

  const isBrandPath = nextPath.startsWith("/brand");
  const isStudioPath =
    nextPath.startsWith("/studio") ||
    nextPath.startsWith("/creator") ||
    nextPath.startsWith("/workspace/studio");

  if (isBrandPath && role !== "client") {
    return withLocale(demoRedirectForRole(role), locale);
  }

  if (isStudioPath && role === "client") {
    return withLocale("/brand", locale);
  }

  return withLocale(nextPath, locale);
}
