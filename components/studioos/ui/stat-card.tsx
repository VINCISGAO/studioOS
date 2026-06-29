import { studioClasses, typography } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: React.ReactNode;
  hint?: string;
  trend?: "up" | "down" | "neutral";
  className?: string;
};

const trendClass = {
  up: "text-success",
  down: "text-destructive",
  neutral: "text-muted-foreground"
} as const;

export function StatCard({ label, value, hint, trend = "neutral", className }: StatCardProps) {
  return (
    <div className={cn(studioClasses.portalCard, "p-6", className)}>
      <p className={typography.label}>{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      {hint ? <p className={cn("mt-1", typography.caption, trendClass[trend])}>{hint}</p> : null}
    </div>
  );
}
