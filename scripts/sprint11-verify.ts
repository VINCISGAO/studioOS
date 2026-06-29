/**
 * Sprint 11 — Design System verification
 * Run: npm run sprint11:verify
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
    name: "tokens.file",
    ok: read("lib/design/tokens.ts").includes("export const radius"),
    detail: "lib/design/tokens.ts"
  });

  const globals = read("app/globals.css");
  checks.push({
    name: "css.radius_card",
    ok: globals.includes("--radius-card: 28px"),
    detail: "--radius-card"
  });
  checks.push({
    name: "css.semantic_colors",
    ok: globals.includes("--success:") && globals.includes("--review:"),
    detail: "success + review tokens"
  });
  checks.push({
    name: "css.typography",
    ok: globals.includes(".text-display") && globals.includes(".text-title"),
    detail: "typography utilities"
  });

  const tailwind = read("tailwind.config.ts");
  checks.push({
    name: "tailwind.semantic",
    ok: tailwind.includes("brand:") && tailwind.includes("rounded-card"),
    detail: "brand + rounded-card"
  });

  const button = read("components/ui/button.tsx");
  checks.push({
    name: "button.heights",
    ok: button.includes('sm: "h-8') && button.includes('lg: "h-12'),
    detail: "32/40/48px"
  });
  checks.push({
    name: "button.rounded",
    ok: button.includes("rounded-button"),
    detail: "14px radius"
  });

  const card = read("components/ui/card.tsx");
  checks.push({
    name: "card.radius",
    ok: card.includes("rounded-card"),
    detail: "28px card"
  });

  const composites = ["page-header", "stat-card", "empty-state", "wizard-stepper"];
  for (const name of composites) {
    checks.push({
      name: `composite.${name}`,
      ok: read(`components/studioos/ui/${name}.tsx`).length > 100,
      detail: name
    });
  }

  checks.push({
    name: "design.page",
    ok: read("app/design-system/page.tsx").includes("Design System"),
    detail: "/design-system"
  });

  checks.push({
    name: "product_theme.delegates",
    ok: read("lib/studioos/product-theme.ts").includes("@/lib/design/tokens"),
    detail: "product-theme → tokens"
  });

  const failed = checks.filter((c) => !c.ok);
  for (const check of checks) {
    console.log(`${check.ok ? "✓" : "✗"} ${check.name}${check.detail ? ` — ${check.detail}` : ""}`);
  }

  if (failed.length) {
    console.error(`\n${failed.length} check(s) failed`);
    process.exit(1);
  }

  console.log(`\nAll ${checks.length} Sprint 11 checks passed.`);
}

main();
