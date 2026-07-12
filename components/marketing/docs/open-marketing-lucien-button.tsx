"use client";

import { useMarketingDocsLucien } from "@/components/marketing/docs/marketing-docs-lucien-context";
import { cn } from "@/lib/utils";

type OpenMarketingLucienButtonProps = {
  className?: string;
  children: React.ReactNode;
};

export function OpenMarketingLucienButton({ className, children }: OpenMarketingLucienButtonProps) {
  const { openLucien } = useMarketingDocsLucien();

  return (
    <button type="button" onClick={openLucien} className={cn(className)}>
      {children}
    </button>
  );
}
