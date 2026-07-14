"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import {
  buildKnowledgeArticlePath,
  knowledgePathPrefixForCode
} from "@/features/knowledge-center/knowledge-center.constants";
import type { KnowledgeArticleListItemDto } from "@/features/knowledge-center/knowledge-center.types";
import { knowledgeCenterHomeCopy } from "@/lib/knowledge/knowledge-center-home-copy";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n";

type KnowledgeCenterSearchTriggerProps = {
  locale: Locale;
  languageCode: string;
};

export function KnowledgeCenterSearchTrigger({
  locale,
  languageCode
}: KnowledgeCenterSearchTriggerProps) {
  const copy = knowledgeCenterHomeCopy(locale);
  const pathPrefix = knowledgePathPrefixForCode(languageCode);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<KnowledgeArticleListItemDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const runSearch = useCallback(
    async (value: string) => {
      const q = value.trim();
      if (!q) {
        setResults([]);
        setOpen(false);
        return;
      }
      setLoading(true);
      try {
        const response = await fetch(
          `/api/v1/knowledge/search?q=${encodeURIComponent(q)}&language=${encodeURIComponent(languageCode)}`
        );
        const payload = (await response.json()) as {
          success?: boolean;
          data?: { results: KnowledgeArticleListItemDto[] };
        };
        setResults(payload.data?.results ?? []);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    },
    [languageCode]
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-3xl">
      <div className="flex overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm sm:rounded-2xl">
        <input
          ref={inputRef}
          id="knowledge-center-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void runSearch(query);
          }}
          placeholder={copy.searchPlaceholder}
          className="h-11 flex-1 bg-transparent px-3 text-sm text-zinc-950 outline-none placeholder:text-zinc-400 sm:h-12 sm:px-4 sm:text-base"
        />
        <button
          type="button"
          onClick={() => void runSearch(query)}
          className="m-1 inline-flex h-9 items-center gap-1.5 rounded-lg bg-violet-600 px-3 text-xs font-semibold text-white transition hover:bg-violet-700 sm:m-1.5 sm:h-10 sm:gap-2 sm:rounded-xl sm:px-4 sm:text-sm"
        >
          <Search className="h-4 w-4" />
          {copy.searchButton}
        </button>
      </div>

      {open && results.length ? (
        <div className="absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl">
          {results.map((item) => (
            <Link
              key={item.id}
              href={buildKnowledgeArticlePath(pathPrefix, item.slug)}
              onClick={() => setOpen(false)}
              className="block border-b border-zinc-100 px-4 py-3 text-sm transition last:border-b-0 hover:bg-zinc-50"
            >
              <p className="font-medium text-zinc-950">{item.title}</p>
              <p className="mt-0.5 text-zinc-500">{item.category}</p>
            </Link>
          ))}
        </div>
      ) : null}

      {loading ? <p className="absolute right-4 top-4 text-xs text-zinc-400">…</p> : null}

      <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 sm:mt-4 sm:gap-2">
        <span className="text-[10px] text-zinc-400 sm:text-xs">{copy.hotKeywordsLabel}</span>
        {copy.hotKeywords.map((keyword) => (
          <button
            key={keyword}
            type="button"
            onClick={() => {
              setQuery(keyword);
              void runSearch(keyword);
            }}
            className={cn(
              "rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-medium text-zinc-600 transition hover:border-violet-200 hover:text-violet-700 sm:px-2.5 sm:py-1 sm:text-xs"
            )}
          >
            {keyword}
          </button>
        ))}
      </div>
    </div>
  );
}
