"use client";

import { cn } from "@/lib/utils";

export function VideoAspectRatioIcon({ ratio }: { ratio: string }) {
  const sizes: Record<string, string> = {
    auto: "h-3.5 w-3.5 rounded border border-dashed border-zinc-400",
    "16:9": "h-2.5 w-[1.65rem] rounded-[2px] border border-zinc-400 bg-zinc-100",
    "4:3": "h-3 w-4 rounded-[2px] border border-zinc-400 bg-zinc-100",
    "1:1": "h-3.5 w-3.5 rounded-[2px] border border-zinc-400 bg-zinc-100",
    "3:4": "h-4 w-3 rounded-[2px] border border-zinc-400 bg-zinc-100",
    "9:16": "h-[1.125rem] w-2.5 rounded-[2px] border border-zinc-400 bg-zinc-100",
    "21:9": "h-2 w-[1.85rem] rounded-[2px] border border-zinc-400 bg-zinc-100"
  };

  return <span className={cn("shrink-0", sizes[ratio] ?? sizes.auto)} />;
}

export function VideoQualityIcon() {
  return (
    <span className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[2px] border border-zinc-400 text-[7px] font-bold leading-none text-zinc-600">
      HD
    </span>
  );
}
