import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCurrentClientEmail } from "@/lib/client-session";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { dnaProfileToFields } from "@/lib/studioos/creative-dna-service";
import { demoCreativeDna } from "@/lib/studioos/creative-dna";
import { getDnaProfile, orgIdFromEmail } from "@/lib/studioos/creative-performance-store";
import { Dna } from "lucide-react";

const copy = {
  en: {
    title: "Creative DNA",
    subtitle: "Brand memory — color, pacing, hook, CTA. Every next campaign starts here.",
    auto: "Auto-learned from attributed ad performance",
    fallback: "Demo profile — upload ad data in Attribution to auto-learn",
    version: "Version"
  },
  zh: {
    title: "Creative DNA",
    subtitle: "品牌记忆 — 色彩、节奏、钩子、CTA。下一次 Campaign 从这里自动开始。",
    auto: "来自归因广告表现的自动学习",
    fallback: "演示档案 — 在归因中心上传广告后台数据后可自动学习",
    version: "版本"
  }
};

export default async function CreativeDnaPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = getLocale(await searchParams);
  const t = copy[locale];
  const clientEmail = await getCurrentClientEmail();
  const profile = clientEmail ? await getDnaProfile(orgIdFromEmail(clientEmail)) : null;
  const fields = profile ? dnaProfileToFields(profile, locale) : demoCreativeDna;

  return (
    <div>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white">
          <Dna className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{t.title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-500">{t.subtitle}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
          {profile ? t.auto : t.fallback}
        </p>
        {profile ? (
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-600">
            {t.version} {profile.version} · {profile.learned_from_record_ids.length}{" "}
            {locale === "zh" ? "条记录" : "records"}
          </span>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {fields.map((field) => (
          <Card key={field.key} className="border-zinc-200/80 shadow-none">
            <CardContent className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                {field.label[locale]}
              </p>
              <p className="mt-2 text-sm leading-6 text-zinc-800">{field.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {profile ? (
        <div className="mt-8">
          <Button asChild variant="outline" className="rounded-full">
            <Link href={withLocale("/brand/projects/new", locale)}>
              {locale === "zh" ? "用 DNA 创建新 Campaign" : "Create campaign from DNA"}
            </Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
