import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Resolved by middleware redirect — no page.tsx required. */
const MIDDLEWARE_REDIRECT_TARGETS = new Set([
  "/brand/brief",
  "/brand/publish",
  "/brand/requirements/new",
  "/workspace/projects/new",
  "/workspace/brand",
  "/workspace/studio"
]);

/** Public marketing + login entry targets — must resolve (page, redirect, or API route). */
const MARKETING_LINK_TARGETS = [
  "/",
  "/login",
  "/login?role=brand",
  "/login?role=creator",
  "/signup",
  "/signup?role=creator",
  "/start",
  "/how-it-works",
  "/pricing",
  "/case-studies",
  "/contact",
  "/faq",
  "/creators",
  "/creators/creator_01",
  "/works",
  "/brand",
  "/studio",
  "/admin/login",
  "/#how-it-works",
  "/#work",
  "/#network",
  "/#escrow",
  "/#cost",
  "/#cta",
  "/api/auth/email/start",
  "/api/auth/continue",
  "/api/auth/demo-social",
  "/api/auth/oauth/google",
  "/api/auth/oauth/alipay",
  "/api/auth/google-one-tap",
  "/auth/callback",
  "/auth/alipay/callback"
];

/** Brand wizard legacy entry — middleware or page redirect, must not 404. */
const BRAND_WIZARD_LEGACY_TARGETS = [
  "/brand/projects/new",
  "/brand/projects/new?step=1",
  "/brand/brief",
  "/brand/publish",
  "/brand/requirements/new",
  "/brand/brief/new",
  "/brand/start-brief",
  "/workspace/projects/new"
];

/** Portal sidebar IA — must have page.tsx (auth-gated, not 404). */
const BRAND_PORTAL_TARGETS = [
  "/brand",
  "/brand/brand-center",
  "/brand/review",
  "/brand/finance/account",
  "/brand/attribution",
  "/brand/messages",
  "/brand/ai",
  "/brand/settings",
  "/brand/projects",
  "/brand/profile"
];

const CREATOR_PORTAL_TARGETS = [
  "/studio",
  "/studio/profile",
  "/studio/invitations",
  "/studio/projects",
  "/studio/review",
  "/studio/income",
  "/studio/messages",
  "/studio/ai",
  "/studio/deposit",
  "/studio/settings",
  "/studio/works"
];

const HOMEPAGE_ANCHOR_FILES = [
  "components/marketing/landing/home-landing-page.tsx",
  "components/marketing/cinematic/home-page-screen.tsx"
];

function normalizePathname(href) {
  const hashIndex = href.indexOf("#");
  const withoutHash = hashIndex >= 0 ? href.slice(0, hashIndex) : href;
  const [pathname] = withoutHash.split("?");
  return pathname || "/";
}

function isHashOnly(href) {
  return href.startsWith("/#") || href.startsWith("#");
}

async function pathExists(relativePath) {
  try {
    await fs.access(path.join(root, relativePath));
    return true;
  } catch {
    return false;
  }
}

async function fileHasRedirect(relativePath) {
  try {
    const content = await fs.readFile(path.join(root, relativePath), "utf8");
    return content.includes("redirect(");
  } catch {
    return false;
  }
}

async function routeExists(pathname) {
  if (pathname === "/") {
    return pathExists("app/page.tsx");
  }

  if (pathname.startsWith("/api/")) {
    const segments = pathname.replace(/^\/api\//u, "").split("/");
    const leaf = segments.pop() ?? "";
    const dir = path.join(root, "app", "api", ...segments);
    const candidates = [
      path.join(dir, `${leaf}/route.ts`),
      path.join(dir, `[${leaf}]/route.ts`),
      path.join(dir, "route.ts")
    ];
    for (const candidate of candidates) {
      if (await pathExists(path.relative(root, candidate))) return true;
    }
    const dynamic = path.join(root, "app", "api", ...segments, "[...path]", "route.ts");
    if (await pathExists(path.relative(root, dynamic))) return true;
    const provider = path.join(root, "app", "api", ...segments, "[provider]", "route.ts");
    if (await pathExists(path.relative(root, provider))) return true;
    return false;
  }

  if (pathname.startsWith("/auth/")) {
    const segments = pathname.replace(/^\/auth\//u, "").split("/");
    const routeFile = path.join(root, "app", "auth", ...segments, "route.ts");
    return pathExists(path.relative(root, routeFile));
  }

  const segments = pathname.replace(/^\/+/u, "").split("/");
  const appDir = path.join(root, "app", ...segments);
  const pageCandidates = [
    path.join(appDir, "page.tsx"),
    path.join(appDir, "page.ts")
  ];
  for (const candidate of pageCandidates) {
    if (await pathExists(path.relative(root, candidate))) return true;
  }

  // Dynamic routes: walk segments and try [param] folders
  let dir = path.join(root, "app");
  for (let i = 0; i < segments.length; i += 1) {
    const segment = segments[i];
    const exact = path.join(dir, segment);
    const dynamicId = path.join(dir, "[id]");
    const dynamicOrderId = path.join(dir, "[orderId]");
    const dynamicSlug = path.join(dir, "[slug]");
    const dynamicCatch = path.join(dir, "[...path]");

    if (await pathExists(path.relative(root, path.join(exact, "page.tsx")))) {
      dir = exact;
      continue;
    }
    for (const dyn of [dynamicId, dynamicOrderId, dynamicSlug, dynamicCatch]) {
      if (await pathExists(path.relative(root, path.join(dyn, "page.tsx")))) {
        dir = dyn;
        break;
      }
    }
    if (i === segments.length - 1) {
      return await pathExists(path.relative(root, path.join(dir, "page.tsx")));
    }
  }

  return false;
}

async function hashAnchorExists(anchor) {
  const id = anchor.replace(/^#/, "");
  let found = 0;

  for (const file of HOMEPAGE_ANCHOR_FILES) {
    const full = path.join(root, file);
    try {
      const content = await fs.readFile(full, "utf8");
      const matches = content.match(new RegExp(`id=["']${id}["']`, "g")) ?? [];
      found += matches.length;
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
        console.warn(`[verify-marketing-links] WARN missing anchor scan file ${file}`);
        continue;
      }
      throw error;
    }
  }

  if (found === 0) return false;
  if (found > 1) {
    console.warn(`[verify-marketing-links] WARN duplicate id="${id}" (${found} occurrences)`);
  }
  return true;
}

async function verifyTarget(href, failures) {
  if (isHashOnly(href)) {
    const anchor = href.slice(1);
    const ok = await hashAnchorExists(anchor);
    if (!ok) {
      console.error(`[verify-marketing-links] FAIL missing anchor ${href}`);
      failures.push(href);
    } else {
      console.log(`[verify-marketing-links] OK anchor ${href}`);
    }
    return;
  }

  const pathname = normalizePathname(href);
  if (MIDDLEWARE_REDIRECT_TARGETS.has(pathname)) {
    console.log(`[verify-marketing-links] OK middleware redirect ${href}`);
    return;
  }

  const ok = await routeExists(pathname);
  if (!ok) {
    console.error(`[verify-marketing-links] FAIL missing route ${href} (${pathname})`);
    failures.push(href);
    return;
  }

  const segments = pathname.replace(/^\/+/u, "").split("/");
  const pagePath = path.join(root, "app", ...segments, "page.tsx");
  const relativePage = path.relative(root, pagePath);
  if (await fileHasRedirect(relativePage)) {
    console.log(`[verify-marketing-links] OK redirect route ${href}`);
  } else {
    console.log(`[verify-marketing-links] OK route ${href}`);
  }
}

async function main() {
  const failures = [];
  const allTargets = [
    ...MARKETING_LINK_TARGETS,
    ...BRAND_WIZARD_LEGACY_TARGETS,
    ...BRAND_PORTAL_TARGETS,
    ...CREATOR_PORTAL_TARGETS
  ];

  for (const href of allTargets) {
    await verifyTarget(href, failures);
  }

  try {
    const homepagePage = await fs.readFile(path.join(root, "app/page.tsx"), "utf8");
    if (!homepagePage.includes("HomePageJsonLd")) {
      console.error("[verify-marketing-links] FAIL homepage missing HomePageJsonLd");
      failures.push("homepage HomePageJsonLd");
    } else {
      console.log("[verify-marketing-links] OK homepage structured data component");
    }

    const schemaFiles = [
      "lib/marketing/structured-data/homepage.ts",
      "lib/marketing/structured-data/pricing.ts",
      "lib/marketing/structured-data/faq-page.ts",
      "lib/marketing/structured-data/creator-profile.ts"
    ];
    for (const file of schemaFiles) {
      try {
        await fs.access(path.join(root, file));
        console.log(`[verify-marketing-links] OK schema file ${file}`);
      } catch {
        console.error(`[verify-marketing-links] FAIL missing schema file ${file}`);
        failures.push(file);
      }
    }

    const faviconFiles = [
      "public/favicon.ico",
      "public/favicon-48x48.png",
      "public/favicon-96x96.png",
      "public/favicon-192x192.png",
      "public/favicon-512x512.png",
      "public/apple-touch-icon.png",
      "public/brand/vincis-logo-512.png"
    ];
    for (const file of faviconFiles) {
      try {
        await fs.access(path.join(root, file));
        console.log(`[verify-marketing-links] OK favicon asset ${file}`);
      } catch {
        console.error(`[verify-marketing-links] FAIL missing favicon asset ${file}`);
        failures.push(file);
      }
    }

    const layoutContent = await fs.readFile(path.join(root, "app/layout.tsx"), "utf8");
    if (!layoutContent.includes("metadataBase")) {
      console.error("[verify-marketing-links] FAIL root layout missing metadataBase");
      failures.push("root layout metadataBase");
    } else if (!layoutContent.includes("vincisRootMetadataIcons")) {
      console.error("[verify-marketing-links] FAIL root layout missing vincisRootMetadataIcons");
      failures.push("root layout icons");
    } else {
      console.log("[verify-marketing-links] OK root layout metadataBase + icons");
    }
  } catch (error) {
    console.error(`[verify-marketing-links] FAIL could not scan homepage schema: ${error}`);
    failures.push("homepage schema scan");
  }

  try {
    const placeholderScan = await fs.readFile(
      path.join(root, "components/marketing/marketing-footer.tsx"),
      "utf8"
    );
    if (placeholderScan.includes('href="#"')) {
      console.error("[verify-marketing-links] FAIL footer still contains href=\"#\"");
      failures.push('footer href="#"');
    } else {
      console.log("[verify-marketing-links] OK no footer href=\"#\" placeholders");
    }
  } catch (error) {
    console.error(`[verify-marketing-links] FAIL could not scan footer: ${error}`);
    failures.push("footer scan");
  }

  if (failures.length > 0) {
    console.error(`\n[verify-marketing-links] ${failures.length} failure(s)`);
    process.exit(1);
  }
  console.log("\n[verify-marketing-links] all link targets verified");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
