"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { pollDepositStatusAction } from "@/app/deposit-actions";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import {
  DEPOSIT_POLL_INTERVAL_MS,
  DEPOSIT_POLL_MAX_ATTEMPTS,
  DEPOSIT_POLL_TIMEOUT_MS
} from "@/lib/studioos/deposit-polling.constants";

export type DepositPollPhase = "idle" | "polling" | "succeeded" | "failed";

export function useDepositStatusPolling(input: {
  locale: Locale;
  enabled: boolean;
  successPath?: string;
}) {
  const router = useRouter();
  const [elapsedSec, setElapsedSec] = useState(0);
  const [pollError, setPollError] = useState<string | null>(null);
  const [phase, setPhase] = useState<DepositPollPhase>("idle");
  const attemptsRef = useRef(0);
  const startedAtRef = useRef(0);
  const stoppedRef = useRef(false);

  useEffect(() => {
    if (!input.enabled) {
      stoppedRef.current = true;
      setPhase("idle");
      setPollError(null);
      setElapsedSec(0);
      return;
    }

    let cancelled = false;
    let pollTimer: number | undefined;
    let tickTimer: number | undefined;
    attemptsRef.current = 0;
    startedAtRef.current = Date.now();
    stoppedRef.current = false;
    setPhase("polling");
    setPollError(null);
    setElapsedSec(0);

    const stop = (nextPhase: DepositPollPhase, message?: string) => {
      if (cancelled || stoppedRef.current) return;
      stoppedRef.current = true;
      setPhase(nextPhase);
      if (message) setPollError(message);
    };

    const scheduleNext = () => {
      if (cancelled || stoppedRef.current) return;
      pollTimer = window.setTimeout(() => {
        void pollOnce();
      }, DEPOSIT_POLL_INTERVAL_MS);
    };

    async function pollOnce() {
      if (cancelled || stoppedRef.current) return;

      if (document.hidden) {
        scheduleNext();
        return;
      }

      attemptsRef.current += 1;
      const elapsedMs = Date.now() - startedAtRef.current;
      if (attemptsRef.current > DEPOSIT_POLL_MAX_ATTEMPTS || elapsedMs >= DEPOSIT_POLL_TIMEOUT_MS) {
        stop(
          "failed",
          input.locale === "zh"
            ? "确认超时，请刷新页面或联系客服。"
            : "Confirmation timed out. Refresh the page or contact support."
        );
        return;
      }

      try {
        const result = await pollDepositStatusAction();
        if (cancelled || stoppedRef.current) return;
        if (!result.ok) {
          scheduleNext();
          return;
        }
        setPollError(null);
        if (result.can_accept_orders) {
          stop("succeeded");
          router.replace(withLocale(input.successPath ?? "/studio", input.locale));
          return;
        }
      } catch {
        if (cancelled || stoppedRef.current) return;
        setPollError(
          input.locale === "zh" ? "状态刷新失败，正在重试…" : "Could not refresh status. Retrying…"
        );
      }

      scheduleNext();
    }

    tickTimer = window.setInterval(() => {
      if (!cancelled) {
        setElapsedSec(Math.floor((Date.now() - startedAtRef.current) / 1000));
      }
    }, 1000);

    const onVisibility = () => {
      if (!document.hidden && !cancelled && !stoppedRef.current) {
        void pollOnce();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    void pollOnce();

    return () => {
      cancelled = true;
      if (pollTimer) window.clearTimeout(pollTimer);
      if (tickTimer) window.clearInterval(tickTimer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [input.enabled, input.locale, input.successPath, router]);

  return { elapsedSec, pollError, phase, isPolling: phase === "polling" };
}
