"use server";

import { redirect } from "next/navigation";
import { hasSupabaseConfig } from "@/lib/auth-config";
import { authService } from "@/features/auth/auth.service";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import { setDemoSession } from "@/lib/demo-auth-server";
import { createClient } from "@/lib/supabase/server";

export async function signUpMvpAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "brand");
  const company = String(formData.get("company_name") ?? "").trim();

  if (!email || password.length < 8) {
    redirect("/signup?error=invalid");
  }

  if (hasDatabaseUrl()) {
    const isCreator = role === "studio" || role === "creator";
    const result = await authService.register({
      email,
      password,
      role: isCreator ? "CREATOR" : "BRAND",
      fullName: name || company || email.split("@")[0] || "StudioOS User",
      companyName: isCreator ? undefined : company || name,
      displayName: isCreator ? name || company || email.split("@")[0] : undefined
    });

    if (!result.ok) {
      redirect(`/signup?error=${encodeURIComponent(result.error)}`);
    }

    await setDemoSession({
      email: result.user.email,
      role: isCreator ? "creator" : "client",
      userId: result.user.id
    });
    redirect(isCreator ? "/studio" : "/brand");
  }

  if (!hasSupabaseConfig()) {
    redirect(`/login?error=${encodeURIComponent("Database is not configured. Cannot create accounts.")}`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: role === "studio" ? "studio" : "brand",
        name,
        company_name: company
      }
    }
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  if (data.user) {
    await supabase.from("profiles").upsert({
      id: data.user.id,
      email,
      role: role === "studio" ? "studio" : "brand",
      name: name || email.split("@")[0],
      company_name: company
    });
  }

  redirect("/workspace");
}
