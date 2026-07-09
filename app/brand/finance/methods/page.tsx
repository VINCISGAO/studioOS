import { getAppUiLocale } from "@/lib/app-language";
import { Card, CardContent } from "@/components/ui/card";
import { type SearchParams } from "@/lib/i18n";

export default async function BrandPaymentMethodsPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const locale = await getAppUiLocale();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
        {locale === "zh" ? "支付方式" : "Payment methods"}
      </h1>
      <p className="mt-2 text-sm text-zinc-500">
        {locale === "zh"
          ? "绑定公司信用卡、银行转账或 Stripe 账户。"
          : "Connect company cards, bank transfer, or Stripe billing."}
      </p>
      <Card className="mt-8 border-zinc-200/80 shadow-none">
        <CardContent className="p-8 text-center text-sm text-zinc-500">
          {locale === "zh" ? "支付方式管理即将上线。" : "Payment method management coming soon."}
        </CardContent>
      </Card>
    </div>
  );
}
