"use client";

import { useFormStatus } from "react-dom";
import { Loader2, Receipt } from "lucide-react";
import { releaseSettlementForLegacyProjectAction } from "@/app/settlement-actions";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";

function ReleaseButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending} className="rounded-lg bg-zinc-900 hover:bg-zinc-800">
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Receipt className="h-4 w-4" />}
      {label}
    </Button>
  );
}

export function ReviewSettlementReleasePanel({
  locale,
  projectId,
  orderId
}: {
  locale: Locale;
  projectId: string;
  orderId: string;
}) {
  return (
    <form action={releaseSettlementForLegacyProjectAction} className="flex items-center gap-2">
      <input type="hidden" name="lang" value={locale} />
      <input type="hidden" name="project_id" value={projectId} />
      <input type="hidden" name="order_id" value={orderId} />
      <ReleaseButton
        label={locale === "zh" ? "释放托管结算" : "Release settlement"}
      />
    </form>
  );
}
