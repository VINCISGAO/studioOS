"use client";

import type { CSSProperties } from "react";

export function CinematicHeroBackdrop({
  src,
  src2x
}: {
  src: string;
  src2x?: string;
}) {
  const style = {
    "--hero-bg": `url("${src}")`,
    ...(src2x ? { "--hero-bg-2x": `url("${src2x}")` } : {})
  } as CSSProperties;

  return (
    <div
      aria-hidden
      className="marketing-hero-backdrop pointer-events-none absolute inset-0 z-0 bg-white"
      style={style}
    />
  );
}
