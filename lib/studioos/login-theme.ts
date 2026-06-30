import type { Locale } from "@/lib/i18n";

export type LoginRole = "brand" | "creator";

export type LoginVisual = {
  portalLabel: Record<Locale, string>;
  bg: string;
  overlay: string;
  panelText: string;
  panelMuted: string;
  card: string;
  cardTitle: string;
  cardMuted: string;
  input: string;
  tabWrap: string;
  tabActive: string;
  tabInactive: string;
  btn: string;
  socialBtn: string;
  divider: string;
  link: string;
  featureIcon: string[];
};

export const LOGIN_VISUAL: Record<LoginRole, LoginVisual> = {
  brand: {
    portalLabel: { en: "Brand workspace", zh: "广告主工作台" },
    bg: "/api/login-brand-bg",
    overlay: "linear-gradient(90deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.35) 100%)",
    panelText: "text-white",
    panelMuted: "text-zinc-400",
    card: "border border-white/10 bg-black/45 text-white shadow-[0_24px_80px_-12px_rgba(0,0,0,0.65)] backdrop-blur-xl",
    cardTitle: "text-white",
    cardMuted: "text-zinc-400",
    input:
      "h-11 rounded-xl border-white/10 bg-white/[0.06] pl-10 pr-4 text-sm text-white shadow-none placeholder:text-zinc-500 focus-visible:border-white/20 focus-visible:ring-2 focus-visible:ring-white/10 sm:h-12 sm:pl-11",
    tabWrap: "bg-white/[0.08] p-1",
    tabActive: "bg-white/15 text-white shadow-sm ring-1 ring-white/10",
    tabInactive: "text-zinc-400 hover:text-zinc-200",
    btn: "h-11 w-full rounded-xl bg-white text-sm font-medium text-zinc-950 shadow-sm hover:bg-zinc-100 sm:h-12 sm:text-[15px]",
    socialBtn:
      "inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] text-sm font-medium text-white transition hover:bg-white/[0.08] sm:gap-2",
    divider: "text-zinc-500",
    link: "text-white hover:text-zinc-200",
    featureIcon: [
      "bg-violet-500/15 text-violet-300 ring-violet-400/25",
      "bg-blue-500/15 text-blue-300 ring-blue-400/25",
      "bg-indigo-500/15 text-indigo-300 ring-indigo-400/25"
    ]
  },
  creator: {
    portalLabel: { en: "Creator workspace", zh: "创作者工作台" },
    bg: "/api/login-creator-bg",
    overlay: "linear-gradient(90deg, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.72) 42%, rgba(255,255,255,0.35) 100%)",
    panelText: "text-zinc-950",
    panelMuted: "text-zinc-600",
    card: "border border-white/60 bg-white/75 text-zinc-950 shadow-[0_24px_80px_-24px_rgba(15,23,42,0.25)] backdrop-blur-xl",
    cardTitle: "text-zinc-950",
    cardMuted: "text-zinc-500",
    input:
      "h-11 rounded-xl border-zinc-200/80 bg-zinc-50/80 pl-10 pr-4 text-sm text-zinc-950 shadow-none placeholder:text-zinc-400 focus-visible:border-violet-300 focus-visible:ring-2 focus-visible:ring-violet-500/15 sm:h-12 sm:pl-11",
    tabWrap: "bg-zinc-100/90 p-1",
    tabActive: "bg-white text-zinc-950 shadow-sm ring-1 ring-zinc-200/80",
    tabInactive: "text-zinc-500 hover:text-zinc-700",
    btn: "h-11 w-full rounded-xl bg-violet-600 text-sm font-medium text-white shadow-sm hover:bg-violet-700 sm:h-12 sm:text-[15px]",
    socialBtn:
      "inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-zinc-200/80 bg-white text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 sm:gap-2",
    divider: "text-zinc-400",
    link: "text-violet-600 hover:text-violet-700",
    featureIcon: [
      "bg-violet-100 text-violet-600 ring-violet-200/80",
      "bg-blue-100 text-blue-600 ring-blue-200/80",
      "bg-indigo-100 text-indigo-600 ring-indigo-200/80"
    ]
  }
};

export function getLoginVisual(role: LoginRole) {
  return LOGIN_VISUAL[role];
}

/** White split-panel login — matches homepage LandingSplitHero auth column */
export const LOGIN_SPLIT_VISUAL: LoginVisual = {
  ...LOGIN_VISUAL.creator,
  btn: "h-11 w-full rounded-xl bg-zinc-950 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 sm:h-12 sm:text-[15px]"
};
