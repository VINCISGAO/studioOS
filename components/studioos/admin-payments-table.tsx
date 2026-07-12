"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { PaymentRecordView } from "@/features/payment/payment-collection.service";
import type { Locale } from "@/lib/i18n";
import { adminFields } from "@/lib/studioos/admin-copy";

const copy = {
  en: {
    empty: "No payment records yet.",
    table: ["Campaign", "Amount", "Payment", "Fees / commission", "Creator payable", "Payout", "Action"]
  },
  zh: {
    empty: "暂无支付记录。",
    table: ["活动", "金额", "支付", "手续费 / 佣金", "创作者应付", "付款", "操作"]
  }
} as const;

export function AdminMarkPayoutButton({
  locale,
  campaignId,
  disabled
}: {
  locale: Locale;
  campaignId: string;
  disabled?: boolean;
}) {
  const f = adminFields(locale);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(disabled);

  async function markPaid() {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/payments/${campaignId}/payout`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return <span className="text-xs font-medium text-emerald-600">{f.paid}</span>;
  }

  return (
    <Button size="sm" variant="outline" disabled={loading} onClick={markPaid}>
      {loading ? f.saving : f.markPayoutPaid}
    </Button>
  );
}

export function AdminPaymentsTable({
  locale,
  records
}: {
  locale: Locale;
  records: PaymentRecordView[];
}) {
  const t = copy[locale];
  const f = adminFields(locale);

  if (records.length === 0) {
    return <p className="px-6 py-8 text-sm text-zinc-500">{t.empty}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b text-xs uppercase tracking-wide text-zinc-500">
            {t.table.map((heading) => (
              <th key={heading} className="px-4 py-3 font-medium first:px-6">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {records.map((row) => (
            <tr key={row.campaignId}>
              <td className="px-6 py-4">
                <p className="font-medium text-zinc-900">{row.campaignTitle}</p>
                <p className="text-xs text-zinc-500">{row.brandName ?? row.brandEmail}</p>
                <p className="text-xs text-zinc-400">{row.stripePaymentId ?? "—"}</p>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                {row.currency} {row.amount.toFixed(2)}
              </td>
              <td className="px-4 py-4">
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium">
                  {row.paymentStatus}
                </span>
              </td>
              <td className="px-4 py-4 text-xs text-zinc-600">
                {row.clientServiceFeeAmount != null ? (
                  <>
                    <div>
                      {f.clientFee}: {row.clientServiceFeePercentage}% → {row.clientServiceFeeAmount.toFixed(2)}
                    </div>
                    <div>
                      {f.creatorComm}: {row.creatorCommissionPercentage}% → {row.creatorCommissionAmount?.toFixed(2)}
                    </div>
                  </>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                {row.creatorPayableAmount != null
                  ? `${row.currency} ${row.creatorPayableAmount.toFixed(2)}`
                  : "—"}
              </td>
              <td className="px-4 py-4">{row.creatorPayoutStatus ?? "—"}</td>
              <td className="px-4 py-4">
                {row.paymentStatus === "PAID" && row.creatorPayoutStatus === "MANUAL_PAYOUT_PENDING" ? (
                  <AdminMarkPayoutButton locale={locale} campaignId={row.campaignId} />
                ) : row.creatorPayoutStatus === "PAID" ? (
                  <span className="text-xs text-emerald-600">{f.paid}</span>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
