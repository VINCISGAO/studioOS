/** Canvas video node loading card — match product mockup 1:1. */
export const VIDEO_NODE_LOADING_CARD = {
  width: 400,
  height: 420
} as const;

export const VIDEO_NODE_LOADING_UI = {
  shell:
    "relative h-full w-full overflow-hidden rounded-[24px] border-[0.5px] border-[#DDD6FE] bg-white shadow-sm",
  shellSelected: "border-[0.5px] border-[#C4B5FD]",
  padding: "flex h-full flex-col p-5",
  header: "flex items-center justify-between gap-3 border-b border-zinc-100 pb-4",
  headerMain: "flex min-w-0 items-center gap-2",
  headerIcon: "h-4 w-4 text-[#8B5CF6]",
  headerTitle: "text-[14px] font-semibold text-zinc-900",
  stopButton:
    "nodrag nopan inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#C4B5FD] bg-white px-3 py-1 text-[12px] font-medium text-[#8B5CF6] hover:bg-violet-50",
  stopIconWrap:
    "inline-flex h-4 w-4 items-center justify-center rounded-full border border-[#C4B5FD]",
  body: "flex min-h-0 flex-1 flex-col items-center justify-center px-1 pt-5 text-center",
  ringWrap: "relative flex h-[88px] w-[88px] items-center justify-center",
  ringCenter: "absolute inset-0 flex items-center justify-center",
  contentTitle: "mt-5 text-[16px] font-semibold text-zinc-900",
  contentPrompt: "mt-1.5 line-clamp-2 max-w-[320px] text-[13px] leading-5 text-zinc-500",
  progressTrack: "mt-5 h-1.5 w-full max-w-[280px] overflow-hidden rounded-full bg-[#EDE9FE]",
  progressFill: "h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#6366F1] transition-[width] duration-500",
  progressLabel: "mt-2 text-[12px] text-zinc-400",
  hintShell:
    "mt-auto flex w-full items-center justify-center gap-1.5 rounded-full bg-[#F5F1FF] px-3 py-2.5 text-center",
  hintIcon: "h-3.5 w-3.5 shrink-0 text-[#8B5CF6]",
  hintText: "text-[11px] leading-4 text-[#8B5CF6]"
} as const;

export const videoNodeCopy = {
  zh: {
    title: "视频生成",
    generatingStatus: (progress: number) => `生成中... ${progress}%`,
    hint: "视频生成可能需要 1-3 分钟，请耐心等待，不要关闭页面哦",
    stop: "停止"
  },
  en: {
    title: "Video generation",
    generatingStatus: (progress: number) => `Generating... ${progress}%`,
    hint: "Video generation may take 1–3 minutes. Please wait and keep this page open.",
    stop: "Stop"
  }
} as const;

export function normalizeVideoNodeProgress(progress: number | undefined) {
  if (typeof progress !== "number" || !Number.isFinite(progress)) return 8;
  return Math.max(0, Math.min(100, Math.round(progress)));
}
