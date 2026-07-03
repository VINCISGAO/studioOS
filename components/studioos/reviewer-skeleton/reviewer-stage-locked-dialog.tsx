"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { MessageCircle, MousePointer2 } from "lucide-react";
import { Dialog, DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type ReviewerStageLockedDialogKind = "comment" | "tool";

const copy = {
  zh: {
    fallbackTitle: "阶段审批完成过程中",
    fallbackCommentBody: "批注暂不可使用",
    fallbackToolBody: "工具暂不可使用",
    confirm: "知道了"
  },
  en: {
    fallbackTitle: "Stage approval is in progress",
    fallbackCommentBody: "Comments are temporarily unavailable",
    fallbackToolBody: "Tools are temporarily unavailable",
    confirm: "Got it"
  }
};

function splitMessage(message: string | undefined, locale: Locale, kind: ReviewerStageLockedDialogKind) {
  const t = copy[locale];
  if (!message) {
    return {
      title: t.fallbackTitle,
      body: kind === "comment" ? t.fallbackCommentBody : t.fallbackToolBody
    };
  }

  const match = message.match(/^(.+?)[，,]\s*(.+)$/);
  if (!match) {
    return {
      title: t.fallbackTitle,
      body: message
    };
  }

  return {
    title: match[1],
    body: match[2]
  };
}

export function ReviewerStageLockedDialog({
  locale,
  kind,
  message,
  open,
  onOpenChange
}: {
  locale: Locale;
  kind: ReviewerStageLockedDialogKind;
  message?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = copy[locale];
  const content = splitMessage(message, locale, kind);
  const Icon = kind === "comment" ? MessageCircle : MousePointer2;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/45 backdrop-blur-[2px]" />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[min(84vw,340px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl bg-white shadow-2xl",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          )}
        >
          <div className="px-6 pb-4 pt-7 text-center">
            <div className="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-violet-100/80">
              <span className="absolute -left-1 top-3 h-1 w-1 rotate-45 rounded-[2px] bg-violet-300/70" />
              <span className="absolute -right-1 top-5 h-1 w-1 rotate-45 rounded-[2px] bg-violet-300/70" />
              <Icon className="h-6 w-6 text-violet-500" strokeWidth={1.9} />
            </div>
            <DialogPrimitive.Title className="text-lg font-semibold tracking-tight text-zinc-900">
              {content.title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="mt-1.5 text-sm leading-relaxed text-zinc-500">
              {content.body}
            </DialogPrimitive.Description>
          </div>

          <div className="border-t border-dashed border-zinc-200 px-6 pb-6 pt-4">
            <button
              type="button"
              className="h-11 w-full rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 text-sm font-semibold text-white shadow-sm transition hover:from-violet-600 hover:to-indigo-600"
              onClick={() => onOpenChange(false)}
            >
              {t.confirm}
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
