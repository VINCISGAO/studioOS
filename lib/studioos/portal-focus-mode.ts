/**
 * Portal layout helpers — wizard/checkout narrow content and review workspace focus mode.
 * Review workspace defaults to the normal portal layout. Users can opt into
 * fullscreen focus mode with `focus=1`.
 */

export const REVIEW_FOCUS_SEARCH_PARAM = "focus";
export const REVIEW_FOCUS_THEME_PARAM = "focusTheme";

export type ReviewFocusTheme = "light" | "dark";

export function parseReviewSearchParams(search: string) {
  const normalized = search.startsWith("?") ? search.slice(1) : search;
  return new URLSearchParams(normalized);
}

export function getReviewFocusTheme(search: string): ReviewFocusTheme {
  const value = parseReviewSearchParams(search).get(REVIEW_FOCUS_THEME_PARAM);
  return value === "light" ? "light" : "dark";
}

export function isBrandPortalProjectReviewRoute(pathname: string): boolean {
  return /\/brand\/projects\/[^/]+\/review/.test(pathname);
}

/** Brand or creator review workspace (not the review hub list). */
export function isReviewPortalWorkspaceRoute(pathname: string): boolean {
  return isBrandPortalProjectReviewRoute(pathname) || isCreatorPortalReviewRoute(pathname);
}

/** Default OFF for review workspace routes; pass `focus=1` to enter focus mode. */
export function isReviewFocusModeActive(search: string): boolean {
  const value = parseReviewSearchParams(search).get(REVIEW_FOCUS_SEARCH_PARAM);
  return value === "1" || value === "true";
}

export function buildReviewFocusSearch(search: string, active: boolean): string {
  const params = parseReviewSearchParams(search);
  if (active) {
    params.set(REVIEW_FOCUS_SEARCH_PARAM, "1");
    if (!params.has(REVIEW_FOCUS_THEME_PARAM)) {
      params.set(REVIEW_FOCUS_THEME_PARAM, "dark");
    }
  } else {
    params.delete(REVIEW_FOCUS_SEARCH_PARAM);
    params.delete(REVIEW_FOCUS_THEME_PARAM);
  }
  const next = params.toString();
  return next ? `?${next}` : "";
}

export function buildReviewFocusThemeSearch(search: string, theme: ReviewFocusTheme): string {
  const params = parseReviewSearchParams(search);
  params.set(REVIEW_FOCUS_THEME_PARAM, theme);
  const next = params.toString();
  return next ? `?${next}` : "";
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
