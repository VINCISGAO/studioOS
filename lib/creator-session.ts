import { cookies } from "next/headers";
import { DEMO_SESSION_COOKIE, hasSupabaseConfig } from "@/lib/auth-config";
import { parseServerDemoSession } from "@/lib/demo-session-server";
import { getCreatorById } from "@/lib/creator-service";
import {
  isCreatorAccountDeleted,
  resolveCreatorIdByEmail
} from "@/lib/studioos/creator-settings-service";
import type { Creator } from "@/lib/types";

const DEMO_CREATOR_IDS: Record<string, string> = {
  "creator.nova@studioos.test": "creator_01",
  "creator.signal@studioos.test": "creator_02",
  "creator.atlas@studioos.test": "creator_03"
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
  const session = parseServerDemoSession(cookieStore.get(DEMO_SESSION_COOKIE)?.value);

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
