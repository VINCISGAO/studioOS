"use client";

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
  aiMatchStatistics
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
}) {
  return (
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
  );
}
