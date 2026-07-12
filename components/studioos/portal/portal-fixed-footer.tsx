"use client";

import { portalFooterInsetClass, PORTAL_SAFE_BOTTOM } from "@/lib/studioos/portal-layout-tokens";
import { cn } from "@/lib/utils";

export function PortalFixedFooter({
  briefSidebar = false,
  zIndex = "z-30",
  className,
  innerClassName,
  children
}: {
  briefSidebar?: boolean;
  zIndex?: string;
  className?: string;
  innerClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <footer
      className={cn(
        "fixed bottom-0 border-t border-zinc-200/80 bg-white/95 backdrop-blur",
        "supports-[backdrop-filter]:bg-white/90",
        portalFooterInsetClass({ briefSidebar }),
        zIndex,
        className
      )}
    >
      <div className={cn("w-full", PORTAL_SAFE_BOTTOM, innerClassName)}>{children}</div>
    </footer>
  );
}
