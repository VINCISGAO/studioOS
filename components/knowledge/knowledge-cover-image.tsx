"use client";

import { resolveKnowledgeCoverSources } from "@/lib/knowledge/knowledge-cover-process.shared";

export function KnowledgeCoverImage({
  coverUrl,
  fallbackUrl,
  alt,
  className
}: {
  coverUrl: string;
  fallbackUrl?: string | null;
  alt: string;
  className?: string;
}) {
  const resolved = resolveKnowledgeCoverSources(coverUrl);
  const fallback = fallbackUrl ?? resolved?.fallback ?? coverUrl;
  if (!resolved?.sources.length) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={coverUrl} alt={alt} className={className} loading="lazy" />
    );
  }

  return (
    <picture>
      {resolved.sources.map((source) => (
        <source key={source.type} srcSet={source.url} type={source.type} />
      ))}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={fallback} alt={alt} className={className} loading="lazy" />
    </picture>
  );
}
