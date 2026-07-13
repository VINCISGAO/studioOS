import { getBrandProfileByEmail } from "@/lib/brand-profile-service";
import {
  fallbackBrandDisplayName,
  sanitizeBrandDisplayName
} from "@/lib/studioos/brand-account-display.shared";

export {
  fallbackBrandDisplayName,
  resolveCopilotDisplayNameFromUser,
  sanitizeBrandDisplayName
} from "@/lib/studioos/brand-account-display.shared";

export async function resolveBrandDisplayName(email: string) {
  const profile = await getBrandProfileByEmail(email.toLowerCase());
  return (
    sanitizeBrandDisplayName(profile?.display_name.trim() ?? "") ||
    sanitizeBrandDisplayName(profile?.company_name.trim() ?? "") ||
    fallbackBrandDisplayName(email)
  );
}
