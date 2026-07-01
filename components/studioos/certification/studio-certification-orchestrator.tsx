"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CertificationExperienceProvider,
  type CertificationExperiencePhase
} from "@/components/studioos/certification/certification-experience-context";
import { CertificationLevelUpDialog } from "@/components/studioos/certification/certification-level-up-dialog";
import { certificationUnlockOrder } from "@/lib/studioos/certification-experience-copy";
import type { CreatorPortalNavKey } from "@/lib/studioos/creator-portal-nav";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function StudioCertificationOrchestrator({
  locale,
  creatorId,
  isVerified,
  levelUpSeen,
  children
}: {
  locale: Locale;
  creatorId: string;
  isVerified: boolean;
  levelUpSeen: boolean;
  children: React.ReactNode;
}) {
  const storageKey = `studioos:cert-level-up:${creatorId}`;
  const [phase, setPhase] = useState<CertificationExperiencePhase>("idle");
  const [unlockedNavKeys, setUnlockedNavKeys] = useState<Set<CreatorPortalNavKey>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const shouldCelebrate = isVerified && !levelUpSeen;

  useEffect(() => {
    if (!shouldCelebrate) {
      return;
    }
    if (typeof window !== "undefined" && sessionStorage.getItem(storageKey) === "1") {
      return;
    }

    sessionStorage.setItem(storageKey, "1");
    setPhase("dim");
    const glowTimer = window.setTimeout(() => setPhase("glow"), 350);
    const modalTimer = window.setTimeout(() => {
      setPhase("modal");
      setDialogOpen(true);
    }, 700);

    return () => {
      window.clearTimeout(glowTimer);
      window.clearTimeout(modalTimer);
    };
  }, [shouldCelebrate, storageKey]);

  function handleUnlockStep(step: number) {
    setPhase("unlocking");
    const key = certificationUnlockOrder[step];
    if (!key) {
      return;
    }
    setUnlockedNavKeys((current) => new Set([...current, key]));
    if (step >= certificationUnlockOrder.length - 1) {
      window.setTimeout(() => setPhase("complete"), 600);
    }
  }

  const contextValue = useMemo(
    () => ({
      phase,
      unlockedNavKeys,
      isAnimating: shouldCelebrate && phase !== "idle" && phase !== "complete"
    }),
    [phase, shouldCelebrate, unlockedNavKeys]
  );

  const showOverlay =
    shouldCelebrate && (phase === "dim" || phase === "glow" || phase === "modal" || phase === "unlocking");

  return (
    <CertificationExperienceProvider value={contextValue}>
      {showOverlay ? (
        <div
          className={cn(
            "pointer-events-none fixed inset-0 z-[60] transition-all duration-500",
            phase === "dim" && "bg-black/20",
            phase === "glow" && "bg-black/35",
            (phase === "modal" || phase === "unlocking") && "bg-black/45"
          )}
        />
      ) : null}
      {shouldCelebrate && (phase === "glow" || phase === "modal" || phase === "unlocking") ? (
        <div className="pointer-events-none fixed inset-0 z-[61] bg-[radial-gradient(circle_at_20%_20%,rgba(139,92,246,0.22),transparent_45%)]" />
      ) : null}
      {children}
      {shouldCelebrate ? (
        <CertificationLevelUpDialog locale={locale} open={dialogOpen} onUnlockStep={handleUnlockStep} />
      ) : null}
    </CertificationExperienceProvider>
  );
}
