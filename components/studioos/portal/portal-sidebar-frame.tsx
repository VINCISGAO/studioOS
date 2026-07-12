"use client";

import { PORTAL_SIDEBAR_WIDTH_PX } from "@/lib/studioos/portal-layout-tokens";
import { cn } from "@/lib/utils";

export function PortalSidebarFrame({
  logo,
  nav,
  footer,
  className
}: {
  logo: React.ReactNode;
  nav: React.ReactNode;
  footer: React.ReactNode;
  className?: string;
}) {
  return (
    <aside
      className={cn(
        "hidden h-full min-h-0 shrink-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden",
        "border-r border-zinc-200/80 bg-white lg:grid",
        className
      )}
      style={{ width: PORTAL_SIDEBAR_WIDTH_PX }}
    >
      <div className="shrink-0">{logo}</div>
      <nav className="min-h-0 overflow-y-auto">{nav}</nav>
      <div className="shrink-0 border-t border-zinc-100 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {footer}
      </div>
    </aside>
  );
}
