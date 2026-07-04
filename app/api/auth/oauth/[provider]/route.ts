import { NextResponse } from "next/server";
import { AUTH_ERROR_COPY } from "@/features/auth/auth-error-copy";
import { authSecurityService } from "@/features/auth/auth-security.service";

export const runtime = "nodejs";

const supportedProviders = new Set(["google", "apple", "wechat", "alipay", "qq"]);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider: rawProvider } = await params;
  const provider = rawProvider.toLowerCase();
  const gate = await authSecurityService.enforceOAuthStart({ request, provider });
  if (!gate.ok || !supportedProviders.has(provider)) {
    return NextResponse.json({ ok: false, error: AUTH_ERROR_COPY.oauthFailed }, { status: 429 });
  }

  return NextResponse.json(
    { ok: false, error: AUTH_ERROR_COPY.oauthFailed },
    { status: provider === "google" ? 501 : 400 }
  );
}
