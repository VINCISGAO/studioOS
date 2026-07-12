export const BRAND_MY_ADS_SECTION_ID = "my-ads";
export const BRAND_PORTAL_MAIN_SELECTOR = "[data-brand-portal-main]";
export const BRAND_PORTAL_HEADER_SELECTOR = "[data-brand-portal-header]";

/** Fallback when sticky header cannot be measured. */
export const BRAND_MY_ADS_SCROLL_OFFSET_PX = 112;

const MY_ADS_SCROLL_DEDUPE_MS = 480;

let lastMyAdsScrollAt = 0;
let myAdsScrollFrame = 0;

export function isBrandDashboardPath(pathname: string) {
  return pathname === "/brand" || pathname.endsWith("/brand");
}

export function prefersInstantBrandMyAdsScroll() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(pointer: coarse)").matches ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function measureBrandPortalScrollOffset() {
  if (typeof window === "undefined") {
    return BRAND_MY_ADS_SCROLL_OFFSET_PX;
  }

  const header = document.querySelector(BRAND_PORTAL_HEADER_SELECTOR);
  if (header instanceof HTMLElement) {
    return Math.ceil(header.getBoundingClientRect().height) + 8;
  }

  return BRAND_MY_ADS_SCROLL_OFFSET_PX;
}

type ScrollRoot = HTMLElement | Window;

function resolveBrandScrollRoot(element: HTMLElement): ScrollRoot {
  const main = document.querySelector(BRAND_PORTAL_MAIN_SELECTOR);
  if (main instanceof HTMLElement) {
    return main;
  }

  let parent = element.parentElement;
  while (parent) {
    const style = window.getComputedStyle(parent);
    const overflowY = style.overflowY;
    if (
      (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") &&
      parent.scrollHeight > parent.clientHeight + 1
    ) {
      return parent;
    }
    parent = parent.parentElement;
  }

  return window;
}

function isMyAdsComfortablyVisible(element: HTMLElement, offsetPx: number) {
  const rect = element.getBoundingClientRect();
  return rect.top >= offsetPx - 12 && rect.top <= offsetPx + 56;
}

function scrollRootToElement(
  scrollRoot: ScrollRoot,
  element: HTMLElement,
  offsetPx: number,
  behavior: ScrollBehavior
) {
  if (scrollRoot instanceof Window) {
    const targetTop = window.scrollY + element.getBoundingClientRect().top - offsetPx;
    window.scrollTo({ top: Math.max(0, targetTop), behavior });
    return;
  }

  const parentRect = scrollRoot.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  const targetTop = scrollRoot.scrollTop + (elementRect.top - parentRect.top) - offsetPx;
  scrollRoot.scrollTo({ top: Math.max(0, targetTop), behavior });
}

export function scrollToBrandMyAds(options?: {
  behavior?: ScrollBehavior;
  force?: boolean;
  offsetPx?: number;
}) {
  if (typeof window === "undefined") {
    return false;
  }

  const element = document.getElementById(BRAND_MY_ADS_SECTION_ID);
  if (!element) {
    return false;
  }

  const behavior = options?.behavior ?? "auto";
  const offsetPx = options?.offsetPx ?? measureBrandPortalScrollOffset();
  const now = Date.now();
  const recentlyScrolled = now - lastMyAdsScrollAt < MY_ADS_SCROLL_DEDUPE_MS;
  const comfortablyVisible = isMyAdsComfortablyVisible(element, offsetPx);

  if (comfortablyVisible) {
    return false;
  }

  if (!options?.force && recentlyScrolled) {
    return false;
  }

  const scrollRoot = resolveBrandScrollRoot(element);
  scrollRootToElement(scrollRoot, element, offsetPx, behavior);
  lastMyAdsScrollAt = now;
  return true;
}

/** Coalesce duplicate my-ads scroll requests into one layout-stable pass. */
export function scheduleBrandMyAdsScroll(options?: {
  behavior?: ScrollBehavior;
  force?: boolean;
  offsetPx?: number;
}) {
  if (typeof window === "undefined") {
    return;
  }

  const frame = ++myAdsScrollFrame;
  const behavior = options?.behavior ?? "auto";

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (frame !== myAdsScrollFrame) return;
      scrollToBrandMyAds({ ...options, behavior, force: options?.force ?? true });
    });
  });
}

export function syncBrandMyAdsHashScroll() {
  if (typeof window === "undefined" || window.location.hash !== "#my-ads") {
    return;
  }

  scheduleBrandMyAdsScroll({ behavior: "auto", force: true });
}
