import { DEMO_USERS } from "@/lib/demo-auth";
import { getBrandProfileByEmail } from "@/lib/brand-profile-service";

export function fallbackBrandDisplayName(email: string): string {
  const demo = DEMO_USERS.find((user) => user.email === email.toLowerCase());
  if (demo) {
    return (
      demo.label
        .replace(/\s*\(brand\)/i, "")
        .replace(/[()（）]/g, "")
        .trim() || demo.label
    );
  }
  return email.split("@")[0] ?? "Brand";
}

export async function resolveBrandDisplayName(email: string) {
  const profile = await getBrandProfileByEmail(email.toLowerCase());
  return profile?.display_name.trim() || profile?.company_name.trim() || fallbackBrandDisplayName(email);
}
