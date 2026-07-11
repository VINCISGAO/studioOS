import { BadgeCheck, CircleDollarSign, Play } from "lucide-react";

export function PricingHeroGraphic() {
  return (
    <div className="relative mx-auto min-h-[260px] w-full max-w-[360px] sm:min-h-[300px] lg:mx-0 lg:max-w-none">
      <div className="absolute inset-0 rounded-[1.75rem] bg-gradient-to-br from-violet-100/70 via-indigo-50/80 to-sky-100/70" />
      <div className="absolute inset-0 rounded-[1.75rem] bg-[radial-gradient(circle_at_30%_24%,rgba(139,92,246,0.22),transparent_58%)]" />
      <div className="absolute inset-0 rounded-[1.75rem] bg-[radial-gradient(circle_at_78%_72%,rgba(56,189,248,0.18),transparent_52%)]" />

      <div className="absolute left-8 top-10 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/70 bg-white/80 text-sky-600 shadow-lg backdrop-blur-sm">
        <CircleDollarSign className="h-7 w-7" strokeWidth={1.75} />
      </div>

      <div className="absolute right-10 top-12 h-[108px] w-[132px] -rotate-3 rounded-2xl border border-white/70 bg-white/75 p-3 shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600 text-white">
            <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />
          </span>
          <div className="space-y-1.5">
            <div className="h-1.5 w-14 rounded bg-violet-200" />
            <div className="h-1.5 w-9 rounded bg-zinc-200" />
          </div>
        </div>
        <div className="mt-3 h-12 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-950" />
        <div className="mt-2 flex gap-1">
          <div className="h-1.5 flex-1 rounded bg-violet-200" />
          <div className="h-1.5 w-6 rounded bg-sky-200" />
        </div>
      </div>

      <div className="absolute bottom-12 left-1/2 w-[min(100%,220px)] -translate-x-1/2 rounded-2xl border border-white/70 bg-white/70 p-4 shadow-lg backdrop-blur-sm">
        <div className="flex items-end justify-between gap-2">
          <div className="flex items-end gap-1.5">
            <div className="h-10 w-3 rounded bg-violet-400/80" />
            <div className="h-14 w-3 rounded bg-violet-600" />
            <div className="h-8 w-3 rounded bg-sky-400/80" />
            <div className="h-12 w-3 rounded bg-indigo-500/80" />
          </div>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md">
            <BadgeCheck className="h-4 w-4" strokeWidth={2.25} />
          </span>
        </div>
      </div>

      <div className="absolute bottom-20 right-14 h-10 w-10 rounded-full bg-violet-400/30 blur-[0.5px]" />
      <div className="absolute left-16 top-24 h-8 w-8 rounded-xl border border-white/50 bg-white/35 backdrop-blur-sm" />
    </div>
  );
}
