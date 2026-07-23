/** Canvas HUD credits popover — match product mockup 1:1. */
export const CANVAS_CREDITS_POPOVER = {
  width: "w-[320px]",
  shell:
    "rounded-[24px] border-0 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.1)]",
  header: "flex items-start justify-between gap-3",
  headerLead: "flex min-w-0 items-center gap-2.5",
  headerIcon:
    "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#8B5CF6]",
  headerIconGlyph: "h-4 w-4 text-white",
  title: "text-[15px] font-semibold leading-5 text-zinc-900",
  closeButton:
    "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 transition hover:bg-zinc-200 hover:text-zinc-700",
  balanceRow: "mt-5 flex items-center gap-2",
  balanceValue:
    "text-[40px] font-bold leading-none tabular-nums tracking-tight text-zinc-950",
  balanceBadge:
    "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#F3E8FF]",
  balanceBadgeIcon: "h-4 w-4 text-[#8B5CF6]",
  balanceMeta: "mt-2 text-[12px] leading-4 text-zinc-500",
  actions: "mt-5 grid gap-2.5",
  buyButton:
    "inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-[#8B5CF6] text-[13px] font-medium text-white transition hover:bg-[#7C3AED]",
  convertButton:
    "inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-[#8B5CF6] bg-white text-[13px] font-medium text-[#8B5CF6] transition hover:bg-violet-50",
  detailsLink:
    "mt-4 inline-flex w-full items-center justify-center gap-0.5 text-[12px] font-medium text-[#8B5CF6] transition hover:text-[#7C3AED]"
} as const;

export const canvasCreditsPopoverCopy = {
  zh: {
    title: "VINCIS Credits",
    available: "可用 Credits",
    reserved: "冻结",
    buy: "购买 Credits",
    convert: "使用收益兑换",
    details: "查看明细"
  },
  en: {
    title: "VINCIS Credits",
    available: "Available credits",
    reserved: "Reserved",
    buy: "Buy credits",
    convert: "Convert earnings",
    details: "View details"
  }
} as const;
