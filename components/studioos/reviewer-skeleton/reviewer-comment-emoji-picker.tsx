"use client";

import { useEffect, useRef, useState } from "react";
import { Smile } from "lucide-react";
import { cn } from "@/lib/utils";

const REVIEW_EMOJIS = [
  "👍",
  "👎",
  "❤️",
  "😂",
  "😊",
  "😮",
  "😢",
  "🔥",
  "✅",
  "❌",
  "👀",
  "💯",
  "🎬",
  "✨",
  "🙏",
  "👏"
];

export function ReviewerCommentEmojiPicker({
  disabled = false,
  onPick
}: {
  disabled?: boolean;
  onPick: (emoji: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={cn(
          "rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600",
          open && "bg-violet-50 text-violet-600",
          disabled && "cursor-not-allowed opacity-40 hover:bg-transparent hover:text-zinc-400"
        )}
        onClick={() => {
          if (disabled) return;
          setOpen((value) => !value);
        }}
      >
        <Smile className="h-4 w-4" />
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Emoji picker"
          className="absolute bottom-full left-0 z-30 mb-2 w-[220px] rounded-xl border border-zinc-200 bg-white p-2 shadow-lg"
        >
          <div className="grid grid-cols-8 gap-0.5">
            {REVIEW_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-lg transition hover:bg-violet-50"
                onClick={() => {
                  onPick(emoji);
                  setOpen(false);
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function insertTextAtCursor(
  current: string,
  insertion: string,
  selectionStart: number,
  selectionEnd: number
): { next: string; cursor: number } {
  const next = current.slice(0, selectionStart) + insertion + current.slice(selectionEnd);
  const cursor = selectionStart + insertion.length;
  return { next, cursor };
}
