import Link from "next/link";
import { ArrowRight, BarChart3, Plus, Sparkles, UserRound } from "lucide-react";
import { BrandStartBriefButton } from "@/components/studioos/brand-start-brief-button";
import { BrandCampaignList } from "@/components/studioos/brand-campaign-list";
import { BrandPortalSections } from "@/components/studioos/brand-portal-sections";
import { Button } from "@/components/ui/button";
import { brandPortalService } from "@/features/brand/brand-portal.service";
import { getSessionUser } from "@/features/auth/session.service";
import { getCurrentClientEmail } from "@/lib/client-session";
import { DEMO_USERS } from "@/lib/demo-auth";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { getBrandProfileByEmail, isBrandProfileComplete } from "@/lib/brand-profile-service";
import { listOrdersForClient } from "@/lib/order-service";
import { listProjectsForClient } from "@/lib/project-service";
import { getBrandAttributionWorkspace } from "@/lib/studioos/attribution-service";
import { portalChrome } from "@/lib/studioos/product-theme";
import { toBrandProjectRows } from "@/lib/studioos/brand-dashboard";
import { cn } from "@/lib/utils";

const copy = {
  en: {
    greeting: (name: string) => `Good morning, ${name}`,
    prompt: "What ad do you want to make today?",
    sub: "Three steps — describe your needs, pick a studio, review and approve.",
    newCampaign: "Create ad project",
    myCampaigns: "My projects",
    statTotal: "All",
    statDraft: "Drafts",
    statActive: "In progress",
    portalBadge: "Brand workspace",
    listHint: "You can delete any project or order · multi-select supported",
    profileSetup: "Set up your brand page",
    profileSetupBody: "After filling in your ad brief, complete your public page to showcase finished ads and link each video to its studio.",
    profileSetupCta: "Set up my page",
    attributionTitle: "Upload ad performance data",
    attributionBody:
      "Bind TikTok / YouTube dashboard screenshots to each deliverable — AI learns what worked for your next campaign.",
    attributionCta: "Open attribution"
  },
  zh: {
    greeting: (name: string) => `${name}，你好`,
    prompt: "今天想做什么广告？",
    sub: "三步搞定 — 说清需求、选制作团队、审片验收。",
    newCampaign: "发布广告需求",
    myCampaigns: "我的广告项目",
    statTotal: "全部",
    statDraft: "草稿",
    statActive: "进行中",
    portalBadge: "品牌工作台",
    listHint: "所有项目和订单都可以删除 · 支持多选批量删除",
    profileSetup: "完善你的品牌主页",
    profileSetupBody: "填完广告需求后，完善公开主页，用来展示已发布的广告；每条视频都会关联制作团队，访客可点进团队主页。",
    profileSetupCta: "去完善主页",
    attributionTitle: "上传广告投放数据",
    attributionBody: "将 TikTok / YouTube 后台截图绑定到每条交付物 — AI 学习有效策略，预填下一次 Campaign。",
    attributionCta: "进入归因中心"
  }
};

function displayName(email: string): string {
  const demo = DEMO_USERS.find((user) => user.email === email.toLowerCase());
  if (demo) {
    const short = demo.label.split(" ")[0]?.replace(/[()（）]/g, "") ?? demo.label;
    return short.includes("brand") ? short.replace(/\s*\(brand\)/i, "").trim() : short;
  }
  return email.split("@")[0] ?? "there";
}

function IconBox({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-white">
      {children}
    </span>
  );
}

type BrandHomeSearchParams = SearchParams & {
  error?: string;
};

export default async function BrandHomePage({
  searchParams
}: {
  searchParams: Promise<BrandHomeSearchParams>;
}) {
  const query = await searchParams;
  const locale = getLocale(query);
  const t = copy[locale];
  const clientEmail = await getCurrentClientEmail();
  const orders = clientEmail ? await listOrdersForClient(clientEmail) : [];
  const projects = clientEmail ? await listProjectsForClient(clientEmail) : [];
  const rows = toBrandProjectRows(orders, projects, locale);
  const orderProjectMap = Object.fromEntries(orders.map((order) => [order.id, order.project_id]));

  const name = clientEmail ? displayName(clientEmail) : locale === "zh" ? "朋友" : "there";
  const draftCount = rows.filter((row) => row.phase === "draft").length;
  const activeCount = rows.filter((row) => row.phase === "active").length;
  const brandProfile = clientEmail ? await getBrandProfileByEmail(clientEmail) : null;
  const profileComplete = isBrandProfileComplete(brandProfile);
  const attribution = clientEmail ? await getBrandAttributionWorkspace(clientEmail) : null;
  const sessionUser = await getSessionUser();
  const portal =
    sessionUser && !sessionUser.id.startsWith("demo_")
      ? await brandPortalService.getDashboard({ id: sessionUser.id, role: sessionUser.role }, orders, projects)
      : {
          campaigns: [],
          escrows: [],
          stats: { totalProjects: rows.length, draftCount, activeCount, awaitingReview: 0, escrowHeld: 0, monthSpend: 0 }
        };

  return (
    <div className="space-y-6">
      {query.error === "start-brief" ? (
        <section className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {locale === "zh"
            ? "暂时无法打开发布向导，请刷新页面后重试。若仍失败，请重启本地 dev server（npm run dev:3001）。"
            : "Could not open the campaign wizard. Refresh and try again, or restart the dev server (npm run dev:3001)."}
        </section>
      ) : null}
      {query.error === "wizard-access" ? (
        <section className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {locale === "zh"
            ? "草稿项目加载失败，请重新点击「发布广告」。若仍失败，请重启 dev server。"
            : "Could not load the draft project. Click Create ad again, or restart the dev server."}
        </section>
      ) : null}
      {attribution && attribution.pendingCount > 0 ? (
        <section className={cn(portalChrome.card, "p-5 sm:p-6")}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3.5">
              <IconBox>
                <BarChart3 className="h-5 w-5" />
              </IconBox>
              <div>
                <h2 className={portalChrome.title}>{t.attributionTitle}</h2>
                <p className={cn("mt-1 max-w-xl", portalChrome.body)}>{t.attributionBody}</p>
              </div>
            </div>
            <Button asChild className={cn("shrink-0", portalChrome.cta)}>
              <Link href={withLocale("/brand/attribution", locale)}>
                {t.attributionCta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      ) : null}

      {!profileComplete && clientEmail ? (
        <section className={cn(portalChrome.card, "p-5 sm:p-6")}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3.5">
              <IconBox>
                <UserRound className="h-5 w-5" />
              </IconBox>
              <div>
                <h2 className={portalChrome.title}>{t.profileSetup}</h2>
                <p className={cn("mt-1 max-w-xl", portalChrome.body)}>{t.profileSetupBody}</p>
              </div>
            </div>
            <Button asChild variant="outline" className="shrink-0 rounded-lg border-zinc-200">
              <Link href={withLocale("/brand/profile", locale)}>
                {t.profileSetupCta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      ) : null}

      <section className={cn(portalChrome.card, "overflow-hidden")}>
        <div className="grid lg:grid-cols-[1fr_auto]">
          <div className="border-b border-zinc-100 p-8 sm:p-10 lg:border-b-0 lg:border-r">
            <p className={portalChrome.eyebrow}>{t.portalBadge}</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">{t.greeting(name)}</h1>
            <p className="mt-3 max-w-lg text-lg text-zinc-600">{t.prompt}</p>
            <p className={cn("mt-2 max-w-lg", portalChrome.body)}>{t.sub}</p>
            <BrandStartBriefButton
              locale={locale}
              size="lg"
              className={cn("mt-7", portalChrome.cta, "h-11 px-6")}
            >
              <Plus className="h-4 w-4" />
              {t.newCampaign}
              <ArrowRight className="h-4 w-4" />
            </BrandStartBriefButton>
          </div>

          <div className="grid grid-cols-3 divide-x divide-zinc-100 bg-zinc-50/80 lg:w-[260px] lg:grid-cols-1 lg:divide-x-0 lg:divide-y">
            {[
              { label: t.statTotal, value: rows.length },
              { label: t.statDraft, value: draftCount },
              { label: t.statActive, value: activeCount }
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col justify-center px-6 py-5 lg:px-8 lg:py-6">
                <p className="text-2xl font-semibold tabular-nums tracking-tight text-zinc-950">{stat.value}</p>
                <p className="mt-1 text-xs font-medium text-zinc-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4 pt-2">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-zinc-950">{t.myCampaigns}</h2>
          <p className={cn("mt-1", portalChrome.body)}>{t.listHint}</p>
        </div>
        <BrandCampaignList locale={locale} rows={rows} orderProjectMap={orderProjectMap} />
      </section>

      <BrandPortalSections
        locale={locale}
        campaigns={portal.campaigns}
        escrows={portal.escrows}
        stats={portal.stats}
      />
    </div>
  );
}
