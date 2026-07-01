import type { Locale } from "@/lib/i18n";
import type { ConfirmedBriefField } from "@/lib/studioos/confirmed-brief";
import { cn } from "@/lib/utils";
import { Calendar, CircleDollarSign, CreditCard, FileText, ShieldCheck } from "lucide-react";

const copy = {
  en: {
    title: "Payment summary",
    subtitle: "Your certification deposit was received. This receipt is synced to your account records."
  },
  zh: {
    title: "付款明细",
    subtitle: "认证保证金已支付成功，以下为本笔付款摘要，已同步至后台记录。"
  }
} as const;

const rowIcons = [ShieldCheck, CircleDollarSign, CreditCard, Calendar, FileText, ShieldCheck];

function isPaidStatus(label: string, value: string, locale: Locale) {
  const statusLabel = locale === "zh" ? "支付状态" : "Status";
  return label === statusLabel && (value === "已付款" || value === "Paid");
}

export function CertificationOnboardingFormCard({
  locale,
  fields
}: {
  locale: Locale;
  fields: ConfirmedBriefField[];
  formId?: string;
  studioName?: string;
}) {
  const t = copy[locale];

  if (!fields.length) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-[18px] border border-zinc-200/90 bg-white shadow-sm">
      <div className="border-b border-zinc-100 px-4 py-4 sm:px-5">
        <p className="text-sm font-semibold text-zinc-950">{t.title}</p>
        <p className="mt-1 text-xs leading-5 text-zinc-500">{t.subtitle}</p>
      </div>

      <dl className="divide-y divide-zinc-100">
        {fields.map((item, index) => {
          const Icon = rowIcons[index] ?? ShieldCheck;
          const paid = isPaidStatus(item.label, item.value, locale);

          return (
            <div key={`${item.label}-${item.value}`} className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
                <Icon className="h-4 w-4" />
              </span>
              <dt className="min-w-[5.5rem] text-sm text-zinc-500">{item.label}</dt>
              <dd className="ml-auto text-right text-sm font-medium text-zinc-900">
                {paid ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {item.value}
                  </span>
                ) : (
                  <span className={cn(item.label.includes("金额") || item.label === "Amount" ? "tabular-nums" : "")}>
                    {item.value}
                  </span>
                )}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
