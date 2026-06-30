import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Homepage section wrapper. */
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
    <section id={id} className={cn("flex flex-col justify-center", className)}>
      {children}
    </section>
  );
}
