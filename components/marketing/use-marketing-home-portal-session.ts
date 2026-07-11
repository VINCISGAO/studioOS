"use client";

import { useEffect, useState } from "react";
import type { MarketingHomePortalSession } from "@/lib/marketing/portal-entry";
import { resolveMarketingHomeWorkspaceCta } from "@/lib/marketing/portal-entry";
import type { Locale, MarketingLocale } from "@/lib/i18n";

type WorkspaceCta = {
  href: string;
  label: string;
};

function mapAuthRoleToPortalSession(role: string | undefined): MarketingHomePortalSession | null {
  if (!role) return null;
  const normalized = role.toUpperCase();
  if (normalized === "CREATOR") {
    return { role: "creator" };
  }
  if (normalized === "BRAND" || normalized === "CLIENT") {
    return { role: "client" };
  }
  return null;
}

/** Client-hydrates homepage portal session when the server omits session lookup. */
export function useMarketingHomePortalSession(
  copyLocale: Locale | MarketingLocale,
  serverSession: MarketingHomePortalSession | null | undefined,
  hydrateFromClient: boolean
): { session: MarketingHomePortalSession | null; workspaceCta: WorkspaceCta | null } {
  const [session, setSession] = useState<MarketingHomePortalSession | null>(serverSession ?? null);

  useEffect(() => {
    if (!hydrateFromClient || serverSession) {
      setSession(serverSession ?? null);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    fetch("/api/v1/auth/me", { credentials: "same-origin", signal: controller.signal })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as {
          success?: boolean;
          data?: { role?: string };
        } | null;
        if (cancelled) return;
        if (!response.ok || !payload?.success) {
          setSession(null);
          return;
        }
        setSession(mapAuthRoleToPortalSession(payload.data?.role));
      })
      .catch((error) => {
        if (cancelled || (error instanceof DOMException && error.name === "AbortError")) return;
        setSession(null);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [hydrateFromClient, serverSession]);

  const workspaceCta = session ? resolveMarketingHomeWorkspaceCta(copyLocale, session) : null;
  return { session, workspaceCta };
}
