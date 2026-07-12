"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { syncLucienChatAuthUser } from "@/lib/lucien/lucien-chat-storage";

const AiCopilotDrawer = dynamic(
  () => import("@/components/ai-copilot/ai-copilot-drawer").then((mod) => mod.AiCopilotDrawer),
  { ssr: false, loading: () => null }
);

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
  const hideCopilotRoot = !pathname || isPublicShellRoute(pathname);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || hideCopilotRoot) {
      setAuthenticated(false);
      syncLucienChatAuthUser(null);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    fetch("/api/v1/auth/me", { credentials: "same-origin", signal: controller.signal })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as {
          success?: boolean;
          data?: { id?: string };
        } | null;
        if (!cancelled) {
          const isAuthenticated = Boolean(response.ok && payload?.success);
          setAuthenticated(isAuthenticated);
          syncLucienChatAuthUser(isAuthenticated ? payload?.data?.id ?? null : null);
        }
      })
      .catch((error) => {
        if (cancelled || (error instanceof DOMException && error.name === "AbortError")) return;
        if (!cancelled) {
          setAuthenticated(false);
          syncLucienChatAuthUser(null);
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [hideCopilotRoot, mounted, pathname]);

  if (!mounted || !authenticated || hideCopilotRoot) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <AiCopilotDrawer />
    </Suspense>
  );
}
