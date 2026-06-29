import Link from "next/link";
import { ArrowRight, BadgeCheck, FileText, HandCoins, Scale, ShieldCheck, Sparkles } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";

const copy = {
  en: {
    eyebrow: "StudioOS pricing",
    title: "Production workflow for brands. Studio partners quote by scope — not marketplace listings.",
    subtitle:
      "StudioOS is not Fiverr. Brands run campaigns on a pipeline OS. Studios quote against briefs with clear production stages.",
    browse: "See case studies",
    start: "Start a brief",
    cards: [
      {
        icon: FileText,
        title: "Quote before payment",
        body: "The creator responds with scope, timeline, revision rules, deliverables, and commercial usage terms before checkout."
      },
      {
        icon: HandCoins,
        title: "Escrow after agreement",
        body: "Funds are collected only after the brand accepts the quote. AdBridge holds the payment until review, delivery, or dispute resolution."
      },
      {
        icon: ShieldCheck,
        title: "Creator deposit",
        body: "Approved creators keep a refundable platform deposit so quality, deadlines, and disputes have real accountability."
      },
      {
        icon: Scale,
        title: "Platform review",
        body: "AdBridge reviews disputes, refund requests, missing deliverables, and deposit release instead of manually pricing every project."
      }
    ],
    flowTitle: "Recommended transaction flow",
    flow: ["Browse portfolio", "Request quote", "Accept scope", "Escrow payment", "Review delivery", "Release payout"],
    noteTitle: "Why pricing is not fixed",
    note:
      "AI ad work varies by product category, asset quality, usage rights, number of cuts, creator seniority, tools, turnaround, and revision depth. A fixed menu would either underprice strong creators or overcharge simple work."
  },
  zh: {
    eyebrow: "询价与担保规则",
    title: "不设固定套餐。价格由创作者、项目范围、使用权和交付速度共同决定。",
    subtitle:
      "AdBridge 不把创作者强行塞进固定套餐。品牌方先看作品，再发起询价，范围和条款确认后才进入平台托管付款。",
    browse: "浏览作品",
    start: "提交需求",
    cards: [
      {
        icon: FileText,
        title: "先询价，再付款",
        body: "创作者先回复制作范围、周期、修改规则、交付内容和商业使用权，品牌确认后再付款。"
      },
      {
        icon: HandCoins,
        title: "确认后进入托管",
        body: "品牌接受报价后才收取项目款。AdBridge 在审核、交付或争议处理完成前托管资金。"
      },
      {
        icon: ShieldCheck,
        title: "承接人保证金",
        body: "通过审核的承接人保留可退还保证金，用来约束质量、交付周期和争议处理。"
      },
      {
        icon: Scale,
        title: "平台只管关键节点",
        body: "AdBridge 处理争议、退款、未交付和保证金释放，不需要人工给每个项目定价。"
      }
    ],
    flowTitle: "推荐交易流程",
    flow: ["浏览作品", "发起询价", "确认范围", "托管付款", "审核交付", "释放结算"],
    noteTitle: "为什么不固定价格",
    note:
      "AI 广告制作会受到产品品类、素材质量、使用权、视频数量、创作者能力、工具成本、交付速度和修改深度影响。固定菜单要么压低优秀创作者价格，要么让简单项目付得过高。"
  }
};

type PricingPageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function PricingPage({ searchParams }: PricingPageProps) {
  const locale = getLocale(await searchParams);
  const t = copy[locale];

  return (
    <PageShell locale={locale}>
      <main className="bg-[#f6f6f3]">
        <section className="relative overflow-hidden border-b">
          <div className="absolute inset-0 luxury-grid opacity-60" />
          <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 rounded-md border bg-white/80 px-3 py-1.5 text-sm text-muted-foreground shadow-sm backdrop-blur">
                <Sparkles className="h-4 w-4 text-foreground" />
                {t.eyebrow}
              </div>
              <h1 className="mt-6 text-balance text-5xl font-semibold leading-tight sm:text-6xl">
                {t.title}
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">{t.subtitle}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href={withLocale("/creators", locale)}>
                    {t.browse} <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="bg-white">
                  <Link href={withLocale("/start", locale)}>{t.start}</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-5 lg:grid-cols-4">
            {t.cards.map(({ icon: Icon, title, body }) => (
              <Card key={title} className="bg-white shadow-none">
                <CardContent className="p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="mt-6 text-lg font-semibold">{title}</h2>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{body}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-[0.42fr_0.58fr]">
            <Card className="bg-white shadow-none">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold">{t.flowTitle}</h2>
                <div className="mt-5 grid gap-3">
                  {t.flow.map((step, index) => (
                    <div key={step} className="flex items-center gap-3 border-t pt-3 text-sm">
                      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-muted font-medium">
                        {index + 1}
                      </span>
                      {step}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white shadow-none">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <BadgeCheck className="h-5 w-5" />
                  <h2 className="text-lg font-semibold">{t.noteTitle}</h2>
                </div>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">{t.note}</p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
