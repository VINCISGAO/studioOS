/**
 * Creator Membership & Commission verification
 * Run: npm run membership:verify
 */
import { PrismaClient } from "@prisma/client";
import { runCommissionCalculationTests } from "../features/membership/commission-calculation.service";
import { membershipService } from "../features/membership/membership.service";
import { membershipAdminService } from "../features/membership/membership-admin.service";
import { membershipExpirationService } from "../features/membership/membership-expiration.service";
import { membershipRepository } from "../features/membership/membership.repository";

const prisma = new PrismaClient();

type Check = { name: string; ok: boolean; detail?: string };

async function main() {
  const checks: Check[] = [];

  for (const test of runCommissionCalculationTests()) {
    checks.push(test);
  }

  let campaignId: string | null = null;
  let creatorId: string | null = null;
  let adminId: string | null = null;

  try {
    const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    adminId = admin?.id ?? null;

    const rule = await membershipRepository.getActiveCommissionRule();
    checks.push({
      name: "db.commission_rule",
      ok: rule != null && rule.defaultCreatorCommissionPercentage === 20,
      detail: rule ? `${rule.defaultCreatorCommissionPercentage}% default` : "missing"
    });

    const plans = await membershipRepository.listPlans();
    checks.push({
      name: "db.membership_plans",
      ok: plans.some((p) => p.planType === "DEFAULT") && plans.some((p) => p.planType === "VERIFIED"),
      detail: `${plans.length} plans`
    });

    const creator = await prisma.user.findUniqueOrThrow({
      where: { email: "creator.nova@adbridge.test" }
    });
    creatorId = creator.id;

    const status = await membershipService.getCreatorMembershipStatus(creator.id);
    checks.push({
      name: "creator.default_status",
      ok: status.planType === "DEFAULT" && status.commissionRate === 20,
      detail: `${status.planType} @ ${status.commissionRate}%`
    });

    const rate = await membershipService.resolveCreatorCommissionRate(creator.id);
    checks.push({
      name: "resolve.default_rate",
      ok: rate.commissionPercentage === 20 && rate.planType === "DEFAULT"
    });

    if (admin) {
      await membershipAdminService.manualUpgrade(
        { id: admin.id, role: "ADMIN" },
        creator.id,
        "membership-verify"
      );
      const verified = await membershipService.resolveCreatorCommissionRate(creator.id);
      checks.push({
        name: "admin.manual_upgrade",
        ok: verified.planType === "VERIFIED" && verified.commissionPercentage === 10,
        detail: `${verified.commissionPercentage}%`
      });

      await membershipAdminService.manualDowngrade(
        { id: admin.id, role: "ADMIN" },
        creator.id,
        "membership-verify cleanup"
      );
      const back = await membershipService.resolveCreatorCommissionRate(creator.id);
      checks.push({
        name: "admin.manual_downgrade",
        ok: back.planType === "DEFAULT"
      });
    } else {
      checks.push({ name: "admin.manual_upgrade", ok: false, detail: "no admin user in seed" });
    }

    const brand = await prisma.user.findUniqueOrThrow({
      where: { email: "client.arc@adbridge.test" }
    });
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 7);

    const campaign = await prisma.campaign.create({
      data: {
        brandId: brand.id,
        creatorId: creator.id,
        title: "Membership Verify Campaign",
        description: "Commission snapshot test",
        budget: 1000,
        currency: "USD",
        deadline,
        platform: "TIKTOK",
        aspectRatio: "9:16",
        status: "COMPLETED"
      }
    });
    campaignId = campaign.id;

    const settled = await membershipService.settleOrderCommission({
      campaignId: campaign.id,
      creatorId: creator.id,
      orderAmount: 1000,
      currency: "USD"
    });
    checks.push({
      name: "settle.default_creator",
      ok:
        settled.creatorCommissionAmount === 200 &&
        settled.creatorPayoutAmount === 800 &&
        settled.clientServiceFeeAmount === 100 &&
        settled.platformTotalRevenue === 300,
      detail: `payout $${settled.creatorPayoutAmount}`
    });

    const eligibility = await membershipService.getUpgradeEligibility(creator.id);
    checks.push({
      name: "upgrade.eligible_after_threshold",
      ok: eligibility.eligible && eligibility.settledRevenue >= 1000,
      detail: `$${eligibility.settledRevenue} / $${eligibility.threshold}`
    });

    await membershipService.recordUpgradeDeclined(creator.id);
    const afterDecline = await membershipService.getUpgradeEligibility(creator.id);
    checks.push({
      name: "upgrade.decline",
      ok: !afterDecline.eligible && afterDecline.reason === "declined"
    });

    if (admin) {
      const upgraded = await membershipAdminService.manualUpgrade(
        { id: admin.id, role: "ADMIN" },
        creator.id,
        "verify verified settlement"
      );
      const expiresAt = upgraded.expiresAt ?? new Date();
      expiresAt.setDate(expiresAt.getDate() - 1);

      await prisma.creatorMembership.update({
        where: { id: upgraded.id },
        data: { expiresAt }
      });

      const expired = await membershipExpirationService.processExpirations(new Date());
      checks.push({
        name: "expiration.downgrade",
        ok: expired.processed >= 1,
        detail: `${expired.processed} expired`
      });

      const postExpire = await membershipService.resolveCreatorCommissionRate(creator.id);
      checks.push({
        name: "expiration.rate_reverts",
        ok: postExpire.planType === "DEFAULT" && postExpire.commissionPercentage === 20
      });
    }
  } catch (error) {
    checks.push({
      name: "membership.run",
      ok: false,
      detail: error instanceof Error ? error.message : String(error)
    });
  } finally {
    if (campaignId) {
      await prisma.orderCommission.deleteMany({ where: { campaignId } });
      await prisma.campaign.delete({ where: { id: campaignId } }).catch(() => null);
    }
    if (creatorId) {
      await prisma.creatorMembershipHistory.deleteMany({ where: { creatorId } });
      await prisma.creatorMembership.deleteMany({ where: { creatorId } });
      await prisma.creatorEarnings.deleteMany({ where: { creatorId } }).catch(() => null);
      const { membershipService: ms } = await import("../features/membership/membership.service");
      await ms.ensureDefaultMembershipOnCreatorRegister(creatorId);
    }
  }

  report(checks);
  process.exit(checks.some((c) => !c.ok) ? 1 : 0);
}

function report(checks: Check[]) {
  console.log("\nMembership verification\n");
  for (const check of checks) {
    console.log(`${check.ok ? "✅" : "❌"} ${check.name}${check.detail ? ` — ${check.detail}` : ""}`);
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
