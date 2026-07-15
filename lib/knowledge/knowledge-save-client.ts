import type { KnowledgeSaveResult } from "@/features/knowledge-center/knowledge-publish.pipeline";

/** Client-safe save payload — never include full body_html in HTTP/Action responses. */
export function toKnowledgeSaveClientPayload(saved: KnowledgeSaveResult) {
  if (!saved.article) return null;
  return {
    article: {
      id: saved.article.id,
      slug: saved.article.slug,
      status: saved.article.status
    },
    pipeline: saved.pipeline
  };
}

export type KnowledgeSaveClientPayload = NonNullable<ReturnType<typeof toKnowledgeSaveClientPayload>>;

export function isStaleServerActionError(error: unknown) {
  return error instanceof Error && /was not found on the server/i.test(error.message);
}
