import type { ReactNode } from "react";
import { startBrandBriefAction } from "@/app/brand/actions";
import { buttonVariants } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

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
  return (
    <form action={startBrandBriefAction}>
      <input type="hidden" name="lang" value={locale} />
      <button type="submit" className={cn(buttonVariants({ size }), "cursor-pointer", className)}>
        {children ?? label}
      </button>
    </form>
  );
}
