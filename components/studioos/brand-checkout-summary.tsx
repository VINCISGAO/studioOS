"use client";

import { Calendar, ClipboardCheck, Clock3, Lock, Shield } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import type { StoredProject } from "@/lib/project-types";

const copy = {
  en: {
    summary: "Campaign summary",
    budget: "Budget range",
    deadline: "Deadline",
    delivery: "Est. delivery",
    videos: "videos",
    escrowTitle: "Escrow protection",
    escrowBody: "Funds are held in escrow until you confirm delivery. They are released only after review approval.",
    fundTitle: "Fund security",
    fundBody: "Full escrow — released per agreed milestones",
    performanceTitle: "Performance guarantee",
    performanceBody: "Appeal if delivery is incomplete or off-brief",
    privacyTitle: "Privacy protection",
    privacyBody: "Account and payment data encrypted end-to-end"
  },
  zh: {
    summary: "CAMPAIGN 摘要",
    budget: "预算区间",
    deadline: "截止日期",
    delivery: "预计交付",
    videos: "支视频",
    escrowTitle: "托管保障",
    escrowBody: "款项托管至你确认交付后释放，审片通过后才会结算给 Studio。",
    fundTitle: "资金安全",
    fundBody: "全程托管，按双方约定释放",
    performanceTitle: "履约保障",
    performanceBody: "未完成交付或不符合要求可申诉",
    privacyTitle: "隐私保护",
    privacyBody: "账户与支付信息全程加密保护"
  }
} as const;

function EscrowFeature({
  icon: Icon,
  title,
  body
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-600">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-sm font-semibold text-zinc-900">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">{body}</p>
      </div>
    </div>
  );
}

export function BrandCheckoutSummary({
  locale,
  project,
  deliveryLabel
}: {
  locale: Locale;
  project: StoredProject;
  deliveryLabel: string;
}) {
  const t = copy[locale];
  const videoCount = project.video_count ?? project.output_quantity ?? 1;

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
        <div className="p-6">
          <div className="flex gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">{t.summary}</p>
              <h2 className="mt-2 text-xl font-semibold text-zinc-950">
                {project.title || project.product_name}
              </h2>
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-zinc-600">
                {project.campaign_goal || project.notes || "—"}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {project.target_platform ? (
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
                    {project.target_platform}
                  </span>
                ) : null}
                {project.video_format ? (
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
                    {project.video_format}
                  </span>
                ) : null}
                <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
                  {videoCount} {t.videos}
                </span>
              </div>
            </div>
            <div className="relative hidden h-24 w-20 shrink-0 sm:block" aria-hidden>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-50 to-sky-50 ring-1 ring-indigo-100" />
              <div className="absolute left-3 top-4 h-14 w-12 rounded-lg bg-white shadow-sm ring-1 ring-zinc-100" />
              <div className="absolute left-5 top-7 h-8 w-8 rounded-full bg-indigo-500/80" />
              <div className="absolute bottom-4 right-3 h-2 w-2 rounded-full bg-sky-400" />
            </div>
          </div>

          <dl className="mt-6 space-y-3 border-t border-zinc-100 pt-5 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-zinc-500">{t.budget}</dt>
              <dd className="font-semibold text-zinc-900">{project.budget_range || "—"}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="flex items-center gap-1.5 text-zinc-500">
                <Calendar className="h-3.5 w-3.5" />
                {t.deadline}
              </dt>
              <dd className="font-semibold text-zinc-900">{project.deadline || "—"}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="flex items-center gap-1.5 text-zinc-500">
                <Clock3 className="h-3.5 w-3.5" />
                {t.delivery}
              </dt>
              <dd className="font-semibold text-zinc-900">{deliveryLabel}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
            <Shield className="h-4 w-4" />
          </div>
          <h3 className="text-base font-semibold text-zinc-950">{t.escrowTitle}</h3>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-zinc-500">{t.escrowBody}</p>
        <div className="mt-5 space-y-4">
          <EscrowFeature icon={Shield} title={t.fundTitle} body={t.fundBody} />
          <EscrowFeature icon={ClipboardCheck} title={t.performanceTitle} body={t.performanceBody} />
          <EscrowFeature icon={Lock} title={t.privacyTitle} body={t.privacyBody} />
        </div>
      </div>
    </div>
  );
}
