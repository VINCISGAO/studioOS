import { BadgeCheck, CheckCircle2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function CertifiedPartnerBadge({
  label,
  compact = false,
  className
}: {
  label: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-2 py-0.5 font-medium text-violet-800 ring-1 ring-violet-200/80",
        compact ? "text-[10px]" : "text-xs",
        className
      )}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-40" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-500" />
      </span>
      {compact ? <Sparkles className="h-3 w-3" /> : <BadgeCheck className="h-3.5 w-3.5" />}
      {label}
    </span>
  );
}

export function CertificationBenefitCard({
  title,
  body
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-violet-100 bg-white/90 p-3.5 shadow-sm">
      <div className="flex items-start gap-2.5">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
        <div>
          <p className="text-sm font-semibold text-zinc-900">{title}</p>
          <p className="mt-1 text-xs leading-5 text-zinc-600">{body}</p>
        </div>
      </div>
    </div>
  );
}
