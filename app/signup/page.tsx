import { redirect } from "next/navigation";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import type { LoginRole } from "@/lib/studioos/login-theme";

type SignUpParams = SearchParams & { error?: string; role?: string };

function resolveRole(raw?: string): LoginRole {
  return raw === "creator" ? "creator" : "brand";
}

export default async function SignUpPage({
  searchParams
}: {
  searchParams: Promise<SignUpParams>;
}) {
  const params = await searchParams;
  const locale = getLocale(params);
  const role = resolveRole(typeof params.role === "string" ? params.role : undefined);
  redirect(withLocale(`/login?role=${role}`, locale));
}
