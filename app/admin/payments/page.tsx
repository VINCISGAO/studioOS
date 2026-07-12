import { getAppUiLocale } from "@/lib/app-language";
import { Card, CardContent } from "@/components/ui/card";
import { AdminPaymentsPrismaTable } from "@/components/studioos/admin-payments-prisma-table";
import { AdminPageShell } from "@/components/studioos/admin-page-shell";
import { adminPaymentService } from "@/features/admin/payment/admin-payment.service";
import { getAdminSessionUser } from "@/features/admin/auth/admin-auth.service";
import { type SearchParams } from "@/lib/i18n";
import { formatCurrency } from "@/lib/utils";

const copy = {
  en: {
    title: "Payments",
    subtitle: "Escrow payments, order commissions, and webhook events.",
    collected: "Collected volume",
    manualPayout: "Manual payout pending",
    recentWebhooks: "Recent webhooks",
    processed: "processed",
    pending: "pending"
  },
  zh: {
    title: "支付",
    subtitle: "托管支付、订单佣金与回调事件。",
    collected: "已收款项",
    manualPayout: "待手动结算",
    recentWebhooks: "最近回调",
    processed: "已处理",
    pending: "待处理"
  }
} as const;

export default async function AdminPaymentsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = await getAppUiLocale();
  const t = copy[locale];
  const user = await getAdminSessionUser();

  const records = user ? await adminPaymentService.list(user) : [];
  const webhooks = user ? await adminPaymentService.listWebhooks(user) : [];

  const paidTotal = records
    .filter((row) => row.paymentStatus === "PAID")
    .reduce((sum, row) => sum + row.amount, 0);
  const pendingPayouts = records.filter((row) => row.creatorPayoutStatus === "MANUAL_PAYOUT_PENDING").length;

  return (
    <AdminPageShell locale={locale} title={t.title} subtitle={t.subtitle}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-zinc-200/80 shadow-none">
          <CardContent className="p-6">
            <p className="text-sm text-zinc-500">{t.collected}</p>
            <p className="mt-2 text-4xl font-semibold">{formatCurrency(paidTotal, locale)}</p>
          </CardContent>
        </Card>
        <Card className="border-zinc-200/80 shadow-none">
          <CardContent className="p-6">
            <p className="text-sm text-zinc-500">{t.manualPayout}</p>
            <p className="mt-2 text-4xl font-semibold">{pendingPayouts}</p>
          </CardContent>
        </Card>
      </div>
      <Card className="mt-4 border-zinc-200/80 shadow-none">
        <CardContent className="p-0">
          <AdminPaymentsPrismaTable locale={locale} records={records} />
        </CardContent>
      </Card>
      {webhooks.length > 0 && (
        <Card className="mt-4 border-zinc-200/80 shadow-none">
          <CardContent className="p-6">
            <h2 className="font-semibold">{t.recentWebhooks}</h2>
            <ul className="mt-3 space-y-2 text-sm text-zinc-600">
              {webhooks.map((w) => (
                <li key={w.id}>
                  {w.provider} · {w.eventType} · {w.processed ? t.processed : t.pending}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </AdminPageShell>
  );
}
