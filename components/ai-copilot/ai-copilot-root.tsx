"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AiCopilotDrawer } from "@/components/ai-copilot/ai-copilot-drawer";

function isPublicShellRoute(pathname: string) {
  if (pathname === "/" || pathname === "/signup" || pathname === "/admin/login") {
    return true;
  }

  return pathname === "/login" || pathname.startsWith("/login/");
}

export function AiCopilotRoot() {
  const [mounted, setMounted] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    let cancelled = false;

    fetch("/api/v1/auth/me", { credentials: "same-origin" })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as { success?: boolean } | null;
        if (!cancelled) {
          setAuthenticated(Boolean(response.ok && payload?.success));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAuthenticated(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [mounted, pathname]);

  if (!mounted || !authenticated || isPublicShellRoute(pathname)) {
    return null;
  }

  return <AiCopilotDrawer />;
}
