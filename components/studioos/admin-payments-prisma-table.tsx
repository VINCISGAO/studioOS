"use client";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AdminPaymentRecord } from "@/features/admin/payment/admin-payment.service";
import type { Locale } from "@/lib/i18n";
import { adminEscrowStatusLabel, adminPaymentStatusLabel } from "@/lib/studioos/admin-enum-labels";
import { adminFields } from "@/lib/studioos/admin-copy";
import { formatCurrency, formatDate } from "@/lib/utils";

const copy = {
  en: {
    empty: "No escrow payments in database.",
    table: ["Campaign", "Escrow", "Payment", "Amount", "Platform fee", "Commission", "Payout", "Release", "Dispute"]
  },
  zh: {
    empty: "数据库中暂无托管支付记录。",
    table: ["活动", "托管", "支付", "金额", "平台手续费", "佣金", "付款", "释放", "争议"]
  }
} as const;

export function AdminPaymentsPrismaTable({
  locale,
  records
}: {
  locale: Locale;
  records: AdminPaymentRecord[];
}) {
  const t = copy[locale];
  const f = adminFields(locale);

  if (!records.length) {
    return <p className="p-6 text-sm text-zinc-500">{t.empty}</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {t.table.map((heading) => (
            <TableHead key={heading}>{heading}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.map((row) => (
          <TableRow key={row.id}>
            <TableCell>
              <div className="font-medium">{row.campaignTitle}</div>
              <div className="text-xs text-zinc-500">
                {row.brandName} → {row.creatorName ?? "—"}
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline">{adminEscrowStatusLabel(row.escrowStatus, locale)}</Badge>
            </TableCell>
            <TableCell>{adminPaymentStatusLabel(row.paymentStatus, locale)}</TableCell>
            <TableCell>{formatCurrency(row.amount, locale)}</TableCell>
            <TableCell>{formatCurrency(row.platformFee, locale)}</TableCell>
            <TableCell>{formatCurrency(row.commission, locale)}</TableCell>
            <TableCell>{formatCurrency(row.creatorPayout, locale)}</TableCell>
            <TableCell className="text-xs">{row.payoutPaidAt ? formatDate(row.payoutPaidAt, locale) : "—"}</TableCell>
            <TableCell>
              {row.hasOpenDispute ? <Badge variant="destructive">{f.open}</Badge> : "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
