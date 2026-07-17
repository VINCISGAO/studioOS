"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { MarketingDocsLucienContext } from "@/components/marketing/docs/marketing-docs-lucien-context";
import { PublicLucienFloatingLauncher } from "@/components/marketing/faq/public-lucien-floating-launcher";
import {
  getLucienViewerSnapshot,
  prefetchLucienViewerSnapshot,
  type LucienViewerSnapshot
} from "@/components/marketing/faq/lucien-viewer-identity.client";
import { normalizePublicLucienPagePath } from "@/lib/marketing/public-lucien-paths";
import type { Locale, MarketingLocale } from "@/lib/i18n";
import { asMarketingLocale } from "@/lib/marketing/i18n/resolve-marketing-copy";

const PublicLucienDrawer = dynamic(
  () =>
    import("@/components/marketing/faq/public-lucien-drawer").then((module) => ({
      default: module.PublicLucienDrawer
    })),
  { ssr: false }
);

export function MarketingDocsLucienHost({
  locale,
  children
}: {
  locale: Locale | MarketingLocale;
  children: ReactNode;
}) {
  const marketingLocale = asMarketingLocale(locale);
  const [open, setOpen] = useState(false);
  const [viewer, setViewer] = useState<LucienViewerSnapshot | null>(null);
  const pathname = usePathname();
  const pagePath = useMemo(() => normalizePublicLucienPagePath(pathname), [pathname]);

  const openLucien = useCallback(() => {
    setOpen(true);
    setViewer((current) => current ?? getLucienViewerSnapshot(marketingLocale));
    void prefetchLucienViewerSnapshot(marketingLocale).then(setViewer);
  }, [marketingLocale]);

  const value = useMemo(
    () => ({
      openLucien,
      viewer: viewer ?? getLucienViewerSnapshot(marketingLocale)
    }),
    [marketingLocale, openLucien, viewer]
  );

  return (
    <MarketingDocsLucienContext.Provider value={value}>
      {children}
      <PublicLucienFloatingLauncher locale={marketingLocale} hidden={open} />
      {open ? (
        <PublicLucienDrawer
          locale={marketingLocale}
          open={open}
          pagePath={pagePath}
          viewer={value.viewer}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </MarketingDocsLucienContext.Provider>
  );
}
