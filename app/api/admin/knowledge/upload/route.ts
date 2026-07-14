import { requireAdminMutationUser } from "@/features/admin/auth/admin-api-guard";
import { KNOWLEDGE_COVER_MAX_BYTES, KNOWLEDGE_INLINE_IMAGE_MAX_BYTES } from "@/lib/knowledge/knowledge-editor.constants";
import { processKnowledgeCoverUpload, processKnowledgeInlineUpload } from "@/lib/knowledge/knowledge-cover-process";
import { resolveTrustedImageMime } from "@/lib/studioos/upload-magic-bytes";
import { apiSuccess, handleRouteError } from "@/lib/core/api-route";
import { appError } from "@/lib/core/errors";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await requireAdminMutationUser(request);

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      throw appError("VALIDATION_ERROR", "Upload payload is too large");
    }

    const file = formData.get("file");
    if (!(file instanceof File)) {
      throw appError("VALIDATION_ERROR", "file is required");
    }
    if (!file.size) {
      throw appError("VALIDATION_ERROR", "Empty file");
    }
    const kind = String(formData.get("kind") ?? "cover");
    const maxBytes = kind === "inline" ? KNOWLEDGE_INLINE_IMAGE_MAX_BYTES : KNOWLEDGE_COVER_MAX_BYTES;
    if (file.size > maxBytes) {
      throw appError(
        "VALIDATION_ERROR",
        kind === "inline" ? "Inline image must be under 5MB" : "Cover image must be under 4MB"
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mime = resolveTrustedImageMime(file, buffer);
    if (!mime) {
      const name = file.name.toLowerCase();
      if (name.endsWith(".heic") || name.endsWith(".heif")) {
        throw appError("VALIDATION_ERROR", "HEIC/HEIF is not supported — export as JPG or PNG first");
      }
      throw appError("VALIDATION_ERROR", "Only JPEG, PNG, WebP, and GIF images are supported");
    }

    const processed =
      kind === "inline"
        ? await processKnowledgeInlineUpload({ buffer, mime })
        : await processKnowledgeCoverUpload({ buffer, mime });
    return apiSuccess(processed);
  } catch (error) {
    return handleRouteError(error);
  }
}
