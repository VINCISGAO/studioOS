"use client";

import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { Bot } from "lucide-react";

export function BriefAiPromoCard({
  locale,
  title,
  body,
  cta
}: {
  locale: Locale;
  title: string;
  body: string;
  cta: string;
}) {
  void locale;
  return (
    <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-4">
      <div className="flex items-center gap-2">
        <Bot className="h-4 w-4 text-violet-600" />
        <p className="text-sm font-semibold text-zinc-900">{title}</p>
        <span className="rounded-full bg-violet-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">Beta</span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-zinc-600">{body}</p>
      <Button type="button" variant="outline" size="sm" className="mt-3 h-8 w-full rounded-lg border-violet-200">
        {cta}
      </Button>
    </div>
  );
}
