import { MarketingShell } from "@/components/marketing/marketing-shell";
import { Card, CardContent } from "@/components/ui/card";
import { getLocale, type SearchParams } from "@/lib/i18n";

export const revalidate = 3600;

const faqs = {
  en: [
    ["Is VINCIS a freelancer marketplace?", "No. VINCIS is a production workflow OS for brands and studios — brief, pipeline, review, delivery."],
    ["Who is a Brand vs a Studio?", "Brands run campaigns. Studios are production partners — the language US advertising uses, not freelancers."],
    ["What is Creative DNA?", "Automatic brand memory: color, pacing, hooks, CTA. Every next campaign starts smarter."],
    ["How fast is delivery?", "Most campaigns target 72-hour turnaround from brief to first cut."]
  ],
  zh: [
    ["VINCIS 是自由职业平台吗？", "不是。VINCIS 是 Brand 与 Studio 的制作工作流 OS：Brief、流水线、审片、交付。"],
    ["Brand 和 Studio 分别是什么？", "Brand 发起 Campaign。Studio 是制作合作伙伴 — 美国广告行业用语，不是 Freelancer。"],
    ["什么是 Creative DNA？", "自动品牌记忆：色彩、节奏、钩子、CTA。下一次 Campaign 更智能。"],
    ["交付有多快？", "多数 Campaign 目标为 Brief 到初剪 72 小时。"]
  ]
};

export default async function FaqPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = getLocale(await searchParams);
  const items = faqs[locale];

  return (
    <MarketingShell locale={locale}>
      <main className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <h1 className="text-4xl font-semibold tracking-tight">FAQ</h1>
        <div className="mt-12 space-y-4">
          {items.map(([q, a]) => (
            <Card key={q} className="border-zinc-200/80 shadow-none">
              <CardContent className="p-6">
                <h2 className="font-semibold">{q}</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-600">{a}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </MarketingShell>
  );
}
