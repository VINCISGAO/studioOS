import type { Locale } from "@/lib/i18n";
import { studioClasses, typography } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  locale?: Locale;
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
};

export function PageHeader({ eyebrow, title, description, actions, className }: PageHeaderProps) {
  return (
    <header className={cn("mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="space-y-2">
        {eyebrow ? <p className={studioClasses.portalEyebrow}>{eyebrow}</p> : null}
        <h1 className={typography.title}>{title}</h1>
        {description ? <p className={cn(typography.body, "max-w-2xl text-muted-foreground")}>{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}
