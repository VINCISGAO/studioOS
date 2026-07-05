"use client";

import type { ComponentType } from "react";
import { Calendar, ClipboardCheck, Clock3, FileText, Lock, Shield, ShieldCheck } from "lucide-react";
import { BrandPaymentDeadlineNotice } from "@/components/studioos/brand-payment-deadline-notice";
import type { Locale } from "@/lib/i18n";
import type { StoredOrder } from "@/lib/order-types";
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
    privacyBody: "Account and payment data encrypted end-to-end",
    escrowRuleTitle: "Escrow rules",
    escrowRuleBody: "256-bit encrypted escrow, released by policy",
    flowTitle: "Payment flow",
    stepConfirm: "Order confirmed",
    stepConfirmBody: "Confirm campaign information",
    stepPay: "Escrow payment",
    stepPayBody: "Funds held safely",
    stepMatch: "Start matching",
    stepMatchBody: "Match the right Studio",
    stepRelease: "Complete delivery",
    stepReleaseBody: "Release after approval"
  },
  zh: {
    summary: "订单摘要",
    budget: "预算区间",
    deadline: "截止日期",
    delivery: "预计交付",
    videos: "支视频",
    escrowTitle: "托管保障",
    escrowBody: "款项托管至需你确认交付后释放，审片通过后才会结算给 Studio。",
    fundTitle: "资金安全",
    fundBody: "全程托管，按双方约定释放",
    performanceTitle: "履约保障",
    performanceBody: "未完成交付或不符合要求可申诉",
    privacyTitle: "隐私保护",
    privacyBody: "账户与支付信息全程加密保护",
    escrowRuleTitle: "托管保密",
    escrowRuleBody: "256 位加密 · 托管保障 · 资金安全，按规则释放",
    flowTitle: "付款流程",
    stepConfirm: "订单确认",
    stepConfirmBody: "确认订单信息",
    stepPay: "托管付款",
    stepPayBody: "款项安全托管",
    stepMatch: "开始匹配",
    stepMatchBody: "为你匹配 Studio",
    stepRelease: "完成交付",
    stepReleaseBody: "交易完成后释放款项"
  }
} as const;

function EscrowFeature({
  icon: Icon,
  title,
  body
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="flex min-h-[82px] gap-3 rounded-xl border border-zinc-100 bg-white px-4 py-4 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
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
  order,
  deliveryLabel
}: {
  locale: Locale;
  project: StoredProject;
  order: Pick<StoredOrder, "created_at">;
  deliveryLabel: string;
}) {
  const t = copy[locale];
  const videoCount = project.video_count ?? project.output_quantity ?? 1;
  const steps = [
    [t.stepConfirm, t.stepConfirmBody],
    [t.stepPay, t.stepPayBody],
    [t.stepMatch, t.stepMatchBody],
    [t.stepRelease, t.stepReleaseBody]
  ];

  return (
    <div className="mt-0 self-start space-y-5">
      <div className="overflow-hidden rounded-[14px] border border-zinc-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        <div className="p-6">
          <div className="mb-5 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <FileText className="h-4 w-4" />
            </div>
            <p className="text-sm font-semibold text-zinc-900">{t.summary}</p>
          </div>
          <div className="flex gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-semibold tracking-tight text-zinc-950">
                {project.title || project.product_name}
              </h2>
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-600">
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
            <div className="relative hidden h-20 w-20 shrink-0 sm:block" aria-hidden>
              <div className="absolute inset-0 rounded-[20px] bg-gradient-to-br from-indigo-50 to-sky-50 ring-1 ring-indigo-100" />
              <div className="absolute left-3 top-3 h-14 w-12 rounded-xl bg-white shadow-sm ring-1 ring-zinc-100" />
              <div className="absolute left-5 top-6 h-8 w-8 rounded-full bg-indigo-500" />
              <div className="absolute bottom-3 right-3 h-2.5 w-2.5 rounded-full bg-sky-400" />
            </div>
          </div>

          <dl className="mt-6 grid grid-cols-3 border-t border-zinc-100 pt-5 text-sm">
            <div className="border-r border-zinc-100 pr-5">
              <dt className="flex items-center gap-1.5 text-zinc-500">
                <Lock className="h-4 w-4 text-indigo-500" />
                {t.budget}
              </dt>
              <dd className="mt-2 text-lg font-semibold text-zinc-950">{project.budget_range || "—"}</dd>
            </div>
            <div className="border-r border-zinc-100 px-5">
              <dt className="flex items-center gap-1.5 text-zinc-500">
                <Calendar className="h-4 w-4 text-indigo-500" />
                {t.deadline}
              </dt>
              <dd className="mt-2 text-lg font-semibold text-zinc-950">{project.deadline || "—"}</dd>
            </div>
            <div className="pl-5">
              <dt className="flex items-center gap-1.5 text-zinc-500">
                <Clock3 className="h-4 w-4 text-indigo-500" />
                {t.delivery}
              </dt>
              <dd className="mt-2 text-lg font-semibold text-zinc-950">{deliveryLabel}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="rounded-[14px] border border-zinc-200/80 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Shield className="h-4 w-4" />
          </div>
          <h3 className="text-base font-semibold text-zinc-950">{t.escrowTitle}</h3>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-zinc-500">{t.escrowBody}</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <EscrowFeature icon={Shield} title={t.fundTitle} body={t.fundBody} />
          <EscrowFeature icon={ClipboardCheck} title={t.performanceTitle} body={t.performanceBody} />
          <EscrowFeature icon={Lock} title={t.privacyTitle} body={t.privacyBody} />
          <EscrowFeature icon={ShieldCheck} title={t.escrowRuleTitle} body={t.escrowRuleBody} />
        </div>
      </div>

      <div className="rounded-[14px] border border-zinc-200/80 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        <div className="mb-5 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Clock3 className="h-4 w-4" />
          </div>
          <h3 className="text-base font-semibold text-zinc-950">{t.flowTitle}</h3>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {steps.map(([title, body], index) => (
            <div key={title} className="relative">
              {index < 3 ? (
                <div className="absolute left-[calc(50%+16px)] right-[calc(-50%+16px)] top-4 border-t border-dashed border-zinc-200" />
              ) : null}
              <div className="relative flex flex-col items-center text-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
                  {index + 1}
                </div>
                <p className="mt-3 text-sm font-semibold text-zinc-900">{title}</p>
                <p className="mt-1 text-xs text-zinc-500">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <BrandPaymentDeadlineNotice locale={locale} order={order} />
    </div>
  );
}
