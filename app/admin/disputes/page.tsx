import { getAppUiLocale } from "@/lib/app-language";
import Link from "next/link";
import { Scale } from "lucide-react";
import { resolveDisputeAction } from "@/app/admin-actions";
import { AdminFormCsrf } from "@/components/studioos/admin-form-csrf";
import { AdminPageShell } from "@/components/studioos/admin-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { disputeService } from "@/features/admin/dispute.service";
import { adminRefundService } from "@/features/admin/refund/admin-refund.service";
import { getAdminSessionUser } from "@/features/admin/auth/admin-auth.service";
import { type SearchParams, withLocale } from "@/lib/i18n";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";
import { adminDisputeStatusLabel, adminRefundStatusLabel } from "@/lib/studioos/admin-enum-labels";
import { formatCurrency, formatDate } from "@/lib/utils";

const copy = {
  en: {
    back: "Back to admin",
    eyebrow: "Trust and safety",
    title: "Refunds and disputes",
    subtitle:
      "Review dispute reasons and proposed resolutions before releasing escrow or returning funds.",
    disputes: "Disputes",
    refunds: "Refund requests",
    disputeTable: ["Campaign", "Brand", "Opened by", "Status", "Reason", "Created", "Resolve"],
    refundTable: ["Order", "Amount", "Status", "Reason", "Created"],
    resolve: "Resolve",
    resultPlaceholder: "Resolution summary",
    emptyDisputes: "No disputes in database."
  },
  zh: {
    back: "返回管理后台",
    eyebrow: "交易安全",
    title: "退款与争议处理",
    subtitle: "审核争议原因与处理方案，再决定释放托管款或退还资金。",
    disputes: "争议",
    refunds: "退款申请",
    disputeTable: ["活动", "品牌方", "发起方", "状态", "原因", "创建时间", "处理"],
    refundTable: ["订单", "金额", "状态", "原因", "创建时间"],
    resolve: "结案",
    resultPlaceholder: "处理说明",
    emptyDisputes: "数据库中暂无争议记录。"
  }
};

export default async function AdminDisputesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = await getAppUiLocale();
  const t = copy[locale];
  const user = await getAdminSessionUser();
  const disputes = user ? await disputeService.list(user) : [];
  const refundRequests = user ? await adminRefundService.list(user) : [];

  return (
    <AdminPageShell locale={locale} title={t.title} subtitle={t.subtitle}>
      <Card className="border-zinc-200/80 shadow-none">
        <CardContent className="p-0">
          <div className="border-b p-6">
            <h2 className="text-lg font-semibold">{t.disputes}</h2>
          </div>
          {disputes.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  {t.disputeTable.map((heading) => (
                    <TableHead key={heading}>{heading}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {disputes.map((dispute) => (
                  <TableRow key={dispute.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={withLocale(adminPortalRoutes.disputeDetail(dispute.id), locale)}
                        className="hover:underline"
                      >
                        {dispute.campaignTitle}
                      </Link>
                    </TableCell>
                    <TableCell>{dispute.brandName ?? "—"}</TableCell>
                    <TableCell>{dispute.openedBy}</TableCell>
                    <TableCell>
                      <Badge variant={dispute.status === "OPEN" ? "warning" : "outline"}>
                        {adminDisputeStatusLabel(dispute.status, locale)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{dispute.reason}</TableCell>
                    <TableCell>{formatDate(dispute.createdAt, locale)}</TableCell>
                    <TableCell>
                      {dispute.status === "OPEN" || dispute.status === "PROCESSING" ? (
                        <form action={resolveDisputeAction} className="flex flex-col gap-2">
                          <AdminFormCsrf />
                          <input type="hidden" name="lang" value={locale} />
                          <input type="hidden" name="dispute_id" value={dispute.id} />
                          <input type="hidden" name="status" value="RESOLVED" />
                          <input
                            name="result"
                            required
                            placeholder={t.resultPlaceholder}
                            className="rounded-md border px-2 py-1 text-xs"
                          />
                          <Button type="submit" size="sm" variant="outline">
                            <Scale className="h-4 w-4" /> {t.resolve}
                          </Button>
                        </form>
                      ) : (
                        <span className="text-xs text-muted-foreground">{dispute.result ?? "—"}</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="p-6 text-sm text-muted-foreground">{t.emptyDisputes}</p>
          )}
        </CardContent>
      </Card>

      <Card className="mt-8 border-zinc-200/80 shadow-none">
        <CardContent className="p-0">
          <div className="border-b p-6">
            <h2 className="text-lg font-semibold">{t.refunds}</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                {t.refundTable.map((heading) => (
                  <TableHead key={heading}>{heading}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {refundRequests.map((refund) => (
                <TableRow key={refund.id}>
                  <TableCell className="font-medium">{refund.orderId}</TableCell>
                  <TableCell>{formatCurrency(refund.amount, locale)}</TableCell>
                  <TableCell>
                    <Badge variant="warning">{adminRefundStatusLabel(refund.status, locale)}</Badge>
                  </TableCell>
                  <TableCell>{refund.reason}</TableCell>
                  <TableCell>{formatDate(refund.createdAt, locale)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminPageShell>
  );
}
