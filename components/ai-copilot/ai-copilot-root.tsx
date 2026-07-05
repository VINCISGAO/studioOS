"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AiCopilotDrawer } from "@/components/ai-copilot/ai-copilot-drawer";

const AI_WORKSPACE_PATHS = new Set([
  "/copilot",
  "/brand/ai",
  "/brand/copilot",
  "/studio/ai",
  "/studio/copilot",
  "/admin/ai",
  "/admin/copilot",
  "/creator/ai"
]);

function isPublicShellRoute(pathname: string) {
  if (pathname === "/" || pathname === "/signup" || pathname === "/admin/login") {
    return true;
  }

  return pathname === "/login" || pathname.startsWith("/login/");
}

function isAiWorkspaceRoute(pathname: string | null | undefined) {
  return pathname ? AI_WORKSPACE_PATHS.has(pathname) : false;
}

export function AiCopilotRoot() {
  const [mounted, setMounted] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const pathname = usePathname();
  const hideCopilotRoot = !pathname || isPublicShellRoute(pathname) || isAiWorkspaceRoute(pathname);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || hideCopilotRoot) {
      setAuthenticated(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    fetch("/api/v1/auth/me", { credentials: "same-origin", signal: controller.signal })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as { success?: boolean } | null;
        if (!cancelled) {
          setAuthenticated(Boolean(response.ok && payload?.success));
        }
      })
      .catch((error) => {
        if (cancelled || (error instanceof DOMException && error.name === "AbortError")) return;
        if (!cancelled) {
          setAuthenticated(false);
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

  return <AiCopilotDrawer />;
}
