"use client";

import { cn } from "@/lib/utils";

export function PortalContentColumn({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden", className)}>
      {children}
    </div>
  );
}
