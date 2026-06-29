import type { ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Full document navigation — avoids client-router / server-action redirect issues. */
export function BrandStartBriefButton({
  locale,
  label,
  className,
  size = "default",
  children
}: {
  locale: Locale;
  label?: string;
  className?: string;
  size?: "default" | "sm" | "lg";
  children?: ReactNode;
}) {
  const href = withLocale("/brand/start-brief", locale);

  return (
    <a href={href} className={cn(buttonVariants({ size }), className)}>
      {children ?? label}
    </a>
  );
}
