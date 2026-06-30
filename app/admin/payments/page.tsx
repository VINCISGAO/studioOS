import { Card, CardContent } from "@/components/ui/card";
import { AdminPaymentsTable } from "@/components/studioos/admin-payments-table";
import { paymentCollectionService } from "@/features/payment/payment-collection.service";
import { getSessionUser } from "@/features/auth/session.service";
import { getLocale, type SearchParams } from "@/lib/i18n";
import { formatCurrency } from "@/lib/utils";

export default async function AdminPaymentsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = getLocale(await searchParams);
  const user = await getSessionUser();

  let records: Awaited<ReturnType<typeof paymentCollectionService.listForAdmin>> = [];
  if (user) {
    try {
      records = await paymentCollectionService.listForAdmin(user);
    } catch {
      records = [];
    }
  }

  const paidTotal = records
    .filter((row) => row.paymentStatus === "PAID")
    .reduce((sum, row) => sum + row.amount, 0);
  const pendingPayouts = records.filter(
    (row) => row.creatorPayoutStatus === "MANUAL_PAYOUT_PENDING"
  ).length;

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Payments</h1>
      <p className="mt-2 text-sm text-zinc-500">
        {locale === "zh"
          ? "在线收款、手续费与创作者手动结算。"
          : "Online collection, service fees, and manual creator payouts."}
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
          <AdminPaymentsTable records={records} />
        </CardContent>
      </Card>
    </div>
  );
}
