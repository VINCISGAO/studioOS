import Link from "next/link";
import { Button } from "@/components/ui/button";
import { studioClasses, typography } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";
import { Inbox } from "lucide-react";

type EmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  icon,
  className
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        studioClasses.portalCard,
        "flex flex-col items-center justify-center px-6 py-16 text-center",
        className
      )}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon ?? <Inbox className="h-5 w-5" />}
      </div>
      <h2 className={typography.subtitle}>{title}</h2>
      {description ? (
        <p className={cn("mt-2 max-w-md", typography.body, "text-muted-foreground")}>{description}</p>
      ) : null}
      {actionLabel && actionHref ? (
        <Button asChild className="mt-6" size="lg">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      ) : null}
      {actionLabel && onAction && !actionHref ? (
        <Button className="mt-6" size="lg" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
