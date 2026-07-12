/** Shared portal layout constants — single source for widths, backgrounds, breakpoints. */

export const PORTAL_SIDEBAR_WIDTH_PX = 248;
export const BRIEF_SIDEBAR_WIDTH_PX = 220;
export const PORTAL_SIDEBAR_OFFSET = `${PORTAL_SIDEBAR_WIDTH_PX}px`;
export const PORTAL_BRIEF_OFFSET = `${PORTAL_SIDEBAR_WIDTH_PX + BRIEF_SIDEBAR_WIDTH_PX}px`;

export const PORTAL_SURFACE_BG = "#f8f9fb";

export const PORTAL_CONTENT_MAX = {
  default: "max-w-[1280px]",
  focus: "max-w-[920px] lg:max-w-[1280px]"
} as const;

export const PORTAL_FOOTER_INSET_PORTAL = "inset-x-0 lg:left-[248px]" as const;
export const PORTAL_FOOTER_INSET_BRIEF = "inset-x-0 lg:left-[248px] xl:left-[468px]" as const;

export function portalFooterInsetClass(options?: { briefSidebar?: boolean }) {
  return options?.briefSidebar ? PORTAL_FOOTER_INSET_BRIEF : PORTAL_FOOTER_INSET_PORTAL;
}

export const PORTAL_SAFE_BOTTOM = "pb-[max(0.5rem,env(safe-area-inset-bottom))]";
export const PORTAL_MAIN_SAFE_BOTTOM = "pb-[calc(1.5rem+env(safe-area-inset-bottom))]";
