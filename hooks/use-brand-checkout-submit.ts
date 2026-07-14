"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const CHECKOUT_SUBMIT_TIMEOUT_MS = 90_000;

export function useBrandCheckoutSubmit(paymentSignal?: string | null) {
  const [pending, setPending] = useState(false);
  const submittingRef = useRef(false);

  const clearPending = useCallback(() => {
    submittingRef.current = false;
    setPending(false);
  }, []);

  useEffect(() => {
    if (paymentSignal) {
      clearPending();
    }
  }, [paymentSignal, clearPending]);

  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        clearPending();
      }
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [clearPending]);

  useEffect(() => {
    if (!pending) return;
    const timer = window.setTimeout(clearPending, CHECKOUT_SUBMIT_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [pending, clearPending]);

  const onSubmit = useCallback(() => {
    if (submittingRef.current) return false;
    submittingRef.current = true;
    setPending(true);
    return true;
  }, []);

  return { pending, onSubmit, clearPending };
}
