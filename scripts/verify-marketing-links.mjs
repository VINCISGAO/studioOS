import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Every marketing link target we expect to resolve without 404. */
const MARKETING_LINK_TARGETS = [
  "/",
  "/login",
  "/login?role=brand",
  "/login?role=creator",
  "/how-it-works",
  "/pricing",
  "/case-studies",
  "/contact",
  "/faq",
  "/creators",
  "/creators/creator_01",
  "/brand",
  "/studio",
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
    path.join(appDir, "page.ts"),
    path.join(root, "app", segments[0], "[id]", "page.tsx"),
    path.join(root, "app", segments[0], "[...path]", "page.tsx")
  ];
  for (const candidate of pageCandidates) {
    if (await pathExists(path.relative(root, candidate))) return true;
  }
  return false;
}

async function hashAnchorExists(anchor) {
  const id = anchor.replace(/^#/, "");
  const files = [
    "components/marketing/cinematic/cinematic-home-page.tsx",
    "components/marketing/landing/landing-sections.tsx"
  ];
  for (const file of files) {
    const content = await fs.readFile(path.join(root, file), "utf8");
    const matches = content.match(new RegExp(`id=["']${id}["']`, "g")) ?? [];
    if (matches.length === 1) return true;
    if (matches.length > 1) {
      console.warn(`[verify-marketing-links] WARN duplicate id="${id}" in ${file}`);
      return true;
    }
  }
  return false;
}

async function main() {
  let failures = 0;

  for (const href of MARKETING_LINK_TARGETS) {
    if (isHashOnly(href)) {
      const anchor = href.slice(1);
      const ok = await hashAnchorExists(anchor);
      if (!ok) {
        console.error(`[verify-marketing-links] FAIL missing anchor ${href}`);
        failures += 1;
      } else {
        console.log(`[verify-marketing-links] OK anchor ${href}`);
      }
      continue;
    }

    const pathname = normalizePathname(href);
    const ok = await routeExists(pathname);
    if (!ok) {
      console.error(`[verify-marketing-links] FAIL missing route ${href} (${pathname})`);
      failures += 1;
    } else {
      console.log(`[verify-marketing-links] OK route ${href}`);
    }
  }

  const placeholderScan = await fs.readFile(
    path.join(root, "components/marketing/marketing-footer.tsx"),
    "utf8"
  );
  if (placeholderScan.includes('href="#"')) {
    console.error("[verify-marketing-links] FAIL footer still contains href=\"#\"");
    failures += 1;
  } else {
    console.log("[verify-marketing-links] OK no footer href=\"#\" placeholders");
  }

  if (failures > 0) {
    process.exit(1);
  }
  console.log("[verify-marketing-links] all marketing link targets verified");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
