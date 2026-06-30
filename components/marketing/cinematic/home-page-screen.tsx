import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Full-viewport section — multi-page scroll feel without scroll hijacking. */
export function HomePageScreen({
  id,
  children,
  className
}: {
  id?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn("flex min-h-svh flex-col justify-center py-16 sm:py-20", className)}>
      {children}
    </section>
  );
}
