export const BRAND_MY_ADS_SECTION_ID = "my-ads";

/** Brand sticky header + tablet/mobile nav — keep section title below chrome. */
export const BRAND_MY_ADS_SCROLL_OFFSET_PX = 112;

function getScrollParent(element: HTMLElement): HTMLElement | null {
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
  return null;
}

function isMyAdsComfortablyVisible(element: HTMLElement, offsetPx: number) {
  const rect = element.getBoundingClientRect();
  return rect.top >= offsetPx - 12 && rect.top <= offsetPx + 56;
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

  const behavior = options?.behavior ?? "smooth";
  const offsetPx = options?.offsetPx ?? BRAND_MY_ADS_SCROLL_OFFSET_PX;

  if (!options?.force && isMyAdsComfortablyVisible(element, offsetPx)) {
    return false;
  }

  const scrollParent = getScrollParent(element);
  if (scrollParent) {
    const parentRect = scrollParent.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    const targetTop = scrollParent.scrollTop + (elementRect.top - parentRect.top) - offsetPx;
    scrollParent.scrollTo({ top: Math.max(0, targetTop), behavior });
    return true;
  }

  const targetTop = window.scrollY + element.getBoundingClientRect().top - offsetPx;
  window.scrollTo({ top: Math.max(0, targetTop), behavior });
  return true;
}
