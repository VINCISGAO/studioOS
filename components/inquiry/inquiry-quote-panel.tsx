import Link from "next/link";
import { acceptQuoteAction, submitQuoteAction } from "@/app/order-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { StoredOrder, StoredQuote } from "@/lib/order-types";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { formatCurrency } from "@/lib/utils";
import { Banknote, CheckCircle2, Clock3, MessageSquareQuote } from "lucide-react";

const copy = {
  en: {
    quoteTitle: "Formal quote — this is how you place an order",
    quoteEmptyCreator: "After you agree on scope in chat, send a formal quote here. The brand accepts it to create an order.",
    amount: "Quote amount (USD)",
    summary: "Scope summary",
    deliveryDays: "Delivery days",
    sendQuote: "Send quote",
    quoteTo: "Quote will be sent to",
    acceptQuote: "Accept quote & place order",
    viewOrder: "Open order",
    payNow: "Pay to start production",
    waitingQuoteTitle: "Not an order yet — waiting for creator quote",
    waitingQuoteBody:
      "Chatting below does not create an order. Ask the creator to send a formal quote using the panel above (creator account). Once you see the price here, click accept to place the order.",
    waitingQuoteTip: "You can message them: “Please send a formal quote so I can place the order.”",
    backDashboard: "Back to inquiries",
    orderCreated: "Order created — next: pay",
    orderCreatedBody: "Your order is created. Pay now to start production. Funds are held in escrow until you approve delivery.",
    completed: "Order completed"
  },
  zh: {
    quoteTitle: "正式报价 — 下单入口在这里",
    quoteEmptyCreator: "在聊天里谈好后，在这里发送正式报价。品牌方接受报价后才会生成订单。",
    amount: "报价金额（USD）",
    summary: "范围说明",
    deliveryDays: "交付天数",
    sendQuote: "发送报价",
    quoteTo: "报价将发送给",
    acceptQuote: "接受报价并下单",
    viewOrder: "查看订单",
    payNow: "付款并开始制作",
    waitingQuoteTitle: "还没下单 — 等待创作者发报价",
    waitingQuoteBody:
      "只在下方聊天不会自动生成订单。请让创作者登录后在上方填写并「发送报价」。你在这里看到金额后，点「接受报价并下单」才算下单。",
    waitingQuoteTip: "你可以发消息说：「谈好了，请发正式报价，我好下单。」",
    backDashboard: "返回我的询价",
    orderCreated: "订单已创建 — 下一步：付款",
    orderCreatedBody: "订单已生成。付款后创作者才会开始制作，款项由平台托管，满意后再释放。",
    completed: "订单已完成"
  }
};

export function InquiryQuotePanel({
  locale,
  inquiryId,
  clientEmail,
  clientName,
  viewerRole,
  quote,
  order
}: {
  locale: Locale;
  inquiryId: string;
  clientEmail: string;
  clientName: string;
  viewerRole: "brand" | "creator";
  quote: StoredQuote | null;
  order: StoredOrder | null;
}) {
  const t = copy[locale];

  if (order?.status === "completed") {
    return (
      <Card className="mt-6 border-emerald-200 bg-emerald-50 shadow-none">
        <CardContent className="flex items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-700" />
            <div>
              <p className="font-semibold text-emerald-950">{t.completed}</p>
              <p className="text-sm text-emerald-900">{order.id}</p>
            </div>
          </div>
          <Button asChild variant="outline">
            <Link href={withLocale(`/orders/${order.id}`, locale)}>{t.viewOrder}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (order) {
    return (
      <Card className="mt-6 border-zinc-900/10 bg-white shadow-sm ring-1 ring-zinc-200">
        <CardContent className="p-5 sm:p-6">
          <p className="text-sm font-semibold text-emerald-700">{t.orderCreated}</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{t.orderCreatedBody}</p>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-lg font-semibold">{order.title}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="secondary">{formatCurrency(order.amount, locale)}</Badge>
                <Badge variant="outline">{order.status}</Badge>
                <Badge variant="outline">{order.payment_status}</Badge>
              </div>
            </div>
            <Button asChild size="lg" className="rounded-full px-6">
              <Link href={withLocale(`/orders/${order.id}${order.payment_status === "unpaid" ? "?pay=1" : ""}`, locale)}>
                {order.payment_status === "unpaid" ? t.payNow : t.viewOrder}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (viewerRole === "creator") {
    return (
      <Card className="mt-6 border-zinc-900/10 shadow-sm ring-1 ring-zinc-200">
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <MessageSquareQuote className="mt-0.5 h-5 w-5 shrink-0 text-zinc-700" />
            <div>
              <h2 className="text-lg font-semibold">{t.quoteTitle}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t.quoteEmptyCreator}</p>
              <p className="mt-3 rounded-lg bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-900">
                {t.quoteTo}: {clientName} ({clientEmail})
              </p>
            </div>
          </div>
          {quote ? (
            <div className="mt-4 rounded-lg border bg-muted/30 p-4 text-sm">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  <Banknote className="mr-1 h-3.5 w-3.5" />
                  {formatCurrency(quote.amount, locale)}
                </Badge>
                <Badge variant="outline">
                  <Clock3 className="mr-1 h-3.5 w-3.5" />
                  {quote.delivery_days}d
                </Badge>
              </div>
              <p className="mt-3 leading-6">{quote.summary}</p>
            </div>
          ) : null}
          <form action={submitQuoteAction} className="mt-5 grid gap-4">
            <input type="hidden" name="lang" value={locale} />
            <input type="hidden" name="inquiry_id" value={inquiryId} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="amount">{t.amount}</Label>
                <Input id="amount" name="amount" type="number" min="1" step="0.01" required placeholder="799" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="delivery_days">{t.deliveryDays}</Label>
                <Input id="delivery_days" name="delivery_days" type="number" min="1" defaultValue="7" required />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="summary">{t.summary}</Label>
              <Textarea
                id="summary"
                name="summary"
                required
                rows={3}
                placeholder={locale === "zh" ? "3 条 TikTok 9:16，含 1 轮修改。" : "3 TikTok 9:16 cuts with one revision round."}
              />
            </div>
            <Button type="submit" size="lg" className="w-full sm:w-auto">
              {t.sendQuote}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  if (quote) {
    return (
      <Card className="mt-6 border-zinc-900/10 bg-white shadow-sm ring-2 ring-zinc-900">
        <CardContent className="p-5 sm:p-6">
          <h2 className="text-lg font-semibold">{t.quoteTitle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {locale === "zh"
              ? "价格已收到。确认无误后点击下方按钮下单。"
              : "Quote received. Click below to place your order."}
          </p>
          <div className="mt-4 rounded-xl border bg-zinc-50 p-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{formatCurrency(quote.amount, locale)}</Badge>
              <Badge variant="outline">
                {quote.delivery_days} {locale === "zh" ? "天交付" : "days"}
              </Badge>
            </div>
            <p className="mt-3 text-sm leading-6">{quote.summary}</p>
          </div>
          <form action={acceptQuoteAction} className="mt-5">
            <input type="hidden" name="lang" value={locale} />
            <input type="hidden" name="inquiry_id" value={quote.inquiry_id} />
            <input type="hidden" name="quote_id" value={quote.id} />
            <Button type="submit" size="lg" className="h-12 w-full rounded-full text-base sm:w-auto sm:px-8">
              <CheckCircle2 className="h-5 w-5" /> {t.acceptQuote}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6 border-amber-200 bg-amber-50/50 shadow-none">
      <CardContent className="p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-amber-950">{t.waitingQuoteTitle}</h2>
        <p className="mt-2 text-sm leading-7 text-amber-900/90">{t.waitingQuoteBody}</p>
        <p className="mt-3 rounded-lg bg-white/80 px-3 py-2 text-sm text-amber-950">{t.waitingQuoteTip}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href={withLocale("/brand", locale)}>{t.backDashboard}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
