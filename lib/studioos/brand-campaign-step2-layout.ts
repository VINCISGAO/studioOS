/** Step 2 scheme card layout tokens */
export const STEP2_SCHEME_LAYOUT = {
  /** 方案 A — 左内容区 + 右指标栏（md 起双栏） */
  featuredBodyGrid:
    "grid grid-cols-1 items-start gap-6 md:grid-cols-[minmax(0,1fr)_220px] md:gap-8",
  featuredLeftCol: "flex min-w-0 flex-col gap-5",
  /** 卡片顶部全宽分镜条 */
  featuredMediaRow: "grid w-full grid-cols-3 gap-2 sm:gap-2.5",
  featuredMediaFrame:
    "relative aspect-square w-full overflow-hidden rounded-lg bg-zinc-900 ring-1 ring-inset ring-white/10",
  featuredMetricsCol: "min-w-0 md:border-l md:border-zinc-100 md:pl-6",
  compactBodyGrid: "grid grid-cols-[96px_minmax(0,1fr)] items-start gap-3",
  compactThumb: "relative aspect-square w-[96px] shrink-0 overflow-hidden rounded-lg bg-zinc-900",
  /** 上方预览 + 下方两枚缩略图 */
  schemesStack: "flex flex-col gap-3",
  schemesCompactRow: "grid grid-cols-1 gap-3 md:grid-cols-2"
} as const;
