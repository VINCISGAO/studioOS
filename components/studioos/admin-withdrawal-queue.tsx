"use client";

import { approveWithdrawalAction, rejectWithdrawalAction } from "@/app/admin-actions";
import { AdminFormCsrf } from "@/components/studioos/admin-form-csrf";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AdminWithdrawalItem } from "@/features/admin/withdrawal/admin-withdrawal.service";
import type { Locale } from "@/lib/i18n";
import { formatCurrency, formatDate } from "@/lib/utils";

const copy = {
  en: {
    empty: "No pending withdrawal requests.",
    table: ["User", "Amount", "Methods", "Requested", "Actions"],
    approve: "Approve & mark paid",
    reject: "Reject",
    reasonPlaceholder: "Reason",
    default: "Default"
  },
  zh: {
    empty: "暂无待审核提现。",
    table: ["用户", "金额", "收款方式", "申请时间", "操作"],
    approve: "通过并标记已付",
    reject: "拒绝",
    reasonPlaceholder: "原因",
    default: "默认"
  }
};

function formatMethod(pm: AdminWithdrawalItem["paymentMethods"][0]) {
  if (pm.walletAddress) return `${pm.provider} ${pm.network ?? ""} ${pm.walletAddress.slice(0, 8)}…`;
  if (pm.accountEmail) return `${pm.provider} ${pm.accountEmail}`;
  if (pm.accountNumber) return `${pm.provider} ${pm.accountNumber}`;
  return `${pm.type} ${pm.provider}`;
}

export function AdminWithdrawalQueue({
  locale,
  items
}: {
  locale: Locale;
  items: AdminWithdrawalItem[];
}) {
  const t = copy[locale];

  return (
    <Card className="border-zinc-200/80 shadow-none">
      <CardContent className="p-0">
        {items.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                {t.table.map((h) => (
                  <TableHead key={h}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((row) => (
                <TableRow key={row.withdrawId}>
                  <TableCell>
                    <div className="font-medium">{row.userName ?? row.userEmail ?? row.userId}</div>
                    <div className="text-xs text-zinc-500">{row.userEmail}</div>
                  </TableCell>
                  <TableCell>{formatCurrency(row.amount, locale)}</TableCell>
                  <TableCell className="max-w-xs text-xs">
                    {row.paymentMethods.length
                      ? row.paymentMethods.map((pm) => (
                          <div key={pm.id}>
                            {pm.isDefault && <Badge variant="outline" className="mr-1">{t.default}</Badge>}
                            {formatMethod(pm)}
                          </div>
                        ))
                      : "—"}
                  </TableCell>
                  <TableCell>{formatDate(row.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <form action={approveWithdrawalAction}>
                        <AdminFormCsrf />
                        <input type="hidden" name="lang" value={locale} />
                        <input type="hidden" name="withdraw_id" value={row.withdrawId} />
                        <Button type="submit" size="sm">{t.approve}</Button>
                      </form>
                      <form action={rejectWithdrawalAction} className="flex gap-1">
                        <AdminFormCsrf />
                        <input type="hidden" name="lang" value={locale} />
                        <input type="hidden" name="withdraw_id" value={row.withdrawId} />
                        <input name="reason" required placeholder={t.reasonPlaceholder} className="w-24 rounded border px-1 text-xs" />
                        <Button type="submit" size="sm" variant="outline">{t.reject}</Button>
                      </form>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="p-6 text-sm text-zinc-500">{t.empty}</p>
        )}
      </CardContent>
    </Card>
  );
}
