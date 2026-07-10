"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { markCreatorSelectionCelebrationSeenAction } from "@/app/creator-selection-actions";
import { CertificationBenefitCard } from "@/components/studioos/certification/certified-partner-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle
} from "@/components/ui/dialog";
import type { Locale } from "@/lib/i18n";
import { tCreatorSelectionCelebration } from "@/lib/studioos/creator-selection-celebration-copy";
import { cn } from "@/lib/utils";
import { Loader2, Sparkles } from "lucide-react";

export function CreatorSelectionCelebrationDialog({
  locale,
  open,
  notificationId,
  orderId,
  onDismiss
}: {
  locale: Locale;
  open: boolean;
  notificationId: string;
  orderId: string | null;
  onDismiss: () => void;
}) {
  const t = tCreatorSelectionCelebration(locale);
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function finish(next: "project" | "review") {
    if (isPending) {
      return;
    }

    setIsPending(true);
    onDismiss();

    const fd = new FormData();
    fd.set("lang", locale);
    fd.set("notificationId", notificationId);
    fd.set("next", next);
    if (orderId) {
      fd.set("orderId", orderId);
    }

    try {
      const result = await markCreatorSelectionCelebrationSeenAction(fd);
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
          "z-[100] max-h-[90vh] gap-0 overflow-hidden border-amber-200/80 p-0 sm:max-w-xl",
          "[&>button.absolute]:hidden",
          "shadow-[0_0_0_1px_rgba(245,158,11,0.2),0_24px_80px_rgba(180,83,9,0.22)]"
        )}
      >
        <div className="relative max-h-[90vh] overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.2),_transparent_55%),linear-gradient(180deg,#fffbeb_0%,#ffffff_100%)] px-6 pb-6 pt-8">
          <div className="pointer-events-none absolute -left-6 -top-6 h-28 w-28 rounded-full bg-amber-300/35 blur-3xl" />
          <div className="pointer-events-none absolute -right-8 top-10 h-24 w-24 rounded-full bg-orange-300/25 blur-3xl" />
          <div className="relative flex flex-col items-center text-center">
            <span
              className="cert-badge-enter flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-4xl shadow-lg shadow-amber-500/35"
              role="img"
              aria-label="Celebration"
            >
              🎉
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
              >
                <CertificationBenefitCard title={benefit.title} body={benefit.body} />
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              className="h-11 flex-1 rounded-xl bg-amber-600 hover:bg-amber-700"
              disabled={isPending}
              onClick={() => void finish("project")}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {t.primaryCta}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1 rounded-xl border-amber-200"
              disabled={isPending}
              onClick={() => void finish("review")}
            >
              {t.secondaryCta}
            </Button>
          </div>
          <p className="mt-3 text-center text-[11px] text-zinc-400">
            {locale === "zh" ? "此庆祝动画仅展示一次" : "This celebration is shown once"}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
