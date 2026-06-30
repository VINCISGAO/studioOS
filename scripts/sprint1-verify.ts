/**
 * Sprint 1 acceptance checks — DB connection, seeded users, password auth
 * Run: npm run sprint1:verify
 */
import { PrismaClient } from "@prisma/client";
import { authService } from "../features/auth/auth.service";
import { DEMO_PASSWORD, DEMO_USERS } from "../lib/demo-auth";

const prisma = new PrismaClient();

type Check = { name: string; ok: boolean; detail?: string };

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
    ok: Boolean(brand?.passwordHash && brand.brandProfile),
    detail: brand ? "Arc & Alloy ready" : "missing"
  });

  const creator = await prisma.user.findUnique({
    where: { email: "creator.nova@studioos.test" },
    include: { creatorProfile: true }
  });
  checks.push({
    name: "seed.creator",
    ok: Boolean(creator?.passwordHash && creator.creatorProfile),
    detail: creator ? "Nova ready" : "missing"
  });

  const campaign = await prisma.campaign.findFirst({
    where: { title: "Summer Glow Campaign" },
    include: { versions: true }
  });
  checks.push({
    name: "seed.campaign",
    ok: Boolean(campaign && campaign.versions.length >= 3),
    detail: campaign ? `${campaign.versions.length} versions` : "missing"
  });

  const auth = await authService.authenticate("client.arc@studioos.test", DEMO_PASSWORD);
  checks.push({
    name: "auth.login",
    ok: auth?.role === "BRAND" && Boolean(auth.id),
    detail: auth ? `${auth.email} (${auth.role})` : "authenticate returned null"
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
