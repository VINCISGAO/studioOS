import { languageService } from "@/features/i18n/language.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";
import { appError } from "@/lib/core/errors";

export async function GET(request: Request) {
  try {
    await requireApiUser(request);
    const languages = await languageService.listLanguages({ includeDisabled: true });
    return apiSuccess({ languages });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireApiUser(request);
    const body = (await request.json()) as Record<string, unknown>;
    const code = String(body.code ?? "").trim();
    if (!code) throw appError("VALIDATION_ERROR", "code is required");

    if (body.is_default === true) {
      const language = await languageService.setDefaultLanguage(user, code);
      return apiSuccess({ language });
    }

    if (typeof body.is_enabled === "boolean") {
      const language = await languageService.setLanguageEnabled(user, code, body.is_enabled);
      return apiSuccess({ language });
    }

    throw appError("VALIDATION_ERROR", "is_default or is_enabled is required");
  } catch (error) {
    return handleRouteError(error);
  }
}
