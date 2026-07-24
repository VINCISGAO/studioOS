/** Ready video node — Lovart-style preview card. */
export const VIDEO_NODE_READY_LONG_EDGE = 480;

const VIDEO_NODE_ASPECT_UNITS: Record<string, { w: number; h: number }> = {
  auto: { w: 16, h: 9 },
  "16:9": { w: 16, h: 9 },
  "4:3": { w: 4, h: 3 },
  "1:1": { w: 1, h: 1 },
  "3:4": { w: 3, h: 4 },
  "9:16": { w: 9, h: 16 },
  "21:9": { w: 21, h: 9 }
};

export function resolveVideoNodeAspectUnits(input: {
  aspectRatio?: string | null;
  videoWidth?: number;
  videoHeight?: number;
}) {
  if (
    typeof input.videoWidth === "number" &&
    typeof input.videoHeight === "number" &&
    input.videoWidth > 0 &&
    input.videoHeight > 0
  ) {
    return { w: input.videoWidth, h: input.videoHeight };
  }
  const key = (input.aspectRatio ?? "auto").trim().toLowerCase();
  return VIDEO_NODE_ASPECT_UNITS[key] ?? VIDEO_NODE_ASPECT_UNITS["16:9"];
}

/** Fit ready-state node box to video aspect ratio (long edge = 480px). */
export function resolveVideoNodeReadyDimensions(input: {
  aspectRatio?: string | null;
  videoWidth?: number;
  videoHeight?: number;
}) {
  const { w, h } = resolveVideoNodeAspectUnits(input);
  const longEdge = VIDEO_NODE_READY_LONG_EDGE;
  if (w >= h) {
    const width = longEdge;
    return { width, height: Math.max(1, Math.round((width * h) / w)) };
  }
  const height = longEdge;
  return { width: Math.max(1, Math.round((height * w) / h)), height };
}

export const VIDEO_NODE_READY_UI = {
  shell:
    "relative h-full w-full overflow-hidden rounded-2xl border bg-black shadow-sm transition-[border-color,box-shadow]",
  shellDefault: "border-[#93C5FD]",
  shellSelected: "border-blue-500 shadow-[0_0_0_1px_rgba(59,130,246,0.35)]",
  video: "nopan h-full w-full cursor-pointer object-cover",
  overlayButton:
    "nodrag nopan inline-flex items-center justify-center bg-black/50 text-white backdrop-blur-[1px] transition hover:bg-black/60",
  infoButton: "absolute right-2.5 top-2.5 h-7 w-7 rounded-full",
  durationBadge:
    "absolute bottom-2.5 left-2.5 rounded-full px-2 py-1 text-[11px] font-medium tabular-nums",
  expandButton: "absolute bottom-2.5 right-2.5 h-7 w-7 rounded-md"
} as const;

export const VIDEO_NODE_INFO_DIALOG = {
  shell:
    "w-[min(360px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.12)]",
  header: "flex items-start justify-between gap-3 border-b border-zinc-100 px-4 py-3.5",
  headerMain: "flex min-w-0 items-center gap-2.5",
  thumb: "h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-zinc-100 object-cover",
  title: "text-[14px] font-semibold leading-5 text-zinc-900",
  closeButton:
    "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700",
  body: "space-y-4 px-4 py-4",
  fieldLabelRow: "mb-1.5 flex items-center justify-between gap-2",
  fieldLabel: "text-[12px] text-zinc-400",
  copyButton:
    "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700",
  promptText: "max-h-32 overflow-y-auto whitespace-pre-wrap text-[13px] leading-6 text-zinc-900",
  fieldValue: "text-[13px] font-medium text-zinc-900",
  modelRow: "inline-flex items-center gap-1.5"
} as const;

export const videoNodeReadyCopy = {
  zh: {
    generatorTitle: "视频生成器",
    promptLabel: "提示词",
    modelLabel: "基础模型",
    aspectLabel: "尺寸",
    durationLabel: "时长",
    qualityLabel: "分辨率",
    copyPrompt: "复制提示词",
    copied: "已复制",
    close: "关闭",
    expand: "全屏播放",
    info: "视频简介",
    waiting: "等待生成视频…",
    idlePrompt: "等待生成视频…"
  },
  en: {
    generatorTitle: "Video generator",
    promptLabel: "Prompt",
    modelLabel: "Base model",
    aspectLabel: "Aspect ratio",
    durationLabel: "Duration",
    qualityLabel: "Resolution",
    copyPrompt: "Copy prompt",
    copied: "Copied",
    close: "Close",
    expand: "Fullscreen",
    info: "Video details",
    waiting: "Waiting to generate video…",
    idlePrompt: "Waiting to generate video…"
  }
} as const;
