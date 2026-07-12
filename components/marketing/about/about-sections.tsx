import {
  BadgeCheck,
  BarChart3,
  BookOpen,
  Globe2,
  Lightbulb,
  Mail,
  MessageSquare,
  Play,
  ShieldCheck,
  Sparkles,
  Target,
  Users
} from "lucide-react";
import { aboutText } from "@/lib/marketing/about-copy";
import type { Locale } from "@/lib/i18n";

const PLATFORM_ICONS = [
  Sparkles,
  Users,
  Mail,
  BookOpen,
  Play,
  BadgeCheck,
  Lightbulb,
  Globe2,
  Target
] as const;

const HERO_POINT_ICONS = [Target, Globe2, Sparkles, BarChart3] as const;
const STORY_POINT_ICONS = [Play, MessageSquare, ShieldCheck] as const;

export function AboutHeroSection({ locale }: { locale: Locale }) {
  const t = aboutText(locale);
  const [introOne = "", introTwo = "", beliefCopy = ""] = t.hero.paragraphs;
  const [beliefLead = "", beliefRest = ""] = beliefCopy.split("\n");

  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-violet-100/70 bg-white p-6 shadow-[0_18px_60px_-48px_rgba(76,29,149,0.35)] sm:p-8 lg:p-10">
      <p className="text-sm font-semibold text-violet-700">{t.pageTitle}</p>
      <div className="mt-2 h-0.5 w-6 rounded-full bg-violet-600" />
      <h1 className="mt-5 max-w-4xl text-3xl font-semibold tracking-[-0.04em] text-zinc-950 sm:text-4xl lg:text-[2.7rem] lg:leading-[1.08]">
        {t.hero.title}
      </h1>
      <div className="mt-5 max-w-5xl space-y-3 text-sm leading-7 text-pretty text-zinc-600">
        <p>{introOne}</p>
        <p>{introTwo}</p>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {t.hero.features.map((item, index) => {
          const Icon = HERO_POINT_ICONS[index] ?? Target;
          return (
            <article key={item.title}>
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-violet-50 text-violet-700">
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <h3 className="mt-4 text-sm font-semibold leading-6 text-zinc-950">{item.title}</h3>
              <p className="mt-2 text-xs leading-6 text-zinc-500">{item.body}</p>
            </article>
          );
        })}
      </div>

      <div className="mt-8 rounded-2xl border border-violet-100 bg-violet-50/60 px-5 py-5 sm:px-6">
        <div className="flex gap-4 sm:items-start">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-violet-700 shadow-sm">
            <Users className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div className="space-y-2 text-sm leading-7 text-zinc-600">
            {beliefLead ? <p className="font-semibold text-zinc-900">{beliefLead}</p> : null}
            {beliefRest ? <p>{beliefRest}</p> : null}
          </div>
        </div>
      </div>
    </section>
  );
}

export function AboutStorySection({ locale }: { locale: Locale }) {
  const t = aboutText(locale);
  const storyPoints = t.story.paragraphs.slice(1, 4);

  return (
    <section
      id="story"
      className="scroll-mt-24 mt-6 overflow-hidden rounded-[1.75rem] border border-violet-100/70 bg-white p-6 shadow-[0_18px_60px_-48px_rgba(76,29,149,0.35)] sm:p-8 lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12 lg:p-10"
    >
      <div className="lg:pt-1">
        <p className="text-sm font-semibold text-violet-700">{t.story.eyebrow}</p>
        <div className="mt-2 h-0.5 w-6 rounded-full bg-violet-600" />
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950">{t.story.title}</h2>
        <p className="mt-4 text-sm leading-7 text-zinc-500">{t.story.paragraphs[0]}</p>
      </div>

      <div className="mt-8 grid gap-6 text-sm leading-7 text-zinc-600 sm:grid-cols-3 lg:mt-0">
        {storyPoints.map((paragraph, index) => {
          const Icon = STORY_POINT_ICONS[index] ?? Sparkles;
          return (
            <article key={paragraph.slice(0, 24)} className="space-y-4">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <p>{paragraph}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function AboutPlatformSection({ locale }: { locale: Locale }) {
  const t = aboutText(locale);

  return (
    <section id="platform" className="scroll-mt-24 mt-6 rounded-2xl border border-zinc-200/80 bg-white p-6 sm:p-8">
      <h2 className="text-2xl font-bold text-zinc-950">{t.platform.title}</h2>
      <p className="mt-3 text-sm text-zinc-600">{t.platform.subtitle}</p>
      <div className="mt-6 grid grid-cols-3 gap-4 sm:grid-cols-5 lg:grid-cols-9">
        {t.platform.items.map((item, index) => {
          const Icon = PLATFORM_ICONS[index] ?? Sparkles;
          return (
            <div key={item} className="flex flex-col items-center gap-2 text-center">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-violet-100 bg-violet-50 text-violet-700">
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <span className="text-[11px] font-medium leading-4 text-zinc-700">{item}</span>
            </div>
          );
        })}
      </div>
      <p className="mt-6 text-sm font-medium text-zinc-700">{t.platform.closing}</p>
    </section>
  );
}

export function AboutStatsSection({ locale }: { locale: Locale }) {
  const t = aboutText(locale);

  return (
    <section className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
      {t.stats.map((stat) => (
        <div key={stat.label} className="rounded-2xl border border-zinc-200/80 bg-white px-5 py-6 text-center">
          <p className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">{stat.value}</p>
          <p className="mt-2 text-sm text-zinc-500">{stat.label}</p>
        </div>
      ))}
    </section>
  );
}
