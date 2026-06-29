import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { orders } from "@/lib/data";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { formatCurrency } from "@/lib/utils";

export default async function AdminPaymentsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = getLocale(await searchParams);
  const total = orders.reduce((s, o) => s + o.amount, 0);

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Payments</h1>
      <p className="mt-2 text-sm text-zinc-500">
        {locale === "zh" ? "托管、释放与平台收入。" : "Escrow, release, and platform revenue."}
      </p>
      <Card className="mt-8 border-zinc-200/80 shadow-none">
        <CardContent className="p-6">
          <p className="text-sm text-zinc-500">{locale === "zh" ? "平台总流水" : "Total volume"}</p>
          <p className="mt-2 text-4xl font-semibold">{formatCurrency(total)}</p>
        </CardContent>
      </Card>
      <Card className="mt-4 border-zinc-200/80 shadow-none">
        <CardContent className="p-0">
          <ul className="divide-y">
            {orders.map((order) => (
              <li key={order.id} className="flex justify-between px-6 py-4">
                <Link href={withLocale(`/admin/orders/${order.id}`, locale)} className="font-medium hover:underline">
                  {order.id}
                </Link>
                <span>{formatCurrency(order.amount)} · {order.payment_status}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
