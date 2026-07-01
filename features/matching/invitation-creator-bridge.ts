import type { CreatorProfile } from "@prisma/client";
import { creators } from "@/lib/data";
import { getCreatorIdForDemoEmail } from "@/lib/creator-session";
import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";

const LEGACY_CREATOR_DEMO_EMAIL: Record<string, string> = {
  creator_01: "creator.nova@studioos.test",
  creator_02: "creator.signal@studioos.test",
  creator_03: "creator.atlas@studioos.test"
};

/** Minimal fields used to map a Prisma creator profile to legacy creator_0x ids. */
export type LegacyCreatorProfileLookup = Pick<CreatorProfile, "displayName"> & {
  user?: {
    email?: string | null;
  } | null;
};

export async function resolveCreatorProfileIdForLegacyId(
  legacyCreatorId: string
): Promise<string | null> {
  if (!hasDatabaseUrl()) return null;

  const demoEmail = LEGACY_CREATOR_DEMO_EMAIL[legacyCreatorId];
  if (demoEmail) {
    const user = await prisma.user.findUnique({
      where: { email: demoEmail.toLowerCase() },
      include: { creatorProfile: true }
    });
    return user?.creatorProfile?.id ?? null;
  }

  const legacyCreator = creators.find((item) => item.id === legacyCreatorId);
  if (!legacyCreator?.email) return null;

  const user = await prisma.user.findFirst({
    where: { email: { equals: legacyCreator.email, mode: "insensitive" } },
    include: { creatorProfile: true }
  });
  return user?.creatorProfile?.id ?? null;
}

export async function resolveLegacyCreatorIdForProfile(
  profile: LegacyCreatorProfileLookup
): Promise<string | null> {
  const email = profile.user?.email;
  if (email) {
    const fromDemo = getCreatorIdForDemoEmail(email);
    if (fromDemo) return fromDemo;
  }

  const displayName = profile.displayName?.toLowerCase();
  const byName = creators.find((item) => item.name.toLowerCase() === displayName);
  return byName?.id ?? null;
}
