import type { ReactNode } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { brandWizardStep1Href } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function BrandStartBriefButton({
  locale,
  label,
  projectId,
  className,
  size = "default",
  children
}: {
  locale: Locale;
  label?: string;
  /** Pre-resolved ephemeral draft — skips DB work on click. */
  projectId?: string;
  className?: string;
  size?: "default" | "sm" | "lg";
  children?: ReactNode;
}) {
  return (
    <Link
      href={brandWizardStep1Href(locale, projectId)}
      prefetch={true}
      className={cn(buttonVariants({ size }), "cursor-pointer", className)}
    >
      {children ?? label}
    </Link>
  );
}
