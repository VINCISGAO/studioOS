"use client";

import Image from "next/image";
import Link from "next/link";
import { CertificationOnboardingFormCard } from "@/components/studioos/certification-onboarding-form-card";
import { ClientBriefFormCard } from "@/components/studioos/client-brief-form-card";
import type { MessageDetailPayload } from "@/components/studioos/studio-message-center.types";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { normalizeInternalActionHref } from "@/lib/studioos/internal-action-href";
import { cn } from "@/lib/utils";
import { Info, MoreHorizontal, Share2, Shield, Star } from "lucide-react";

const copy = {
  zh: {
    selectHint: "选择一条消息查看详情。",
    projectInfo: "项目信息",
    viewProjectDetail: "查看项目详情",
    viewProject: "查看项目",
    replyBrand: "回复品牌方"
  },
  en: {
    selectHint: "Select a message to view details.",
    projectInfo: "Project info",
    viewProjectDetail: "View project details",
    viewProject: "View project",
    replyBrand: "Reply to brand"
  }
} as const;

export function StudioMessageDetailPanel({
  locale,
  detail
}: {
  locale: Locale;
  detail: MessageDetailPayload | null;
}) {
  const t = copy[locale];

  if (!detail) {
    return (
      <section className="flex min-h-[640px] items-center justify-center rounded-[20px] border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <p className="text-sm text-zinc-500">{t.selectHint}</p>
      </section>
    );
  }

  const projectHref = detail.projectInfo
    ? normalizeInternalActionHref(detail.projectInfo.href, locale)
    : "";
  const actionHref = normalizeInternalActionHref(detail.actionHref, locale);
  const replyHref = normalizeInternalActionHref(detail.replyHref, locale);

  return (
    <section className="overflow-hidden rounded-[20px] border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
              detail.senderAvatarTone
            )}
          >
            {detail.senderName.includes("系统") ? <Shield className="h-4 w-4" /> : detail.senderInitials}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-zinc-950">{detail.senderName}</h2>
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                {detail.categoryLabel}
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-400">{detail.detailTimeLabel}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button type="button" className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600" aria-label="Favorite">
            <Star className="h-4 w-4" />
          </button>
          <button type="button" className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600" aria-label="Share">
            <Share2 className="h-4 w-4" />
          </button>
          <button type="button" className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600" aria-label="More">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-5 px-5 py-5">
        <div>
          <h3 className="text-xl font-semibold tracking-tight text-zinc-950">{detail.detailTitle}</h3>
          <p className="mt-3 text-sm font-medium text-zinc-700">{detail.salutation}</p>
          <p className="mt-3 text-sm leading-7 text-zinc-600">{detail.body}</p>
        </div>

        {detail.type !== "certification_approved" && detail.projectInfo ? (
          <div className="rounded-[18px] border border-zinc-200 bg-zinc-50/70 p-4">
            <p className="text-sm font-semibold text-zinc-900">{t.projectInfo}</p>
            <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-zinc-200">
                  <Image
                    src={detail.projectInfo.thumbnailUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="64px"
                    unoptimized
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-950">{detail.projectInfo.title}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {locale === "zh" ? "项目编号：" : "Project code: "}
                    {detail.projectInfo.code}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {locale === "zh" ? "当前阶段：" : "Current stage: "}
                    {detail.projectInfo.stage}
                  </p>
                </div>
              </div>
              <Button asChild variant="outline" size="sm" className="rounded-lg border-zinc-200 bg-white">
                <Link href={projectHref}>{t.viewProjectDetail}</Link>
              </Button>
            </div>
          </div>
        ) : null}

        {detail.nextStep ? (
          <div className="flex gap-3 rounded-[18px] border border-violet-100 bg-violet-50/70 px-4 py-4">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600">
              <Info className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-violet-900">{detail.nextStep.title}</p>
              <p className="mt-1 text-sm leading-6 text-violet-800/90">{detail.nextStep.body}</p>
            </div>
          </div>
        ) : null}

        {detail.type === "certification_approved" && detail.fields.length > 0 ? (
          <CertificationOnboardingFormCard locale={locale} fields={detail.fields} />
        ) : detail.fields.length > 0 ? (
          <ClientBriefFormCard
            locale={locale}
            fields={detail.fields}
            formId={detail.formId}
            projectTitle={detail.projectTitle}
          />
        ) : null}
      </div>

      <div className="flex flex-col gap-3 border-t border-zinc-100 px-5 py-4 sm:flex-row">
        {detail.type === "certification_approved" ? (
          <Button asChild className="rounded-xl bg-violet-600 hover:bg-violet-700 sm:flex-1">
            <Link href={actionHref}>{detail.actionLabel}</Link>
          </Button>
        ) : (
          <>
            <Button asChild className="rounded-xl bg-violet-600 hover:bg-violet-700 sm:flex-1">
              <Link href={actionHref}>{detail.actionLabel || t.viewProject}</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl border-zinc-200 sm:flex-1">
              <Link href={replyHref}>{detail.replyLabel || t.replyBrand}</Link>
            </Button>
          </>
        )}
      </div>
    </section>
  );
}
