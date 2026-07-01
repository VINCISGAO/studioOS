"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { markCertificationLevelUpSeenAction } from "@/app/certification-actions";
import { CertificationBenefitCard } from "@/components/studioos/certification/certified-partner-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle
} from "@/components/ui/dialog";
import type { Locale } from "@/lib/i18n";
import { tCertificationExperience } from "@/lib/studioos/certification-experience-copy";
import { cn } from "@/lib/utils";
import { BadgeCheck, Loader2, Sparkles } from "lucide-react";

export function CertificationLevelUpDialog({
  locale,
  open,
  onUnlockStep,
  onDismiss
}: {
  locale: Locale;
  open: boolean;
  onUnlockStep: (step: number) => void;
  onDismiss: () => void;
}) {
  const t = tCertificationExperience(locale);
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function finish(next: "home" | "benefits") {
    if (isPending) {
      return;
    }

    setIsPending(true);
    onDismiss();

    const fd = new FormData();
    fd.set("lang", locale);
    fd.set("next", next);

    try {
      const result = await markCertificationLevelUpSeenAction(fd);
      if (result.ok) {
        router.push(result.href);
        router.refresh();
      }
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => undefined}>
      <DialogContent
        overlayClassName="z-[100]"
        className={cn(
          "z-[100] max-h-[90vh] gap-0 overflow-hidden border-violet-200/80 p-0 sm:max-w-xl",
          "[&>button.absolute]:hidden",
          "shadow-[0_0_0_1px_rgba(139,92,246,0.15),0_24px_80px_rgba(88,28,135,0.25)]"
        )}
      >
        <div className="relative max-h-[90vh] overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.18),_transparent_55%),linear-gradient(180deg,#faf5ff_0%,#ffffff_100%)] px-6 pb-6 pt-8">
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-violet-300/30 blur-3xl" />
          <div className="relative flex flex-col items-center text-center">
            <span className="cert-badge-enter flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-500/30">
              <BadgeCheck className="h-8 w-8" />
            </span>
            <DialogTitle className="mt-5 text-xl font-semibold tracking-tight text-zinc-950 sm:text-2xl">
              {t.modalTitle}
            </DialogTitle>
            <DialogDescription className="mt-2 max-w-md text-sm leading-6 text-zinc-600">
              {t.modalSubtitle}
            </DialogDescription>
          </div>

          <div className="mt-6 grid gap-2.5">
            {t.benefits.map((benefit, index) => (
              <div
                key={benefit.title}
                className="cert-benefit-enter opacity-0"
                style={{ animationDelay: `${220 + index * 90}ms`, animationFillMode: "forwards" }}
                onAnimationStart={() => onUnlockStep(index)}
              >
                <CertificationBenefitCard title={benefit.title} body={benefit.body} />
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              className="h-11 flex-1 rounded-xl bg-violet-600 hover:bg-violet-700"
              disabled={isPending}
              onClick={() => void finish("home")}
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {t.primaryCta}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1 rounded-xl border-violet-200"
              disabled={isPending}
              onClick={() => void finish("benefits")}
            >
              {t.secondaryCta}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
