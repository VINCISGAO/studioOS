"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { dismissCertificationWelcomeBannerAction } from "@/app/certification-actions";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { tCertificationExperience } from "@/lib/studioos/certification-experience-copy";
import { cn } from "@/lib/utils";
import { Sparkles, X } from "lucide-react";

export function CertificationWelcomeBanner({ locale }: { locale: Locale }) {
  const t = tCertificationExperience(locale);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function dismiss() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("lang", locale);
      await dismissCertificationWelcomeBannerAction(fd);
      router.refresh();
    });
  }

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-violet-200/80",
        "bg-[linear-gradient(135deg,#faf5ff_0%,#f5f3ff_45%,#ffffff_100%)] px-5 py-4 shadow-sm"
      )}
    >
      <div className="pointer-events-none absolute -right-6 top-0 h-24 w-24 rounded-full bg-violet-300/20 blur-2xl" />
      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-zinc-950">{t.welcomeTitle}</p>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-600">{t.welcomeBody}</p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="shrink-0 self-end rounded-lg text-zinc-500 hover:text-zinc-900 sm:self-start"
          disabled={isPending}
          onClick={dismiss}
        >
          <X className="h-4 w-4" />
          {t.welcomeDismiss}
        </Button>
      </div>
    </section>
  );
}
