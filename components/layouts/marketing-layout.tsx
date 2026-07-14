import type { ReactNode } from "react";

type MarketingLayoutProps = {
  children: ReactNode;
};

/**
 * Marketing Layout marker — homepage and docs pages bring their own
 * CinematicNav / MarketingDocsShell chrome at the page level.
 */
export function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <div className="min-h-dvh" data-layout="marketing">
      {children}
    </div>
  );
}
