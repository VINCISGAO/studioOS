import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const bundlesDir = path.join(root, "lib/marketing/i18n/bundles");

const namespaces = [
  "faq",
  "about",
  "pricing",
  "process",
  "partners",
  "cases",
  "nav",
  "docs-nav",
  "login",
  "contact",
  "landing-home",
  "cinematic-home"
] as const;

function readExistingBundle(namespace: string): Record<string, unknown> {
  try {
    return JSON.parse(readFileSync(path.join(bundlesDir, `${namespace}.json`), "utf8")) as Record<
      string,
      unknown
    >;
  } catch {
    return {};
  }
}

async function main() {
  mkdirSync(bundlesDir, { recursive: true });

  const loaders: Record<(typeof namespaces)[number], () => Promise<{ en: unknown; "zh-CN": unknown }>> = {
    faq: async () => {
      const mod = await import("../lib/marketing/faq-copy.sources");
      return { en: mod.faqCopyEn, "zh-CN": mod.faqCopyZhCN };
    },
    about: async () => {
      const mod = await import("../lib/marketing/about-copy.sources");
      return { en: mod.aboutCopyEn, "zh-CN": mod.aboutCopyZhCN };
    },
    pricing: async () => {
      const mod = await import("../lib/marketing/pricing-copy.sources");
      return { en: mod.pricingCopyEn, "zh-CN": mod.pricingCopyZhCN };
    },
    process: async () => {
      const mod = await import("../lib/marketing/process-copy.sources");
      return { en: mod.processCopyEn, "zh-CN": mod.processCopyZhCN };
    },
    partners: async () => {
      const mod = await import("../lib/marketing/partners-copy.sources");
      return { en: mod.partnersCopyEn, "zh-CN": mod.partnersCopyZhCN };
    },
    cases: async () => {
      const mod = await import("../lib/marketing/cases-copy.sources");
      return { en: mod.casesCopyEn, "zh-CN": mod.casesCopyZhCN };
    },
    nav: async () => {
      const mod = await import("../lib/marketing/marketing-site-nav.sources");
      return { en: mod.marketingSiteNavEn, "zh-CN": mod.marketingSiteNavZhCN };
    },
    "docs-nav": async () => {
      const mod = await import("../lib/marketing/marketing-docs-nav.sources");
      return { en: mod.marketingDocsNavEn, "zh-CN": mod.marketingDocsNavZhCN };
    },
    login: async () => {
      const mod = await import("../lib/marketing/login-copy.sources");
      return { en: mod.loginCopyEn, "zh-CN": mod.loginCopyZhCN };
    },
    contact: async () => {
      const mod = await import("../lib/marketing/contact-copy.sources");
      return { en: mod.contactCopyEn, "zh-CN": mod.contactCopyZhCN };
    },
    "landing-home": async () => {
      const mod = await import("../lib/marketing/landing-home-copy.sources");
      return { en: mod.landingHomeCopyEn, "zh-CN": mod.landingHomeCopyZhCN };
    },
    "cinematic-home": async () => {
      const mod = await import("../lib/marketing/cinematic-home-copy.sources");
      return { en: mod.cinematicHomeCopyEn, "zh-CN": mod.cinematicHomeCopyZhCN };
    }
  };

  for (const namespace of namespaces) {
    const source = await loaders[namespace]();
    const existing = readExistingBundle(namespace);
    writeFileSync(
      path.join(bundlesDir, `${namespace}.json`),
      `${JSON.stringify({ ...existing, ...source }, null, 2)}\n`,
      "utf8"
    );
    console.log(`[marketing-i18n-seed] ${namespace}.json`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
