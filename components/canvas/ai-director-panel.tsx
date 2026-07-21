"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Film,
  ImageIcon,
  LoaderCircle,
  MessageSquareText,
  Music2,
  Play,
  Send,
  Sparkles,
  Video,
  WandSparkles,
  X
} from "lucide-react";
import type {
  CanvasDirectorPlan,
  CanvasSnapshot,
  DirectorSkill
} from "@/lib/canvas/types";
import { cn } from "@/lib/utils";

type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: { message?: string };
};

const skills: { id: DirectorSkill; label: string; icon: typeof Video }[] = [
  { id: "AD_VIDEO", label: "广告视频", icon: Clapperboard },
  { id: "PRODUCT_FILM", label: "产品宣传片", icon: Film },
  { id: "SEEDANCE_VIDEO", label: "Seedance 视频", icon: Video },
  { id: "IMAGE_TO_VIDEO", label: "图生视频", icon: Play },
  { id: "BRAND_KEY_VISUAL", label: "品牌主视觉", icon: ImageIcon },
  { id: "SOCIAL_AD", label: "社交媒体广告", icon: MessageSquareText },
  { id: "MUSIC_SCORE", label: "音乐配乐", icon: Music2 },
  { id: "LOGO_MOTION", label: "Logo 动效", icon: WandSparkles }
];

export function AiDirectorPanel({
  projectId,
  collapsed,
  onToggle,
  onApplied
}: {
  projectId: string;
  collapsed: boolean;
  onToggle: () => void;
  onApplied: (snapshot: CanvasSnapshot) => void;
}) {
  const [skill, setSkill] = useState<DirectorSkill>("AD_VIDEO");
  const [message, setMessage] = useState("");
  const [plan, setPlan] = useState<CanvasDirectorPlan | null>(null);

  const planMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/canvas/director/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, message, skill })
      });
      const payload = (await response.json()) as ApiEnvelope<CanvasDirectorPlan>;
      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error?.message ?? "AI Director planning failed");
      }
      return payload.data;
    },
    onSuccess: (nextPlan) => {
      setPlan(nextPlan);
      setMessage("");
    }
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      if (!plan) throw new Error("No plan to apply");
      const response = await fetch("/api/canvas/director/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, plan })
      });
      const payload = (await response.json()) as ApiEnvelope<CanvasSnapshot>;
      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error?.message ?? "AI Director apply failed");
      }
      return payload.data;
    },
    onSuccess: (snapshot) => {
      onApplied(snapshot);
      setPlan(null);
    }
  });

  if (collapsed) {
    return (
      <div className="absolute right-3 top-3 z-40">
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 shadow-lg"
        >
          <Sparkles className="h-4 w-4" />
          AI Director
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <aside className="relative z-40 flex h-full w-[390px] max-w-[42vw] shrink-0 flex-col border-l border-zinc-200 bg-white max-md:absolute max-md:inset-y-0 max-md:right-0 max-md:max-w-[88vw]">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-100 px-4">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-950 text-white">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <div className="text-sm font-semibold text-zinc-950">VINCIS AI Director</div>
            <div className="text-[10px] text-zinc-400">Structured canvas agent</div>
          </div>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-800"
          aria-label="折叠 AI Director"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <div className="rounded-2xl bg-zinc-50 p-4 ring-1 ring-zinc-100">
          <div className="text-xs font-medium text-zinc-800">让 Director 操作画布</div>
          <p className="mt-1 text-[11px] leading-5 text-zinc-500">
            它会先创建 Brief、镜头和生成计划。确认 Credits 后才执行。
          </p>
        </div>

        <div className="mt-5">
          <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-400">
            Skills
          </div>
          <div className="grid grid-cols-2 gap-2">
            {skills.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setSkill(id)}
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs transition",
                  skill === id
                    ? "border-zinc-900 bg-zinc-950 text-white"
                    : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {plan ? (
          <div className="mt-5 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-zinc-900">待确认执行计划</div>
                <p className="mt-2 text-xs leading-5 text-zinc-600">{plan.message}</p>
              </div>
              <button
                type="button"
                onClick={() => setPlan(null)}
                className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-zinc-50 p-3">
                <div className="text-[10px] text-zinc-400">预计消耗</div>
                <div className="mt-1 text-sm font-semibold text-zinc-900">
                  {plan.estimatedCredits} Credits
                </div>
              </div>
              <div className="rounded-xl bg-zinc-50 p-3">
                <div className="text-[10px] text-zinc-400">预计时间</div>
                <div className="mt-1 text-sm font-semibold text-zinc-900">
                  {plan.estimatedTime.minMinutes}–{plan.estimatedTime.maxMinutes} 分钟
                </div>
              </div>
            </div>
            <div className="mt-3 text-[11px] text-zinc-400">
              {plan.actions.length} 个结构化画布动作 · 失败任务不计费
            </div>
            <button
              type="button"
              disabled={applyMutation.isPending}
              onClick={() => applyMutation.mutate()}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 py-3 text-xs font-medium text-white disabled:opacity-50"
            >
              {applyMutation.isPending ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              确认并创建到画布
            </button>
          </div>
        ) : null}

        {planMutation.error || applyMutation.error ? (
          <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-600">
            {(planMutation.error ?? applyMutation.error)?.message}
          </p>
        ) : null}
      </div>

      <form
        className="shrink-0 border-t border-zinc-100 p-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (message.trim().length >= 3 && !planMutation.isPending) planMutation.mutate();
        }}
      >
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-2 focus-within:border-zinc-400 focus-within:bg-white">
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={3}
            maxLength={4000}
            placeholder="描述你想制作的广告…"
            className="w-full resize-none bg-transparent px-2 py-1 text-sm leading-5 text-zinc-800 outline-none"
          />
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] text-zinc-400">先规划，确认后执行</span>
            <button
              type="submit"
              disabled={message.trim().length < 3 || planMutation.isPending}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-950 text-white disabled:opacity-35"
              aria-label="发送给 AI Director"
            >
              {planMutation.isPending ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </form>
    </aside>
  );
}
