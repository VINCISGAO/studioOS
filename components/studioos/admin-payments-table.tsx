"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { PaymentRecordView } from "@/features/payment/payment-collection.service";

export function AdminMarkPayoutButton({
  campaignId,
  disabled
}: {
  campaignId: string;
  disabled?: boolean;
}) {
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
    return <span className="text-xs font-medium text-emerald-600">Paid</span>;
  }

  return (
    <Button size="sm" variant="outline" disabled={loading} onClick={markPaid}>
      {loading ? "Saving…" : "Mark payout paid"}
    </Button>
  );
}

export function AdminPaymentsTable({ records }: { records: PaymentRecordView[] }) {
  if (records.length === 0) {
    return <p className="px-6 py-8 text-sm text-zinc-500">No payment records yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b text-xs uppercase tracking-wide text-zinc-500">
            <th className="px-6 py-3 font-medium">Campaign</th>
            <th className="px-4 py-3 font-medium">Amount</th>
            <th className="px-4 py-3 font-medium">Payment</th>
            <th className="px-4 py-3 font-medium">Fees / Commission</th>
            <th className="px-4 py-3 font-medium">Creator payable</th>
            <th className="px-4 py-3 font-medium">Payout</th>
            <th className="px-4 py-3 font-medium">Action</th>
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
                    <div>Client fee: {row.clientServiceFeePercentage}% → {row.clientServiceFeeAmount.toFixed(2)}</div>
                    <div>Creator comm: {row.creatorCommissionPercentage}% → {row.creatorCommissionAmount?.toFixed(2)}</div>
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
              <td className="px-4 py-4">
                {row.creatorPayoutStatus ?? "—"}
              </td>
              <td className="px-4 py-4">
                {row.paymentStatus === "PAID" && row.creatorPayoutStatus === "MANUAL_PAYOUT_PENDING" ? (
                  <AdminMarkPayoutButton campaignId={row.campaignId} />
                ) : row.creatorPayoutStatus === "PAID" ? (
                  <span className="text-xs text-emerald-600">Paid</span>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
