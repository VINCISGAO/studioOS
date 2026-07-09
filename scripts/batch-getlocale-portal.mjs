import fs from "node:fs";
import path from "node:path";
import { globSync } from "node:glob";

const roots = ["app/brand", "app/studio", "app/admin", "app/workspace", "app/dashboard", "app/creator"];
const files = roots.flatMap((root) =>
  globSync(`${root}/**/*.{ts,tsx}`, { cwd: process.cwd(), absolute: true })
);

const replacements = [
  ["const locale = getLocale(await searchParams);", "const locale = await getAppUiLocale();"],
  ["const locale = getLocale(params);", "const locale = await getAppUiLocale();"],
  ["const locale = getLocale(query);", "const locale = await getAppUiLocale();"],
  [
    'const locale = getLocale({ lang: new URLSearchParams(search).get("lang") ?? undefined });',
    "const locale = await getAppUiLocale();"
  ]
];

const changed = [];

for (const file of files.sort()) {
  let content = fs.readFileSync(file, "utf8");
  if (!content.includes("getLocale(")) continue;

  const original = content;
  for (const [from, to] of replacements) {
    content = content.split(from).join(to);
  }

  if (content.includes("getAppUiLocale") && !content.includes('from "@/lib/app-language"')) {
    content = `import { getAppUiLocale } from "@/lib/app-language";\n${content}`;
  }

  content = content.replace(/import \{ getLocale, /g, "import { ");
  content = content.replace(/, getLocale/g, "");
  content = content.replace(/getLocale, /g, "");

  if (/\bgetLocale\b/.test(content)) continue;
  if (content === original) continue;

  fs.writeFileSync(file, content);
  changed.push(path.relative(process.cwd(), file));
}

console.log(`Updated ${changed.length} files`);
for (const file of changed) console.log(file);
