"use server";

import { revalidatePath } from "next/cache";
import { languageService } from "@/features/i18n/language.service";
import { getSessionUser } from "@/features/auth/session.service";

async function requireAdminUser() {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Not authenticated");
  }
  return user;
}

export async function toggleLanguageAction(formData: FormData) {
  const user = await requireAdminUser();
  const code = String(formData.get("code") ?? "");
  const enabled = formData.get("enabled") === "1";
  await languageService.setLanguageEnabled(user, code, enabled);
  revalidatePath("/admin/languages");
}

export async function setDefaultLanguageAction(formData: FormData) {
  const user = await requireAdminUser();
  const code = String(formData.get("code") ?? "");
  await languageService.setDefaultLanguage(user, code);
  revalidatePath("/admin/languages");
}

export async function upsertTranslationAction(formData: FormData) {
  const user = await requireAdminUser();
  const translations: Record<string, string> = {};
  for (const [name, value] of formData.entries()) {
    if (name.startsWith("translation:")) {
      translations[name.slice("translation:".length)] = String(value);
    }
  }

  await languageService.upsertTranslation(user, {
    namespace: String(formData.get("namespace") ?? ""),
    key: String(formData.get("key") ?? ""),
    description: String(formData.get("description") ?? ""),
    translations
  });
  revalidatePath("/admin/languages");
}
