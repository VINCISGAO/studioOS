/** Studio routes accessible before certification lock or without business access. */
const STUDIO_PATHS_ALWAYS_ALLOWED = [
  "/studio",
  "/studio/deposit",
  "/studio/settings",
  "/studio/works",
  "/studio/profile",
  "/studio/income"
];

export function isStudioPathAlwaysAllowed(pathname: string) {
  return STUDIO_PATHS_ALWAYS_ALLOWED.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

export function isWorkspaceStudioPath(pathname: string) {
  return (
    pathname === "/studio/review" ||
    pathname.startsWith("/studio/review/") ||
    pathname === "/workspace/studio" ||
    pathname.startsWith("/workspace/studio/")
  );
}

export function isStudioFeaturePath(pathname: string) {
  if (isStudioPathAlwaysAllowed(pathname)) {
    return false;
  }

  if (pathname === "/studio" || pathname.startsWith("/studio/")) {
    return true;
  }

  if (isWorkspaceStudioPath(pathname)) {
    return true;
  }

  if (pathname.startsWith("/workspace/projects/") && pathname.endsWith("/review")) {
    return true;
  }

  return false;
}

/** @deprecated use isStudioFeaturePath */
export function requiresStudioCertification(pathname: string) {
  return isStudioFeaturePath(pathname);
}

export function studioCertificationRedirectPath(locale: "en" | "zh") {
  return locale === "zh" ? "/studio/deposit?lang=zh" : "/studio/deposit";
}

export function studioProfileOnboardingPath(locale: "en" | "zh") {
  return locale === "zh" ? "/studio/works?lang=zh&onboarding=1" : "/studio/works?onboarding=1";
}
