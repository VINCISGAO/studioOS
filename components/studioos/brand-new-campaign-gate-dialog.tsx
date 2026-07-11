"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle
} from "@/components/ui/dialog";
import {
  BRAND_ACTIVE_CAMPAIGN_LIMIT,
  type BrandNewCampaignGate
} from "@/lib/studioos/brand-active-campaign-limit";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";
import { scrollToBrandMyAds } from "@/lib/studioos/brand-my-ads-scroll";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { Lightbulb } from "lucide-react";

const copy = {
  en: {
    warnTitle: "You already have campaigns in progress",
    warnLead: (active: number) =>
      `You currently have ${active} active project${active === 1 ? "" : "s"}. To help every project receive focused creative support and high-quality delivery, VINCIS recommends no more than ${BRAND_ACTIVE_CAMPAIGN_LIMIT} active campaigns at once.`,
    warnQuestion: "Would you like to create another project now?",
    continue: "Continue creating",
    later: "Create later",
    blockTitle: "Active campaign limit reached",
    blockLead:
      "You have reached the platform’s recommended maximum of 3 simultaneous campaigns. To protect creative quality and project management efficiency, please wait until one campaign is completed before starting another.",
    rateTitle: "Creation limit reached",
    rateLead10m:
      "You are creating projects too quickly. For service quality, the limit is 2 new projects per 10 minutes (including deleted drafts). Please wait and try again.",
    rateLead24h:
      "You have reached today’s recommended creation limit — up to 5 new projects per 24 hours (including deleted drafts). Try again tomorrow or finish in-progress work first.",
    viewProjects: "View my projects",
    backHome: "Back to workspace",
    gotIt: "Got it"
  },
  zh: {
    warnTitle: "您已有进行中的项目",
    warnLead: (active: number) =>
      `您当前已有 ${active} 个进行中的项目。为了确保每个项目都能获得充分的创意支持与高质量交付，VINCIS 建议同时进行中的项目不超过 ${BRAND_ACTIVE_CAMPAIGN_LIMIT} 个。`,
    warnQuestion: "继续创建新项目吗？",
    continue: "继续创建",
    later: "稍后再创建",
    blockTitle: "已达到同时进行项目上限",
    blockLead:
      "当前已达到平台建议上限（3 个同时进行项目）。为了保证创意质量和项目管理效率，请等待其中一个项目完成后再创建新的项目。",
    rateTitle: "已达到创建频率建议上限",
    rateLead10m:
      "创建过于频繁。为保障平台服务质量，10 分钟内最多创建 2 个项目（含已删除项目）。请稍后再试。",
    rateLead24h:
      "已达到今日创建建议上限。24 小时内最多创建 5 个项目（含已删除项目），请明天再试或先完成进行中的项目。",
    viewProjects: "查看我的项目",
    backHome: "返回工作台",
    gotIt: "我知道了"
  }
} as const;

type Props = {
  locale: Locale;
  gate: Exclude<BrandNewCampaignGate, "allow">;
  activeCount: number;
  rateLimitCode?: "rate_limit_10m" | "rate_limit_24h" | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue: () => void;
};

export function BrandNewCampaignGateDialog({
  locale,
  gate,
  activeCount,
  rateLimitCode,
  open,
  onOpenChange,
  onContinue
}: Props) {
  const t = copy[locale];
  const pathname = usePathname() ?? "";
  const onDashboard = pathname === brandPortalRoutes.dashboard || pathname.endsWith("/brand");
  const isWarn = gate === "warn";
  const isRateLimit = gate === "rate_limit";

  function handleViewProjects() {
    onOpenChange(false);
    if (onDashboard) {
      scrollToBrandMyAds({ behavior: "smooth", force: true });
    }
  }

  const title = isWarn ? t.warnTitle : isRateLimit ? t.rateTitle : t.blockTitle;
  const description = isWarn
    ? t.warnLead(activeCount)
    : isRateLimit
      ? rateLimitCode === "rate_limit_10m"
        ? t.rateLead10m
        : t.rateLead24h
      : t.blockLead;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
            <Lightbulb className="h-5 w-5" />
          </span>
          <div className="min-w-0 space-y-2">
            <DialogTitle className="text-left text-lg font-semibold text-zinc-950">{title}</DialogTitle>
            <DialogDescription className="text-left text-sm leading-relaxed text-zinc-600">
              {description}
            </DialogDescription>
            {isWarn ? <p className="text-sm text-zinc-700">{t.warnQuestion}</p> : null}
          </div>
        </div>

        <DialogFooter className="mt-2 flex-col gap-2 sm:flex-row sm:justify-end">
          {isWarn ? (
            <>
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
                {t.later}
              </Button>
              <Button type="button" className="rounded-xl bg-violet-600 hover:bg-violet-700" onClick={onContinue}>
                {t.continue}
              </Button>
            </>
          ) : isRateLimit ? (
            <Button type="button" className="rounded-xl bg-violet-600 hover:bg-violet-700" onClick={() => onOpenChange(false)}>
              {t.gotIt}
            </Button>
          ) : (
            <>
              <Button type="button" variant="outline" className="rounded-xl" asChild>
                <Link href={withLocale(brandPortalRoutes.dashboard, locale)}>{t.backHome}</Link>
              </Button>
              {onDashboard ? (
                <Button
                  type="button"
                  className="rounded-xl bg-violet-600 hover:bg-violet-700"
                  onClick={handleViewProjects}
                >
                  {t.viewProjects}
                </Button>
              ) : (
                <Button type="button" className="rounded-xl bg-violet-600 hover:bg-violet-700" asChild>
                  <Link href={withLocale(`${brandPortalRoutes.dashboard}#my-ads`, locale)}>{t.viewProjects}</Link>
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
