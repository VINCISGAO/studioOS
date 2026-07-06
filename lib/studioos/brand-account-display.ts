import { DEMO_USERS } from "@/lib/demo-auth";
import { getBrandProfileByEmail } from "@/lib/brand-profile-service";

export function sanitizeBrandDisplayName(name: string): string {
  return name
    .replace(/\s*[\(（]\s*(brand|client|品牌方|广告主)\s*[\)）]\s*$/i, "")
    .trim();
}

export function fallbackBrandDisplayName(email: string): string {
  const demo = DEMO_USERS.find((user) => user.email === email.toLowerCase());
  if (demo) {
    return sanitizeBrandDisplayName(demo.label) || demo.label;
  }
  return email.split("@")[0] ?? "Brand";
}

export async function resolveBrandDisplayName(email: string) {
  const profile = await getBrandProfileByEmail(email.toLowerCase());
  return (
    sanitizeBrandDisplayName(profile?.display_name.trim() ?? "") ||
    sanitizeBrandDisplayName(profile?.company_name.trim() ?? "") ||
    fallbackBrandDisplayName(email)
  );
}
