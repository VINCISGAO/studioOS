import { cn } from "@/lib/utils";

/** Shared Canvas music panel tokens — keep in sync with product mockups. */
export const MUSIC_PANEL_WIDTH = 520;

export const MUSIC_PANEL_SHELL_CLASS =
  "overflow-visible rounded-[24px] border-[0.5px] border-zinc-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)]";

export const MUSIC_PANEL_PURPLE = "#8B5CF6";

export const musicPanelSectionLabelClass = "text-[12px] font-medium text-zinc-800";

export const musicPanelFieldShellClass =
  "relative overflow-hidden rounded-xl border border-zinc-200/90 bg-white";

export const musicPanelInputShellClass = musicPanelFieldShellClass;

export const musicPanelTextareaClass =
  "min-h-[108px] w-full resize-none border-0 bg-transparent px-3.5 pb-7 pt-3 text-sm leading-6 text-zinc-900 outline-none placeholder:text-zinc-400 focus:ring-0";

export const musicPanelStyleTextareaClass =
  "min-h-[92px] w-full resize-none border-0 bg-transparent px-3.5 pb-7 pt-3 text-sm leading-6 text-zinc-900 outline-none placeholder:text-zinc-400 focus:ring-0";

export const musicPanelCharCountClass =
  "pointer-events-none absolute bottom-2.5 right-3 text-[11px] tabular-nums text-zinc-400";

export function musicPanelTabClass(active: boolean) {
  return cn(
    "border-b-2 pb-2.5 text-[13px] transition",
    active
      ? "border-[#8B5CF6] font-semibold text-zinc-900"
      : "border-transparent font-medium text-zinc-400 hover:text-zinc-600"
  );
}

export function musicPanelActionChipClass(active: boolean) {
  return cn(
    "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[12px] transition",
    active
      ? "border-[#8B5CF6] bg-white text-[#8B5CF6]"
      : "border-zinc-200/90 bg-white text-zinc-500 hover:border-zinc-300"
  );
}

export const musicPanelCloseButtonClass =
  "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-zinc-200/90 bg-white text-zinc-400 transition hover:bg-zinc-50 hover:text-zinc-700";

export function musicPanelToggleTrackClass(checked: boolean) {
  return cn(
    "relative inline-flex h-5 w-9 shrink-0 rounded-full transition",
    checked ? "bg-[#8B5CF6]" : "bg-zinc-200"
  );
}

export const musicPanelToggleThumbClass =
  "pointer-events-none absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform data-[checked=true]:translate-x-4";

export const musicPanelEnhanceButtonClass =
  "inline-flex items-center gap-1 rounded-full bg-[#F3E8FF] px-2.5 py-1 text-[11px] font-medium text-[#8B5CF6] transition hover:bg-[#EDE9FE] disabled:cursor-not-allowed disabled:opacity-50";

export const musicPanelTagClass =
  "rounded-full border border-zinc-200/90 bg-white px-2.5 py-1 text-[11px] text-zinc-700 transition hover:border-zinc-300";

export const musicPanelRefreshButtonClass =
  "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-zinc-200/90 bg-white text-zinc-500 transition hover:border-zinc-300";

export const musicPanelFooterHintClass =
  "inline-flex min-w-0 flex-1 items-center gap-1 truncate text-[11px] text-zinc-500";

export const musicPanelGenerateButtonClass =
  "inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA] px-5 py-2.5 text-[13px] font-medium text-white shadow-sm transition hover:from-[#7C3AED] hover:to-[#8B5CF6] disabled:cursor-not-allowed disabled:opacity-40";

export const musicPanelStyleToolbarClass =
  "flex flex-wrap items-center gap-2 border-t border-zinc-100 px-3 py-2.5";
