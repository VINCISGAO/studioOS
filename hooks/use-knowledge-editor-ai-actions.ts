"use client";

import { runKnowledgeAiAssistantAction } from "@/app/knowledge-admin-actions";
import type { KnowledgeAiAssistantAction } from "@/features/knowledge-center/knowledge-ai-assistant.types";
import { readAdminCsrfToken } from "@/lib/studioos/admin-csrf-client";
import { useCallback, useState } from "react";

export type KnowledgeEditorAiPatch = {
  seo_title?: string;
  meta_description?: string;
  focus_keywords?: string;
  body_markdown?: string;
  message?: string;
};

function buildFormData(action: KnowledgeAiAssistantAction, draft: Record<string, string | string[]>) {
  const formData = new FormData();
  const csrf = readAdminCsrfToken();
  if (csrf) formData.set("_adminCsrf", csrf);
  formData.set("action", action);
  for (const [key, value] of Object.entries(draft)) {
    if (Array.isArray(value)) {
      formData.set(key, value.join(","));
    } else {
      formData.set(key, value);
    }
  }
  return formData;
}

export function useKnowledgeEditorAiActions(input: {
  draft: Record<string, string | string[]>;
  zh: boolean;
  onPatch: (patch: KnowledgeEditorAiPatch) => void;
}) {
  const [runningAction, setRunningAction] = useState<KnowledgeAiAssistantAction | null>(null);

  const runAction = useCallback(
    async (action: KnowledgeAiAssistantAction) => {
      setRunningAction(action);
      try {
        const result = await runKnowledgeAiAssistantAction(buildFormData(action, input.draft));
        const patch: KnowledgeEditorAiPatch = {};

        if (result.seo_title) patch.seo_title = result.seo_title;
        if (result.meta_description) patch.meta_description = result.meta_description;
        if (result.summary) patch.meta_description = result.summary;
        if (result.keywords?.length) patch.focus_keywords = result.keywords.join(", ");
        if (result.body_markdown) patch.body_markdown = result.body_markdown;
        if (result.lucien_summary) patch.meta_description = result.lucien_summary;
        if (result.lucien_keywords?.length) patch.focus_keywords = result.lucien_keywords.join(", ");

        if (result.internal_links?.length) {
          const links = result.internal_links
            .map((item) => `[${item.suggested_anchor}](/en/resources/${item.slug})`)
            .join("\n");
          patch.body_markdown = `${String(input.draft.body_markdown ?? "")}\n\n## Related reading\n\n${links}`;
        }

        if (result.faqs?.length) {
          patch.message = input.zh
            ? `已生成 ${result.faqs.length} 条 FAQ，发布时将写入 JSON-LD。`
            : `Generated ${result.faqs.length} FAQs. They attach on publish for JSON-LD.`;
        } else if (result.error) {
          patch.message = input.zh ? `AI 已使用模板回退：${result.error}` : `AI fell back to template: ${result.error}`;
        } else {
          patch.message = input.zh ? "AI 操作完成。" : "AI action completed.";
        }

        input.onPatch(patch);
      } catch (error) {
        input.onPatch({
          message: error instanceof Error ? error.message : input.zh ? "AI 操作失败" : "AI action failed"
        });
      } finally {
        setRunningAction(null);
      }
    },
    [input]
  );

  return { runningAction, runAction };
}
