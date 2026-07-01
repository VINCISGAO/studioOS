import Link from "next/link";
import { Shield } from "lucide-react";
import { DepositPanel } from "@/components/studioos/deposit-panel";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { CREATOR_DEPOSIT_USD, tCertified } from "@/lib/studioos/deposit-copy";
import type { CreatorDepositSnapshot } from "@/lib/studioos/deposit-types";
import { creatorPortalRoutes } from "@/lib/studioos/creator-portal-routes";
import { portalChrome } from "@/lib/studioos/product-theme";
import { cn, formatCurrency } from "@/lib/utils";

type Props = {
  locale: Locale;
  creatorId: string;
  snapshot: CreatorDepositSnapshot;
  mode: "optional" | "required" | "certified";
  completedOrders: number;
  submitted?: boolean;
  error?: string;
  profileComplete?: boolean;
};

const optionalCopy = {
  en: {
    title: "Professional certification (optional)",
    body: "Get certified to boost brand trust — or complete your first project free, then decide.",
    certify: "Certify now",
    later: "Maybe later"
  },
  zh: {
    title: "专业认证（可选）",
    body: "完成认证可提升品牌信任度；也可以先免费完成第一单，再决定是否认证。",
    certify: "立即认证",
    later: "以后再说"
  }
};

const requiredCopy = {
  en: {
    title: "Your free trial has ended",
    body: "Complete professional certification to continue receiving new ad projects.",
    certify: "Certify now"
  },
  zh: {
    title: "你的免费体验已结束",
    body: "完成专业认证后，即可继续接收新的广告项目。",
    certify: "立即认证"
  }
};

export function CreatorCertificationHub({
  locale,
  creatorId,
  snapshot,
  mode,
  completedOrders,
  submitted,
  error,
  profileComplete = true
}: Props) {
  const t = tCertified(locale);

  if (mode === "certified" || snapshot.deposit_status === "paid") {
    return (
      <DepositPanel
        locale={locale}
        creatorId={creatorId}
        snapshot={snapshot}
        submitted={submitted}
        error={error}
        profileComplete={profileComplete}
      />
    );
  }

  if (mode === "required") {
    const copy = requiredCopy[locale];
    return (
      <div className="space-y-6">
        <section className={cn(portalChrome.card, "border-amber-200 bg-amber-50/80 p-6 sm:p-8")}>
          <div className="flex gap-3">
            <Shield className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-amber-950 sm:text-2xl">{copy.title}</h1>
              <p className="mt-2 text-sm leading-6 text-amber-900/90">{copy.body}</p>
              <Button asChild className="mt-5 rounded-full">
                <Link href={withLocale(`${creatorPortalRoutes.deposit}?scroll=pay`, locale)}>
                  {copy.certify}
                </Link>
              </Button>
            </div>
          </div>
        </section>
        <DepositPanel
          locale={locale}
          creatorId={creatorId}
          snapshot={snapshot}
          submitted={submitted}
          error={error}
          profileComplete={profileComplete}
        />
      </div>
    );
  }

  const copy = optionalCopy[locale];
  return (
    <div className="space-y-6">
      <section className={cn(portalChrome.card, "p-6 sm:p-8")}>
        <p className={portalChrome.eyebrow}>{t.programName}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">{copy.title}</h1>
        <p className={cn("mt-2 max-w-2xl", portalChrome.body)}>{copy.body}</p>
        <p className="mt-3 text-sm text-zinc-500">
          {formatCurrency(CREATOR_DEPOSIT_USD)} ·{" "}
          {locale === "zh"
            ? `已完成 ${completedOrders} 单 · 首单前全部功能开放`
            : `${completedOrders} completed order(s) · all features open before first delivery`}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild className={portalChrome.cta}>
            <Link href={withLocale(`${creatorPortalRoutes.deposit}?scroll=pay`, locale)}>{copy.certify}</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href={withLocale(creatorPortalRoutes.home, locale)}>{copy.later}</Link>
          </Button>
        </div>
      </section>
      <DepositPanel
        locale={locale}
        creatorId={creatorId}
        snapshot={snapshot}
        submitted={submitted}
        error={error}
        profileComplete={profileComplete}
      />
    </div>
  );
}
