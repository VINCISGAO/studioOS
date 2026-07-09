import { getAppUiLocale } from "@/lib/app-language";
import { Lock } from "lucide-react";
import { type SearchParams } from "@/lib/i18n";

export default async function BrandTeamPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = await getAppUiLocale();

  return (
    <section className="mx-auto flex min-h-[420px] max-w-3xl items-center justify-center">
      <div className="w-full rounded-[28px] border border-zinc-200 bg-white p-10 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-zinc-950">
          {locale === "zh" ? "团队协作暂未开放" : "Team Collaboration Is Not Available Yet"}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-zinc-500">
          {locale === "zh"
            ? "该模块正在规划中，暂时无法进入。后续开放后可邀请团队成员共同管理广告、审片和账单。"
            : "This module is currently locked. When it opens, you will be able to invite teammates to manage ads, reviews, and billing together."}
        </p>
      </div>
    </section>
  );
}
