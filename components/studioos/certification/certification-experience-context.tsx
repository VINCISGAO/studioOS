"use client";

import { createContext, useContext } from "react";
import type { CreatorPortalNavKey } from "@/lib/studioos/creator-portal-nav";

export type CertificationExperiencePhase =
  | "idle"
  | "dim"
  | "glow"
  | "modal"
  | "unlocking"
  | "complete";

type CertificationExperienceContextValue = {
  phase: CertificationExperiencePhase;
  unlockedNavKeys: Set<CreatorPortalNavKey>;
  isAnimating: boolean;
};

const CertificationExperienceContext = createContext<CertificationExperienceContextValue>({
  phase: "idle",
  unlockedNavKeys: new Set(),
  isAnimating: false
});

export function CertificationExperienceProvider({
  value,
  children
}: {
  value: CertificationExperienceContextValue;
  children: React.ReactNode;
}) {
  return (
    <CertificationExperienceContext.Provider value={value}>{children}</CertificationExperienceContext.Provider>
  );
}

export function useCertificationExperience() {
  return useContext(CertificationExperienceContext);
}
