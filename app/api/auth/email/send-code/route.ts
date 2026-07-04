import { handleEmailStartPost } from "@/features/auth/email-start.route-handler";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleEmailStartPost(request);
}
