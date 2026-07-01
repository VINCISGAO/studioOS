"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ensureBrandProjectMatchAction } from "@/app/brand-project-actions";
import { BrandCreatorGlobeMatchingLoader } from "@/components/studioos/brand-creator-globe-matching-loader";
import { BrandProjectMatchTab } from "@/components/studioos/brand-project-match-tab";
import type { Locale } from "@/lib/i18n";
import type { StoredCreatorInvitation } from "@/lib/studioos/creator-invitation-types";

const MIN_LOADER_MS = 1200;

export function BrandProjectMatchTabShell({
  locale,
  projectId,
  projectStatus,
  initialInvitations,
  initialAccepted,
  notificationCount = 0,
  projectBudgetRange
}: {
  locale: Locale;
  projectId: string;
  projectStatus: string;
  initialInvitations: StoredCreatorInvitation[];
  initialAccepted: StoredCreatorInvitation[];
  notificationCount?: number;
  projectBudgetRange?: string | null;
}) {
  const router = useRouter();
  const ensureStarted = useRef(false);
  const [invitations, setInvitations] = useState(initialInvitations);
  const [accepted, setAccepted] = useState(initialAccepted);
  const [showLoader, setShowLoader] = useState(
    () => (projectStatus === "matching" || projectStatus === "studio_selected") && initialInvitations.length === 0
  );
  const [loaderComplete, setLoaderComplete] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setInvitations(initialInvitations);
    setAccepted(initialAccepted);
  }, [initialAccepted, initialInvitations]);

  useEffect(() => {
    const needsEnsure =
      (projectStatus === "matching" || projectStatus === "studio_selected") && invitations.length === 0;
    if (!needsEnsure) {
      setShowLoader(false);
      return;
    }
    if (ensureStarted.current) {
      return;
    }
    ensureStarted.current = true;

    setShowLoader(true);
    setLoaderComplete(false);
    const started = Date.now();

    startTransition(async () => {
      const result = await ensureBrandProjectMatchAction(projectId, locale);
      const elapsed = Date.now() - started;
      const waitMs = Math.max(0, MIN_LOADER_MS - elapsed);

      if (result.ok) {
        setInvitations(result.invitations);
        setAccepted(result.accepted);
      }

      window.setTimeout(() => {
        setLoaderComplete(true);
        window.setTimeout(() => {
          setShowLoader(false);
          if (result.ok) {
            router.refresh();
          }
        }, 320);
      }, waitMs);
    });
  }, [invitations.length, locale, projectId, projectStatus, router]);

  if (showLoader || isPending) {
    return <BrandCreatorGlobeMatchingLoader locale={locale} complete={loaderComplete} />;
  }

  return (
    <BrandProjectMatchTab
      locale={locale}
      projectId={projectId}
      invitations={invitations}
      accepted={accepted}
      notificationCount={notificationCount}
      projectBudgetRange={projectBudgetRange}
    />
  );
}
