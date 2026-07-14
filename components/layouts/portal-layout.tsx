import type { ReactNode } from "react";

type PortalLayoutProps = {
  children: ReactNode;
};

/**
 * Portal Layout marker — authenticated brand / studio / admin shells
 * are applied in `app/brand/layout.tsx`, `app/studio/layout.tsx`, etc.
 */
export function PortalLayout({ children }: PortalLayoutProps) {
  return (
    <div className="min-h-dvh" data-layout="portal">
      {children}
    </div>
  );
}
