import { getAppUiLocale } from "@/lib/app-language";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminDepositService } from "@/features/admin/deposit/admin-deposit.service";
import { getAdminSessionUser } from "@/features/admin/auth/admin-auth.service";
import { type SearchParams, withLocale } from "@/lib/i18n";
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
    title: "Studio 保证金",
    subtitle: "审核 Studio 保证金状态，确保制作任务履约可控。",
    table: ["Studio", "金额", "状态", "可退还时间", "原因", "操作"],
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
    <div>
      <Button asChild variant="outline" size="sm">
        <Link href={withLocale("/admin", locale)}>
          <ArrowLeft className="h-4 w-4" /> {t.back}
        </Link>
      </Button>
      <div className="mt-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">{t.eyebrow}</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">{t.title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{t.subtitle}</p>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Metric label={locale === "zh" ? "保证金总额" : "Total deposits"} value={formatCurrency(summary.totalAmount, locale)} />
        <Metric label={locale === "zh" ? "退还申请" : "Refund requests"} value={String(summary.refundRequestedCount)} />
        <Metric label={locale === "zh" ? "Studio 数量" : "Studios"} value={String(summary.studioCount)} />
      </div>
      <Card className="mt-8 shadow-none">
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
                    <Badge variant={deposit.status === "paid" ? "success" : "warning"}>{deposit.status}</Badge>
                  </TableCell>
                  <TableCell>{deposit.refundableAfter ? formatDate(deposit.refundableAfter) : "-"}</TableCell>
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
    </div>
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
