import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "fs";
import path from "path";
import sharp from "sharp";
import toIco from "to-ico";

const root = process.cwd();
const publicDir = path.join(root, "public");
const brandDir = path.join(publicDir, "brand");

const SOURCE_CANDIDATES = [
  path.join(publicDir, "images/bimi.svg"),
  path.join(publicDir, "images/LOGO.png"),
  path.join(publicDir, "logo.png")
];

function resolveSource() {
  for (const candidate of SOURCE_CANDIDATES) {
    if (existsSync(candidate)) return candidate;
  }
  throw new Error("[generate-favicon-assets] missing favicon source asset");
}

async function renderSquarePng(source, size) {
  return sharp(source, { density: 512 })
    .resize(size, size, { fit: "contain", background: { r: 5, g: 5, b: 5, alpha: 1 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function main() {
  const source = resolveSource();
  mkdirSync(brandDir, { recursive: true });

  const pngTargets = [
    { file: "favicon-48x48.png", size: 48 },
    { file: "favicon-96x96.png", size: 96 },
    { file: "favicon-192x192.png", size: 192 },
    { file: "favicon-512x512.png", size: 512 },
    { file: "apple-touch-icon.png", size: 180 }
  ];

  for (const target of pngTargets) {
    const output = path.join(publicDir, target.file);
    const buffer = await renderSquarePng(source, target.size);
    writeFileSync(output, buffer);
    console.log(`[generate-favicon-assets] ${target.file} (${target.size}x${target.size})`);
  }

  const brandLogoPath = path.join(brandDir, "vincis-logo-512.png");
  const brandLogoBuffer = await renderSquarePng(source, 512);
  writeFileSync(brandLogoPath, brandLogoBuffer);
  console.log("[generate-favicon-assets] brand/vincis-logo-512.png");

  const legacyLogoPath = path.join(publicDir, "logo.png");
  writeFileSync(legacyLogoPath, brandLogoBuffer);
  console.log("[generate-favicon-assets] logo.png (Organization schema fallback)");

  const icoSizes = [16, 32, 48];
  const icoBuffers = await Promise.all(icoSizes.map((size) => renderSquarePng(source, size)));
  writeFileSync(path.join(publicDir, "favicon.ico"), await toIco(icoBuffers));
  console.log("[generate-favicon-assets] favicon.ico");

  if (existsSync(source) && source.endsWith(".svg")) {
    const svgDest = path.join(brandDir, "vincis-mark.svg");
    if (source !== svgDest) {
      copyFileSync(source, svgDest);
      console.log("[generate-favicon-assets] brand/vincis-mark.svg");
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
