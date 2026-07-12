import { getAppUiLocale } from "@/lib/app-language";
import { ShieldCheck } from "lucide-react";
import { AdminPageShell } from "@/components/studioos/admin-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminDepositService } from "@/features/admin/deposit/admin-deposit.service";
import { getAdminSessionUser } from "@/features/admin/auth/admin-auth.service";
import { type SearchParams } from "@/lib/i18n";
import { adminDepositStatusLabel } from "@/lib/studioos/admin-enum-labels";
import { formatCurrency, formatDate } from "@/lib/utils";

const copy = {
  en: {
    back: "Back to admin",
    eyebrow: "Deposit operations",
    title: "Studio guarantee deposits",
    subtitle: "Review paid, frozen, deducted, and refund-requested deposits before studios accept production jobs.",
    table: ["Studio", "Amount", "Status", "Refundable after", "Reason", "Action"],
    review: "Review"
  },
  zh: {
    back: "返回管理后台",
    eyebrow: "保证金管理",
    title: "创作者保证金",
    subtitle: "审核创作者保证金状态，确保制作任务履约可控。",
    table: ["创作者", "金额", "状态", "可退还时间", "原因", "操作"],
    review: "审核"
  }
};

type AdminDepositsPageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function AdminDepositsPage({ searchParams }: AdminDepositsPageProps) {
  const locale = await getAppUiLocale();
  const t = copy[locale];
  const user = await getAdminSessionUser();
  const deposits = user ? await adminDepositService.list(user) : [];
  const summary = user ? await adminDepositService.getSummary(user) : { totalAmount: 0, refundRequestedCount: 0, studioCount: 0 };

  return (
    <AdminPageShell locale={locale} title={t.title} subtitle={t.subtitle}>
      <div className="grid gap-4 md:grid-cols-3">
        <Metric label={locale === "zh" ? "保证金总额" : "Total deposits"} value={formatCurrency(summary.totalAmount, locale)} />
        <Metric label={locale === "zh" ? "退还申请" : "Refund requests"} value={String(summary.refundRequestedCount)} />
        <Metric label={locale === "zh" ? "创作者数量" : "Studios"} value={String(summary.studioCount)} />
      </div>
      <Card className="mt-8 border-zinc-200/80 shadow-none">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {t.table.map((heading) => (
                  <TableHead key={heading}>{heading}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {deposits.map((deposit) => (
                <TableRow key={deposit.id}>
                  <TableCell>
                    <div className="font-medium">{deposit.creatorName}</div>
                    <div className="text-xs text-muted-foreground">{deposit.creatorEmail}</div>
                  </TableCell>
                  <TableCell>{formatCurrency(deposit.amount, locale)}</TableCell>
                  <TableCell>
                    <Badge variant={deposit.status === "paid" ? "success" : "warning"}>
                      {adminDepositStatusLabel(deposit.status, locale)}
                    </Badge>
                  </TableCell>
                  <TableCell>{deposit.refundableAfter ? formatDate(deposit.refundableAfter, locale) : "—"}</TableCell>
                  <TableCell>{deposit.reason}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline">
                      <ShieldCheck className="h-4 w-4" /> {t.review}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminPageShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card className="shadow-none">
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="mt-2 text-3xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}
