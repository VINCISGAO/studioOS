/** Canonical layout boundaries for VINCIS surface areas. */

export const LAYOUT_KINDS = ["marketing", "portal", "public"] as const;
export type LayoutKind = (typeof LAYOUT_KINDS)[number];

/** Public profile / portfolio pages — never marketing chrome. */
export const PUBLIC_ROUTE_PREFIXES = ["/brands/", "/creators/"] as const;

/** Marketing-only chrome — forbidden on Public Layout routes. */
export const FORBIDDEN_PUBLIC_CHROME_IMPORTS = [
  "CinematicNav",
  "MarketingHeader",
  "MarketingShell",
  "MarketingDocsShell",
  "MarketingFooter"
] as const;

/** Import path fragments that imply marketing / portal chrome (including indirect imports). */
export const FORBIDDEN_PUBLIC_IMPORT_PATHS = [
  "components/marketing/",
  "marketing/cinematic",
  "marketing-header",
  "marketing-shell",
  "marketing-docs",
  "marketing-footer",
  "cinematic-nav",
  "components/page-shell",
  "login-page-shell",
  "brand-portal-header",
  "brand-portal-sidebar",
  "studio-portal-shell",
  "brand-portal-shell"
] as const;

/** Route hrefs that must not appear on public profile pages. */
export const FORBIDDEN_PUBLIC_ROUTE_HREFS = [
  "/pricing",
  "/how-it-works",
  "/faq",
  "/login",
  "/signup",
  "/cases",
  "/resources"
] as const;

/** Marketing CTA copy that must not appear on public profile pages. */
export const FORBIDDEN_PUBLIC_MARKETING_LABELS = [
  "Pricing",
  "How it works",
  "How It Works",
  "Sign Up",
  "Sign up",
  "Get Started",
  "Book a Demo",
  "价格",
  "如何运作",
  "登录",
  "注册"
] as const;

export function isPublicRoutePath(pathname: string) {
  return PUBLIC_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix.slice(0, -1) || pathname.startsWith(prefix)
  );
}
