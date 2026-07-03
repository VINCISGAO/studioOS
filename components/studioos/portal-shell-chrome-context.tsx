"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { CreatorNotification } from "@/lib/notification-types";

export type PortalShellChromeValue = {
  initials: string;
  userName?: string;
  profileHref: string;
  roleLabel: string;
  unreadMessageCount: number;
  messagesHref?: string;
  notifications?: CreatorNotification[];
  showNotificationBell?: boolean;
};

const PortalShellChromeContext = createContext<PortalShellChromeValue | null>(null);

export function PortalShellChromeProvider({
  value,
  children
}: {
  value: PortalShellChromeValue;
  children: ReactNode;
}) {
  return <PortalShellChromeContext.Provider value={value}>{children}</PortalShellChromeContext.Provider>;
}

export function usePortalShellChrome() {
  return useContext(PortalShellChromeContext);
}
