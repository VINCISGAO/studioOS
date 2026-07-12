"use client";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AdminPaymentRecord } from "@/features/admin/payment/admin-payment.service";
import type { Locale } from "@/lib/i18n";
import { formatCurrency, formatDate } from "@/lib/utils";

export function AdminPaymentsPrismaTable({
  locale,
  records
}: {
  locale: Locale;
  records: AdminPaymentRecord[];
}) {
  if (!records.length) {
    return <p className="p-6 text-sm text-zinc-500">No escrow payments in database.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Campaign</TableHead>
          <TableHead>Escrow</TableHead>
          <TableHead>Payment</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Platform fee</TableHead>
          <TableHead>Commission</TableHead>
          <TableHead>Payout</TableHead>
          <TableHead>Release</TableHead>
          <TableHead>Dispute</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.map((row) => (
          <TableRow key={row.id}>
            <TableCell>
              <div className="font-medium">{row.campaignTitle}</div>
              <div className="text-xs text-zinc-500">{row.brandName} → {row.creatorName ?? "—"}</div>
            </TableCell>
            <TableCell><Badge variant="outline">{row.escrowStatus}</Badge></TableCell>
            <TableCell>{row.paymentStatus}</TableCell>
            <TableCell>{formatCurrency(row.amount, locale)}</TableCell>
            <TableCell>{formatCurrency(row.platformFee, locale)}</TableCell>
            <TableCell>{formatCurrency(row.commission, locale)}</TableCell>
            <TableCell>{formatCurrency(row.creatorPayout, locale)}</TableCell>
            <TableCell className="text-xs">{row.payoutPaidAt ? formatDate(row.payoutPaidAt) : "—"}</TableCell>
            <TableCell>{row.hasOpenDispute ? <Badge variant="destructive">open</Badge> : "—"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
