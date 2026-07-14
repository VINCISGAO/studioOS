export function CasesHeroIllustration() {
  return (
    <div
      className="pointer-events-none relative mx-auto hidden h-[168px] w-[220px] shrink-0 lg:block xl:h-[196px] xl:w-[260px]"
      aria-hidden
    >
      <div className="absolute inset-x-6 bottom-3 h-8 rounded-full bg-violet-200/30 blur-xl" />
      <div className="absolute bottom-0 left-1/2 h-3 w-[78%] -translate-x-1/2 rounded-full bg-zinc-200/80" />
      <div className="absolute bottom-3 left-[18%] h-[72%] w-[52%] rotate-[-8deg] rounded-2xl border border-white/60 bg-gradient-to-br from-violet-200/50 to-violet-400/20 shadow-[0_20px_50px_-30px_rgba(109,40,217,0.55)] backdrop-blur-sm" />
      <div className="absolute bottom-5 left-[32%] h-[68%] w-[48%] rotate-[4deg] rounded-2xl border border-white/70 bg-gradient-to-br from-violet-100/70 to-white/40 shadow-[0_16px_40px_-28px_rgba(109,40,217,0.45)] backdrop-blur-md" />
      <div className="absolute bottom-7 left-[44%] flex h-[58%] w-[42%] items-center justify-center rounded-2xl border border-white/80 bg-gradient-to-br from-white/90 to-violet-50/80 shadow-[0_12px_32px_-24px_rgba(109,40,217,0.35)]">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-600/90 text-white shadow-lg shadow-violet-500/30">
          <svg viewBox="0 0 24 24" className="ml-0.5 h-5 w-5 fill-current" aria-hidden>
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </div>
    </div>
  );
}
