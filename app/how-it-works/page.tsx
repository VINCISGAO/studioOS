import Link from "next/link";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";

export const revalidate = 3600;

const steps = {
  en: [
    ["Brief Builder", "Product URL → goal → audience → style → references. AI generates your Creative Brief."],
    ["Studio assignment", "Matched production studio receives the brief on the pipeline — not a chat thread."],
    ["Production pipeline", "Storyboard, scene generation, voice, sound, QA — visible like Linear."],
    ["Review Center", "Timeline comments on video. Approve or request revisions anchored to timestamps."],
    ["Delivery & DNA", "Final ads archive to Asset Library. Creative DNA learns for the next campaign."]
  ],
  zh: [
    ["Brief Builder", "产品链接 → 目标 → 受众 → 风格 → 参考。AI 生成 Creative Brief。"],
    ["分配 Studio", "匹配的制作 Studio 在流水线上接收 Brief — 不是聊天。"],
    ["制作流水线", "分镜、场景、配音、音效、质检 — 像 Linear 一样可视化。"],
    ["Review Center", "视频时间轴批注。所有修改锚定在具体画面。"],
    ["交付与 DNA", "成片进入素材库。Creative DNA 为下一次 Campaign 自动记忆。"]
  ]
};

export default async function HowItWorksPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = getLocale(await searchParams);
  const items = steps[locale];

  return (
    <MarketingShell locale={locale}>
      <main className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <h1 className="text-4xl font-semibold tracking-tight">{locale === "zh" ? "如何运作" : "How it works"}</h1>
        <p className="mt-4 text-lg text-zinc-500">
          {locale === "zh" ? "Workflow，不是 Marketplace。" : "Workflow, not marketplace."}
        </p>
        <ol className="mt-12 space-y-6">
          {items.map(([title, body], index) => (
            <Card key={title} className="border-zinc-200/80 shadow-none">
              <CardContent className="flex gap-4 p-6">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <div>
                  <h2 className="text-lg font-semibold">{title}</h2>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">{body}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </ol>
        <Button asChild className="mt-10 rounded-full">
          <Link href={withLocale("/brand/brief/new", locale)}>
            {locale === "zh" ? "开始 Brief" : "Start a brief"}
          </Link>
        </Button>
      </main>
    </MarketingShell>
  );
}
