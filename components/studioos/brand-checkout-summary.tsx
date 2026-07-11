"use client";

import type { ComponentType } from "react";
import { Calendar, ClipboardCheck, Clock3, FileText, Lock, Shield, ShieldCheck } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import type { StoredOrder } from "@/lib/order-types";
import type { StoredProject } from "@/lib/project-types";

const copy = {
  en: {
    summary: "Campaign summary",
    budget: "Budget range",
    deadline: "Deadline",
    delivery: "Est. delivery",
    createdAt: "Order created",
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
    deadlineInline: "Unpaid orders cancel automatically after 30 minutes",
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
    createdAt: "订单创建时间",
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
    deadlineInline: "下单后 30 分钟内未付款，订单将自动取消",
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
    <div className="flex items-center gap-3 rounded-2xl border border-zinc-100 bg-white px-3.5 py-3 text-left shadow-[0_1px_0_rgba(15,23,42,0.02)] sm:min-h-[132px] sm:flex-col sm:justify-center sm:px-4 sm:py-5 sm:text-center">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600 sm:h-14 sm:w-14 sm:rounded-2xl">
        <Icon className="h-5 w-5 sm:h-7 sm:w-7" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-zinc-900 sm:mt-3">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-zinc-500 sm:mt-1">{body}</p>
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
  const createdAt = new Date(order.created_at).toLocaleString(locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  const steps = [
    [t.stepConfirm, t.stepConfirmBody],
    [t.stepPay, t.stepPayBody],
    [t.stepMatch, t.stepMatchBody],
    [t.stepRelease, t.stepReleaseBody]
  ];

  return (
    <div className="mt-0 self-start space-y-5">
      <div className="overflow-hidden rounded-[1.75rem] border border-zinc-200/80 bg-white shadow-sm">
        <div className="p-6">
          <div className="mb-5 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <FileText className="h-4 w-4" />
            </div>
            <p className="text-sm font-semibold text-zinc-900">{t.summary}</p>
          </div>
          <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
            <div className="lg:border-r lg:border-zinc-100 lg:pr-5">
              <dt className="flex items-center gap-1.5 text-zinc-500">
                <Lock className="h-4 w-4 text-violet-500" />
                {t.budget}
              </dt>
              <dd className="mt-2 text-lg font-semibold text-zinc-950">{project.budget_range || "—"}</dd>
            </div>
            <div className="lg:border-r lg:border-zinc-100 lg:px-5">
              <dt className="flex items-center gap-1.5 text-zinc-500">
                <Calendar className="h-4 w-4 text-violet-500" />
                {t.deadline}
              </dt>
              <dd className="mt-2 text-lg font-semibold text-zinc-950">{project.deadline || "—"}</dd>
            </div>
            <div className="lg:border-r lg:border-zinc-100 lg:px-5">
              <dt className="flex items-center gap-1.5 text-zinc-500">
                <Clock3 className="h-4 w-4 text-violet-500" />
                {t.delivery}
              </dt>
              <dd className="mt-2 text-lg font-semibold text-zinc-950">{deliveryLabel}</dd>
            </div>
            <div className="lg:pl-5">
              <dt className="flex items-center gap-1.5 text-zinc-500">
                <FileText className="h-4 w-4 text-violet-500" />
                {t.createdAt}
              </dt>
              <dd className="mt-2 text-lg font-semibold text-zinc-950">{createdAt}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-zinc-200/80 bg-white p-4 shadow-sm sm:rounded-[1.75rem] sm:p-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <Shield className="h-4 w-4" />
          </div>
          <h3 className="text-base font-semibold text-zinc-950">{t.escrowTitle}</h3>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500 sm:mt-3">{t.escrowBody}</p>
        <div className="mt-4 grid gap-2.5 sm:mt-6 sm:grid-cols-4 sm:gap-3">
          <EscrowFeature icon={Shield} title={t.fundTitle} body={t.fundBody} />
          <EscrowFeature icon={ClipboardCheck} title={t.performanceTitle} body={t.performanceBody} />
          <EscrowFeature icon={Lock} title={t.privacyTitle} body={t.privacyBody} />
          <EscrowFeature icon={ShieldCheck} title={t.escrowRuleTitle} body={t.escrowRuleBody} />
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-zinc-200/80 bg-white p-4 shadow-sm sm:rounded-[1.75rem] sm:p-6">
        <div className="mb-5 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <Clock3 className="h-4 w-4" />
          </div>
          <h3 className="text-base font-semibold text-zinc-950">{t.flowTitle}</h3>
        </div>
        <div className="grid gap-2.5 sm:grid-cols-4 sm:gap-3">
          {steps.map(([title, body], index) => (
            <div key={title} className="relative">
              {index < 3 ? (
                <div className="absolute left-[calc(50%+16px)] right-[calc(-50%+16px)] top-4 hidden border-t border-dashed border-zinc-200 sm:block" />
              ) : null}
              <div className="relative flex items-center gap-3 rounded-2xl border border-zinc-100 bg-white px-3.5 py-3 text-left sm:flex-col sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:text-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-sm font-semibold text-white">
                  {index + 1}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-zinc-900 sm:mt-3">{title}</p>
                  <p className="mt-0.5 text-xs text-zinc-500 sm:mt-1">{body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-3 text-xs text-amber-900">
          <span>{t.deadlineInline}</span>
          <span className="shrink-0 font-semibold">30:00</span>
        </div>
      </div>
    </div>
  );
}
