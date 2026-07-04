import { languageService } from "@/features/i18n/language.service";
import {
  requireAdminMutationUser,
  requireAdminSession
} from "@/features/admin/auth/admin-api-guard";
import { apiSuccess, handleRouteError } from "@/lib/core/api-route";
import { appError } from "@/lib/core/errors";

export async function GET(request: Request) {
  try {
    await requireAdminSession(request);
    const url = new URL(request.url);
    const keys = await languageService.listTranslationKeys({
      namespace: url.searchParams.get("namespace"),
      search: url.searchParams.get("search"),
      limit: Number(url.searchParams.get("limit") ?? 100)
    });
    return apiSuccess({ keys });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAdminMutationUser(request);
    const body = (await request.json()) as Record<string, unknown>;
    const namespace = String(body.namespace ?? "").trim();
    const key = String(body.key ?? "").trim();
    const translations =
      typeof body.translations === "object" && body.translations !== null && !Array.isArray(body.translations)
        ? (body.translations as Record<string, string | null | undefined>)
        : null;

    if (!namespace || !key || !translations) {
      throw appError("VALIDATION_ERROR", "namespace, key and translations are required");
    }

    const item = await languageService.upsertTranslation(user, {
      namespace,
      key,
      description: typeof body.description === "string" ? body.description : null,
      translations
    });
    return apiSuccess({ key: item });
  } catch (error) {
    return handleRouteError(error);
  }
}
