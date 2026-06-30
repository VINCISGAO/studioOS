/**
 * Membership UI verification — Sprint 19
 * Run: npm run membership-ui:verify
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

type Check = { name: string; ok: boolean; detail?: string };

function read(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

function main() {
  const checks: Check[] = [];

  checks.push({
    name: "ui.creator_panel",
    ok: read("components/studioos/creator-membership-panel.tsx").includes("CreatorMembershipPanel"),
    detail: "studio dashboard panel"
  });

  checks.push({
    name: "ui.upgrade_dialog",
    ok: read("components/studioos/creator-membership-upgrade-dialog.tsx").includes("CreatorMembershipUpgradeDialog"),
    detail: "upgrade modal"
  });

  checks.push({
    name: "page.studio_integrated",
    ok: read("app/studio/page.tsx").includes("CreatorMembershipPanel"),
    detail: "/studio"
  });

  checks.push({
    name: "page.admin_membership",
    ok: read("app/admin/membership/page.tsx").includes("membershipAdminService"),
    detail: "/admin/membership"
  });

  checks.push({
    name: "service.demo_upgrade",
    ok: read("features/membership/membership.service.ts").includes("activateVerifiedMembershipDemo"),
    detail: "demo upgrade path"
  });

  checks.push({
    name: "auth.signup_hook",
    ok: read("lib/auth/sign-in-service.ts").includes("ensureDefaultMembershipOnCreatorRegister"),
    detail: "creator sign-in hook"
  });

  checks.push({
    name: "nav.admin_membership",
    ok: read("components/studioos/admin-portal-shell.tsx").includes("adminPortalRoutes.membership"),
    detail: "admin nav"
  });

  report(checks);
  process.exit(checks.some((c) => !c.ok) ? 1 : 0);
}

function report(checks: Check[]) {
  console.log("\nMembership UI verification\n");
  for (const check of checks) {
    console.log(`${check.ok ? "✅" : "❌"} ${check.name}${check.detail ? ` — ${check.detail}` : ""}`);
  }
  const failed = checks.filter((c) => !c.ok).length;
  console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
}

main();
