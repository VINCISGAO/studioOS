"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { MarketingDocsLucienContext } from "@/components/marketing/docs/marketing-docs-lucien-context";
import {
  getLucienViewerSnapshot,
  prefetchLucienViewerSnapshot
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
  const [viewer, setViewer] = useState(() => getLucienViewerSnapshot(locale));
  const pathname = usePathname();
  const pagePath = useMemo(() => normalizePublicLucienPagePath(pathname), [pathname]);

  useEffect(() => {
    setViewer(getLucienViewerSnapshot(locale));
  }, [locale]);

  const openLucien = useCallback(() => {
    setOpen(true);
    void prefetchLucienViewerSnapshot(locale).then(setViewer);
  }, [locale]);

  const value = useMemo(
    () => ({
      openLucien,
      viewer
    }),
    [openLucien, viewer]
  );

  return (
    <MarketingDocsLucienContext.Provider value={value}>
      {children}
      {open ? (
        <PublicLucienDrawer
          locale={locale}
          open={open}
          pagePath={pagePath}
          viewer={viewer}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </MarketingDocsLucienContext.Provider>
  );
}
