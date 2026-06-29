import Link from "next/link";
import { ArrowRight, Bot, Clapperboard, Globe2, ShieldCheck, Sparkles } from "lucide-react";
import { HomeScrollReveal } from "@/components/marketing/home-scroll-reveal";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";

const copy = {
  en: {
    eyebrow: "Platform",
    title: "Everything after the brief.",
    subtitle: "One system for matching, contracts, production, review, and creative intelligence.",
    explore: "See how it works",
    featured: {
      title: "Creative Intelligence flywheel",
      body: "Attribute ad performance to each deliverable. Insights prefill your next campaign wizard — learn what hooks, lengths, and styles win.",
      tags: ["Analytics", "Creative DNA", "Wizard prefill"]
    },
    cards: [
      {
        icon: Globe2,
        title: "Brand workspace",
        body: "Campaign wizard, structured briefs, timeline review, and team-ready project management."
      },
      {
        icon: Clapperboard,
        title: "Studio execution",
        body: "Portfolio discovery, Proposal Room, versioned deliverables, and escrow payouts."
      },
      {
        icon: Bot,
        title: "AI copilot",
        body: "GPT-assisted briefs, product image refinement, and production guidance — human studios execute."
      },
      {
        icon: ShieldCheck,
        title: "Trust layer",
        body: "Dual-sign contracts, escrow, audit logs, and timestamped review for procurement."
      }
    ]
  },
  zh: {
    eyebrow: "平台能力",
    title: "需求简报之后的全部环节。",
    subtitle: "匹配、合约、制作、审片与创意智能 — 一套系统完成。",
    explore: "了解如何运作",
    featured: {
      title: "创意智能飞轮",
      body: "将广告效果归因到每条交付物。洞察自动预填下一次投放向导 — 持续学习有效的开场钩子、时长与风格。",
      tags: ["数据分析", "创意 DNA", "向导预填"]
    },
    cards: [
      {
        icon: Globe2,
        title: "品牌方工作区",
        body: "投放向导、结构化需求简报、时间轴审片与团队级项目管理。"
      },
      {
        icon: Clapperboard,
        title: "制作方执行",
        body: "作品集发现、方案间、版本化交付与托管结算。"
      },
      {
        icon: Bot,
        title: "AI 助手",
        body: "辅助撰写简报、产品图精修与制作指引 — 由人类制作方落地执行。"
      },
      {
        icon: ShieldCheck,
        title: "信任层",
        body: "双签合约、托管、审计日志与时间戳审片 — 满足采购合规。"
      }
    ]
  }
};

export function HomeInfrastructure({ locale }: { locale: Locale }) {
  const t = copy[locale];

  return (
    <div className="bg-[#09090b]">
      <div className="relative overflow-hidden rounded-t-[1.75rem] bg-[#fafaf8] shadow-[0_-32px_64px_-24px_rgba(0,0,0,0.45)] ring-1 ring-white/10 sm:rounded-t-[2rem]">
        <section className="bg-white py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <HomeScrollReveal className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">{t.eyebrow}</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl lg:text-5xl">
            {t.title}
          </h2>
          <p className="mt-4 text-base leading-7 text-zinc-500 sm:text-lg">{t.subtitle}</p>
          <Link
            href={withLocale("/how-it-works", locale)}
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-900 hover:underline"
          >
            {t.explore} <ArrowRight className="h-4 w-4" />
          </Link>
        </HomeScrollReveal>

        <HomeScrollReveal delay={1} className="mt-14 grid gap-4 lg:grid-cols-3 lg:grid-rows-2">
          <article className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-8 text-white lg:col-span-2 lg:row-span-2 lg:p-10">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/[0.04] blur-3xl" />
            <div className="relative">
              <Sparkles className="h-5 w-5 text-zinc-300" />
              <h3 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">{t.featured.title}</h3>
              <p className="mt-4 max-w-lg text-sm leading-7 text-zinc-400 sm:text-base">{t.featured.body}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {t.featured.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-zinc-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {(locale === "zh"
                  ? [
                      ["3.2%", "点击率"],
                      ["88", "开场钩子"],
                      ["+18%", "复投提升"]
                    ]
                  : [
                      ["3.2%", "CTR"],
                      ["88", "Hook"],
                      ["+18%", "Reuse lift"]
                    ]
                ).map(([value, label]) => (
                  <div key={label} className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
                    <p className="font-mono text-xl font-semibold">{value}</p>
                    <p className="mt-1 text-xs text-zinc-500">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </article>

          {t.cards.map(({ icon: Icon, title, body }) => (
            <article
              key={title}
              className="rounded-2xl border border-zinc-200/90 bg-zinc-50/50 p-6 transition hover:border-zinc-300 hover:bg-white"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-white">
                <Icon className="h-4 w-4" />
              </div>
              <h3 className="mt-4 text-base font-semibold tracking-tight text-zinc-950">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-500">{body}</p>
            </article>
          ))}
        </HomeScrollReveal>
          </div>
        </section>
      </div>
    </div>
  );
}
