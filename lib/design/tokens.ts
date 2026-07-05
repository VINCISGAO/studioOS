/**
 * VINCIS Design Tokens — single source of truth (Sprint 11)
 * Synced to globals.css CSS variables + tailwind.config.ts
 * @see docs/design/DESIGN_SYSTEM.md
 */

export const spacing = {
  xs: "4px",
  sm: "8px",
  md: "16px",
  lg: "24px",
  xl: "32px"
} as const;

export const radius = {
  button: "14px",
  input: "14px",
  card: "28px",
  dialog: "28px",
  video: "20px",
  badge: "10px"
} as const;

export const buttonHeight = {
  sm: "32px",
  md: "40px",
  lg: "48px"
} as const;

export const sidebarWidth = {
  brand: "280px",
  compact: "248px"
} as const;

export const wizard = {
  steps: 7,
  stepCircle: "36px",
  stepGap: "24px"
} as const;

export const reviewTimeline = {
  height: "56px",
  markerSize: "10px",
  markerHoverScale: 1.15
} as const;

export const motion = {
  micro: "200ms",
  page: "300ms",
  ease: "cubic-bezier(0, 0, 0.2, 1)",
  hoverScaleMax: 1.02
} as const;

export const colors = {
  reviewAnnotation: "#FF4D4F",
  shellBackground: "#fafaf8"
} as const;

/** Tailwind class helpers — use instead of raw zinc/blue in portal UI */
export const studioClasses = {
  shellBg: "bg-surface-secondary",
  portalHeader: "border-b border-border/80 bg-background/90 backdrop-blur",
  portalLogo: "flex h-8 w-8 items-center justify-center rounded-[10px] bg-primary text-primary-foreground",
  portalBadge: "rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground",
  portalGhost: "text-muted-foreground hover:bg-muted hover:text-foreground",
  portalCard: "rounded-card border border-border/80 bg-card shadow-sm",
  portalEyebrow: "text-label uppercase tracking-[0.14em] text-muted-foreground",
  portalTitle: "text-title text-foreground",
  portalBody: "text-body text-muted-foreground",
  brandAccentText: "text-brand",
  studioAccentText: "text-studio"
} as const;

export const typography = {
  display: "text-display",
  title: "text-title",
  subtitle: "text-subtitle",
  body: "text-body",
  caption: "text-caption",
  label: "text-label"
} as const;
