/** Canvas HUD credits popover — compact (75% of original mockup scale). */
export const CANVAS_CREDITS_POPOVER = {
  width: "w-[240px]",
  shell:
    "rounded-[18px] border-0 bg-white p-[18px] shadow-[0_9px_30px_rgba(15,23,42,0.1)]",
  header: "flex items-start justify-between gap-2",
  headerLead: "flex min-w-0 items-center gap-2",
  headerIcon:
    "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#8B5CF6]",
  headerIconGlyph: "h-3 w-3 text-white",
  title: "text-[12px] font-semibold leading-4 text-zinc-900",
  closeButton:
    "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-500 transition hover:bg-zinc-200 hover:text-zinc-700",
  balanceRow: "mt-3.5 flex items-center gap-1.5",
  balanceValue:
    "text-[30px] font-bold leading-none tabular-nums tracking-tight text-zinc-950",
  balanceBadge:
    "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-[8px] bg-[#F3E8FF]",
  balanceBadgeIcon: "h-3 w-3 text-[#8B5CF6]",
  balanceMeta: "mt-1.5 text-[10px] leading-3.5 text-zinc-500",
  actions: "mt-3.5 grid gap-2",
  buyButton:
    "inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-full bg-[#8B5CF6] text-[11px] font-medium text-white transition hover:bg-[#7C3AED]",
  convertButton:
    "inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-full border border-[#8B5CF6] bg-white text-[11px] font-medium text-[#8B5CF6] transition hover:bg-violet-50",
  detailsLink:
    "mt-3 inline-flex w-full items-center justify-center gap-0.5 text-[10px] font-medium text-[#8B5CF6] transition hover:text-[#7C3AED]"
} as const;

export const canvasCreditsPopoverCopy = {
  zh: {
    title: "VINCIS Token",
    available: "可用 Token",
    reserved: "冻结",
    buy: "购买 Token",
    convert: "使用收益兑换",
    details: "查看明细"
  },
  en: {
    title: "VINCIS Token",
    available: "Available Token",
    reserved: "Reserved",
    buy: "Buy Token",
    convert: "Convert earnings",
    details: "View details"
  }
} as const;
