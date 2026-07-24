/**
 * Creator-1 verification — static checks + pure eligibility unit tests
 * Run: npm run creator-lifecycle:verify
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveCreatorEligibility } from "../features/creator/creator-eligibility.core";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");

type Check = { name: string; ok: boolean; detail?: string };

function read(relPath: string) {
  return readFileSync(join(ROOT, relPath), "utf8");
}

function checkSchema(): Check {
  const schema = read("prisma/schema.prisma");
  const required = [
    "enum CreatorVerificationStatus",
    "enum CreatorLevel",
    "enum CreatorIdentityType",
    "enum CreatorVerificationReviewAction",
    "model CreatorVerificationReviewLog",
    "verificationStatus",
    "canAcceptProjects",
    "marketplaceVisible",
    "identityType",
    "LIMITED",
    "UNAVAILABLE"
  ];
  const missing = required.filter((needle) => !schema.includes(needle));
  return {
    name: "schema.creator_lifecycle",
    ok: missing.length === 0,
    detail: missing.length ? `Missing: ${missing.join(", ")}` : "Creator lifecycle schema present"
  };
}

function checkMigration(): Check {
  const sql = read("prisma/migrations/20260724140000_creator_lifecycle_creator_1/migration.sql");
  const ok =
    sql.includes("creator_verification_review_logs") &&
    sql.includes("verification_status") &&
    !sql.toLowerCase().includes("set verification_status = 'approved'");
  return {
    name: "migration.add_only",
    ok,
    detail: ok ? "ADD ONLY migration without bulk APPROVED" : "Migration safety check failed"
  };
}

function checkEligibilityService(): Check {
  const core = read("features/creator/creator-eligibility.core.ts");
  const service = read("features/creator/creator-eligibility.service.ts");
  const ok =
    core.includes("resolveCreatorEligibility") &&
    core.includes("canUseAiTools") &&
    core.includes("canPublishPortfolio") &&
    service.includes("CREATOR_LIFECYCLE_ENFORCEMENT_FLAG") &&
    service.includes("assertCreatorEligibility");
  return {
    name: "service.eligibility",
    ok,
    detail: ok ? "CreatorEligibilityService present" : "Missing eligibility service exports"
  };
}

function checkWiring(): Check {
  const files = [
    "features/matching/matching.service.ts",
    "features/matching/invitation.service.ts",
    "features/matching/invitation-portal.service.ts",
    "app/order-actions.ts",
    "app/project-actions.ts",
    "lib/creator-service.ts"
  ];
  const missing = files.filter((file) => !read(file).includes("creator-eligibility"));
  const brandMatchOk = read("lib/studioos/brand-match-recommendations.ts").includes(
    "filterCreatorsForMarketplaceDisplay"
  );
  return {
    name: "wiring.permission_entries",
    ok: missing.length === 0 && brandMatchOk,
    detail:
      missing.length > 0
        ? `Missing wiring: ${missing.join(", ")}`
        : brandMatchOk
          ? "Permission entry wiring present"
          : "brand-match-recommendations missing marketplace filter"
  };
}

function checkSeedFlag(): Check {
  const seed = read("prisma/seed.ts");
  const ok = seed.includes("creator.lifecycle.enforcement") && seed.includes("enabled: false");
  return {
    name: "seed.feature_flag",
    ok,
    detail: ok ? "creator.lifecycle.enforcement seeded disabled" : "Feature flag seed missing"
  };
}

function unitEligibilityEnforcementOnApproved(): Check {
  const eligibility = resolveCreatorEligibility(
    {
      verificationStatus: "APPROVED",
      canAcceptProjects: true,
      marketplaceVisible: true,
      availability: "AVAILABLE",
      identityType: "INDIVIDUAL",
      profileCompletedAt: new Date(),
      user: { status: "ACTIVE", deletedAt: null, role: "CREATOR" }
    },
    {
      depositPaid: false,
      profileCompleted: true,
      ordersPaused: false,
      accountDeleted: false,
      completedOrders: 0
    },
    true
  );

  return {
    name: "unit.enforcement_on.approved_first_order",
    ok:
      eligibility.canReceiveInvitations &&
      eligibility.canSubmitProposal &&
      eligibility.canAppearInMarketplace &&
      eligibility.canUseAiTools &&
      eligibility.canPublishPortfolio,
    detail: JSON.stringify(eligibility)
  };
}

function unitEligibilityEnforcementOnNotApplied(): Check {
  const eligibility = resolveCreatorEligibility(
    {
      verificationStatus: "NOT_APPLIED",
      canAcceptProjects: false,
      marketplaceVisible: false,
      availability: "AVAILABLE",
      identityType: "INDIVIDUAL",
      profileCompletedAt: null,
      user: { status: "ACTIVE", deletedAt: null, role: "CREATOR" }
    },
    {
      depositPaid: true,
      profileCompleted: true,
      ordersPaused: false,
      accountDeleted: false,
      completedOrders: 1
    },
    true
  );

  return {
    name: "unit.enforcement_on.not_applied_blocks",
    ok: !eligibility.canReceiveInvitations && eligibility.canUseAiTools && eligibility.canPublishPortfolio,
    detail: JSON.stringify(eligibility.reasons)
  };
}

function unitEligibilityLegacyFallback(): Check {
  const eligibility = resolveCreatorEligibility(
    {
      verificationStatus: "NOT_APPLIED",
      canAcceptProjects: false,
      marketplaceVisible: false,
      availability: "AVAILABLE",
      identityType: "INDIVIDUAL",
      profileCompletedAt: new Date(),
      user: { status: "ACTIVE", deletedAt: null, role: "CREATOR" }
    },
    {
      depositPaid: true,
      profileCompleted: true,
      ordersPaused: false,
      accountDeleted: false,
      completedOrders: 1
    },
    false
  );

  return {
    name: "unit.enforcement_off.legacy_deposit",
    ok: eligibility.canReceiveInvitations && eligibility.canSubmitProposal,
    detail: JSON.stringify(eligibility.reasons)
  };
}

function unitMarketplaceIndependentFromAccept(): Check {
  const eligibility = resolveCreatorEligibility(
    {
      verificationStatus: "APPROVED",
      canAcceptProjects: false,
      marketplaceVisible: true,
      availability: "AVAILABLE",
      identityType: "INDIVIDUAL",
      profileCompletedAt: new Date(),
      user: { status: "ACTIVE", deletedAt: null, role: "CREATOR" }
    },
    {
      depositPaid: true,
      profileCompleted: true,
      ordersPaused: false,
      accountDeleted: false,
      completedOrders: 0
    },
    true
  );

  return {
    name: "unit.marketplace_without_accept",
    ok: eligibility.canAppearInMarketplace && !eligibility.canReceiveInvitations,
    detail: JSON.stringify(eligibility.reasons)
  };
}

function main() {
  const checks: Check[] = [
    checkSchema(),
    checkMigration(),
    checkEligibilityService(),
    checkWiring(),
    checkSeedFlag(),
    unitEligibilityEnforcementOnApproved(),
    unitEligibilityEnforcementOnNotApplied(),
    unitEligibilityLegacyFallback(),
    unitMarketplaceIndependentFromAccept()
  ];

  let failed = 0;
  for (const check of checks) {
    const status = check.ok ? "PASS" : "FAIL";
    console.log(`${status} ${check.name}${check.detail ? ` — ${check.detail}` : ""}`);
    if (!check.ok) failed += 1;
  }

  if (failed > 0) {
    process.exit(1);
  }
}

main();
