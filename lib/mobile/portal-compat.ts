/** Shared mobile-safe class fragments — web + future native shell */
export const mobileTouch = {
  /** Minimum 44×44 tap target (Apple HIG / Material) */
  button: "min-h-11 min-w-11",
  /** Comfortable primary CTA (48px) */
  cta: "min-h-12 px-4",
  /** Icon-only control in header/toolbar */
  iconButton: "inline-flex h-11 w-11 items-center justify-center",
  /** Bottom safe area for fixed footers / tab bars */
  safeBottom: "pb-[max(1rem,env(safe-area-inset-bottom))]"
} as const;
