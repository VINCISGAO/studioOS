"use client";

import { useEffect, useState } from "react";
import { CreatorSelectionCelebrationDialog } from "@/components/studioos/creator-selection-celebration-dialog";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type PendingSelectionCelebration = {
  notificationId: string;
  orderId: string | null;
  projectId: string | null;
  title: string;
};

export function CreatorSelectionOrchestrator({
  locale,
  pendingCelebration,
  children
}: {
  locale: Locale;
  pendingCelebration: PendingSelectionCelebration | null;
  children: React.ReactNode;
}) {
  const [phase, setPhase] = useState<"idle" | "dim" | "glow" | "modal" | "complete">("idle");
  const [dialogOpen, setDialogOpen] = useState(false);
  const shouldCelebrate = Boolean(pendingCelebration);

  useEffect(() => {
    if (!shouldCelebrate) {
      return;
    }

    setPhase("dim");
    const glowTimer = window.setTimeout(() => setPhase("glow"), 300);
    const modalTimer = window.setTimeout(() => {
      setPhase("modal");
      setDialogOpen(true);
    }, 650);

    return () => {
      window.clearTimeout(glowTimer);
      window.clearTimeout(modalTimer);
    };
  }, [shouldCelebrate, pendingCelebration?.notificationId]);

  function handleDismiss() {
    setDialogOpen(false);
    setPhase("complete");
  }

  const showOverlay =
    shouldCelebrate && !dialogOpen && (phase === "dim" || phase === "glow");

  return (
    <>
      {showOverlay ? (
        <div
          className={cn(
            "pointer-events-none fixed inset-0 z-[60] transition-all duration-500",
            phase === "dim" && "bg-black/15",
            phase === "glow" && "bg-black/30"
          )}
        />
      ) : null}
      {shouldCelebrate && (phase === "glow" || phase === "modal") ? (
        <div className="pointer-events-none fixed inset-0 z-[61] bg-[radial-gradient(circle_at_50%_30%,rgba(251,191,36,0.25),transparent_50%)]" />
      ) : null}
      {children}
      {pendingCelebration ? (
        <CreatorSelectionCelebrationDialog
          locale={locale}
          open={dialogOpen}
          notificationId={pendingCelebration.notificationId}
          orderId={pendingCelebration.orderId}
          onDismiss={handleDismiss}
        />
      ) : null}
    </>
  );
}
