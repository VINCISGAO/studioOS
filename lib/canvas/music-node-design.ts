/** Canvas music node card tokens — wide bar layout (not square). */
export const MUSIC_NODE_CARD = {
  width: 480,
  height: 168,
  minWidth: 440,
  minHeight: 168
} as const;

/** Compact footprint once audio is ready — header + player + actions. */
export const MUSIC_NODE_READY_CARD = {
  width: 480,
  height: 208,
  minWidth: 440,
  minHeight: 208
} as const;

/** Ready-state layout tokens — match product mockup 1:1. */
export const MUSIC_NODE_READY_UI = {
  shellPadding: "p-5",
  body: "flex min-h-0 flex-1 flex-col",
  sectionGap: "mt-3 shrink-0",
  icon: "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#8B5CF6]",
  iconGlyph: "h-[18px] w-[18px] text-white",
  title: "text-[14px] font-semibold leading-5 text-zinc-900",
  badge: "inline-flex items-center gap-1 text-[10px] font-medium text-[#22C55E]",
  badgeDot:
    "inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#22C55E] text-[9px] text-white",
  subtitle: "mt-0.5 text-[11px] leading-4 text-zinc-400",
  playerShell: "rounded-full bg-[#F5F3FF] px-3 py-2.5",
  footer: "mt-auto flex shrink-0 items-center justify-between gap-3 pt-3",
  regenerateButton:
    "nodrag nopan inline-flex h-8 shrink-0 items-center gap-1 rounded-full border border-zinc-200 bg-white px-3 text-[11px] text-zinc-800 hover:border-zinc-300 disabled:opacity-40",
  downloadButton:
    "nodrag nopan inline-flex h-8 shrink-0 items-center gap-1 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA] px-3 text-[11px] font-medium text-white hover:from-[#7C3AED] hover:to-[#8B5CF6] disabled:opacity-40"
} as const;

export const MUSIC_NODE_LOADING_CARD = {
  width: 480,
  height: 196,
  centerOffsetY: -260
} as const;

/** Loading-state layout tokens — wide bar, compact vertical rhythm. */
export const MUSIC_NODE_LOADING_UI = {
  shellPadding: "p-4",
  headerRow: "flex items-start justify-between gap-3",
  headerMain: "flex min-w-0 items-start gap-2.5",
  icon: "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#F3F0FF]",
  iconGlyph: "h-[18px] w-[18px] text-[#8B5CF6]",
  title: "text-[14px] font-semibold leading-5 text-zinc-900",
  subtitle: "mt-0.5 text-[11px] leading-4 text-zinc-400",
  statusWrap: "inline-flex shrink-0 items-center gap-1.5 pt-0.5",
  statusDot: "h-1.5 w-1.5 rounded-full bg-[#22C55E]",
  statusText: "text-[11px] font-medium text-zinc-400",
  panel:
    "mt-2.5 flex flex-col items-center justify-center rounded-xl border-[0.5px] border-zinc-200/90 bg-gradient-to-b from-[#F5F1FF] to-[#FBFAFF] px-4 py-3",
  hint: "mt-2 text-center text-[11px] leading-4 text-zinc-400",
  progressTrack: "mt-3 h-1.5 w-full max-w-[280px] overflow-hidden rounded-full bg-[#EDE9FE]",
  progressFill:
    "h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#6366F1] transition-[width] duration-500",
  progressLabel: "mt-2 text-[11px] tabular-nums text-zinc-400",
  waveformWrap: "relative flex h-10 w-full max-w-[280px] items-end justify-center gap-[4px]",
  waveformBar: "w-[3px] shrink-0 rounded-full bg-gradient-to-t from-[#7C3AED] via-[#8B5CF6] to-[#C4B5FD]"
} as const;

/** Regenerate confirm dialog — match product mockup 1:1. */
export const MUSIC_NODE_REGENERATE_DIALOG = {
  shell:
    "max-w-[420px] gap-0 overflow-hidden rounded-2xl border-0 p-0 shadow-[0_12px_40px_rgba(15,23,42,0.12)] [&>button]:hidden",
  header: "flex items-start justify-between gap-3 px-5 pb-4 pt-5",
  headerMain: "flex min-w-0 items-center gap-3",
  icon: "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F3E8FF]",
  iconGlyph: "h-5 w-5 text-[#8B5CF6]",
  title: "text-[15px] font-semibold leading-5 text-zinc-900",
  closeButton:
    "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 transition hover:bg-zinc-200 hover:text-zinc-700",
  body: "px-5 pb-5 text-[13px] leading-6 text-zinc-600",
  credits: "font-semibold text-[#8B5CF6]",
  footer: "flex items-center justify-end gap-2 border-t border-zinc-100 px-5 py-4",
  cancelButton:
    "inline-flex h-9 min-w-[72px] items-center justify-center rounded-full border border-zinc-200 bg-white px-5 text-[13px] font-medium text-zinc-700 transition hover:bg-zinc-50",
  confirmButton:
    "inline-flex h-9 min-w-[88px] items-center justify-center rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA] px-5 text-[13px] font-medium text-white shadow-sm transition hover:from-[#7C3AED] hover:to-[#8B5CF6]"
} as const;

/** Outer shell — thin border aligned with product mockups. */
export const MUSIC_NODE_SHELL = {
  radius: "rounded-2xl",
  radiusCompact: "rounded-[20px]",
  border: "border-[0.5px] border-zinc-200/90",
  borderSelected: "border-[0.5px] border-violet-300",
  padding: "h-full p-5"
} as const;

/** Symmetric loading waveform — center tallest, edges shortest (px heights). */
export const MUSIC_WAVEFORM_BARS = [10, 16, 22, 18, 28, 32, 28, 18, 22, 16, 10];

export function formatAudioTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export const musicNodeCopy = {
  zh: {
    title: "音乐生成",
    generatingSubtitle: "AI 正在创作中，请稍候...",
    generatingStatus: "生成中",
    generatingProgress: (progress: number) => `生成中... ${progress}%`,
    generatingHint: "正在分析你的需求，生成专属音乐...",
    readyBadge: "生成完成",
    readySubtitle: "你的专属音乐已生成",
    regenerate: "重新生成",
    download: "下载",
    regenerateConfirmTitle: "重新生成音乐？",
    regenerateConfirmLead: "将按首次生成的 Token 费用（",
    regenerateConfirmCredits: (credits: number) => `${credits} 积分`,
    regenerateConfirmTail:
      "）再次扣费，并使用相同设置重新生成。当前这条结果会保留在画布上，不会被覆盖。",
    regenerateConfirm: "确定生成",
    regenerateCancel: "取消",
    waiting: "等待生成音乐…",
    failed: "生成失败"
  },
  en: {
    title: "Music",
    generatingSubtitle: "AI is composing, please wait...",
    generatingStatus: "Generating",
    generatingProgress: (progress: number) => `Generating... ${progress}%`,
    generatingHint: "Analyzing your request and creating your track...",
    readyBadge: "Complete",
    readySubtitle: "Your track is ready",
    regenerate: "Regenerate",
    download: "Download",
    regenerateConfirmTitle: "Regenerate music?",
    regenerateConfirmLead: "You will be charged the same Token cost as the first generation (",
    regenerateConfirmCredits: (credits: number) => `${credits} credits`,
    regenerateConfirmTail:
      ") using the same settings. The current result stays on the canvas and will not be overwritten.",
    regenerateConfirm: "Confirm",
    regenerateCancel: "Cancel",
    waiting: "Waiting to generate music…",
    failed: "Generation failed"
  }
} as const;

export function normalizeMusicNodeProgress(progress: number | undefined) {
  if (typeof progress !== "number" || !Number.isFinite(progress)) return 8;
  return Math.max(0, Math.min(100, Math.round(progress)));
}
