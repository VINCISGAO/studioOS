"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BrandNewCampaignGateDialog } from "@/components/studioos/brand-new-campaign-gate-dialog";
import { buttonVariants } from "@/components/ui/button";
import {
  resolveBrandNewCampaignGate,
  type BrandNewCampaignGate
} from "@/lib/studioos/brand-active-campaign-limit";
import type { Locale } from "@/lib/i18n";
import { brandWizardStep1Href } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function BrandStartBriefButton({
  locale,
  label,
  projectId,
  activeCampaignCount = 0,
  creationGate,
  rateLimitCode = null,
  className,
  size = "default",
  children
}: {
  locale: Locale;
  label?: string;
  /** Pre-resolved ephemeral draft — only for explicit resume links, not new create. */
  projectId?: string;
  /** Active (in-progress) campaigns — drives warn / block gate when creationGate is omitted. */
  activeCampaignCount?: number;
  /** Server-resolved gate including rate limits. */
  creationGate?: BrandNewCampaignGate;
  rateLimitCode?: "rate_limit_10m" | "rate_limit_24h" | null;
  className?: string;
  size?: "default" | "sm" | "lg";
  children?: ReactNode;
}) {
  const router = useRouter();
  const href = brandWizardStep1Href(locale, projectId);
  const gate = creationGate ?? resolveBrandNewCampaignGate(activeCampaignCount);
  const [dialogGate, setDialogGate] = useState<Exclude<BrandNewCampaignGate, "allow"> | null>(null);

  function navigateToWizard() {
    router.push(href, { scroll: false });
  }

  function handleClick() {
    if (gate === "allow") {
      navigateToWizard();
      return;
    }
    setDialogGate(gate);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={cn(buttonVariants({ size }), "cursor-pointer", className)}
      >
        {children ?? label}
      </button>

      {dialogGate ? (
        <BrandNewCampaignGateDialog
          locale={locale}
          gate={dialogGate}
          activeCount={activeCampaignCount}
          rateLimitCode={rateLimitCode}
          open={dialogGate !== null}
          onOpenChange={(open) => {
            if (!open) setDialogGate(null);
          }}
          onContinue={() => {
            setDialogGate(null);
            navigateToWizard();
          }}
        />
      ) : null}
    </>
  );
}
