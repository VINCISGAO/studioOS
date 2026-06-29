/**
 * Product UI — same language as marketing (home-audience, marketing-shell).
 * Neutral zinc base · whisper blue/green for role · no saturated fills.
 */
export const shellBg = "bg-[#fafaf8]";

export const portalChrome = {
  header: "border-b border-zinc-200/80 bg-white/90 backdrop-blur",
  logo: "flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white",
  badge: "rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500",
  ghost: "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
  cta: "h-10 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800",
  card: "rounded-2xl border border-zinc-200/80 bg-white shadow-sm",
  eyebrow: "text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400",
  title: "font-semibold tracking-tight text-zinc-950",
  body: "text-sm leading-6 text-zinc-500"
} as const;

/** Brand — cool whisper */
export const brandAccent = {
  text: "text-blue-600/90",
  mesh: "radial-gradient(ellipse 60% 40% at 0% 0%, rgba(37,99,235,0.06), transparent 55%)",
  check: "bg-zinc-100 text-blue-600"
} as const;

/** Studio — fresh whisper */
export const studioAccent = {
  text: "text-teal-600/90",
  mesh: "radial-gradient(ellipse 60% 40% at 0% 0%, rgba(13,148,136,0.06), transparent 55%)",
  check: "bg-zinc-100 text-teal-600"
} as const;

export const brandTheme = {
  pageBg: shellBg,
  heroRing: "ring-zinc-200/80",
  avatarBg: "bg-zinc-900",
  tabActive: "border-zinc-900 text-zinc-950",
  tabIdle: "border-transparent text-zinc-400 hover:text-zinc-700",
  badge: "bg-zinc-100 text-zinc-600 ring-0",
  statPill: "bg-zinc-50 text-zinc-700 ring-1 ring-zinc-200/80",
  cardRing: "ring-zinc-200/80"
} as const;

/** @deprecated */
export const brandProductTheme = { shellBg, ...portalChrome };
export const studioProductTheme = { shellBg, ...portalChrome, navActive: "bg-zinc-900 text-white", navIdle: portalChrome.ghost };
export const productTheme = brandProductTheme;
