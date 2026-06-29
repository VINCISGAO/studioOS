/**
 * Product UI theme — delegates to lib/design/tokens (Sprint 11)
 * @deprecated Prefer importing studioClasses from @/lib/design
 */
import { colors, studioClasses } from "@/lib/design/tokens";

export const shellBg = studioClasses.shellBg;

export const portalChrome = {
  header: studioClasses.portalHeader,
  logo: studioClasses.portalLogo,
  badge: studioClasses.portalBadge,
  ghost: studioClasses.portalGhost,
  cta: "h-10 rounded-button bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90",
  card: studioClasses.portalCard,
  eyebrow: studioClasses.portalEyebrow,
  title: studioClasses.portalTitle,
  body: studioClasses.portalBody
} as const;

export const brandAccent = {
  text: studioClasses.brandAccentText,
  mesh: "radial-gradient(ellipse 60% 40% at 0% 0%, hsl(var(--brand) / 0.06), transparent 55%)",
  check: "bg-muted text-brand"
} as const;

export const studioAccent = {
  text: studioClasses.studioAccentText,
  mesh: "radial-gradient(ellipse 60% 40% at 0% 0%, hsl(var(--studio) / 0.06), transparent 55%)",
  check: "bg-muted text-studio"
} as const;

export const brandTheme = {
  pageBg: shellBg,
  heroRing: "ring-border/80",
  avatarBg: "bg-primary",
  tabActive: "border-primary text-foreground",
  tabIdle: "border-transparent text-muted-foreground hover:text-foreground",
  badge: "bg-muted text-muted-foreground ring-0",
  statPill: "bg-muted text-foreground ring-1 ring-border/80",
  cardRing: "ring-border/80"
} as const;

/** @deprecated */
export const brandProductTheme = { shellBg, ...portalChrome };
export const studioProductTheme = {
  shellBg,
  ...portalChrome,
  navActive: "bg-primary text-primary-foreground",
  navIdle: portalChrome.ghost
};
export const productTheme = brandProductTheme;

export { colors as productColors };
