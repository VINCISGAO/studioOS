/**
 * Portal "focus mode" — immersive layouts for wizard, checkout, and review flows.
 * Applies only below the Tailwind `lg` breakpoint (1024px); desktop always uses the
 * standard shell with sidebar, full-width content, and default header.
 */

export function isBrandPortalProjectReviewRoute(pathname: string): boolean {
  return /\/brand\/projects\/[^/]+\/review/.test(pathname);
}

/** Narrow-content / task-focused brand routes (excludes project review room). */
export function isBrandPortalFocusRoute(pathname: string): boolean {
  if (isBrandPortalProjectReviewRoute(pathname)) {
    return false;
  }
  return (
    pathname.includes("/projects/new") ||
    pathname.includes("/studios") ||
    pathname.includes("/checkout") ||
    /\/brand\/(campaigns|projects)\/[^/]+$/.test(pathname)
  );
}

export function isBrandPortalWizardCreateRoute(pathname: string): boolean {
  return pathname.includes("/projects/new");
}

export function isCreatorPortalReviewRoute(pathname: string): boolean {
  return (
    /\/workspace\/projects\/[^/]+\/review$/.test(pathname) ||
    /\/studio\/review\/[^/]+$/.test(pathname)
  );
}
