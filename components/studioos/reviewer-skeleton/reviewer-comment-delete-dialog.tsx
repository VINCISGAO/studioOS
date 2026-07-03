"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Trash2 } from "lucide-react";
import { Dialog, DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const copy = {
  zh: {
    title: "确认删除批注",
    body: "删除后无法恢复，确定要删除这条批注吗？",
    cancel: "取消",
    delete: "删除"
  },
  en: {
    title: "Delete comment",
    body: "This cannot be undone. Are you sure you want to delete this comment?",
    cancel: "Cancel",
    delete: "Delete"
  }
};

export function ReviewerCommentDeleteDialog({
  locale,
  open,
  pending = false,
  onOpenChange,
  onConfirm
}: {
  locale: Locale;
  open: boolean;
  pending?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const t = copy[locale];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/40 backdrop-blur-[2px]" />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-white shadow-2xl",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          )}
        >
          <div className="px-8 pb-7 pt-8 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
              <Trash2 className="h-6 w-6 text-red-500" strokeWidth={1.75} />
            </div>
            <DialogPrimitive.Title className="text-xl font-semibold tracking-tight text-zinc-900">
              {t.title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="mt-3 text-sm leading-relaxed text-zinc-500">
              {t.body}
            </DialogPrimitive.Description>
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-zinc-100 px-4 py-4">
            <button
              type="button"
              disabled={pending}
              className="h-11 rounded-xl border border-zinc-200 bg-white text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
              onClick={() => onOpenChange(false)}
            >
              {t.cancel}
            </button>
            <button
              type="button"
              disabled={pending}
              className="h-11 rounded-xl bg-gradient-to-r from-violet-500 to-violet-600 text-sm font-semibold text-white shadow-sm transition hover:from-violet-600 hover:to-violet-700 disabled:opacity-50"
              onClick={onConfirm}
            >
              {t.delete}
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
