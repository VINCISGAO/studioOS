import { getAppUiLocale } from "@/lib/app-language";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentClientEmail } from "@/features/auth/session-context";
import { type SearchParams, withLocale } from "@/lib/i18n";
import { listOrdersForClient } from "@/lib/order-service";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function BrandInvoicesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = await getAppUiLocale();
  const clientEmail = await getCurrentClientEmail();
  const orders = clientEmail ? await listOrdersForClient(clientEmail) : [];

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">{locale === "zh" ? "账单" : "Invoices"}</h1>
      <p className="mt-2 text-sm text-zinc-500">
        {locale === "zh" ? "全部付款、收据与退款记录。" : "All payments, receipts, and refunds."}
      </p>

      <Card className="mt-8 border-zinc-200/80 shadow-none">
        <CardContent className="p-0">
          {orders.length ? (
            <ul className="divide-y">
              {orders.map((order) => (
                <li key={order.id} className="flex flex-col gap-2 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <Link href={withLocale(`/orders/${order.id}`, locale)} className="font-medium hover:underline">
                      {order.title || order.id}
                    </Link>
                    <p className="text-xs text-zinc-500">{formatDate(order.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={order.payment_status === "unpaid" ? "secondary" : "success"}>
                      {order.payment_status}
                    </Badge>
                    <span className="font-medium">{formatCurrency(order.amount, locale)}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-12 text-center text-sm text-zinc-500">
              {locale === "zh" ? "暂无账单。" : "No invoices yet."}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
