"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const href = brandWizardStep1Href(locale, projectId);

  return (
    <button
      type="button"
      onClick={() => router.push(href)}
      className={cn(buttonVariants({ size }), "cursor-pointer", className)}
    >
      {children ?? label}
    </button>
  );
}
