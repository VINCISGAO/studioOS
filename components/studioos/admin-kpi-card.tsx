import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function AdminKpiCard({
  label,
  value,
  hint,
  accent = false,
  className
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "border-zinc-200/80 shadow-none transition hover:border-zinc-300/80",
        accent && "border-violet-200/80 bg-gradient-to-br from-violet-50/50 to-white",
        className
      )}
    >
      <CardContent className="p-5">
        <p className={cn("text-sm", accent ? "text-violet-700" : "text-zinc-500")}>{label}</p>
        <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-zinc-950">{value}</p>
        {hint ? <p className="mt-2 text-xs leading-relaxed text-zinc-400">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}
