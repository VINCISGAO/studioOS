import { cache } from "react";
import { cookies } from "next/headers";
import { DEMO_SESSION_COOKIE } from "@/lib/auth-config";
import { parseServerDemoSession } from "@/lib/demo-session-server";
import { getCreatorById } from "@/lib/creator-service";
import {
  isCreatorAccountDeleted,
  resolveCreatorIdByEmail
} from "@/lib/studioos/creator-settings-service";
import { getCurrentAuthUser, getCurrentSession } from "@/lib/session-user";
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
  return resolveCreatorIdByEmail(email);
}

export const getCurrentCreatorId = cache(async (): Promise<string | null> => {
  const cookieStore = await cookies();
  const session = parseServerDemoSession(cookieStore.get(DEMO_SESSION_COOKIE)?.value);

  const currentSession = session?.role === "creator" ? session : await getCurrentSession();
  if (!currentSession || currentSession.role !== "creator") {
    return null;
  }

  const authUser = await getCurrentAuthUser();
  if (authUser && authUser.role !== "CREATOR") {
    return null;
  }

  const creatorId = await resolveCreatorIdByEmail(currentSession.email);
  if (!creatorId) {
    return null;
  }

  if (await isCreatorAccountDeleted(creatorId)) {
    return null;
  }

  return creatorId;
});

export const getCurrentCreator = cache(async (): Promise<Creator | null> => {
  const creatorId = await getCurrentCreatorId();
  if (!creatorId) {
    return null;
  }

  return getCreatorById(creatorId);
});
