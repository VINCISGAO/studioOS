"use client";

import { useEffect, useRef } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Dialog, DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const MAX_LENGTH = 200;

const copy = {
  zh: {
    title: "添加文字",
    subtitle: "请输入要添加的文字内容",
    placeholder: "在此输入文字内容…",
    cancel: "取消",
    confirm: "确定"
  },
  en: {
    title: "Add text",
    subtitle: "Enter the text you want to add",
    placeholder: "Enter text here…",
    cancel: "Cancel",
    confirm: "Confirm"
  }
};

export function ReviewerAnnotationTextDialog({
  locale,
  open,
  value,
  onValueChange,
  onOpenChange,
  onConfirm
}: {
  locale: Locale;
  open: boolean;
  value: string;
  onValueChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const t = copy[locale];
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => textareaRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  function handleConfirm() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onConfirm();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/40 backdrop-blur-[2px]" />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[min(92vw,480px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-white shadow-2xl",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          )}
        >
          <div className="flex items-start justify-between gap-4 px-6 pb-2 pt-6">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-100">
                <span className="font-serif text-xl font-semibold leading-none text-violet-600">T</span>
              </div>
              <div className="min-w-0 pt-0.5">
                <DialogPrimitive.Title className="text-lg font-semibold tracking-tight text-zinc-900">
                  {t.title}
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="mt-1 text-sm text-zinc-500">
                  {t.subtitle}
                </DialogPrimitive.Description>
              </div>
            </div>
            <DialogPrimitive.Close
              type="button"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600"
              aria-label={t.cancel}
            >
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>

          <div className="px-6 py-4">
            <div className="relative">
              <textarea
                ref={textareaRef}
                rows={5}
                value={value}
                maxLength={MAX_LENGTH}
                placeholder={t.placeholder}
                className="w-full resize-none rounded-xl border border-violet-200 bg-white px-4 py-3 pb-8 text-sm leading-relaxed text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                onChange={(event) => onValueChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                    event.preventDefault();
                    handleConfirm();
                  }
                }}
              />
              <span className="pointer-events-none absolute bottom-3 right-3 text-xs tabular-nums text-zinc-400">
                {value.length}/{MAX_LENGTH}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-zinc-100 px-6 py-4">
            <button
              type="button"
              className="h-10 min-w-[88px] rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
              onClick={() => onOpenChange(false)}
            >
              {t.cancel}
            </button>
            <button
              type="button"
              disabled={!value.trim()}
              className="h-10 min-w-[88px] rounded-xl bg-gradient-to-r from-violet-500 to-violet-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:from-violet-600 hover:to-violet-700 disabled:opacity-50"
              onClick={handleConfirm}
            >
              {t.confirm}
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
