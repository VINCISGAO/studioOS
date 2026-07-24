/**
 * Order lifecycle static verification — Brand → Creator → Escrow → Review → Settlement wiring.
 * Run: npm run order-lifecycle:verify
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");

type Check = { name: string; ok: boolean; detail?: string };

function read(relPath: string) {
  return readFileSync(join(ROOT, relPath), "utf8");
}

function report(checks: Check[]) {
  for (const check of checks) {
    console.log(`${check.ok ? "OK" : "FAIL"} ${check.name}${check.detail ? `: ${check.detail}` : ""}`);
  }
  const failed = checks.filter((check) => !check.ok);
  if (failed.length > 0) throw new Error(`${failed.length} order lifecycle check(s) failed`);
}

function main() {
  const checks: Check[] = [];

  checks.push({
    name: "lifecycle.spec.present",
    ok: existsSync(join(ROOT, "docs/VINCIS_ORDER_LIFECYCLE_SPEC.md")),
    detail: "docs/VINCIS_ORDER_LIFECYCLE_SPEC.md"
  });

  const selection = read("features/matching/campaign-selection.service.ts");
  checks.push({
    name: "lifecycle.selection.requires_escrow",
    ok:
      selection.includes("isCampaignEscrowStatusActive") &&
      selection.includes("selectCreatorForLegacyProject") &&
      selection.includes("正式达成合作")
  });

  const invitation = read("features/matching/invitation.service.ts");
  const invitationPortal = read("features/matching/invitation-portal.service.ts");
  checks.push({
    name: "lifecycle.accept_does_not_create_order",
    ok:
      invitation.includes("async accept(") &&
      !invitation.includes("ensureSelectedCreatorOrderBridge") &&
      !invitationPortal.includes("ensureSelectedCreatorOrderBridge")
  });

  checks.push({
    name: "lifecycle.accept_notifies_brand",
    ok:
      invitation.includes("Creator accepted your invitation") ||
      invitationPortal.includes("accepted your invitation")
  });

  const paymentCollection = read("features/payment/payment-collection.service.ts");
  checks.push({
    name: "lifecycle.payment_before_matching",
    ok: paymentCollection.includes("AI creator matching can begin")
  });

  const reviewPolicy = read("features/review/review-round-policy.ts");
  checks.push({
    name: "lifecycle.review_five_round_policy",
    ok:
      reviewPolicy.includes("assertReviewVersionUploadAllowed") &&
      reviewPolicy.includes("INCLUDED_FREE_REVISION_ROUNDS") &&
      reviewPolicy.includes("MAX_REVISION_ROUNDS")
  });

  const happyPath = read("scripts/happy-path-transaction-verify.ts");
  checks.push({
    name: "lifecycle.happy_path_script",
    ok:
      happyPath.includes("publish") &&
      happyPath.includes("pay") &&
      happyPath.includes("approve") &&
      happyPath.includes("settlement")
  });

  const revisionVerify = read("scripts/revision-five-round-verify.ts");
  checks.push({
    name: "lifecycle.revision_five_round_script",
    ok:
      revisionVerify.includes("assertReviewVersionUploadAllowed") &&
      revisionVerify.includes("paidRevisionService")
  });

  const escrowGuards = read("features/payment/escrow-guards.ts");
  checks.push({
    name: "lifecycle.escrow_guards",
    ok: escrowGuards.includes("isCampaignEscrowStatusActive")
  });

  const delivery = read("features/delivery/delivery.service.ts");
  checks.push({
    name: "lifecycle.delivery_service",
    ok: delivery.includes("markAsFinalForLegacyOrder")
  });

  const settlement = read("features/settlement/settlement.service.ts");
  checks.push({
    name: "lifecycle.settlement_service",
    ok: settlement.includes("SettlementService") && settlement.includes("SettlementState.RELEASED")
  });

  report(checks);
}

main();
