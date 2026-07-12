import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type MarketingDocsHeroProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  variant?: "gradient" | "white";
  children?: ReactNode;
};

export function MarketingDocsHero({
  eyebrow,
  title,
  subtitle,
  variant = "gradient",
  children
}: MarketingDocsHeroProps) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-[1.75rem] border p-6 shadow-[0_18px_60px_-48px_rgba(76,29,149,0.35)] sm:p-8 lg:p-10",
        variant === "gradient"
          ? "border-violet-100/70 bg-gradient-to-br from-violet-50/30 via-white to-sky-50/20"
          : "border-violet-100/70 bg-white"
      )}
    >
      <p className="text-sm font-semibold text-violet-700">{eyebrow}</p>
      {variant === "white" ? <div className="mt-2 h-0.5 w-6 rounded-full bg-violet-600" /> : null}
      <h1 className="mt-4 max-w-4xl text-3xl font-semibold tracking-[-0.035em] text-zinc-950 sm:text-4xl lg:text-[2.65rem] lg:leading-[1.08]">
        {title}
      </h1>
      <p className="mt-5 max-w-4xl text-sm leading-7 text-zinc-600">{subtitle}</p>
      {children ? <div className={variant === "white" ? "mt-8" : "mt-6"}>{children}</div> : null}
    </section>
  );
}
