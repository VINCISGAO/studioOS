"use server";

import { redirect } from "next/navigation";
import { guardAdminServerActionUser } from "@/features/admin/auth/admin-mutation-guard";
import { withLocale, type Locale } from "@/lib/i18n";
import { approveApplication, createApplication, rejectApplication } from "@/lib/onboarding-service";

function normalizeLang(raw: FormDataEntryValue | null): Locale {
  return String(raw ?? "en") === "zh" ? "zh" : "en";
}

export async function submitOnboardingAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const studio_name = String(formData.get("studio_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim();
  const portfolio_url = String(formData.get("portfolio_url") ?? "").trim();
  const specialties = String(formData.get("specialties") ?? "").trim();
  const tools = String(formData.get("tools") ?? "").trim();
  const base_price = String(formData.get("base_price") ?? "").trim();
  const delivery_speed = String(formData.get("delivery_speed") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!studio_name || !email || !country || !portfolio_url || !specialties || !tools || !base_price || !delivery_speed) {
    redirect(withLocale("/studio/onboarding?error=missing", lang));
  }

  const application = await createApplication({
    studio_name,
    email,
    country,
    portfolio_url,
    specialties,
    tools,
    base_price,
    delivery_speed,
    notes
  });

  redirect(withLocale(`/studio/onboarding?submitted=${application.id}`, lang));
}

export async function approveOnboardingAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const applicationId = String(formData.get("application_id") ?? "");
  await guardAdminServerActionUser(formData);
  await approveApplication(applicationId);
  redirect(withLocale("/admin?approved=1", lang));
}

export async function rejectOnboardingAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const applicationId = String(formData.get("application_id") ?? "");
  await guardAdminServerActionUser(formData);
  await rejectApplication(applicationId);
  redirect(withLocale("/admin?rejected=1", lang));
}
