import { cookies } from "next/headers";
import { DEMO_SESSION_COOKIE, hasSupabaseConfig } from "@/lib/auth-config";
import { parseDemoSession } from "@/lib/demo-auth";
import { getCreatorById } from "@/lib/creator-service";
import {
  isCreatorAccountDeleted,
  resolveCreatorIdByEmail
} from "@/lib/studioos/creator-settings-service";
import type { Creator } from "@/lib/types";

const DEMO_CREATOR_IDS: Record<string, string> = {
  "creator.nova@adbridge.test": "creator_01",
  "creator.signal@adbridge.test": "creator_02",
  "creator.atlas@adbridge.test": "creator_03"
};

export function getCreatorIdForDemoEmail(email: string) {
  return DEMO_CREATOR_IDS[email.trim().toLowerCase()] ?? null;
}

export async function resolveCurrentCreatorIdFromEmail(email: string) {
  if (hasSupabaseConfig()) {
    return null;
  }
  return resolveCreatorIdByEmail(email);
}

export async function getCurrentCreatorId(): Promise<string | null> {
  const cookieStore = await cookies();
  const session = parseDemoSession(cookieStore.get(DEMO_SESSION_COOKIE)?.value);

  if (!session || session.role !== "creator") {
    return null;
  }

  const creatorId = await resolveCreatorIdByEmail(session.email);
  if (!creatorId) {
    return null;
  }

  if (await isCreatorAccountDeleted(creatorId)) {
    return null;
  }

  return creatorId;
}

export async function getCurrentCreator(): Promise<Creator | null> {
  const creatorId = await getCurrentCreatorId();
  if (!creatorId) {
    return null;
  }

  return getCreatorById(creatorId);
}
