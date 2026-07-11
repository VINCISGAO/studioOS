"use client";

import { ArrowRight } from "lucide-react";
import { OpenMarketingLucienButton } from "@/components/marketing/docs/open-marketing-lucien-button";

export function PricingLucienCtaButton({ label }: { label: string }) {
  return (
    <OpenMarketingLucienButton className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-violet-600 px-6 text-sm font-semibold text-white shadow-[0_16px_36px_-18px_rgba(124,58,237,0.75)] transition hover:bg-violet-700">
      {label}
      <ArrowRight className="h-4 w-4" />
    </OpenMarketingLucienButton>
  );
}
