"use client";

import { useEffect, useState } from "react";
import { BrandCreatorGlobeMatchingLoader } from "@/components/studioos/brand-creator-globe-matching-loader";
import { BrandProjectMatchTab } from "@/components/studioos/brand-project-match-tab";
import type { Locale } from "@/lib/i18n";
import type { AiMatchReportStatistics } from "@/lib/studioos/ai-match-report";
import type { StoredCreatorInvitation } from "@/lib/studioos/creator-invitation-types";

export function BrandProjectMatchTabShell({
  locale,
  projectId,
  initialInvitations,
  initialAccepted,
  selectedCreatorId = null,
  notificationCount = 0,
  projectBudgetRange,
  aiMatchStatistics,
  showPaymentSuccessMatching = false
}: {
  locale: Locale;
  projectId: string;
  projectStatus?: string;
  initialInvitations: StoredCreatorInvitation[];
  initialAccepted: StoredCreatorInvitation[];
  selectedCreatorId?: string | null;
  notificationCount?: number;
  projectBudgetRange?: string | null;
  aiMatchStatistics?: AiMatchReportStatistics | null;
  showPaymentSuccessMatching?: boolean;
}) {
  const [showMatching, setShowMatching] = useState(showPaymentSuccessMatching);

  useEffect(() => {
    if (!showPaymentSuccessMatching) return;

    const hideTimer = window.setTimeout(() => setShowMatching(false), 1400);
    const url = new URL(window.location.href);
    if (url.searchParams.get("matching") === "1") {
      url.searchParams.delete("matching");
      window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    }

    return () => window.clearTimeout(hideTimer);
  }, [showPaymentSuccessMatching]);

  return (
    <>
      {showMatching ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-white/96 p-4 backdrop-blur-md sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-busy="true"
          aria-label={locale === "zh" ? "正在匹配创作者" : "Matching creators"}
        >
          <div className="w-full max-w-4xl animate-in fade-in zoom-in-95 duration-300">
            <BrandCreatorGlobeMatchingLoader locale={locale} className="shadow-lg" />
          </div>
        </div>
      ) : null}
      <BrandProjectMatchTab
        locale={locale}
        projectId={projectId}
        invitations={initialInvitations}
        accepted={initialAccepted}
        selectedCreatorId={selectedCreatorId}
        notificationCount={notificationCount}
        projectBudgetRange={projectBudgetRange}
        aiMatchStatistics={aiMatchStatistics}
      />
    </>
  );
}
