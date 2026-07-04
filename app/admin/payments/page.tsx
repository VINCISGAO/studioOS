import { Card, CardContent } from "@/components/ui/card";
import { AdminPaymentsPrismaTable } from "@/components/studioos/admin-payments-prisma-table";
import { adminPaymentService } from "@/features/admin/payment/admin-payment.service";
import { getAdminSessionUser } from "@/features/admin/auth/admin-auth.service";
import { getLocale, type SearchParams } from "@/lib/i18n";
import { formatCurrency } from "@/lib/utils";

export default async function AdminPaymentsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = getLocale(await searchParams);
  const user = await getAdminSessionUser();

  const records = user ? await adminPaymentService.list(user) : [];
  const webhooks = user ? await adminPaymentService.listWebhooks(user) : [];

  const paidTotal = records
    .filter((row) => row.paymentStatus === "PAID")
    .reduce((sum, row) => sum + row.amount, 0);
  const pendingPayouts = records.filter((row) => row.creatorPayoutStatus === "MANUAL_PAYOUT_PENDING").length;

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Payments</h1>
      <p className="mt-2 text-sm text-zinc-500">
        {locale === "zh"
          ? "Prisma EscrowPayment、OrderCommission 与 Webhook 事件。"
          : "Prisma EscrowPayment, OrderCommission, and webhook events."}
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card className="border-zinc-200/80 shadow-none">
          <CardContent className="p-6">
            <p className="text-sm text-zinc-500">{locale === "zh" ? "已收款项" : "Collected volume"}</p>
            <p className="mt-2 text-4xl font-semibold">{formatCurrency(paidTotal)}</p>
          </CardContent>
        </Card>
        <Card className="border-zinc-200/80 shadow-none">
          <CardContent className="p-6">
            <p className="text-sm text-zinc-500">{locale === "zh" ? "待手动结算" : "Manual payout pending"}</p>
            <p className="mt-2 text-4xl font-semibold">{pendingPayouts}</p>
          </CardContent>
        </Card>
      </div>
      <Card className="mt-4 border-zinc-200/80 shadow-none">
        <CardContent className="p-0">
          <AdminPaymentsPrismaTable records={records} />
        </CardContent>
      </Card>
      {webhooks.length > 0 && (
        <Card className="mt-4 border-zinc-200/80 shadow-none">
          <CardContent className="p-6">
            <h2 className="font-semibold">Recent webhooks</h2>
            <ul className="mt-3 space-y-2 text-sm text-zinc-600">
              {webhooks.map((w) => (
                <li key={w.id}>{w.provider} · {w.eventType} · {w.processed ? "processed" : "pending"}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
