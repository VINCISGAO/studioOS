import { NextResponse } from "next/server";
import { withLocale, type Locale } from "@/lib/i18n";

export const runtime = "nodejs";

function normalizeLang(value: FormDataEntryValue | null): Locale {
  return String(value ?? "en") === "zh" ? "zh" : "en";
}

function redirectTo(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url), { status: 303 });
}

function loginErrorPath({
  lang,
  role,
  error
}: {
  lang: Locale;
  role: "brand" | "creator";
  error: string;
}) {
  return withLocale(`/login?error=${encodeURIComponent(error)}&role=${role}`, lang);
}

/** Test social login retired — real OAuth / email only. */
export async function POST(request: Request) {
  const formData = await request.formData();
  const lang = normalizeLang(formData.get("lang"));
  const role = String(formData.get("expected_role") ?? "") === "creator" ? "creator" : "brand";
  return redirectTo(request, loginErrorPath({ lang, role, error: "unsupported-provider" }));
}
