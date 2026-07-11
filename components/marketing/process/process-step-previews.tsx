import {
  Archive,
  Calculator,
  ClipboardList,
  CloudUpload,
  MessageSquareReply,
  PlayCircle,
  ShieldCheck,
  Users
} from "lucide-react";
import type { ProcessStepId } from "@/lib/marketing/process-copy";
import { cn } from "@/lib/utils";

const STEP_ICONS: Record<ProcessStepId, typeof ClipboardList> = {
  brief: ClipboardList,
  pricing: Calculator,
  matching: Users,
  production: PlayCircle,
  review: MessageSquareReply,
  delivery: CloudUpload,
  escrow: ShieldCheck,
  complete: Archive
};

export function ProcessStepIcon({ id, className }: { id: ProcessStepId; className?: string }) {
  const Icon = STEP_ICONS[id];
  return <Icon className={cn("h-5 w-5", className)} strokeWidth={1.75} />;
}

export function ProcessStepPreview({ id }: { id: ProcessStepId }) {
  switch (id) {
    case "brief":
      return (
        <div className="w-full max-w-[220px] rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
          <p className="text-[10px] font-semibold text-zinc-800">项目需求</p>
          <div className="mt-2 space-y-2">
            <div className="h-7 rounded-lg border border-zinc-200 bg-zinc-50" />
            <div className="h-7 rounded-lg border border-zinc-200 bg-zinc-50" />
            <div className="h-14 rounded-lg border border-zinc-200 bg-zinc-50" />
          </div>
          <div className="mt-3 h-7 rounded-full bg-violet-600/90" />
        </div>
      );
    case "pricing":
      return (
        <div className="w-full max-w-[220px] rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-medium text-zinc-400">AI Estimate</p>
          <p className="mt-1 text-2xl font-bold text-zinc-950">$8,960</p>
          <p className="text-xs text-zinc-500">USD</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {["Medium", "15–30s", "2 weeks"].map((tag) => (
              <span key={tag} className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] text-violet-700">
                {tag}
              </span>
            ))}
          </div>
        </div>
      );
    case "matching":
      return (
        <div className="w-full max-w-[220px] rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
          <div className="flex -space-x-2">
            {[
              { label: "VS", color: "bg-violet-600" },
              { label: "AK", color: "bg-indigo-500" },
              { label: "LM", color: "bg-fuchsia-500" }
            ].map((creator) => (
              <span
                key={creator.label}
                className={cn(
                  "inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-white text-[10px] font-semibold text-white",
                  creator.color
                )}
              >
                {creator.label}
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs font-medium text-zinc-800">Vision Studio</p>
          <p className="text-[10px] text-amber-500">★★★★★ 4.9</p>
          <p className="mt-1 text-[10px] text-zinc-500">+2 matched creators</p>
        </div>
      );
    case "production":
      return (
        <div className="w-full max-w-[220px] rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between gap-1 text-[9px] text-zinc-500">
            {["Accepted", "Paid", "Production", "Delivery"].map((label, index) => (
              <span key={label} className={cn(index === 2 && "font-semibold text-violet-700")}>
                {label}
              </span>
            ))}
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-100">
            <div className="h-full w-[68%] rounded-full bg-violet-600" />
          </div>
          <p className="mt-2 text-[10px] font-medium text-violet-700">In production</p>
        </div>
      );
    case "review":
      return (
        <div className="w-full max-w-[220px] overflow-hidden rounded-xl border border-zinc-200 bg-zinc-900 shadow-sm">
          <div className="relative aspect-video bg-gradient-to-br from-zinc-800 to-zinc-950">
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white">
                <PlayCircle className="h-4 w-4" />
              </span>
            </span>
          </div>
          <div className="border-t border-white/10 p-2">
            <div className="rounded-lg bg-white/10 px-2 py-1 text-[10px] text-white/80">
              00:12 — Revise opening shot
            </div>
          </div>
        </div>
      );
    case "delivery":
      return (
        <div className="w-full max-w-[220px] space-y-2 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
          {["Final_Video.mp4", "Project_Files.zip"].map((file) => (
            <div
              key={file}
              className="flex items-center justify-between rounded-lg bg-zinc-50 px-2 py-1.5 text-[10px] text-zinc-700"
            >
              <span className="truncate">{file}</span>
              <span className="shrink-0 text-violet-600">↓</span>
            </div>
          ))}
        </div>
      );
    case "escrow":
      return (
        <div className="w-full max-w-[220px] rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-2 py-1.5 text-[10px] text-emerald-700">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white">✓</span>
            Paid to platform
          </div>
          <div className="mt-2 flex items-center gap-2 rounded-lg bg-violet-50 px-2 py-1.5 text-[10px] text-violet-700">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 text-white">✓</span>
            Released to creator
          </div>
        </div>
      );
    case "complete":
      return (
        <div className="w-full max-w-[220px] rounded-xl border border-zinc-200 bg-white p-4 text-center shadow-sm">
          <Archive className="mx-auto h-8 w-8 text-violet-600" strokeWidth={1.5} />
          <p className="mt-2 text-xs font-medium text-zinc-800">Project archive</p>
          <p className="mt-1 text-[10px] text-zinc-500">Completed · All versions saved</p>
          <span className="mt-3 inline-flex rounded-full bg-violet-600 px-3 py-1 text-[10px] font-medium text-white">
            View archive →
          </span>
        </div>
      );
    default:
      return null;
  }
}

export const PROCESS_DIAGRAM_ICONS = [
  ClipboardList,
  Calculator,
  Users,
  PlayCircle,
  MessageSquareReply,
  CloudUpload,
  ShieldCheck,
  Archive
] as const;
