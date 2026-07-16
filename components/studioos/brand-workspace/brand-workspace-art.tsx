/** Brand workspace mascot assets (public/images/ai-copilot). */

import { cn } from "@/lib/utils";

export const BRAND_WORKSPACE_HERO_MASCOT_SRC =
  "/images/ai-copilot/Home%20Page%20Workbench.png";
export const BRAND_WORKSPACE_EMPTY_MASCOT_SRC = "/images/ai-copilot/icon%281%29.png";

function HeroSparkle({
  className,
  size = 12
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={cn("text-violet-400", className)}
      aria-hidden
    >
      <path
        d="M12 1.5 13.8 9.2 21.5 11 13.8 12.8 12 20.5 10.2 12.8 2.5 11 10.2 9.2Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Purple gradient panel backdrop with decorative stars for the workspace hero. */
export function BrandWorkspaceHeroBackdrop({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden rounded-[24px]",
        className
      )}
      aria-hidden
    >
      <div className="absolute inset-0 bg-gradient-to-br from-violet-200/55 via-violet-100/35 to-white/20" />
      <div className="absolute -left-8 -top-10 h-40 w-40 rounded-full bg-violet-300/25 blur-3xl" />
      <div className="absolute right-[18%] top-0 h-36 w-36 rounded-full bg-fuchsia-200/20 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-32 w-48 rounded-full bg-violet-200/30 blur-3xl" />

      <HeroSparkle className="absolute left-[8%] top-[18%] opacity-80" size={14} />
      <HeroSparkle className="absolute left-[22%] top-[10%] text-violet-300 opacity-60" size={10} />
      <HeroSparkle className="absolute left-[34%] top-[24%] text-fuchsia-300 opacity-50" size={8} />
      <HeroSparkle className="absolute right-[34%] top-[12%] text-violet-300 opacity-70" size={12} />
      <HeroSparkle className="absolute right-[26%] top-[28%] opacity-55" size={9} />
      <HeroSparkle className="absolute right-[18%] top-[8%] text-violet-500 opacity-45" size={11} />
      <HeroSparkle className="absolute right-[12%] top-[22%] text-fuchsia-400 opacity-65" size={13} />
      <HeroSparkle className="absolute right-[8%] top-[38%] text-violet-300 opacity-50" size={8} />
      <span className="absolute left-[16%] top-[32%] h-1.5 w-1.5 rounded-full bg-violet-300/80" />
      <span className="absolute left-[28%] top-[14%] h-1 w-1 rounded-full bg-fuchsia-300/70" />
      <span className="absolute right-[30%] top-[18%] h-1.5 w-1.5 rounded-full bg-violet-400/60" />
      <span className="absolute right-[20%] top-[32%] h-1 w-1 rounded-full bg-violet-300/75" />
    </div>
  );
}

export function BrandWorkspaceHeroMascot({ className }: { className?: string }) {
  return (
    <img
      src={BRAND_WORKSPACE_HERO_MASCOT_SRC}
      alt=""
      aria-hidden
      draggable={false}
      className={className}
    />
  );
}

export function BrandWorkspaceEmptyMascot({ className }: { className?: string }) {
  return (
    <img
      src={BRAND_WORKSPACE_EMPTY_MASCOT_SRC}
      alt=""
      aria-hidden
      draggable={false}
      className={className}
    />
  );
}
