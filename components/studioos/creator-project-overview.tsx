"use client";

import { useState } from "react";
import { CreatorProjectCollaborationHero } from "@/components/studioos/creator-project-collaboration-hero";
import {
  CreatorProjectDetailTabs,
  type CreatorDetailTab
} from "@/components/studioos/creator-project-detail-tabs";
import { CreatorProjectOverviewHeader } from "@/components/studioos/creator-project-overview-header";
import { CreatorProjectOverviewStepper } from "@/components/studioos/creator-project-overview-stepper";
import { CreatorProjectQuickAccess } from "@/components/studioos/creator-project-quick-access";
import { CreatorProjectSuccessBanner } from "@/components/studioos/creator-project-success-banner";
import type { StoredCreativePackItem } from "@/lib/campaign-types";
import type { CreativeCollaborationView } from "@/features/creative-collaboration/creative-collaboration.types";
import type { Locale } from "@/lib/i18n";
import type { CreatorCommercialContext, CreatorCommercialStep } from "@/lib/studioos/commercial-lifecycle";
import { isActiveCreatorProject } from "@/lib/studioos/creator-order-lifecycle";
import type { StoredDeliverable, StoredOrder } from "@/lib/order-types";
import type { StoredProject } from "@/lib/project-types";
import type { ReviewComment } from "@/lib/studioos/review-comment-types";

export function CreatorProjectOverview({
  locale,
  order,
  project,
  pack,
  deliverables,
  comments,
  canUpload,
  collaborationView,
  aiEnabled,
  creatorCommercialStep,
  commercialContext
}: {
  locale: Locale;
  order: StoredOrder;
  project: StoredProject | null;
  pack: StoredCreativePackItem[];
  deliverables: StoredDeliverable[];
  comments: ReviewComment[];
  canUpload: boolean;
  collaborationView: CreativeCollaborationView | null;
  aiEnabled: boolean;
  creatorCommercialStep: CreatorCommercialStep;
  commercialContext: CreatorCommercialContext;
}) {
  const [tab, setTab] = useState<CreatorDetailTab>("brief");
  const activeProject = isActiveCreatorProject(order);
  const showUploadCta = canUpload && deliverables.length === 0;
  const referenceUrls = project?.reference_links
    ? project.reference_links.split("\n").map((item) => item.trim()).filter(Boolean)
    : [];

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-10">
      <CreatorProjectOverviewHeader
        locale={locale}
        order={order}
        project={project}
        creatorCommercialStep={creatorCommercialStep}
        commercialContext={commercialContext}
        canUpload={canUpload}
      />

      <CreatorProjectOverviewStepper
        locale={locale}
        creatorCommercialStep={creatorCommercialStep}
        commercialContext={commercialContext}
        createdAt={order.created_at}
        selectedAt={order.created_at}
      />

      <CreatorProjectSuccessBanner
        locale={locale}
        orderId={order.id}
        showCongrats={activeProject}
        showUploadCta={showUploadCta}
      />

      <CreatorProjectQuickAccess locale={locale} orderId={order.id} />

      <CreatorProjectDetailTabs
        locale={locale}
        order={order}
        project={project}
        pack={pack}
        deliverables={deliverables}
        initialComments={comments}
        canUpload={canUpload}
        activeTab={tab}
        onTabChange={setTab}
        referenceUrls={referenceUrls}
        briefSlot={
          tab === "brief" && project && collaborationView ? (
            <CreatorProjectCollaborationHero
              locale={locale}
              projectId={project.id}
              orderId={order.id}
              aiEnabled={aiEnabled}
              collaborationView={collaborationView}
            />
          ) : null
        }
      />

      <p className="pt-4 text-center text-xs text-zinc-400">
        Copyright © {new Date().getFullYear()} VINCIS. All rights reserved.
      </p>
    </div>
  );
}
