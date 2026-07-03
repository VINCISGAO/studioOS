import { languageService } from "@/features/i18n/language.service";
import { apiSuccess, handleRouteError } from "@/lib/core/api-route";

export async function GET() {
  try {
    const languages = await languageService.listLanguages();
    return apiSuccess({ languages });
  } catch (error) {
    return handleRouteError(error);
  }
}
