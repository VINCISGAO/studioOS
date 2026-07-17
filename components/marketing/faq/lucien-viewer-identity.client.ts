"use client";

import { syncLucienChatAuthUser } from "@/lib/lucien/lucien-chat-storage";
import {
  publicLucienWelcomeMessage,
  resolvePublicLucienViewerIdentity,
  type PublicLucienAuthUser,
  type PublicLucienViewerIdentity
} from "@/lib/marketing/public-lucien-identity";
import type { MarketingLocale } from "@/lib/i18n";

export type LucienViewerSnapshot = {
  viewerIdentity: PublicLucienViewerIdentity;
  authUser: PublicLucienAuthUser | null;
  welcomeMessage: string;
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
};

type ViewerCache = {
  locale: MarketingLocale | null;
  snapshot: LucienViewerSnapshot | null;
  inflight: Promise<LucienViewerSnapshot> | null;
};

const viewerCache: ViewerCache = {
  locale: null,
  snapshot: null,
  inflight: null
};

function buildGuestLucienViewerSnapshot(locale: MarketingLocale): LucienViewerSnapshot {
  return {
    viewerIdentity: "guest",
    authUser: null,
    welcomeMessage: publicLucienWelcomeMessage(locale, "guest")
  };
}

function buildLucienViewerSnapshot(
  locale: MarketingLocale,
  user: PublicLucienAuthUser | null
): LucienViewerSnapshot {
  const viewerIdentity = user ? resolvePublicLucienViewerIdentity(user.role) : "guest";
  return {
    viewerIdentity,
    authUser: user,
    welcomeMessage: publicLucienWelcomeMessage(locale, viewerIdentity, user)
  };
}

async function requestLucienViewerSnapshot(locale: MarketingLocale): Promise<LucienViewerSnapshot> {
  try {
    const response = await fetch("/api/v1/auth/me", {
      credentials: "same-origin",
      cache: "no-store"
    });
    const payload = (await response.json().catch(() => null)) as ApiResponse<PublicLucienAuthUser> | null;
    if (response.ok && payload?.success && payload.data) {
      syncLucienChatAuthUser(payload.data.id);
      return buildLucienViewerSnapshot(locale, payload.data);
    }
  } catch {
    // Fall through to guest — server remains source of truth on chat API.
  }
  syncLucienChatAuthUser(null);
  return buildGuestLucienViewerSnapshot(locale);
}

export function getLucienViewerSnapshot(locale: MarketingLocale): LucienViewerSnapshot {
  if (viewerCache.locale === locale && viewerCache.snapshot) {
    return viewerCache.snapshot;
  }
  return buildGuestLucienViewerSnapshot(locale);
}

export function prefetchLucienViewerSnapshot(locale: MarketingLocale): Promise<LucienViewerSnapshot> {
  if (viewerCache.locale === locale && viewerCache.snapshot) {
    return Promise.resolve(viewerCache.snapshot);
  }
  if (viewerCache.locale === locale && viewerCache.inflight) {
    return viewerCache.inflight;
  }

  viewerCache.locale = locale;
  viewerCache.inflight = requestLucienViewerSnapshot(locale)
    .then((snapshot) => {
      viewerCache.snapshot = snapshot;
      return snapshot;
    })
    .finally(() => {
      viewerCache.inflight = null;
    });

  return viewerCache.inflight;
}
