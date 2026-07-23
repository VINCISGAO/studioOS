import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { CREATOR_DEPOSIT_USD, depositRequiredMessage, depositRequiredTitle, tCertified } from "@/lib/studioos/deposit-copy";
import { formatSettlementUsd } from "@/lib/money/display-money";

export function DepositRequiredCallout({
  locale,
  compact = false
}: {
  locale: Locale;
  compact?: boolean;
}) {
  const t = tCertified(locale);
  const title = depositRequiredTitle(locale);

  if (compact) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        <p className="font-medium">{title}</p>
        <p className="mt-1 text-xs leading-5 text-amber-900/90">
          {formatSettlementUsd(CREATOR_DEPOSIT_USD, locale)} {t.paymentLabel}
        </p>
        <Button asChild size="sm" variant="outline" className="mt-3 border-amber-300 bg-white">
          <Link href={withLocale("/studio/deposit", locale)}>{t.ctaShort}</Link>
        </Button>
      </div>
    );
  }

  return (
    <Card className="border-amber-200 bg-amber-50/80 shadow-none">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <div className="min-w-0 max-w-2xl">
            <p className="font-semibold text-amber-950">{title}</p>
            <p className="mt-1 text-sm leading-6 text-amber-900/90">{depositRequiredMessage(locale)}</p>
          </div>
        </div>
        <Button asChild className="shrink-0 rounded-full">
          <Link href={withLocale("/studio/deposit", locale)}>{t.cta}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
