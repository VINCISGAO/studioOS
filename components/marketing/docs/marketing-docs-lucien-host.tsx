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
import type { Locale } from "@/lib/i18n";

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
  locale: Locale;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [viewer, setViewer] = useState<LucienViewerSnapshot | null>(null);
  const pathname = usePathname();
  const pagePath = useMemo(() => normalizePublicLucienPagePath(pathname), [pathname]);

  const openLucien = useCallback(() => {
    setOpen(true);
    setViewer((current) => current ?? getLucienViewerSnapshot(locale));
    void prefetchLucienViewerSnapshot(locale).then(setViewer);
  }, [locale]);

  const value = useMemo(
    () => ({
      openLucien,
      viewer: viewer ?? getLucienViewerSnapshot(locale)
    }),
    [locale, openLucien, viewer]
  );

  return (
    <MarketingDocsLucienContext.Provider value={value}>
      {children}
      <PublicLucienFloatingLauncher locale={locale} hidden={open} />
      {open ? (
        <PublicLucienDrawer
          locale={locale}
          open={open}
          pagePath={pagePath}
          viewer={value.viewer}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </MarketingDocsLucienContext.Provider>
  );
}
