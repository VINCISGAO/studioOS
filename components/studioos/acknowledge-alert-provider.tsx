"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { AcknowledgeAlertDialog } from "@/components/studioos/acknowledge-alert-dialog";
import type { Locale } from "@/lib/i18n";

type AcknowledgeAlertOptions = {
  title?: string;
};

type AcknowledgeAlertContextValue = {
  alert: (message: string, options?: AcknowledgeAlertOptions) => void;
};

const AcknowledgeAlertContext = createContext<AcknowledgeAlertContextValue | null>(null);

const noopAlert = () => {};

export function AcknowledgeAlertProvider({
  locale,
  children
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const [state, setState] = useState<{ message: string; title?: string } | null>(null);

  const alert = useCallback((message: string, options?: AcknowledgeAlertOptions) => {
    const trimmed = message.trim();
    if (!trimmed) return;
    setState({ message: trimmed, title: options?.title });
  }, []);

  const value = useMemo(() => ({ alert }), [alert]);

  return (
    <AcknowledgeAlertContext.Provider value={value}>
      {children}
      <AcknowledgeAlertDialog
        locale={locale}
        open={Boolean(state)}
        message={state?.message ?? ""}
        title={state?.title}
        onClose={() => setState(null)}
      />
    </AcknowledgeAlertContext.Provider>
  );
}

export function useAcknowledgeAlert() {
  const context = useContext(AcknowledgeAlertContext);
  return context ?? { alert: noopAlert };
}
