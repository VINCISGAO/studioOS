import { type NextRequest, NextResponse } from "next/server";
import { DEMO_SESSION_COOKIE, VISITOR_COOKIE } from "@/lib/auth-config";
import { resolveBrandBriefStartFromRequestCookies } from "@/lib/brand-brief-session";
import { createBrandBriefDraftProjectForEmail } from "@/lib/brand-start-brief";
import { getLocale, withLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const locale = getLocale(
    Object.fromEntries(request.nextUrl.searchParams.entries())
  );

  const { email: clientEmail, visitorId } = resolveBrandBriefStartFromRequestCookies(
    request.cookies.get(DEMO_SESSION_COOKIE)?.value,
    request.cookies.get(VISITOR_COOKIE)?.value
  );

  try {
    const project = await createBrandBriefDraftProjectForEmail(clientEmail);
    const destination = new URL(
      withLocale(`/brand/projects/new?project=${project.id}&step=1`, locale),
      request.url
    );
    const response = NextResponse.redirect(destination);

    if (visitorId) {
      response.cookies.set(VISITOR_COOKIE, visitorId, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 365
      });
    }

    return response;
  } catch (error) {
    console.error("[GET /brand/start-brief]", error);
    const fallback = new URL(withLocale("/brand", locale), request.url);
    fallback.searchParams.set("error", "start-brief");
    return NextResponse.redirect(fallback);
  }
}
