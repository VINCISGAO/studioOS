import { NextResponse } from "next/server";
import { hasSupabaseConfig } from "@/lib/auth-config";
import { clearDemoSession } from "@/lib/demo-auth-server";
import { withLocale, type Locale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

function normalizeLocale(raw: FormDataEntryValue | null): Locale {
  return String(raw ?? "en") === "zh" ? "zh" : "en";
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const locale = normalizeLocale(formData.get("lang"));

  if (hasSupabaseConfig()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  await clearDemoSession();

  const response = NextResponse.redirect(new URL(withLocale("/", locale), request.url), 303);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
