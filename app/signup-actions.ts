"use server";

import { redirect } from "next/navigation";
import { hasSupabaseConfig } from "@/lib/auth-config";
import { createClient } from "@/lib/supabase/server";

export async function signUpMvpAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "brand");
  const company = String(formData.get("company_name") ?? "").trim();

  if (!hasSupabaseConfig()) {
    redirect(`/login?error=${encodeURIComponent("Demo mode: use preset accounts on the login page.")}`);
  }

  if (!email || password.length < 8) {
    redirect("/signup?error=invalid");
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
