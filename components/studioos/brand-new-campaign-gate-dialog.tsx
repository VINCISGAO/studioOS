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
import { cn } from "@/lib/utils";
import { ArrowRight, Check, Lightbulb, Sparkles } from "lucide-react";

const copy = {
  en: {
    warnTitle: "You already have campaigns in progress",
    warnLead: (active: number) =>
      `You currently have ${active} active project${active === 1 ? "" : "s"}. To help every project receive focused creative support and high-quality delivery, VINCIS recommends no more than ${BRAND_ACTIVE_CAMPAIGN_LIMIT} active campaigns at once.`,
    warnQuestion: "Would you like to create another project now?",
    qualityTitle: "Keep delivery quality high",
    qualityBody: "Focus on each project and protect delivery standards",
    experienceTitle: "Get a better experience",
    experienceBody: "More efficient communication and more precise matching",
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
    qualityTitle: "保持高质量交付",
    qualityBody: "专注每个项目，保证交付质量",
    experienceTitle: "获得更优体验",
    experienceBody: "更高效的沟通，更精准的匹配",
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

  const benefits = [
    { title: t.qualityTitle, body: t.qualityBody },
    { title: t.experienceTitle, body: t.experienceBody }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName={isWarn ? "bg-slate-950/45 backdrop-blur-md" : undefined}
        className={cn(
          isWarn
            ? [
                "max-h-[88dvh] w-[min(calc(100vw-2rem),22rem)] gap-0 overflow-hidden rounded-2xl border border-white/80 bg-white/95 p-0 shadow-[0_18px_54px_rgba(30,41,59,0.24)] sm:w-full sm:max-w-[568px]",
                "[&>button.absolute]:right-4 [&>button.absolute]:top-4 [&>button.absolute]:z-20 [&>button.absolute]:opacity-80 [&>button.absolute]:ring-offset-white [&>button.absolute]:hover:opacity-100",
                "[&>button.absolute>svg]:h-4 [&>button.absolute>svg]:w-4"
              ]
            : "max-w-md rounded-2xl"
        )}
      >
        {isWarn ? (
          <div className="relative max-h-[88dvh] overflow-y-auto bg-[radial-gradient(circle_at_12%_16%,rgba(124,58,237,0.12),transparent_22%),linear-gradient(180deg,#ffffff_0%,#fbfaff_100%)] px-4 pb-4 pt-5 sm:px-7 sm:pb-7 sm:pt-8">
            <div className="pointer-events-none absolute -left-6 -top-6 h-28 w-28 rounded-full bg-violet-300/20 blur-3xl" />
            <div className="pointer-events-none absolute -right-8 bottom-2 h-28 w-28 rounded-full bg-violet-500/10 blur-3xl" />

            <div className="relative flex gap-4 pr-5 sm:gap-4 sm:pr-6">
              <div className="relative hidden h-14 w-14 shrink-0 items-center justify-center rounded-full bg-violet-100/70 shadow-[inset_0_0_18px_rgba(124,58,237,0.13),0_10px_22px_rgba(124,58,237,0.12)] sm:flex sm:h-[4.4rem] sm:w-[4.4rem]">
                <div className="absolute inset-3 rounded-full bg-white/45" />
                <Lightbulb className="relative h-7 w-7 text-violet-600 sm:h-9 sm:w-9" strokeWidth={2.4} />
                <Sparkles className="absolute right-3.5 top-3.5 h-2.5 w-2.5 fill-violet-500 text-violet-500 sm:right-4 sm:top-4 sm:h-3 sm:w-3" />
              </div>

              <div className="min-w-0 flex-1">
                <DialogTitle className="text-left text-[1.25rem] font-semibold leading-tight tracking-[-0.04em] text-zinc-950 sm:text-[1.7rem]">
                  {title}
                </DialogTitle>
                <DialogDescription className="mt-1.5 max-w-[350px] text-left text-[0.74rem] leading-[1.15rem] tracking-[-0.01em] text-zinc-600 sm:mt-3 sm:max-w-[420px] sm:text-sm sm:leading-6">
                  {description}
                </DialogDescription>
              </div>
            </div>

            <div className="relative mt-4 overflow-hidden rounded-xl border border-violet-100/90 bg-[linear-gradient(135deg,rgba(250,247,255,0.98),rgba(255,255,255,0.92))] px-3.5 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_12px_32px_rgba(109,40,217,0.08)] sm:mt-7 sm:px-6 sm:py-5">
              <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[32%] bg-[radial-gradient(circle_at_58%_48%,rgba(124,58,237,0.2),transparent_44%)] sm:block" />
              <div className="relative grid gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="h-4 w-4 fill-violet-600 text-violet-600 sm:h-5 sm:w-5" />
                    <p className="text-[0.82rem] font-semibold tracking-[-0.03em] text-zinc-900 sm:text-sm">
                      {t.warnQuestion}
                    </p>
                  </div>

                  <div className="mt-3 grid gap-2.5 sm:mt-5 sm:grid-cols-2 sm:gap-4">
                    {benefits.map((benefit, index) => (
                      <div
                        key={benefit.title}
                        className={cn(
                          "flex items-start gap-2.5",
                          index > 0 ? "border-t border-violet-100 pt-2.5 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0" : undefined
                        )}
                      >
                        <span className="mt-0.5 flex h-[1.125rem] w-[1.125rem] shrink-0 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg shadow-violet-600/25 sm:h-5 sm:w-5">
                          <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" strokeWidth={2.8} />
                        </span>
                        <span>
                          <span className="block text-[0.72rem] font-semibold text-zinc-900 sm:text-sm">
                            {benefit.title}
                          </span>
                          <span className="mt-0.5 block text-[0.64rem] leading-[0.9rem] text-zinc-500 sm:text-xs sm:leading-5">
                            {benefit.body}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            <DialogFooter className="relative mt-3.5 flex-col gap-2 sm:mt-6 sm:flex-row sm:justify-end sm:gap-3 sm:space-x-0">
              <Button
                type="button"
                variant="outline"
                className="h-9 w-full rounded-lg border-zinc-200 bg-white text-xs font-semibold text-zinc-700 shadow-[0_8px_20px_rgba(15,23,42,0.05)] hover:bg-zinc-50 sm:h-12 sm:min-w-[9.5rem] sm:flex-1 sm:text-base"
                onClick={() => onOpenChange(false)}
              >
                {t.later}
              </Button>
              <Button
                type="button"
                className="h-9 w-full rounded-lg bg-violet-600 text-xs font-semibold text-white shadow-[0_12px_22px_rgba(109,40,217,0.26)] hover:bg-violet-700 sm:h-12 sm:min-w-[10.5rem] sm:flex-1 sm:text-base"
                onClick={onContinue}
              >
                {t.continue}
                <ArrowRight className="ml-2 h-3.5 w-3.5 sm:h-5 sm:w-5" strokeWidth={2.3} />
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                <Lightbulb className="h-5 w-5" />
              </span>
              <div className="min-w-0 space-y-2">
                <DialogTitle className="text-left text-lg font-semibold text-zinc-950">{title}</DialogTitle>
                <DialogDescription className="text-left text-sm leading-relaxed text-zinc-600">
                  {description}
                </DialogDescription>
              </div>
            </div>

            <DialogFooter className="mt-2 flex-col gap-2 sm:flex-row sm:justify-end">
              {isRateLimit ? (
                <Button
                  type="button"
                  className="rounded-xl bg-violet-600 hover:bg-violet-700"
                  onClick={() => onOpenChange(false)}
                >
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
