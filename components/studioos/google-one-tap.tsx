"use client";

import { useEffect, useRef } from "react";
import type { Locale } from "@/lib/i18n";
import type { LoginRole } from "@/lib/studioos/login-theme";

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
            context?: "signin" | "signup" | "use";
            ux_mode?: "popup" | "redirect";
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: () => void;
        };
      };
    };
  }
}

const GOOGLE_ID_SCRIPT = "https://accounts.google.com/gsi/client";

function loadGoogleIdentityScript() {
  const existing = document.querySelector<HTMLScriptElement>(`script[src="${GOOGLE_ID_SCRIPT}"]`);
  if (existing) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = GOOGLE_ID_SCRIPT;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Identity Services."));
    document.head.appendChild(script);
  });
}

export function GoogleOneTap({
  clientId,
  locale,
  role,
  nextPath,
  enabled
}: {
  clientId: string;
  locale: Locale;
  role: LoginRole;
  nextPath: string;
  enabled: boolean;
}) {
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!enabled || !clientId || initializedRef.current) return;
    let cancelled = false;

    void loadGoogleIdentityScript()
      .then(() => {
        if (cancelled || !window.google?.accounts?.id) return;
        initializedRef.current = true;
        window.google.accounts.id.initialize({
          client_id: clientId,
          context: "signin",
          ux_mode: "popup",
          auto_select: false,
          cancel_on_tap_outside: true,
          callback: async ({ credential }) => {
            if (!credential) return;
            const response = await fetch("/api/auth/google-one-tap", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                credential,
                role,
                lang: locale,
                next: nextPath
              })
            }).catch(() => null);
            const payload = (await response?.json().catch(() => null)) as {
              ok?: boolean;
              redirectTo?: string;
            } | null;
            if (payload?.redirectTo) {
              window.location.href = payload.redirectTo;
            }
          }
        });
        window.google.accounts.id.prompt();
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [clientId, enabled, locale, nextPath, role]);

  return null;
}
