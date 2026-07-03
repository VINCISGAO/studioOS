import { languageService } from "@/features/i18n/language.service";
import { apiSuccess, handleRouteError } from "@/lib/core/api-route";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const language = url.searchParams.get("language") ?? url.searchParams.get("lang") ?? "en";
    const namespace = url.searchParams.get("namespace");
    const bundle = await languageService.getTranslationBundle(language, namespace);
    return apiSuccess(bundle);
  } catch (error) {
    return handleRouteError(error);
  }
}
