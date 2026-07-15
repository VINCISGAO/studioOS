"use client";

import { KnowledgeEditorArticleFields } from "@/components/studioos/knowledge-editor/knowledge-editor-article-fields";
import { KnowledgeEditorCategoryTagsPanel } from "@/components/studioos/knowledge-editor/knowledge-editor-category-tags-panel";
import { KnowledgeEditorCoverBlock } from "@/components/studioos/knowledge-editor/knowledge-editor-cover-block";
import { KnowledgeEditorHeroSection } from "@/components/studioos/knowledge-editor/knowledge-editor-hero-section";
import { KnowledgeEditorLucienPanel } from "@/components/studioos/knowledge-editor/knowledge-editor-lucien-panel";
import { KnowledgeEditorPublishDialog } from "@/components/studioos/knowledge-editor/knowledge-editor-publish-dialog";
import { KnowledgeEditorPublishPanel } from "@/components/studioos/knowledge-editor/knowledge-editor-publish-panel";
import { KnowledgeEditorTopBar } from "@/components/studioos/knowledge-editor/knowledge-editor-top-bar";
import { KnowledgeTiptapEditor } from "@/components/studioos/knowledge-editor/tiptap/knowledge-tiptap-editor-host";
import { useKnowledgeEditorController } from "@/hooks/use-knowledge-editor-controller";
import type { KnowledgeArticleDetailDto } from "@/features/knowledge-center/knowledge-center.types";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type EditorProps = {
  locale: Locale;
  articleId?: string;
  initial?: KnowledgeArticleDetailDto | null;
};

export function AdminKnowledgeEditorPanel({ locale, articleId, initial }: EditorProps) {
  const editor = useKnowledgeEditorController({ locale, articleId, initial });
  const {
    zh,
    currentId,
    form,
    patchForm,
    displayStatus,
    saveState,
    message,
    notify,
    saveDraft,
    openPublish,
    confirmPublish,
    publishDialog
  } = editor;

  return (
    <div className="pb-10">
      <KnowledgeEditorTopBar
        locale={locale}
        isNew={!currentId}
        displayStatus={displayStatus}
        saveState={saveState}
        saving={saveState === "saving"}
        onSaveDraft={saveDraft}
        onPublish={openPublish}
      />

      {message ? (
        <div
          className={cn(
            "mb-4 rounded-xl border px-4 py-3 text-sm",
            message.tone === "error" && "border-rose-200 bg-rose-50 text-rose-900",
            message.tone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-900",
            message.tone === "info" && "border-zinc-200 bg-zinc-50 text-zinc-700"
          )}
        >
          {message.text}
        </div>
      ) : null}

      <KnowledgeEditorHeroSection locale={locale} isNew={!currentId} />

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:items-stretch">
        <div className="flex min-w-0 flex-col gap-5">
          <KnowledgeEditorArticleFields
            locale={locale}
            form={form}
            onChange={patchForm}
            onTitleChange={(title) => patchForm({ title })}
          />

          <KnowledgeEditorCoverBlock
            locale={locale}
            value={form.cover_image_url}
            onNotify={(text, variant) => notify(text, variant)}
            onChange={(value) =>
              patchForm({
                cover_image_url: value.url,
                cover_fallback_url: value.fallback_url ?? ""
              })
            }
          />

          <KnowledgeTiptapEditor
            locale={zh ? "zh" : "en"}
            value={form.body_html}
            onChange={(body_html) => patchForm({ body_html })}
            onNotify={(text, variant) => notify(text, variant)}
          />
        </div>

        <aside className="flex min-w-0 flex-col gap-5">
          <KnowledgeEditorCategoryTagsPanel locale={locale} form={form} onChange={patchForm} />
          <KnowledgeEditorPublishPanel locale={locale} form={form} onChange={patchForm} />
          <KnowledgeEditorLucienPanel
            locale={locale}
            articleId={currentId}
            value={form.lucien_learning}
            onChange={(lucien_learning) => patchForm({ lucien_learning })}
            onNotify={(text, variant) => notify(text, variant)}
          />
        </aside>
      </div>

      <KnowledgeEditorPublishDialog
        locale={locale}
        open={publishDialog.open}
        form={publishDialog.form}
        blockers={publishDialog.blockers}
        warnings={publishDialog.warnings}
        saving={publishDialog.saving}
        onClose={publishDialog.close}
        onConfirm={() => void confirmPublish()}
      />
    </div>
  );
}
