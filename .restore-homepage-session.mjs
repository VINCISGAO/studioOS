#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)));
const owner = "VINCISGAO";
const repo = "studioOS";
const ref = "main";

const FILES = [
  "app/globals.css",
  "app/layout.tsx",
  "app/page.tsx",
  "components/language-switcher.tsx",
  "components/marketing/README.md",
  "components/marketing/home-hero-metrics.tsx",
  "components/marketing/home-hero-video.tsx",
  "components/marketing/marketing-footer.tsx",
  "components/marketing/marketing-header.tsx",
  "components/marketing/marketing-shell.tsx",
  "components/marketing/marketing-viewport-guard.tsx",
  "components/marketing/use-marketing-home-portal-session.ts",
  "components/marketing/about/about-page.tsx",
  "components/marketing/about/about-sections-footer.tsx",
  "components/marketing/about/about-sections.tsx",
  "components/marketing/cases/cases-hero-illustration.tsx",
  "components/marketing/cases/cases-page-loading.tsx",
  "components/marketing/cases/cases-showcase-page.tsx",
  "components/marketing/cases/cases-work-card.tsx",
  "components/marketing/cases/marketing-cases-shell.tsx",
  "components/marketing/cinematic/cinematic-escrow.tsx",
  "components/marketing/cinematic/cinematic-hero-backdrop.tsx",
  "components/marketing/cinematic/cinematic-hero-brands.tsx",
  "components/marketing/cinematic/cinematic-hero-cta.tsx",
  "components/marketing/cinematic/cinematic-hero-features.tsx",
  "components/marketing/cinematic/cinematic-hero.tsx",
  "components/marketing/cinematic/cinematic-nav.tsx",
  "components/marketing/cinematic/cinematic-network.tsx",
  "components/marketing/cinematic/home-page-screen.tsx",
  "components/marketing/cinematic/motion-primitives.tsx",
  "components/marketing/docs/marketing-docs-hero.tsx",
  "components/marketing/docs/marketing-docs-lucien-context.tsx",
  "components/marketing/docs/marketing-docs-lucien-host.tsx",
  "components/marketing/docs/marketing-docs-mobile-header.tsx",
  "components/marketing/docs/marketing-docs-mobile-nav.tsx",
  "components/marketing/docs/marketing-docs-page-loading.tsx",
  "components/marketing/docs/marketing-docs-shell.tsx",
  "components/marketing/docs/marketing-docs-sidebar.tsx",
  "components/marketing/docs/open-marketing-lucien-button.tsx",
  "components/marketing/faq/faq-cta-graphic.tsx",
  "components/marketing/faq/faq-hero-section.tsx",
  "components/marketing/faq/faq-page-view.tsx",
  "components/marketing/faq/faq-page.tsx",
  "components/marketing/faq/lucien-viewer-identity.client.ts",
  "components/marketing/faq/public-lucien-drawer.tsx",
  "components/marketing/landing/home-landing-page.tsx",
  "components/marketing/landing/landing-cost-comparison.tsx",
  "components/marketing/landing/landing-motion.tsx",
  "components/marketing/landing/landing-recent-work.tsx",
  "components/marketing/landing/landing-sections.tsx",
  "components/marketing/landing/landing-ui.tsx",
  "components/marketing/partners/partners-earnings-calculator.tsx",
  "components/marketing/partners/partners-page.tsx",
  "components/marketing/partners/partners-sections.tsx",
  "components/marketing/pricing/pricing-budget-tier-card.tsx",
  "components/marketing/pricing/pricing-lucien-cta-button.tsx",
  "components/marketing/pricing/pricing-page.tsx",
  "components/marketing/pricing/pricing-sections.tsx",
  "components/marketing/process/process-page.tsx",
  "components/marketing/process/process-sections.tsx",
  "components/marketing/process/process-step-icon.tsx",
  "components/marketing/showcase/marketing-showcase-video-modal.tsx",
  "components/marketing/showcase/showcase-cover.tsx",
  "lib/marketing/about-copy.ts",
  "lib/marketing/cases-copy.ts",
  "lib/marketing/cinematic-copy.ts",
  "lib/marketing/faq-copy.ts",
  "lib/marketing/footer-copy.ts",
  "lib/marketing/home-hero-video-pool.ts",
  "lib/marketing/home-hero-video-sources.ts",
  "lib/marketing/home-showcase-curated.ts",
  "lib/marketing/home-showcase-works.ts",
  "lib/marketing/landing-copy.ts",
  "lib/marketing/localized-href.ts",
  "lib/marketing/marketing-docs-metadata.ts",
  "lib/marketing/marketing-docs-nav.ts",
  "lib/marketing/marketing-site-nav-icons.ts",
  "lib/marketing/marketing-site-nav.ts",
  "lib/marketing/marketing-video-proxy.ts",
  "lib/marketing/partners-copy.ts",
  "lib/marketing/portal-entry.ts",
  "lib/marketing/pricing-copy.ts",
  "lib/marketing/process-copy.ts",
  "lib/marketing/public-lucien-identity.ts",
  "lib/marketing/public-lucien-paths.ts",
  "lib/marketing/recent-work-media.ts",
  "lib/marketing/showcase-official.ts",
  "lib/studioos/home-hero-space-asset.ts",
  "lib/studioos/marketing-headline-font.ts",
];

async function gh(pathname) {
  const res = await fetch(`https://api.github.com${pathname}`, {
    headers: { Accept: "application/vnd.github+json", "User-Agent": "vincis-homepage-restore" },
  });
  if (!res.ok) throw new Error(`${pathname} -> ${res.status}`);
  return res.json();
}

async function main() {
  const commit = (await gh(`/repos/${owner}/${repo}/git/ref/heads/${ref}`)).object.sha;
  const tree = await gh(`/repos/${owner}/${repo}/git/trees/${commit}?recursive=1`);
  const shaByPath = new Map(
    tree.tree.filter((e) => e.type === "blob").map((e) => [e.path, e.sha])
  );

  const written = [];
  for (const filePath of FILES) {
    const sha = shaByPath.get(filePath);
    if (!sha) throw new Error(`Missing blob: ${filePath}`);
    const blob = await gh(`/repos/${owner}/${repo}/git/blobs/${sha}`);
    const content = Buffer.from(blob.content.replace(/\n/g, ""), "base64");
    const dest = path.join(root, filePath);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, content);
    written.push(filePath);
  }

  const log = [
    "RESTORED_FROM=main",
    "STATUS=COMPLETE",
    `FILE_COUNT=${written.length}`,
    `WRITTEN_THIS_SESSION=${written.length}`,
    `COMMIT=${commit}`,
    "",
    ...written.sort(),
    "",
    "DONE",
  ].join("\n");
  fs.writeFileSync(path.join(root, "scripts/.homepage-restore.log"), `${log}\n`);
  console.log(`Wrote ${written.length} files`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
