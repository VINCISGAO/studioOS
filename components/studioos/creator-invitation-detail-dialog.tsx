"use client";

import { useMemo, useState } from "react";
import { BadgeCheck, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { ProjectThumbnailImage } from "@/components/studioos/project-thumbnail-image";
import type { CreatorPortalInvitationView } from "@/features/creator/creator-portal.types";
import type { Locale } from "@/lib/i18n";
import {
  resolveCreatorInvitationDetail,
  type CreatorInvitationDetailModel
} from "@/lib/studioos/creator-invitation-detail";
import { cn } from "@/lib/utils";

const copy = {
  en: {
    trigger: "Project details",
    subtitle: "Review the brand brief before you accept or decline.",
    briefTitle: "Campaign brief"
  },
  zh: {
    trigger: "项目详情",
    subtitle: "请先了解品牌需求，再决定是否接受邀请。",
    briefTitle: "广告需求"
  }
} as const;

export function CreatorInvitationDetailDialog({
  locale,
  invitation,
  detail,
  thumbnailUrl,
  campaignId,
  className
}: {
  locale: Locale;
  invitation: CreatorPortalInvitationView;
  detail?: CreatorInvitationDetailModel | null;
  thumbnailUrl: string;
  campaignId: string;
  className?: string;
}) {
  const t = copy[locale];
  const [open, setOpen] = useState(false);
  const resolvedDetail = useMemo(
    () => resolveCreatorInvitationDetail(invitation, locale, detail),
    [invitation, locale, detail]
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 transition hover:border-violet-300 hover:bg-violet-100",
            className
          )}
        >
          <FileText className="h-3.5 w-3.5" />
          {t.trigger}
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto sm:rounded-2xl">
        <DialogHeader className="space-y-4 text-left">
          <div className="flex gap-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-zinc-100">
              <ProjectThumbnailImage
                src={thumbnailUrl}
                seed={campaignId}
                className="absolute inset-0"
              />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                  {resolvedDetail.brandName}
                </p>
                <BadgeCheck className="h-4 w-4 text-sky-500" aria-hidden />
              </div>
              <DialogTitle className="mt-1 text-left text-xl text-zinc-950">{resolvedDetail.title}</DialogTitle>
              <DialogDescription className="mt-1 text-left text-sm text-zinc-500">
                {t.subtitle}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <section className="space-y-3 rounded-2xl border border-zinc-100 bg-zinc-50/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">{t.briefTitle}</p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">{resolvedDetail.brief}</p>
        </section>

        {resolvedDetail.fields.length ? (
          <dl className="grid gap-3 sm:grid-cols-2">
            {resolvedDetail.fields.map((field) => (
              <div key={field.label} className="rounded-xl border border-zinc-100 bg-white px-4 py-3">
                <dt className="text-xs font-medium text-zinc-500">{field.label}</dt>
                <dd className="mt-1 text-sm font-medium leading-relaxed text-zinc-900">{field.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
