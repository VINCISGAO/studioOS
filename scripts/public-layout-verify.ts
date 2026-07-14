import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import {
  FORBIDDEN_PUBLIC_CHROME_IMPORTS,
  FORBIDDEN_PUBLIC_IMPORT_PATHS,
  FORBIDDEN_PUBLIC_MARKETING_LABELS,
  FORBIDDEN_PUBLIC_ROUTE_HREFS,
  PUBLIC_ROUTE_PREFIXES
} from "../lib/layouts/layout-policy";

const ROOT = join(import.meta.dirname ?? __dirname, "..");
const PUBLIC_ROUTE_DIR = join(ROOT, "app", "(public)");

type Violation = { file: string; detail: string };

const IMPORT_RE =
  /(?:import\s+(?:type\s+)?(?:[\w*{}\s,]+)\s+from\s+|export\s+[\w*{}\s,]+\s+from\s+)["']([^"']+)["']/g;

const CHROME_FILE_PATTERNS = [
  /^components\/layouts\/public-/,
  /^app\/\(public\)\/layout\.tsx$/,
  /^app\/\(public\)\/.+\/page\.tsx$/
] as const;

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      files.push(...walk(full));
      continue;
    }
    if (/\.(tsx|ts|jsx|js)$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

function resolveImportPath(fromFile: string, spec: string): string | null {
  if (!spec.startsWith("@/") && !spec.startsWith(".")) return null;
  let base: string;
  if (spec.startsWith("@/")) {
    base = join(ROOT, spec.slice(2));
  } else {
    base = resolve(join(fromFile, ".."), spec);
  }
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    join(base, "index.ts"),
    join(base, "index.tsx")
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate) && statSync(candidate).isFile()) {
      return candidate;
    }
  }
  return null;
}

function isChromeFile(filePath: string): boolean {
  const rel = relative(ROOT, filePath).replaceAll("\\", "/");
  return CHROME_FILE_PATTERNS.some((pattern) => pattern.test(rel));
}

function shouldFollowImport(resolvedPath: string): boolean {
  const rel = relative(ROOT, resolvedPath).replaceAll("\\", "/");
  return rel.startsWith("components/");
}

function collectPublicUiSources(entryFiles: string[]): string[] {
  const seen = new Set<string>();
  const queue = [...entryFiles];

  while (queue.length > 0) {
    const file = queue.shift();
    if (!file || seen.has(file)) continue;
    seen.add(file);

    let source = "";
    try {
      source = readFileSync(file, "utf8");
    } catch {
      continue;
    }

    for (const match of source.matchAll(IMPORT_RE)) {
      const spec = match[1];
      const resolved = resolveImportPath(file, spec);
      if (!resolved || seen.has(resolved) || !shouldFollowImport(resolved)) {
        continue;
      }
      queue.push(resolved);
    }
  }

  return [...seen];
}

function scanSource(filePath: string, source: string): Violation[] {
  const rel = relative(ROOT, filePath).replaceAll("\\", "/");
  const violations: Violation[] = [];
  const isPublicRoutePage = rel.startsWith("app/(public)/") && rel.endsWith("/page.tsx");
  const chromeFile = isChromeFile(filePath);

  for (const symbol of FORBIDDEN_PUBLIC_CHROME_IMPORTS) {
    if (new RegExp(`\\b${symbol}\\b`).test(source)) {
      violations.push({ file: rel, detail: `forbidden marketing chrome symbol: ${symbol}` });
    }
  }

  for (const fragment of FORBIDDEN_PUBLIC_IMPORT_PATHS) {
    if (rel.startsWith("components/layouts/public-")) continue;
    if (source.includes(fragment)) {
      violations.push({ file: rel, detail: `forbidden import path fragment: ${fragment}` });
    }
  }

  if (chromeFile) {
    for (const label of FORBIDDEN_PUBLIC_MARKETING_LABELS) {
      if (source.includes(label)) {
        violations.push({ file: rel, detail: `forbidden marketing label: "${label}"` });
      }
    }

    for (const href of FORBIDDEN_PUBLIC_ROUTE_HREFS) {
      if (source.includes(`"${href}"`) || source.includes(`'${href}'`) || source.includes(`\`${href}\``)) {
        violations.push({ file: rel, detail: `forbidden marketing route href: ${href}` });
      }
    }

    if (/\bhref=\{[^}]*\/login|href=["'`]\/login|withLocale\(["'`]\/login/.test(source)) {
      violations.push({ file: rel, detail: "login entry must not appear on public profile pages" });
    }
  }

  if (/\bPageShell\b/.test(source) && !source.includes("@deprecated")) {
    violations.push({ file: rel, detail: "PageShell must not appear in public profile graph" });
  }

  if (isPublicRoutePage && /\bBrandPortalShell\b|\bStudioPortalShell\b/.test(source)) {
    violations.push({ file: rel, detail: "portal shell must not appear on public route pages" });
  }

  return violations;
}

function assertPublicRouteGroupLayout() {
  const layoutPath = join(PUBLIC_ROUTE_DIR, "layout.tsx");
  const layout = readFileSync(layoutPath, "utf8");
  if (!layout.includes("PublicLayout")) {
    throw new Error("app/(public)/layout.tsx must wrap children in PublicLayout");
  }
}

function main() {
  console.log("Public layout verify");
  console.log(`Route prefixes: ${PUBLIC_ROUTE_PREFIXES.join(", ")}`);

  assertPublicRouteGroupLayout();

  const entryFiles = walk(PUBLIC_ROUTE_DIR);
  const allFiles = collectPublicUiSources(entryFiles);

  const violations: Violation[] = [];
  for (const file of allFiles) {
    const source = readFileSync(file, "utf8");
    violations.push(...scanSource(file, source));
  }

  const unique = new Map<string, Violation>();
  for (const item of violations) {
    unique.set(`${item.file}::${item.detail}`, item);
  }
  const deduped = [...unique.values()];

  if (deduped.length) {
    console.error(`\nPublic layout violations (${deduped.length}):`);
    for (const item of deduped) {
      console.error(`  - ${item.file}: ${item.detail}`);
    }
    process.exit(1);
  }

  console.log(
    `OK — scanned ${entryFiles.length} route files + ${allFiles.length - entryFiles.length} UI component imports`
  );
}

main();
