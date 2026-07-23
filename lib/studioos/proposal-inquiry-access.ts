import "server-only";

import { getCurrentClientEmail, getCurrentCreatorId } from "@/features/auth/session-context";

export async function resolveInquiryViewer(inquiry: { client_email: string; creator_id: string }) {
  const [clientEmail, creatorId] = await Promise.all([getCurrentClientEmail(), getCurrentCreatorId()]);
  const isBrand = Boolean(
    clientEmail && clientEmail.toLowerCase() === inquiry.client_email.trim().toLowerCase()
  );
  const isCreator = creatorId === inquiry.creator_id;
  return {
    isBrand,
    isCreator,
    viewerRole: isCreator ? ("studio" as const) : ("brand" as const)
  };
}
