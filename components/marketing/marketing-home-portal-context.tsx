"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useMarketingHomePortalSession } from "@/components/marketing/use-marketing-home-portal-session";
import type { MarketingHomePortalSession } from "@/lib/marketing/portal-entry";
import type { Locale, MarketingLocale } from "@/lib/i18n";

type MarketingHomePortalContextValue = {
  session: MarketingHomePortalSession | null;
  workspaceCta: { href: string; label: string } | null;
};

const MarketingHomePortalContext = createContext<MarketingHomePortalContextValue | null>(null);

/** Single client auth hydrate for homepage nav + hero (avoids duplicate /api/v1/auth/me). */
export function MarketingHomePortalProvider({
  copyLocale,
  children
}: {
  copyLocale: Locale | MarketingLocale;
  children: ReactNode;
}) {
  const value = useMarketingHomePortalSession(copyLocale, null, true);
  return <MarketingHomePortalContext.Provider value={value}>{children}</MarketingHomePortalContext.Provider>;
}

export function useMarketingHomePortalContext(): MarketingHomePortalContextValue {
  const value = useContext(MarketingHomePortalContext);
  if (!value) {
    throw new Error("MarketingHomePortalProvider is required when hydratePortalSession is enabled.");
  }
  return value;
}

export function useResolvedMarketingHomePortal({
  hydrateFromClient,
  serverSession = null,
  serverWorkspaceCta = null
}: {
  hydrateFromClient: boolean;
  serverSession?: MarketingHomePortalSession | null;
  serverWorkspaceCta?: { href: string; label: string } | null;
}): MarketingHomePortalContextValue {
  const hydrated = useContext(MarketingHomePortalContext);

  if (hydrateFromClient) {
    if (!hydrated) {
      throw new Error("MarketingHomePortalProvider is required when hydratePortalSession is enabled.");
    }
    return hydrated;
  }

  return {
    session: serverSession,
    workspaceCta: serverWorkspaceCta
  };
}
