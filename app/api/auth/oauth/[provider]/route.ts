import { NextResponse } from "next/server";
import { startOAuthSignIn, type OAuthProvider } from "@/features/auth/oauth-start.service";
import type { OAuthEntryRole } from "@/features/auth/oauth-auth.service";
import type { Locale } from "@/lib/i18n";

export const runtime = "nodejs";

const supportedProviders = new Set<OAuthProvider>(["google", "apple", "wechat", "alipay", "qq"]);

function parseLang(raw: string | null): Locale {
  return raw === "zh" ? "zh" : "en";
}

function parseEntryRole(raw: string | null): OAuthEntryRole {
  return raw === "creator" ? "creator" : "brand";
}

function parseInput(request: Request, providerRaw: string) {
  const provider = providerRaw.toLowerCase() as OAuthProvider;
  const url = new URL(request.url);

  if (request.method === "GET") {
    return {
      provider,
      lang: parseLang(url.searchParams.get("lang")),
      entryRole: parseEntryRole(url.searchParams.get("role") ?? url.searchParams.get("expected_role")),
      nextPath: url.searchParams.get("next")?.trim() ?? ""
    };
  }

  return null;
}

async function parseFormInput(request: Request, providerRaw: string) {
  const provider = providerRaw.toLowerCase() as OAuthProvider;
  const formData = await request.formData();
  const expectedRole = String(formData.get("expected_role") ?? "brand");

  return {
    provider,
    lang: parseLang(String(formData.get("lang") ?? "en")),
    entryRole: parseEntryRole(expectedRole === "creator" ? "creator" : "brand"),
    nextPath: String(formData.get("next") ?? "").trim()
  };
}

async function handleOAuthStart(request: Request, providerRaw: string) {
  const parsed =
    request.method === "GET"
      ? parseInput(request, providerRaw)
      : await parseFormInput(request, providerRaw);

  if (!parsed || !supportedProviders.has(parsed.provider)) {
    return NextResponse.redirect(new URL("/login?error=unsupported-provider", request.url));
  }

  const destination = await startOAuthSignIn({
    request,
    provider: parsed.provider,
    lang: parsed.lang,
    entryRole: parsed.entryRole,
    nextPath: parsed.nextPath
  });

  return NextResponse.redirect(destination.startsWith("http") ? destination : new URL(destination, request.url));
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  return handleOAuthStart(request, provider);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  return handleOAuthStart(request, provider);
}
