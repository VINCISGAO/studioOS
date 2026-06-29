import Link from "next/link";
import { ArrowRight, Building2, Clapperboard } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";

const copy = {
  en: {
    eyebrow: "Two portals, one OS",
    title: "Built for brands and studios.",
    brand: {
      label: "Brand",
      title: "Ship campaigns with procurement-grade controls",
      desc: "Wizard, matching, timeline review, and analytics in one workspace.",
      cta: "Brand portal"
    },
    studio: {
      label: "Studio",
      title: "Production dashboard for the AI era",
      desc: "Assigned queue, versioned deliverables, and escrow-backed payouts.",
      cta: "Studio portal"
    }
  },
  zh: {
    eyebrow: "一套系统，两个门户",
    title: "为品牌方与制作方分别设计",
    brand: {
      label: "品牌方",
      title: "以采购级管控交付投放项目",
      desc: "向导、匹配、审片与数据分析，统一在一个工作区。",
      cta: "进入品牌方门户"
    },
    studio: {
      label: "制作方",
      title: "面向 AI 时代的制作工作台",
      desc: "项目队列、版本化交付与托管结算。",
      cta: "进入创作者"
    }
  }
};

export function HomeAudience({ locale }: { locale: Locale }) {
  const t = copy[locale];

  const cards = [
    { ...t.brand, icon: Building2, href: "/login?role=brand" },
    { ...t.studio, icon: Clapperboard, href: "/login?role=creator" }
  ];

  return (
    <section className="border-t border-zinc-200 bg-zinc-50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">{t.eyebrow}</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">{t.title}</h2>
        </div>

        <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-2">
          {cards.map((card) => (
            <Link
              key={card.label}
              href={withLocale(card.href, locale)}
              className="group flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-zinc-300 hover:shadow-md sm:p-7"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-white">
                  <card.icon className="h-4 w-4" />
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  {card.label}
                </span>
              </div>

              <h3 className="mt-4 text-lg font-semibold leading-snug tracking-tight text-zinc-950">
                {card.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-zinc-500">{card.desc}</p>

              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-900 group-hover:gap-2.5 transition-all">
                {card.cta}
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
