export const BRAND_WIZARD_SCROLL_ROOT_ID = "brand-wizard-scroll-panel";

export const BRIEF_FIELD_TARGETS = {
  projectTitle: "brief-field-project-title",
  adOneLiner: "brief-field-ad-one-liner",
  productDescription: "brief-field-product-description",
  productImage: "brief-field-product-image",
  aspectRatio: "brief-field-aspect-ratio",
  videoDuration: "brief-field-video-duration",
  resolution: "brief-field-resolution",
  budget: "brief-field-budget",
  scheduleStart: "brief-field-schedule-start",
  scheduleDelivery: "brief-field-schedule-delivery"
} as const;

const BRIEF_SCROLL_OFFSET_PX = 112;
const BRIEF_FIELD_HIGHLIGHT_CLASSES = ["ring-2", "ring-red-300", "ring-offset-2", "transition-shadow"] as const;

function prefersInstantBriefScroll() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(pointer: coarse)").matches ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function resolveBriefScrollRoot(element: HTMLElement): HTMLElement | Window {
  const panel = document.getElementById(BRAND_WIZARD_SCROLL_ROOT_ID);
  if (panel instanceof HTMLElement && panel.scrollHeight > panel.clientHeight + 1) {
    return panel;
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

function scrollRootToElement(
  scrollRoot: HTMLElement | Window,
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

function pulseBriefFieldHighlight(element: HTMLElement) {
  element.classList.remove(...BRIEF_FIELD_HIGHLIGHT_CLASSES);
  void element.offsetWidth;
  element.classList.add(...BRIEF_FIELD_HIGHLIGHT_CLASSES);
  window.setTimeout(() => {
    element.classList.remove(...BRIEF_FIELD_HIGHLIGHT_CLASSES);
  }, 2400);
}

export function scrollToBriefField(targetId: string) {
  if (typeof window === "undefined") return false;

  const element = document.getElementById(targetId);
  if (!element) return false;

  const behavior = prefersInstantBriefScroll() ? "auto" : "smooth";
  const scrollRoot = resolveBriefScrollRoot(element);
  scrollRootToElement(scrollRoot, element, BRIEF_SCROLL_OFFSET_PX, behavior);

  window.requestAnimationFrame(() => {
    pulseBriefFieldHighlight(element);
    const focusable = element.querySelector<HTMLElement>(
      "input:not([type='hidden']):not([disabled]), textarea:not([disabled]), button:not([disabled]), select:not([disabled]), [contenteditable='true']"
    );
    focusable?.focus({ preventScroll: true });
  });

  return true;
}
