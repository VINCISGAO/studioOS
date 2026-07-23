/** Video generation studio panel — match product mockup 1:1. */
export const GENERATION_VIDEO_PANEL_WIDTH = 548;

export const VIDEO_PANEL_CONTENT_CLASS = "px-4 pb-3 pt-3";

export const VIDEO_PANEL_HEADER_ROW = "flex items-center justify-between gap-3";

export const VIDEO_PANEL_NOTICE =
  "flex min-w-0 flex-1 items-center gap-1.5 text-[11px] leading-4 text-zinc-400";

export const VIDEO_PANEL_KIND_GRID = "mt-3 grid grid-cols-3 gap-2";

export function videoPanelKindCardClass(active: boolean) {
  return active
    ? "flex w-full flex-col items-center justify-center gap-1 rounded-xl border-[0.5px] border-[#8B5CF6] bg-[#FBFAFF] px-2 py-2.5 text-center transition"
    : "flex w-full flex-col items-center justify-center gap-1 rounded-xl border-[0.5px] border-zinc-200/90 bg-white px-2 py-2.5 text-center transition hover:border-zinc-300";
}

export const VIDEO_PANEL_KIND_ICON = "h-5 w-5 text-[#8B5CF6]";

export const VIDEO_PANEL_KIND_TITLE = "text-[12px] font-medium text-zinc-900";

export const VIDEO_PANEL_KIND_SUBTITLE = "text-[10px] leading-3.5 text-zinc-400";

export const VIDEO_PANEL_PROMPT_BLOCK = "mt-4";

export const VIDEO_PANEL_PROMPT_TITLE = "mb-2 text-[13px] font-semibold text-zinc-900";

export const VIDEO_PANEL_PROMPT_BOX =
  "relative rounded-xl border border-zinc-200 bg-white";

export const VIDEO_PANEL_PROMPT_INPUT =
  "min-h-[96px] w-full resize-none bg-transparent px-3 pb-7 pt-3 text-sm leading-6 text-zinc-900 outline-none placeholder:text-zinc-400";

export const VIDEO_PANEL_PROMPT_COUNTER =
  "pointer-events-none absolute bottom-2 right-3 text-[11px] tabular-nums text-zinc-400";

export const VIDEO_PANEL_PROMPT_FOOTER = "mt-2 flex items-center justify-between gap-3";

export const VIDEO_PANEL_HINT =
  "inline-flex min-w-0 items-center gap-1.5 text-[11px] text-[#8B5CF6]";

export const VIDEO_PANEL_AI_INSPIRATION_BUTTON =
  "inline-flex shrink-0 items-center gap-1 rounded-full border border-[#8B5CF6] bg-white px-3 py-1.5 text-[11px] text-[#8B5CF6] transition hover:bg-[#FBFAFF]";

export const VIDEO_PANEL_FOOTER_CLASS = "border-t border-zinc-100 px-4 py-2.5";

export const VIDEO_PANEL_FOOTER_ROW = "flex items-center gap-2 overflow-x-auto";

export const videoPanelUploadButtonClass =
  "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-[#8B5CF6] bg-white px-3 text-[12px] text-[#8B5CF6] hover:bg-[#FBFAFF]";

export const videoPanelToolbarPillClass =
  "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 text-[11px] text-zinc-700 hover:bg-zinc-50";

export const videoPanelCloseButtonClass =
  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700";

export const videoPanelSubmitButtonClass =
  "inline-flex h-8 shrink-0 items-center gap-1 rounded-full bg-[#EDE9FE] px-3 text-xs font-medium text-[#8B5CF6] hover:bg-[#DDD6FE] disabled:cursor-not-allowed disabled:opacity-40";
