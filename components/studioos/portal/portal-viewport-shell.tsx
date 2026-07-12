"use client";

import { useBodyScrollLock } from "@/hooks/use-body-scroll-lock";
import { PORTAL_SURFACE_BG } from "@/lib/studioos/portal-layout-tokens";
import { cn } from "@/lib/utils";

export type PortalViewportMode = "fixed" | "flow" | "review-dvh";

const modeClass: Record<PortalViewportMode, string> = {
  fixed: "fixed inset-0 z-0 flex min-h-0 flex-col overflow-hidden",
  flow: "flex min-h-screen flex-col lg:h-[100dvh] lg:max-h-[100dvh] lg:overflow-hidden",
  "review-dvh": "flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden"
};

export function PortalViewportShell({
  mode = "fixed",
  scrollLock = mode === "fixed",
  brandPortalRoot = false,
  className,
  children
}: {
  mode?: PortalViewportMode;
  scrollLock?: boolean;
  brandPortalRoot?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  useBodyScrollLock(scrollLock, "both");

  return (
    <div
      data-portal-viewport={mode}
      {...(brandPortalRoot ? { "data-brand-portal-root": "" } : {})}
      className={cn(modeClass[mode], className)}
      style={{ backgroundColor: PORTAL_SURFACE_BG }}
    >
      {children}
    </div>
  );
}
