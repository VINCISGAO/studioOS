"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ensureBrandProjectMatchAction } from "@/app/brand-project-actions";
import { BrandProjectMatchTab } from "@/components/studioos/brand-project-match-tab";
import type { Locale } from "@/lib/i18n";
import type { StoredCreatorInvitation } from "@/lib/studioos/creator-invitation-types";

function MatchTabLoadingSkeleton({ locale }: { locale: Locale }) {
  return (
    <div className="space-y-5">
      <p className="text-center text-sm text-zinc-500">
        {locale === "zh" ? "加载匹配结果…" : "Loading match results…"}
      </p>
      <div className="grid animate-pulse items-start gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,1fr)]">
        <div className="space-y-5">
          <div className="h-28 rounded-2xl bg-zinc-100" />
          <div className="h-52 rounded-2xl bg-zinc-100" />
        </div>
        <div className="h-96 rounded-2xl bg-zinc-100" />
      </div>
    </div>
  );
}

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
  const [isEnsuring, setIsEnsuring] = useState(false);

  useEffect(() => {
    setInvitations(initialInvitations);
    setAccepted(initialAccepted);
  }, [initialAccepted, initialInvitations]);

  useEffect(() => {
    const needsEnsure =
      (projectStatus === "matching" || projectStatus === "studio_selected") && invitations.length === 0;
    if (!needsEnsure || ensureStarted.current) {
      return;
    }
    ensureStarted.current = true;
    setIsEnsuring(true);

    void (async () => {
      const result = await ensureBrandProjectMatchAction(projectId, locale);
      if (result.ok) {
        setInvitations(result.invitations);
        setAccepted(result.accepted);
        router.refresh();
      }
      setIsEnsuring(false);
    })();
  }, [invitations.length, locale, projectId, projectStatus, router]);

  if (isEnsuring && invitations.length === 0) {
    return <MatchTabLoadingSkeleton locale={locale} />;
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
