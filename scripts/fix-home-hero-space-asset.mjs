import { copyFileSync, existsSync, mkdirSync } from "fs";
import path from "path";

const root = process.cwd();
const ownerCandidates = [
  path.join(root, "public/images/home-hero-space.png"),
  path.join(
    process.env.HOME ?? "",
    ".cursor/projects/Users-linkele-Projects-studioOS/assets/home-hero-space-b358d22e-0b93-4110-9671-23c8569b0d7f-cdf7b294-846b-4572-92c4-25c37ccecdbf.png"
  )
];

const destPublic = path.join(root, "public/images/home-hero-space.png");
const destBundled = path.join(root, "assets/marketing/home-hero-space.png");
const destPublic2x = path.join(root, "public/images/home-hero-space@2x.png");
const destBundled2x = path.join(root, "assets/marketing/home-hero-space@2x.png");

const source = ownerCandidates.find((candidate) => existsSync(candidate));
if (!source) {
  console.error("[fix-home-hero-space-asset] owner hero image not found");
  process.exit(1);
}

mkdirSync(path.dirname(destPublic), { recursive: true });
mkdirSync(path.dirname(destBundled), { recursive: true });

copyFileSync(source, destPublic);
copyFileSync(source, destBundled);
copyFileSync(source, destPublic2x);
copyFileSync(source, destBundled2x);

console.log(`[fix-home-hero-space-asset] synced owner hero from ${source}`);
