import Link from "next/link";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import type { DemoRole } from "@/lib/demo-auth";

const copy = {
  en: {
    loggedInAs: "Signed in as",
    brand: "brand",
    creator: "creator",
    admin: "admin",
    guest: "guest (not signed in)",
    brandViewingCreatorHint:
      "You are signed in as a brand. To send a quote, sign out and sign in with the creator account (creator.nova@adbridge.test).",
    creatorViewingBrandHint:
      "You are signed in as a creator. To accept a quote, sign out and sign in with the brand account (client.arc@adbridge.test).",
    quoteSent: "Quote sent successfully. The brand can accept it from this chat or their dashboard.",
    quoteFailed:
      "Quote was not saved. Sign in as the creator for this thread, then send the quote again.",
    signInCreator: "Sign in as creator",
    signInBrand: "Sign in as brand",
    useTwoBrowsers:
      "Tip: use two browsers (or one normal + one incognito) so brand and creator can stay signed in at the same time."
  },
  zh: {
    loggedInAs: "当前登录",
    brand: "品牌方",
    creator: "创作者",
    admin: "管理员",
    guest: "未登录",
    brandViewingCreatorHint:
      "你现在是品牌方登录。若要发送报价，请先退出，再用创作者账号登录（creator.nova@adbridge.test）。",
    creatorViewingBrandHint:
      "你现在是创作者登录。若要接受报价，请先退出，再用品牌账号登录（client.arc@adbridge.test）。",
    quoteSent: "报价已发送。品牌方可在本页或「询价与订单」里接受报价。",
    quoteFailed: "报价未保存。请确认已用创作者账号登录，然后重新发送报价。",
    signInCreator: "登录创作者账号",
    signInBrand: "登录品牌账号",
    useTwoBrowsers: "提示：请用两个浏览器（或一个普通窗口 + 一个无痕窗口）分别登录品牌和创作者，避免互相顶掉登录状态。"
  }
};

export function ChatSessionBanner({
  locale,
  sessionRole,
  sessionEmail,
  viewerRole,
  flash
}: {
  locale: Locale;
  sessionRole: DemoRole | "guest";
  sessionEmail?: string;
  viewerRole: "brand" | "creator";
  flash?: "quoted" | "quote-error" | null;
}) {
  const t = copy[locale];
  const roleLabel =
    sessionRole === "client"
      ? t.brand
      : sessionRole === "creator"
        ? t.creator
        : sessionRole === "admin"
          ? t.admin
          : t.guest;

  const mismatch =
    (sessionRole === "client" && viewerRole === "creator") ||
    (sessionRole === "creator" && viewerRole === "brand");

  return (
    <div className="mt-4 space-y-3">
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
        {t.loggedInAs}: <span className="font-medium text-zinc-900">{roleLabel}</span>
        {sessionEmail ? <span className="text-zinc-500"> ({sessionEmail})</span> : null}
        <p className="mt-1 text-xs text-zinc-500">{t.useTwoBrowsers}</p>
      </div>

      {flash === "quoted" ? (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          {t.quoteSent}
        </div>
      ) : null}

      {flash === "quote-error" ? (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p>{t.quoteFailed}</p>
            <Button asChild size="sm" variant="outline" className="mt-2">
              <Link href={withLocale("/login?role=creator", locale)}>{t.signInCreator}</Link>
            </Button>
          </div>
        </div>
      ) : null}

      {mismatch && sessionRole === "client" && viewerRole === "creator" ? (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p>{t.brandViewingCreatorHint}</p>
            <Button asChild size="sm" variant="outline" className="mt-2">
              <Link href={withLocale("/login?role=creator", locale)}>{t.signInCreator}</Link>
            </Button>
          </div>
        </div>
      ) : null}

      {mismatch && sessionRole === "creator" && viewerRole === "brand" ? (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p>{t.creatorViewingBrandHint}</p>
            <Button asChild size="sm" variant="outline" className="mt-2">
              <Link href={withLocale("/login?role=brand", locale)}>{t.signInBrand}</Link>
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
