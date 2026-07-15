/**
 * Sprint 1 acceptance checks — DB connection, seeded users, password auth
 * Run: npm run sprint1:verify
 */
import { PrismaClient } from "@prisma/client";
import { authService } from "../features/auth/auth.service";
import { DEMO_PASSWORD, DEMO_USERS } from "../lib/demo-auth";

const prisma = new PrismaClient();

type Check = { name: string; ok: boolean; detail?: string };

const demoAuthRetired = DEMO_USERS.length === 0;

async function main() {
  const checks: Check[] = [];

  if (!process.env.DATABASE_URL?.trim()) {
    checks.push({ name: "DATABASE_URL", ok: false, detail: "not set — copy from .env.example" });
    report(checks);
    process.exit(1);
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.push({ name: "database.connect", ok: true });
  } catch (error) {
    checks.push({
      name: "database.connect",
      ok: false,
      detail: error instanceof Error ? error.message : String(error)
    });
    report(checks);
    process.exit(1);
  }

  const userCount = await prisma.user.count();
  checks.push({
    name: "seed.users",
    ok: userCount >= DEMO_USERS.length,
    detail: `count=${userCount}, expected>=${DEMO_USERS.length}`
  });

  const brand = await prisma.user.findUnique({
    where: { email: "client.arc@studioos.test" },
    include: { brandProfile: true }
  });
  checks.push({
    name: "seed.brand",
    ok: demoAuthRetired ? true : Boolean(brand?.passwordHash && brand.brandProfile),
    detail: demoAuthRetired
      ? "@studioos.test brand retired (skipped)"
      : brand
        ? "Arc & Alloy ready"
        : "missing"
  });

  const creator = await prisma.user.findUnique({
    where: { email: "creator.nova@studioos.test" },
    include: { creatorProfile: true }
  });
  checks.push({
    name: "seed.creator",
    ok: demoAuthRetired ? true : Boolean(creator?.passwordHash && creator.creatorProfile),
    detail: demoAuthRetired
      ? "@studioos.test creator retired (skipped)"
      : creator
        ? "Nova ready"
        : "missing"
  });

  const campaigns = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM campaigns WHERE title = 'Summer Glow Campaign' LIMIT 1
  `;
  const campaign = campaigns[0] ?? null;
  const versionCount = campaign
    ? await prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*)::bigint AS count FROM campaign_versions WHERE campaign_id = ${campaign.id}
      `
    : [];
  const campaignVersions = Number(versionCount[0]?.count ?? 0);
  const campaignOk = !campaign || campaignVersions >= 3;
  checks.push({
    name: "seed.campaign",
    ok: campaignOk,
    detail: campaign
      ? `${campaignVersions} versions`
      : "optional demo campaign absent (OK after reset:demo-accounts)"
  });

  const auth = await authService.authenticate("client.arc@studioos.test", DEMO_PASSWORD);
  checks.push({
    name: "auth.login",
    ok: demoAuthRetired ? auth === null : auth?.role === "BRAND" && Boolean(auth.id),
    detail: demoAuthRetired
      ? "@studioos.test login retired (expected null)"
      : auth
        ? `${auth.email} (${auth.role})`
        : "authenticate returned null"
  });

  const badAuth = await authService.authenticate("client.arc@studioos.test", "wrong-password");
  checks.push({
    name: "auth.reject_bad_password",
    ok: badAuth === null,
    detail: badAuth ? "unexpected success" : "rejected"
  });

  report(checks);
  const failed = checks.filter((c) => !c.ok);
  process.exit(failed.length ? 1 : 0);
}

function report(checks: Check[]) {
  console.log("\nSprint 1 verification\n");
  for (const check of checks) {
    const mark = check.ok ? "✅" : "❌";
    console.log(`${mark} ${check.name}${check.detail ? ` — ${check.detail}` : ""}`);
  }
  const failed = checks.filter((c) => !c.ok).length;
  console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
