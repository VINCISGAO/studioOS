"use client";

import { useMemo, useState, useTransition } from "react";
import type { CreativeCollaborationActionName } from "@/features/creative-collaboration/creative-collaboration.actions";
import { CreativeIdeaCard } from "@/components/studioos/creative-idea-card";
import { Button } from "@/components/ui/button";
import type { CreativeCollaborationView } from "@/features/creative-collaboration/creative-collaboration.types";
import {
  COLLABORATION_DISCLAIMER,
  COLLABORATION_GENERATING_COPY,
  CREATIVE_DIRECTION_RISK,
  CREATIVE_DIRECTION_WARNING
} from "@/features/creative-collaboration/creative-collaboration.types";
import { postCreativeCollaboration } from "@/lib/api-client/creative-collaboration-client";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ImageIcon, Loader2, Sparkles } from "lucide-react";

const copy = {
  zh: {
    title: "AI 创意协作",
    aiButton: "AI 帮我想想",
    generating: COLLABORATION_GENERATING_COPY.zh,
    disclaimer: COLLABORATION_DISCLAIMER.zh,
    deepen: "继续深挖",
    sendCreator: "发送给 Creator 参考",
    skip: "跳过",
    confirm: "确认方向",
    reject: "要求修改",
    sendFinal: "发送定稿创意方案",
    acknowledge: "接收并确认品牌方向",
    sendBrand: "发送给广告主确认",
    generateImage: "帮我生成图片",
    imageSoon: "图片生成功能即将上线",
    escrowRequired: "完成托管付款后可使用 AI 创意协作",
    brandSent: "品牌已发送参考方向",
    confirmed: "创意方向已确认",
    warning: CREATIVE_DIRECTION_WARNING.zh,
    risk: CREATIVE_DIRECTION_RISK.zh,
    selectOne: "请至少选择一个方向"
  },
  en: {
    title: "AI Creative Collaboration",
    aiButton: "AI 帮我想想",
    generating: COLLABORATION_GENERATING_COPY.en,
    disclaimer: COLLABORATION_DISCLAIMER.en,
    deepen: "Deepen",
    sendCreator: "Send to Creator",
    skip: "Skip",
    confirm: "Confirm direction",
    reject: "Request changes",
    sendFinal: "Send final creative plan",
    acknowledge: "Acknowledge brand direction",
    sendBrand: "Send to Brand for confirmation",
    generateImage: "Generate images",
    imageSoon: "Image generation coming soon",
    escrowRequired: "AI collaboration unlocks after escrow payment",
    brandSent: "Brand sent a reference direction",
    confirmed: "Creative direction confirmed",
    warning: CREATIVE_DIRECTION_WARNING.en,
    risk: CREATIVE_DIRECTION_RISK.en,
    selectOne: "Select at least one direction"
  }
};

export function CreativeCollaborationPanel({
  locale,
  projectId,
  orderId,
  role,
  aiEnabled,
  initialView
}: {
  locale: Locale;
  projectId: string;
  orderId?: string;
  role: "brand" | "creator";
  aiEnabled: boolean;
  initialView: CreativeCollaborationView;
}) {
  const t = copy[locale];
  const [view, setView] = useState(initialView);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeIdeaId, setActiveIdeaId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const roleIdeas = useMemo(
    () => view.ideas.filter((idea) => idea.actor === role && idea.status === "draft"),
    [view.ideas, role]
  );
  const pendingFromOther =
    role === "brand" ? view.pendingCreatorIdeas : view.brandSentIdea ? [view.brandSentIdea] : [];

  function run(action: () => Promise<{ ok: boolean; view?: CreativeCollaborationView; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.ok && result.view) {
        setView(result.view);
        setSelectedIds([]);
      } else if (!result.ok) {
        setError(result.error ?? "Failed");
      }
    });
  }

  function submit(actionName: string, extra?: Record<string, string>) {
    const action = actionName as CreativeCollaborationActionName;
    return postCreativeCollaboration({
      role,
      projectId,
      orderId,
      action,
      locale,
      ideaId: extra?.ideaId,
      ideaIds: extra?.ideaIds?.split(",").map((id) => id.trim()).filter(Boolean)
    });
  }

  function toggleSelect(id: string) {
    setActiveIdeaId(id);
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-zinc-900">
            <Sparkles className="h-5 w-5 text-violet-500" />
            {t.title}
          </h3>
          {!view.hasConfirmedDirection ? (
            <p className="mt-1 text-sm text-amber-700">{t.warning}</p>
          ) : (
            <p className="mt-1 text-sm text-emerald-700">{t.confirmed}</p>
          )}
        </div>
        <Button
          type="button"
          disabled={!aiEnabled || isPending}
          className="rounded-xl bg-violet-600 hover:bg-violet-700"
          onClick={() => run(() => submit(role === "brand" ? "brandGenerate" : "creatorGenerate"))}
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {t.aiButton}
        </Button>
      </div>

      {!aiEnabled ? <p className="mt-3 text-sm text-zinc-500">{t.escrowRequired}</p> : null}
      {isPending ? (
        <p className="mt-3 animate-pulse text-sm font-medium text-violet-700">{t.generating}…</p>
      ) : null}
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      {view.finalCreativeDirection ? (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 text-sm text-emerald-900">
          <p className="font-semibold">{view.finalCreativeDirection.title}</p>
          <p className="mt-1 whitespace-pre-wrap">{view.finalCreativeDirection.summary}</p>
        </div>
      ) : null}

      {pendingFromOther.length ? (
        <div className="mt-5 space-y-3">
          <p className="text-sm font-medium text-zinc-700">
            {role === "creator" ? t.brandSent : locale === "zh" ? "创作者发来的方向" : "Creator proposals"}
          </p>
          {pendingFromOther.map((idea) => (
            <CreativeIdeaCard key={idea.id} locale={locale} idea={idea}>
              <div className="mt-3 flex flex-wrap gap-2">
                {role === "brand" ? (
                  <>
                    <Button
                      size="sm"
                      className="rounded-lg"
                      disabled={isPending}
                      onClick={() => run(() => submit("brandConfirm", { ideaId: idea.id }))}
                    >
                      {t.confirm}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-lg"
                      disabled={!aiEnabled || isPending}
                      onClick={() => run(() => submit("brandDeepenCreator", { ideaId: idea.id }))}
                    >
                      {t.aiButton}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-lg"
                      disabled={isPending}
                      onClick={() => run(() => submit("brandReject", { ideaId: idea.id }))}
                    >
                      {t.reject}
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    className="rounded-lg"
                    disabled={isPending}
                    onClick={() => run(() => submit("creatorAck"))}
                  >
                    {t.acknowledge}
                  </Button>
                )}
              </div>
            </CreativeIdeaCard>
          ))}
        </div>
      ) : null}

      {roleIdeas.length ? (
        <div className="mt-5 space-y-3">
          <p className="text-sm text-zinc-500">{t.disclaimer}</p>
          {roleIdeas.map((idea) => (
            <CreativeIdeaCard
              key={idea.id}
              locale={locale}
              idea={idea}
              selected={selectedIds.includes(idea.id) || activeIdeaId === idea.id}
              onSelect={() => toggleSelect(idea.id)}
            >
              <div className="mt-3 flex flex-wrap gap-2">
                {role === "brand" ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-lg"
                      disabled={!aiEnabled || isPending}
                      onClick={() => run(() => submit("brandDeepen", { ideaId: idea.id }))}
                    >
                      {t.deepen}
                    </Button>
                    <Button
                      size="sm"
                      className="rounded-lg"
                      disabled={isPending}
                      onClick={() => run(() => submit("brandSend", { ideaId: idea.id }))}
                    >
                      {t.sendCreator}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-lg text-zinc-500"
                      disabled={isPending}
                      onClick={() => setError(t.imageSoon)}
                    >
                      <ImageIcon className="mr-1 h-3.5 w-3.5" />
                      {t.generateImage}
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    className="rounded-lg"
                    disabled={isPending || selectedIds.length === 0}
                    onClick={() => {
                      if (!selectedIds.length) {
                        setError(t.selectOne);
                        return;
                      }
                      run(() => submit("creatorSend", { ideaIds: selectedIds.join(",") }));
                    }}
                  >
                    {t.sendBrand}
                  </Button>
                )}
              </div>
            </CreativeIdeaCard>
          ))}
        </div>
      ) : null}

      {role === "brand" && !view.brandSkippedAt && !view.brandSentIdeaId && roleIdeas.length === 0 ? (
        <Button
          type="button"
          variant="ghost"
          className={cn("mt-4 text-zinc-500")}
          disabled={isPending}
          onClick={() => run(() => submit("brandSkip"))}
        >
          {t.skip}
        </Button>
      ) : null}

      {!view.hasConfirmedDirection && roleIdeas.length === 0 && !pendingFromOther.length ? (
        <p className="mt-4 text-xs text-zinc-400">{t.risk}</p>
      ) : null}

      {role === "brand" && activeIdeaId && view.ideas.some((i) => i.parentId === activeIdeaId) ? (
        <div className="mt-4">
          <Button
            size="sm"
            variant="outline"
            className="rounded-lg"
            disabled={isPending}
            onClick={() =>
              activeIdeaId
                ? run(() => submit("brandSendFinal", { ideaId: activeIdeaId }))
                : undefined
            }
          >
            {t.sendFinal}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
