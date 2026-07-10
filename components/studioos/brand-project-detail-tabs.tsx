"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ClientBriefFormCard } from "@/components/studioos/client-brief-form-card";
import { BrandReviewWorkflowPanel } from "@/components/studioos/brand-review-workflow-panel";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { buildConfirmedBriefSnapshot } from "@/lib/studioos/confirmed-brief";
import type { ReviewComment } from "@/lib/studioos/review-store";
import type { StoredDeliverable, StoredOrder } from "@/lib/order-types";
import type { StoredProject } from "@/lib/project-types";
import { cn } from "@/lib/utils";
import { ChevronDown, FileText, FolderOpen, History, Play } from "lucide-react";

export type OverviewDetailTab = "brief" | "assets" | "versions" | "audit";

const tabs: { id: OverviewDetailTab; label: { en: string; zh: string }; icon: typeof FileText }[] = [
  { id: "brief", label: { en: "Ad requirements", zh: "广告需求" }, icon: FileText },
  { id: "assets", label: { en: "Assets", zh: "素材文件" }, icon: FolderOpen },
  { id: "versions", label: { en: "Versions", zh: "作品版本" }, icon: Play },
  { id: "audit", label: { en: "Review log", zh: "审核记录" }, icon: History }
];

const copy = {
  en: {
    expand: "Show more",
    collapse: "Show less",
    assetsEmpty: "Brand assets will appear here once uploaded.",
    versionsEmpty: "No video versions uploaded yet.",
    auditEmpty: "Review history appears after the first upload.",
    version: (n: number) => `Version ${n}`,
    openReview: "Open review room"
  },
  zh: {
    expand: "展开更多内容",
    collapse: "收起内容",
    assetsEmpty: "品牌上传的素材将显示在这里。",
    versionsEmpty: "暂无作品版本。",
    auditEmpty: "上传作品后将显示审核记录。",
    version: (n: number) => `版本 V${n}`,
    openReview: "进入审片室"
  }
};

export function BrandProjectDetailTabs({
  locale,
  project,
  activeTab,
  projectId,
  linkedOrder,
  deliverables,
  reviewComments
}: {
  locale: Locale;
  project: StoredProject;
  activeTab: OverviewDetailTab;
  projectId: string;
  linkedOrder: StoredOrder | null;
  deliverables: StoredDeliverable[];
  reviewComments: ReviewComment[];
}) {
  const t = copy[locale];
  const [expanded, setExpanded] = useState(false);
  const snapshot = useMemo(() => buildConfirmedBriefSnapshot(project, locale), [project, locale]);
  const visibleFields = expanded ? snapshot.fields : snapshot.fields.slice(0, 5);
  const formId = project.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12).toUpperCase() || project.id.slice(0, 8);

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
      <nav className="flex gap-1 overflow-x-auto border-b border-zinc-100 px-4" aria-label="Project details">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <Link
              key={tab.id}
              href={withLocale(`/brand/projects/${projectId}?tab=${tab.id}`, locale)}
              className={cn(
                "relative flex shrink-0 items-center gap-2 px-4 py-3.5 text-sm font-medium transition",
                active ? "text-violet-700" : "text-zinc-500 hover:text-zinc-800"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label[locale]}
              {active ? <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-violet-600" /> : null}
            </Link>
          );
        })}
      </nav>

      <div className="p-5 sm:p-6">
        {activeTab === "brief" ? (
          <div className="space-y-4">
            {visibleFields.length ? (
              <ClientBriefFormCard
                locale={locale}
                fields={visibleFields}
                projectTitle={project.title}
                formId={formId}
              />
            ) : (
              <p className="text-sm text-zinc-500">{locale === "zh" ? "暂无需求内容。" : "No brief details yet."}</p>
            )}
            {snapshot.fields.length > 5 ? (
              <Button type="button" variant="ghost" className="h-9 gap-1 text-violet-700" onClick={() => setExpanded((v) => !v)}>
                {expanded ? t.collapse : t.expand}
                <ChevronDown className={cn("h-4 w-4 transition", expanded && "rotate-180")} />
              </Button>
            ) : null}
          </div>
        ) : null}

        {activeTab === "assets" ? (
          <p className="text-sm text-zinc-500">{t.assetsEmpty}</p>
        ) : null}

        {activeTab === "versions" ? (
          deliverables.length ? (
            <ul className="space-y-3">
              {deliverables.map((item) => (
                <li key={item.id} className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50/50 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{t.version(item.version)}</p>
                    <p className="text-xs text-zinc-500">{item.created_at?.split("T")[0] ?? ""}</p>
                  </div>
                  <Button asChild size="sm" variant="outline" className="rounded-lg">
                    <Link href={withLocale(`/brand/projects/${projectId}/review`, locale)}>{t.openReview}</Link>
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-500">{t.versionsEmpty}</p>
          )
        ) : null}

        {activeTab === "audit" ? (
          linkedOrder && (deliverables.length || reviewComments.length) ? (
            <BrandReviewWorkflowPanel
              locale={locale}
              projectId={projectId}
              order={linkedOrder}
              deliverables={deliverables}
              comments={reviewComments}
            />
          ) : (
            <p className="text-sm text-zinc-500">{t.auditEmpty}</p>
          )
        ) : null}
      </div>
    </section>
  );
}
