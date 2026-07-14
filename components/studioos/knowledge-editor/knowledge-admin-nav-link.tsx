"use client";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function KnowledgeAdminNavLink({
  href,
  children,
  variant = "outline"
}: {
  href: string;
  children: React.ReactNode;
  variant?: "outline" | "primary";
}) {
  return (
    <Link
      href={href}
      prefetch
      className={cn(
        buttonVariants({ variant: variant === "primary" ? "default" : "outline", size: "default" }),
        "relative z-10 pointer-events-auto"
      )}
    >
      {children}
    </Link>
  );
}
