"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  cancelSettlementAction,
  freezeSettlementAction,
  releaseSettlementAction,
  retrySettlementAction
} from "@/app/admin-actions";
import type { AdminSettlementQueueItem } from "@/features/admin/settlement/admin-settlement.service";
import { AdminFormCsrf } from "@/components/studioos/admin-form-csrf";
import type { Locale } from "@/lib/i18n";
import { adminSettlementStateLabel, adminEscrowStatusLabel, adminDeliveryStatusLabel, adminLedgerEntryTypeLabel } from "@/lib/studioos/admin-enum-labels";
import { formatCurrency, formatDate } from "@/lib/utils";

const copy = {
  en: {
    empty: "No campaigns in settlement queue.",
    table: ["Campaign", "Brand", "Creator", "State", "Escrow", "Delivery", "Ledger", "Actions"],
    release: "Release",
    freeze: "Freeze",
    cancel: "Cancel",
    retry: "Retry",
    reasonPlaceholder: "Reason",
    notePlaceholder: "Note",
    rowSummary: "rows"
  },
  zh: {
    empty: "结算队列为空。",
    table: ["活动", "品牌方", "创作者", "状态", "托管", "交付", "账本", "操作"],
    release: "释放",
    freeze: "冻结",
    cancel: "取消",
    retry: "重试",
    reasonPlaceholder: "原因",
    notePlaceholder: "备注",
    rowSummary: "条"
  }
};

function stateVariant(state: string) {
  if (state === "READY") return "success" as const;
  if (state === "DISPUTE" || state === "FAILED") return "destructive" as const;
  return "outline" as const;
}

export function AdminSettlementQueue({
  locale,
  items
}: {
  locale: Locale;
  items: AdminSettlementQueueItem[];
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
                <TableRow key={row.campaignId}>
                  <TableCell className="font-medium">{row.title}</TableCell>
                  <TableCell>{row.brandName ?? "—"}</TableCell>
                  <TableCell>{row.creatorName ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={stateVariant(row.queueState)}>
                      {adminSettlementStateLabel(row.queueState, locale)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {row.escrowStatus ? adminEscrowStatusLabel(row.escrowStatus, locale) : "—"}
                    <div className="text-xs text-zinc-500">{formatCurrency(row.escrowRemaining, locale)}</div>
                  </TableCell>
                  <TableCell>{row.deliveryStatus ? adminDeliveryStatusLabel(row.deliveryStatus, locale) : "—"}</TableCell>
                  <TableCell className="max-w-xs text-xs text-zinc-500">
                    {row.ledgerPreview.map((e) => `${adminLedgerEntryTypeLabel(e.entryType, locale)}: ${e.amount}`).join(" · ") || "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {row.queueState === "READY" && (
                        <form action={releaseSettlementAction}>
                          <AdminFormCsrf />
                          <input type="hidden" name="lang" value={locale} />
                          <input type="hidden" name="campaign_id" value={row.campaignId} />
                          <Button type="submit" size="sm" variant="outline">{t.release}</Button>
                        </form>
                      )}
                      {(row.queueState === "FAILED" || row.queueState === "LOCKED") && (
                        <form action={retrySettlementAction}>
                          <AdminFormCsrf />
                          <input type="hidden" name="lang" value={locale} />
                          <input type="hidden" name="campaign_id" value={row.campaignId} />
                          <Button type="submit" size="sm" variant="outline">{t.retry}</Button>
                        </form>
                      )}
                      <form action={freezeSettlementAction} className="flex gap-1">
                        <AdminFormCsrf />
                        <input type="hidden" name="lang" value={locale} />
                        <input type="hidden" name="campaign_id" value={row.campaignId} />
                        <input name="reason" placeholder={t.reasonPlaceholder} className="w-20 rounded border px-1 text-xs" />
                        <Button type="submit" size="sm" variant="outline">{t.freeze}</Button>
                      </form>
                      <form action={cancelSettlementAction} className="flex gap-1">
                        <AdminFormCsrf />
                        <input type="hidden" name="lang" value={locale} />
                        <input type="hidden" name="campaign_id" value={row.campaignId} />
                        <input name="note" placeholder={t.notePlaceholder} className="w-20 rounded border px-1 text-xs" />
                        <Button type="submit" size="sm" variant="ghost">{t.cancel}</Button>
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
        <p className="border-t p-4 text-xs text-zinc-400">
          {items.length} {t.rowSummary} · {formatDate(new Date().toISOString(), locale)}
        </p>
      </CardContent>
    </Card>
  );
}
