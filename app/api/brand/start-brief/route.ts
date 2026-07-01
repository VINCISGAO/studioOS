import { type NextRequest, NextResponse } from "next/server";
import { DEMO_SESSION_COOKIE, VISITOR_COOKIE } from "@/lib/auth-config";
import { resolveBrandBriefStartFromRequestCookies } from "@/lib/brand-brief-session";
import { getOrCreateEphemeralWizardProject } from "@/lib/brand-start-brief";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const langParam = request.nextUrl.searchParams.get("lang");
  const lang = langParam === "zh" ? "zh" : "en";

  const { email: clientEmail, visitorId } = resolveBrandBriefStartFromRequestCookies(
    request.cookies.get(DEMO_SESSION_COOKIE)?.value,
    request.cookies.get(VISITOR_COOKIE)?.value
  );

  try {
    const project = await getOrCreateEphemeralWizardProject(clientEmail);
    const destination = new URL("/brand/projects/new", request.url);
    destination.searchParams.set("project", project.id);
    destination.searchParams.set("step", "1");
    destination.searchParams.set("lang", lang);

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
    console.error("[GET /api/brand/start-brief]", error);
    const fallback = new URL("/brand", request.url);
    fallback.searchParams.set("lang", lang);
    fallback.searchParams.set("error", "start-brief");
    return NextResponse.redirect(fallback);
  }
}
