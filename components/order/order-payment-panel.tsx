import { payOrderAction } from "@/app/order-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { StoredOrder } from "@/lib/order-types";
import type { Locale } from "@/lib/i18n";
import { formatCurrency } from "@/lib/utils";
import { ShieldCheck } from "lucide-react";

const copy = {
  en: {
    title: "Escrow payment",
    body: "Funds are held until you approve the final delivery. Demo mode completes payment instantly when Stripe is not configured.",
    pay: "Pay now",
    paid: "Payment in escrow",
    amount: "Order total",
    fee: "Platform fee",
    payout: "Creator payout"
  },
  zh: {
    title: "托管付款",
    body: "款项将托管至你确认交付后释放。未配置 Stripe 时使用演示付款，立即完成。",
    pay: "立即付款",
    paid: "托管中",
    amount: "订单总额",
    fee: "平台服务费",
    payout: "创作者收入"
  }
};

export function OrderPaymentPanel({
  locale,
  order,
  showPayPrompt
}: {
  locale: Locale;
  order: StoredOrder;
  showPayPrompt?: boolean;
}) {
  const t = copy[locale];

  if (order.payment_status !== "unpaid") {
    return (
      <Card className="border-emerald-200 bg-emerald-50 shadow-none">
        <CardContent className="flex items-center gap-3 p-5">
          <ShieldCheck className="h-5 w-5 text-emerald-700" />
          <div>
            <p className="font-semibold text-emerald-950">{t.paid}</p>
            <p className="text-sm text-emerald-900">{formatCurrency(order.amount, locale)}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={showPayPrompt ? "border-amber-200 bg-amber-50 shadow-none" : "shadow-none"}>
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold">{t.title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{t.body}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="secondary">{t.amount}: {formatCurrency(order.amount, locale)}</Badge>
          <Badge variant="outline">{t.fee}: {formatCurrency(order.platform_fee, locale)}</Badge>
          <Badge variant="outline">{t.payout}: {formatCurrency(order.creator_payout, locale)}</Badge>
        </div>
        <form action={payOrderAction} className="mt-5">
          <input type="hidden" name="lang" value={locale} />
          <input type="hidden" name="order_id" value={order.id} />
          <Button type="submit" size="lg">
            <ShieldCheck className="h-4 w-4" /> {t.pay}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
