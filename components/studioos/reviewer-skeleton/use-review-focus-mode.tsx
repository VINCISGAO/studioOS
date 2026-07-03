"use client";

import { createContext, Suspense, useCallback, useContext, useMemo, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  buildReviewFocusSearch,
  buildReviewFocusThemeSearch,
  getReviewFocusTheme,
  isReviewFocusModeActive,
  isReviewPortalWorkspaceRoute,
  type ReviewFocusTheme
} from "@/lib/studioos/portal-focus-mode";

type ReviewFocusModeContextValue = {
  isReviewWorkspace: boolean;
  isFocusMode: boolean;
  focusTheme: ReviewFocusTheme;
  exitFocusMode: () => void;
  enterFocusMode: () => void;
  setFocusTheme: (theme: ReviewFocusTheme) => void;
};

const ReviewFocusModeContext = createContext<ReviewFocusModeContextValue | null>(null);

function normalizeSearchFallback(searchFallback: string) {
  return searchFallback.startsWith("?") ? searchFallback.slice(1) : searchFallback;
}

function ReviewFocusModeProviderContent({
  search,
  children
}: {
  search: string;
  children: ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const isReviewWorkspace = isReviewPortalWorkspaceRoute(pathname);
  const isFocusMode = isReviewWorkspace && isReviewFocusModeActive(search);
  const focusTheme = isFocusMode ? getReviewFocusTheme(search) : "light";

  const exitFocusMode = useCallback(() => {
    router.push(`${pathname}${buildReviewFocusSearch(search, false)}`);
  }, [pathname, router, search]);

  const enterFocusMode = useCallback(() => {
    router.push(`${pathname}${buildReviewFocusSearch(search, true)}`);
  }, [pathname, router, search]);

  const setFocusTheme = useCallback(
    (theme: ReviewFocusTheme) => {
      if (!isFocusMode) return;
      router.push(`${pathname}${buildReviewFocusThemeSearch(search, theme)}`);
    },
    [isFocusMode, pathname, router, search]
  );

  const value = useMemo(
    () => ({
      isReviewWorkspace,
      isFocusMode,
      focusTheme,
      exitFocusMode,
      enterFocusMode,
      setFocusTheme
    }),
    [enterFocusMode, exitFocusMode, focusTheme, isFocusMode, isReviewWorkspace, setFocusTheme]
  );

  return <ReviewFocusModeContext.Provider value={value}>{children}</ReviewFocusModeContext.Provider>;
}

function ReviewFocusModeProviderWithSearch({
  searchFallback,
  children
}: {
  searchFallback: string;
  children: ReactNode;
}) {
  const searchParams = useSearchParams();
  const search = searchParams.toString() || normalizeSearchFallback(searchFallback);
  return <ReviewFocusModeProviderContent search={search}>{children}</ReviewFocusModeProviderContent>;
}

export function ReviewFocusModeProvider({
  searchFallback = "",
  children
}: {
  searchFallback?: string;
  children: ReactNode;
}) {
  const fallbackSearch = normalizeSearchFallback(searchFallback);

  return (
    <Suspense
      fallback={
        <ReviewFocusModeProviderContent search={fallbackSearch}>{children}</ReviewFocusModeProviderContent>
      }
    >
      <ReviewFocusModeProviderWithSearch searchFallback={searchFallback}>
        {children}
      </ReviewFocusModeProviderWithSearch>
    </Suspense>
  );
}

function useReviewFocusModeContext() {
  const context = useContext(ReviewFocusModeContext);
  if (!context) {
    throw new Error("Review focus mode hooks must be used within ReviewFocusModeProvider");
  }
  return context;
}

export function useReviewFocusMode() {
  return useReviewFocusModeContext();
}

export function usePortalReviewFocus(_searchFallback = "") {
  const { isReviewWorkspace, isFocusMode } = useReviewFocusModeContext();
  return { isReviewWorkspace, isFocusMode };
}
