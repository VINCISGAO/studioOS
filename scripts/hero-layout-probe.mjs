/**
 * Compare homepage hero computed layout values (Chromium baseline).
 * Run: npm run marketing:hero-layout-probe
 * Safari: paste the same selectors in Web Inspector and diff against output.
 */
import { chromium } from "@playwright/test";

const URL = process.env.HERO_PROBE_URL ?? "http://127.0.0.1:3000/?lang=zh-CN";
const WIDTH = Number(process.env.HERO_PROBE_WIDTH ?? "1440");
const HEIGHT = Number(process.env.HERO_PROBE_HEIGHT ?? "900");

async function readMetrics(page) {
  return page.evaluate(() => {
    const html = document.documentElement;
    const shell = document.querySelector(".marketing-hero-shell");
    const frame = document.querySelector(".marketing-hero-frame");
    const headline = document.querySelector(".marketing-hero-top h1");
    const bottom = document.querySelector(".marketing-hero-bottom");
    const backdrop = document.querySelector(".marketing-hero-backdrop");

    const cs = (el) => (el ? getComputedStyle(el) : null);

    const shellStyle = cs(shell);
    const frameStyle = cs(frame);
    const headlineStyle = cs(headline);
    const bottomStyle = cs(bottom);
    const backdropStyle = cs(backdrop);

    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      devicePixelRatio: window.devicePixelRatio,
      htmlFontSize: cs(html)?.fontSize ?? null,
      shell: shell
        ? {
            height: shellStyle?.height,
            minHeight: shellStyle?.minHeight,
            width: shellStyle?.width,
            overflow: shellStyle?.overflow,
            overflowX: shellStyle?.overflowX,
            transform: shellStyle?.transform,
            zoom: shellStyle?.zoom ?? "1"
          }
        : null,
      frame: frame
        ? {
            width: frameStyle?.width,
            minHeight: frameStyle?.minHeight,
            display: frameStyle?.display,
            gridTemplateRows: frameStyle?.gridTemplateRows
          }
        : null,
      headline: headline
        ? {
            fontSize: headlineStyle?.fontSize,
            lineHeight: headlineStyle?.lineHeight,
            fontFamily: headlineStyle?.fontFamily,
            transform: headlineStyle?.transform
          }
        : null,
      bottom: bottom
        ? {
            offsetTop: bottom.getBoundingClientRect().top,
            transform: bottomStyle?.transform
          }
        : null,
      backdrop: backdrop
        ? {
            backgroundSize: backdropStyle?.backgroundSize,
            backgroundPosition: backdropStyle?.backgroundPosition,
            backgroundPositionX: backdropStyle?.backgroundPositionX,
            backgroundPositionY: backdropStyle?.backgroundPositionY
          }
        : null
    };
  });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1
  });
  const page = await context.newPage();

  try {
    await page.goto(URL, { waitUntil: "networkidle", timeout: 120_000 });
    await page.waitForSelector(".marketing-hero-shell", { timeout: 30_000 });
    const metrics = await readMetrics(page);
    console.log(JSON.stringify({ url: URL, width: WIDTH, height: HEIGHT, metrics }, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
