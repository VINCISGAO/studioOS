import { FileText, HelpCircle, MessageCircle, UserRound } from "lucide-react";

export function FaqHeroGraphic() {
  return (
    <div className="relative mx-auto min-h-[280px] w-full max-w-[420px] sm:min-h-[320px] lg:mx-0 lg:max-w-none">
      <div className="absolute inset-0 rounded-[1.75rem] bg-gradient-to-br from-violet-100/60 via-white to-sky-100/70" />
      <div className="absolute inset-0 rounded-[1.75rem] bg-[radial-gradient(circle_at_28%_22%,rgba(139,92,246,0.18),transparent_55%)]" />
      <div className="absolute inset-0 rounded-[1.75rem] bg-[radial-gradient(circle_at_76%_68%,rgba(56,189,248,0.14),transparent_52%)]" />

      <div className="absolute left-1/2 top-[58%] h-24 w-40 -translate-x-1/2 rounded-[2rem] bg-gradient-to-b from-violet-200/80 to-violet-300/70 shadow-lg" />
      <div className="absolute left-1/2 top-[72%] h-8 w-52 -translate-x-1/2 rounded-full bg-violet-300/50 blur-[1px]" />

      <div className="absolute left-1/2 top-[18%] w-[min(100%,250px)] -translate-x-1/2 rounded-[1.75rem] border border-white/80 bg-white/85 px-6 py-5 text-center shadow-xl backdrop-blur-sm">
        <span className="text-3xl font-bold tracking-[-0.04em] text-violet-700">FAQ</span>
        <div className="mx-auto mt-3 h-1.5 w-16 rounded-full bg-violet-200" />
      </div>

      <div className="absolute left-8 top-16 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/70 bg-white/80 text-violet-600 shadow-md backdrop-blur-sm">
        <HelpCircle className="h-6 w-6" strokeWidth={1.75} />
      </div>

      <div className="absolute right-10 top-14 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/70 bg-white/80 text-sky-600 shadow-md backdrop-blur-sm">
        <FileText className="h-6 w-6" strokeWidth={1.75} />
      </div>

      <div className="absolute bottom-16 left-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/80 text-indigo-600 shadow-md backdrop-blur-sm">
        <UserRound className="h-5 w-5" strokeWidth={1.75} />
      </div>

      <div className="absolute bottom-20 right-12 flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/80 text-violet-500 shadow-md backdrop-blur-sm">
        <MessageCircle className="h-5 w-5" strokeWidth={1.75} />
      </div>
    </div>
  );
}
