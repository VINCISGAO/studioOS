"use client";

import { useEffect, useState } from "react";
import { AcknowledgeAlertProvider } from "@/components/studioos/acknowledge-alert-provider";
import { AdminPortalHeader } from "@/components/studioos/admin-portal-header";
import { AdminPortalSidebar } from "@/components/studioos/admin-portal-sidebar";
import { PortalContentColumn } from "@/components/studioos/portal/portal-content-column";
import { PortalViewportShell } from "@/components/studioos/portal/portal-viewport-shell";
import { PORTAL_MAIN_SAFE_BOTTOM } from "@/lib/studioos/portal-layout-tokens";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function AdminPortalShell({
  locale,
  pathname,
  failedNotificationCount = 0,
  adminAccount,
  children
}: {
  locale: Locale;
  pathname: string;
  search?: string;
  failedNotificationCount?: number;
  adminAccount: { name: string; email: string; initials: string };
  children: React.ReactNode;
}) {
  return (
    <AcknowledgeAlertProvider locale={locale}>
      <PortalViewportShell mode="flow">
        <div className="flex min-h-0 flex-1">
          <AdminPortalSidebar locale={locale} pathname={pathname} adminAccount={adminAccount} />
          <PortalContentColumn>
            <AdminPortalHeader
              locale={locale}
              pathname={pathname}
              failedNotificationCount={failedNotificationCount}
            />
            <main className={cn("min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8", PORTAL_MAIN_SAFE_BOTTOM)}>
              {children}
            </main>
          </PortalContentColumn>
        </div>
      </PortalViewportShell>
    </AcknowledgeAlertProvider>
  );
}
