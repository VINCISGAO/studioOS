import { BadgeCheck, Play } from "lucide-react";

export function ProcessHeroGraphic() {
  return (
    <div className="relative mt-6 min-h-[220px] overflow-hidden rounded-2xl bg-gradient-to-br from-violet-100 via-indigo-50 to-sky-100 sm:min-h-[260px] lg:mt-0 lg:min-h-[280px]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,rgba(139,92,246,0.28),transparent_58%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_72%,rgba(99,102,241,0.18),transparent_50%)]" />

      <div className="absolute left-8 top-10 h-[88px] w-[118px] -rotate-6 rounded-2xl border border-white/70 bg-white/75 p-3 shadow-lg backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-violet-600 text-white">
            <Play className="ml-0.5 h-3 w-3 fill-current" />
          </span>
          <div className="space-y-1">
            <div className="h-1.5 w-12 rounded bg-violet-200" />
            <div className="h-1.5 w-8 rounded bg-zinc-200" />
          </div>
        </div>
        <div className="mt-3 h-10 rounded-lg bg-gradient-to-br from-zinc-800 to-zinc-950" />
      </div>

      <div className="absolute right-10 top-12 h-[72px] w-[96px] rotate-6 rounded-2xl border border-white/70 bg-white/65 p-2.5 shadow-md backdrop-blur-sm">
        <div className="h-2 w-10 rounded bg-zinc-200" />
        <div className="mt-2 space-y-1.5">
          <div className="h-2 w-full rounded bg-zinc-100" />
          <div className="h-2 w-4/5 rounded bg-zinc-100" />
        </div>
        <span className="mt-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
          <BadgeCheck className="h-3 w-3" strokeWidth={2.5} />
        </span>
      </div>

      <div className="absolute bottom-14 left-14 h-14 w-14 rounded-2xl bg-indigo-500/25 shadow-inner" />
      <div className="absolute bottom-10 right-16 h-16 w-16 rounded-full bg-violet-500/30 blur-[1px]" />
      <div className="absolute right-24 top-24 h-10 w-10 rotate-12 rounded-xl border border-white/50 bg-white/40 backdrop-blur-sm" />
    </div>
  );
}
