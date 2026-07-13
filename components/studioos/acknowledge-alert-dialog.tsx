"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Info } from "lucide-react";
import { Dialog, DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const copy = {
  zh: {
    confirm: "知道了",
    defaultTitle: "提示"
  },
  en: {
    confirm: "Got it",
    defaultTitle: "Notice"
  }
} as const;

export function AcknowledgeAlertDialog({
  locale,
  open,
  message,
  title,
  onClose
}: {
  locale: Locale;
  open: boolean;
  message: string;
  title?: string;
  onClose: () => void;
}) {
  const t = copy[locale];

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogPortal>
        <DialogOverlay className="bg-black/45 backdrop-blur-[2px]" />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-[120] w-[min(84vw,340px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl bg-white shadow-2xl",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          )}
        >
          <div className="px-6 pb-4 pt-7 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-violet-100/80">
              <Info className="h-6 w-6 text-violet-500" strokeWidth={1.9} />
            </div>
            <DialogPrimitive.Title className="text-lg font-semibold tracking-tight text-zinc-900">
              {title ?? t.defaultTitle}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="mt-2 text-sm leading-relaxed text-zinc-600">
              {message}
            </DialogPrimitive.Description>
          </div>

          <div className="border-t border-dashed border-zinc-200 px-6 pb-6 pt-4">
            <button
              type="button"
              className="h-11 w-full rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 text-sm font-semibold text-white shadow-sm transition hover:from-violet-600 hover:to-indigo-600"
              onClick={onClose}
            >
              {t.confirm}
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
