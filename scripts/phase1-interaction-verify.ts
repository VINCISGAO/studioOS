/**
 * Phase 1 interaction fixes — regression checks for fatal UX bugs.
 * Run: npm run phase1:verify
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEPOSIT_POLL_INTERVAL_MS,
  DEPOSIT_POLL_MAX_ATTEMPTS,
  DEPOSIT_POLL_TIMEOUT_MS
} from "../lib/studioos/deposit-polling.constants";
import { toSafeNextPath, toSafeNextPathname } from "../lib/auth/post-login-redirect";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");

type Check = { name: string; ok: boolean; detail?: string };

function read(relPath: string) {
  return readFileSync(join(ROOT, relPath), "utf8");
}

function report(checks: Check[]) {
  console.log("\nPhase 1 interaction verify\n");
  for (const check of checks) {
    console.log(`${check.ok ? "✅" : "❌"} ${check.name}${check.detail ? ` — ${check.detail}` : ""}`);
  }
  const failed = checks.filter((item) => !item.ok).length;
  console.log(failed ? `\n${failed} check(s) failed` : "\nPhase 1 batch 1 ready");
  return failed;
}

function main() {
  const checks: Check[] = [];

  const checkoutPanel = read("components/studioos/brand-checkout-panel.tsx");
  const checkoutHook = read("hooks/use-brand-checkout-submit.ts");
  checks.push({
    name: "checkout.pending.hook",
    ok: checkoutPanel.includes("useBrandCheckoutSubmit") && checkoutHook.includes("clearPending")
  });
  checks.push({
    name: "checkout.pending.pageshow",
    ok: checkoutHook.includes("pageshow")
  });
  checks.push({
    name: "checkout.pending.timeout",
    ok: checkoutHook.includes("CHECKOUT_SUBMIT_TIMEOUT_MS")
  });
  checks.push({
    name: "checkout.pending.duplicate_guard",
    ok: checkoutHook.includes("submittingRef") && checkoutPanel.includes("event.preventDefault()")
  });
  checks.push({
    name: "checkout.payment_signal",
    ok: read("app/brand/projects/[id]/checkout/page.tsx").includes("paymentSignal")
  });

  const depositHook = read("hooks/use-deposit-status-polling.ts");
  checks.push({
    name: "deposit.poll.limits",
    ok:
      DEPOSIT_POLL_MAX_ATTEMPTS === 90 &&
      DEPOSIT_POLL_TIMEOUT_MS === 180_000 &&
      DEPOSIT_POLL_INTERVAL_MS === 2_000
  });
  checks.push({
    name: "deposit.poll.hidden_pause",
    ok: depositHook.includes("document.hidden") && depositHook.includes("visibilitychange")
  });
  checks.push({
    name: "deposit.poll.failure_state",
    ok: depositHook.includes('stop("failed"') && read("components/studioos/creator-deposit-pending-card.tsx").includes('phase === "failed"')
  });
  checks.push({
    name: "deposit.panel.shared_card",
    ok:
      read("components/studioos/deposit-panel.tsx").includes("CreatorDepositPendingCard") &&
      !read("components/studioos/deposit-panel.tsx").includes("function PendingPaymentCard")
  });

  const middleware = read("middleware.ts");
  checks.push({
    name: "middleware.login.next.preserve_lang_strip",
    ok: middleware.includes('pathname === "/login"') && middleware.includes("url.searchParams.delete(\"lang\")")
  });
  checks.push({
    name: "middleware.redirect_to_login.full_path",
    ok: middleware.includes("pathWithSearch") && middleware.includes("toSafeNextPath(pathWithSearch)")
  });
  checks.push({
    name: "middleware.logged_in_honors_next",
    ok: middleware.includes("resolveSafeLoginNext") && middleware.includes("redirectToSafeRelativePath")
  });

  const wizardNext = toSafeNextPath("/brand/projects/new?project=abc&step=2&evil=1");
  checks.push({
    name: "redirect.wizard_next_whitelist",
    ok: wizardNext === "/brand/projects/new?project=abc&step=2",
    detail: wizardNext
  });
  checks.push({
    name: "redirect.blocks_open_redirect",
    ok: toSafeNextPathname("https://evil.example") === "" && toSafeNextPath("//evil.example") === ""
  });

  const pushRefreshTargets = [
    "components/studioos/login-workspace.tsx",
    "components/studioos/studio-notification-bell.tsx",
    "components/studioos/notification-center-bell.tsx",
    "components/studioos/certification/certification-level-up-dialog.tsx",
    "components/studioos/creator-selection-celebration-dialog.tsx"
  ];
  for (const rel of pushRefreshTargets) {
    const source = read(rel);
    const hasPair = /router\.push\([^)]*\)[\s\S]{0,80}router\.refresh\(\)/.test(source);
    checks.push({ name: `nav.no_push_refresh.${rel.split("/").pop()}`, ok: !hasPair });
  }

  const guards = read("lib/studioos/brand-portal-page-guards.ts");
  checks.push({
    name: "brand.guards.exist",
    ok:
      guards.includes("brandPortalRequireSession") &&
      guards.includes("brandPortalRequireOwnedResource") &&
      guards.includes("brandPortalDenyInvalidState")
  });
  const studios = read("app/brand/projects/[id]/studios/page.tsx");
  const orderReview = read("app/brand/orders/[id]/review/page.tsx");
  const projectPage = read("app/brand/projects/[id]/page.tsx");
  checks.push({
    name: "brand.guards.wired",
    ok:
      studios.includes("brandPortalRequireSession") &&
      orderReview.includes("brandPortalRequireOwnedResource") &&
      projectPage.includes("brandPortalDenyInvalidState")
  });
  checks.push({
    name: "brand.forbidden_same_as_missing",
    ok: orderReview.includes("brandPortalRequireOwnedResource") && projectPage.includes("notFound()")
  });

  checks.push({
    name: "files.e2e.phase1",
    ok: existsSync(join(ROOT, "e2e/phase1-interaction.spec.ts"))
  });

  const failed = report(checks);
  process.exit(failed ? 1 : 0);
}

main();
