import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { DEMO_SESSION_COOKIE } from "@/lib/auth-config";
import { parseDemoSession } from "@/lib/demo-auth";
import { getCreatorIdForDemoEmail } from "@/lib/creator-session";
import { addMessage, getInquiry, getMessagesForPair, resolveCanonicalInquiry } from "@/lib/chat-service";
import type { ChatSender } from "@/lib/chat-types";
import { getOrderForPair } from "@/lib/order-service";
import { isProposalChatLocked } from "@/lib/studioos/project-contract";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function resolveCreatorId() {
  const cookieStore = await cookies();
  const session = parseDemoSession(cookieStore.get(DEMO_SESSION_COOKIE)?.value);
  if (!session || session.role !== "creator") {
    return null;
  }
  return getCreatorIdForDemoEmail(session.email);
}

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const inquiry = await getInquiry(id);

  if (!inquiry) {
    return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
  }

  const after = new URL(request.url).searchParams.get("after") ?? undefined;
  let messages = await getMessagesForPair(inquiry.client_email, inquiry.creator_id);

  if (after) {
    const afterTime = new Date(after).getTime();
    messages = messages.filter((item) => new Date(item.created_at).getTime() > afterTime);
  }

  return NextResponse.json({ messages });
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const inquiry = await getInquiry(id);

  if (!inquiry) {
    return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
  }

  const order = await getOrderForPair(inquiry.client_email, inquiry.creator_id);
  if (isProposalChatLocked(order)) {
    return NextResponse.json({ error: "locked" }, { status: 403 });
  }

  const payload = (await request.json()) as { body?: string; sender?: ChatSender };
  const body = String(payload.body ?? "").trim();
  const sender = payload.sender;

  if (!body || (sender !== "brand" && sender !== "creator")) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }

  const targetInquiry = (await resolveCanonicalInquiry(inquiry.client_email, inquiry.creator_id)) ?? inquiry;

  if (sender === "creator") {
    const creatorId = await resolveCreatorId();
    if (!creatorId || creatorId !== inquiry.creator_id) {
      return NextResponse.json({ error: "Not authorized as studio" }, { status: 403 });
    }
  }

  const message = await addMessage(targetInquiry.id, sender, body);
  if (!message) {
    return NextResponse.json({ error: "Could not save message" }, { status: 400 });
  }

  return NextResponse.json({ message });
}
