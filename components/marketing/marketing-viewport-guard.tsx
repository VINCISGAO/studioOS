"use client";

import { useEffect } from "react";

type MarketingViewportGuardProps = {
  /** Page backdrop — prevents cream body flash during iOS rubber-band. */
  backdrop?: "dark" | "light";
};

export function MarketingViewportGuard({ backdrop = "dark" }: MarketingViewportGuardProps) {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverscroll = html.style.overscrollBehavior;
    const prevBodyOverscroll = body.style.overscrollBehavior;
    const prevBodyBg = body.style.backgroundColor;

    html.style.overscrollBehavior = "none";
    body.style.overscrollBehavior = "none";
    body.style.backgroundColor = backdrop === "dark" ? "#000000" : "#fafaf8";

    return () => {
      html.style.overscrollBehavior = prevHtmlOverscroll;
      body.style.overscrollBehavior = prevBodyOverscroll;
      body.style.backgroundColor = prevBodyBg;
    };
  }, [backdrop]);

  return null;
}
