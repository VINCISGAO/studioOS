import { appError } from "@/lib/core/errors";

/** Vercel serverless request body limit (Hobby ~4.5MB). */
export const KNOWLEDGE_MUTATION_MAX_BYTES = 4_400_000;

export async function readKnowledgeMutationJson(request: Request): Promise<Record<string, unknown>> {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > KNOWLEDGE_MUTATION_MAX_BYTES) {
    throw appError(
      "PAYLOAD_TOO_LARGE",
      "Article payload too large (>4.4MB). Images are uploaded separately — avoid pasting huge inline content."
    );
  }

  const raw = await request.text();
  if (raw.length > KNOWLEDGE_MUTATION_MAX_BYTES) {
    throw appError(
      "PAYLOAD_TOO_LARGE",
      "Article payload too large (>4.4MB). Images are uploaded separately — avoid pasting huge inline content."
    );
  }

  if (!raw.trim()) {
    throw appError("VALIDATION_ERROR", "Request body is required");
  }

  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw appError("VALIDATION_ERROR", "Invalid JSON body");
  }
}
