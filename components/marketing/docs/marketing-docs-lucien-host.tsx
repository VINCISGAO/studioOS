"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { usePathname } from "next/navigation";
import { PublicLucienDrawer } from "@/components/marketing/faq/public-lucien-drawer";
import {
  getLucienViewerSnapshot,
  prefetchLucienViewerSnapshot,
  type LucienViewerSnapshot
} from "@/components/marketing/faq/lucien-viewer-identity.client";
import { normalizePublicLucienPagePath } from "@/lib/marketing/public-lucien-paths";
import type { Locale } from "@/lib/i18n";

type MarketingDocsLucienContextValue = {
  openLucien: () => void;
  viewer: LucienViewerSnapshot;
};

const MarketingDocsLucienContext = createContext<MarketingDocsLucienContextValue | null>(null);

export function useMarketingDocsLucien() {
  const context = useContext(MarketingDocsLucienContext);
  if (!context) {
    throw new Error("useMarketingDocsLucien must be used within MarketingDocsLucienHost");
  }
  return context;
}

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
    let cancelled = false;

    void prefetchLucienViewerSnapshot(locale).then((snapshot) => {
      if (!cancelled) setViewer(snapshot);
    });

    return () => {
      cancelled = true;
    };
  }, [locale]);

  const value = useMemo(
    () => ({
      openLucien: () => setOpen(true),
      viewer
    }),
    [viewer]
  );

  return (
    <MarketingDocsLucienContext.Provider value={value}>
      {children}
      <PublicLucienDrawer
        locale={locale}
        open={open}
        pagePath={pagePath}
        viewer={viewer}
        onClose={() => setOpen(false)}
      />
    </MarketingDocsLucienContext.Provider>
  );
}
