"use client";

import { createContext, useContext } from "react";
import type { LucienViewerSnapshot } from "@/components/marketing/faq/lucien-viewer-identity.client";

export type MarketingDocsLucienContextValue = {
  openLucien: () => void;
  viewer: LucienViewerSnapshot;
};

export const MarketingDocsLucienContext = createContext<MarketingDocsLucienContextValue | null>(null);

export function useMarketingDocsLucien() {
  const context = useContext(MarketingDocsLucienContext);
  if (!context) {
    throw new Error("useMarketingDocsLucien must be used within MarketingDocsLucienHost");
  }
  return context;
}
