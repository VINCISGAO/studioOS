"use client";

import { runKnowledgeAiAssistantAction } from "@/app/knowledge-admin-actions";
import {
  buildKnowledgeArticlePath,
  knowledgePathPrefixForCode
} from "@/features/knowledge-center/knowledge-center.constants";
import type { KnowledgeAiAssistantAction } from "@/features/knowledge-center/knowledge-ai-assistant.types";
import { readAdminCsrfToken } from "@/lib/studioos/admin-csrf-client";
import { useCallback, useState } from "react";

export type KnowledgeEditorAiPatch = {
  seo_title?: string;
  meta_description?: string;
  focus_keywords?: string;
  body_markdown?: string;
  faqs?: Array<{ question: string; answer: string }>;
  message?: string;
};

type AiDraft = Record<string, string | string[]>;

function buildFormData(action: KnowledgeAiAssistantAction, draft: AiDraft) {
  const formData = new FormData();
  const csrf = readAdminCsrfToken();
  if (csrf) formData.set("_adminCsrf", csrf);
  formData.set("action", action);
  for (const [key, value] of Object.entries(draft)) {
    formData.set(key, Array.isArray(value) ? value.join(",") : value);
  }
  return formData;
}

function buildAiPatch(
  draft: AiDraft,
  result: Awaited<ReturnType<typeof runKnowledgeAiAssistantAction>>,
  zh: boolean
): KnowledgeEditorAiPatch {
  const patch: KnowledgeEditorAiPatch = {};

  if (result.seo_title) patch.seo_title = result.seo_title;
  if (result.meta_description) patch.meta_description = result.meta_description;
  if (result.summary) patch.meta_description = result.summary;
  if (result.keywords?.length) patch.focus_keywords = result.keywords.join(", ");
  if (result.body_markdown) patch.body_markdown = result.body_markdown;
  if (result.lucien_summary) patch.meta_description = result.lucien_summary;
  if (result.lucien_keywords?.length) patch.focus_keywords = result.lucien_keywords.join(", ");
  if (result.faqs?.length) patch.faqs = result.faqs;

  if (result.internal_links?.length) {
    const prefix = knowledgePathPrefixForCode(String(draft.language_code ?? "en"));
    const links = result.internal_links
      .map((item) => `<li><a href="${buildKnowledgeArticlePath(prefix, item.slug)}">${item.suggested_anchor}</a></li>`)
      .join("");
    patch.body_markdown = `${String(draft.body_markdown ?? "")}<h2>Related reading</h2><ul>${links}</ul>`;
  }

  if (result.faqs?.length) {
    patch.message = zh
      ? `已生成 ${result.faqs.length} 条 FAQ，保存后写入数据库。`
      : `Generated ${result.faqs.length} FAQs — save to persist.`;
  } else if (result.error) {
    patch.message = zh ? `AI 已使用模板回退：${result.error}` : `AI fell back to template: ${result.error}`;
  } else {
    patch.message = zh ? "AI 操作完成。" : "AI action completed.";
  }

  return patch;
}

export function useKnowledgeEditorAiActions(input: {
  draft: AiDraft;
  zh: boolean;
  onPatch: (patch: KnowledgeEditorAiPatch) => void;
}) {
  const [runningAction, setRunningAction] = useState<KnowledgeAiAssistantAction | null>(null);

  const runAction = useCallback(
    async (action: KnowledgeAiAssistantAction) => {
      setRunningAction(action);
      try {
        const result = await runKnowledgeAiAssistantAction(buildFormData(action, input.draft));
        input.onPatch(buildAiPatch(input.draft, result, input.zh));
      } catch (error) {
        input.onPatch({
          message: error instanceof Error ? error.message : input.zh ? "AI 操作失败" : "AI action failed"
        });
      } finally {
        setRunningAction(null);
      }
    },
    [input.draft, input.onPatch, input.zh]
  );

  return { runningAction, runAction };
}
