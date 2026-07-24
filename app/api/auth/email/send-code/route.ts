import { handleEmailStartPost } from "@/features/auth/email-start.route-handler";

export const runtime = "nodejs";

/** @deprecated Use POST /api/auth/email/start — kept for legacy clients only. */
export async function POST(request: Request) {
  const response = await handleEmailStartPost(request);
  response.headers.set("Deprecation", "true");
  return response;
}
