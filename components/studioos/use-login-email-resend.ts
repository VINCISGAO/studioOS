"use client";

import { useCallback, useEffect, useState } from "react";
import { loginEmailStartAction } from "@/app/actions";
import type { Locale } from "@/lib/i18n";

const RESEND_COOLDOWN_MS = 60_000;

type ResendResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

export function useLoginEmailResend(locale: Locale) {
  const [cooldownEndsAt, setCooldownEndsAt] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!cooldownEndsAt) {
      setSecondsLeft(0);
      return;
    }

    const tick = () => {
      const left = Math.max(0, Math.ceil((cooldownEndsAt - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0) {
        setCooldownEndsAt(0);
      }
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [cooldownEndsAt]);

  const markSent = useCallback(() => {
    setCooldownEndsAt(Date.now() + RESEND_COOLDOWN_MS);
  }, []);

  const resend = useCallback(
    async (email: string): Promise<ResendResult> => {
      if (secondsLeft > 0 || resending) {
        return {
          ok: false,
          error:
            locale === "zh"
              ? `请 ${secondsLeft} 秒后再试。`
              : `Please wait ${secondsLeft}s before resending.`
        };
      }

      setResending(true);
      try {
        const formData = new FormData();
        formData.set("email", email);
        formData.set("lang", locale);
        const data = await loginEmailStartAction(formData);
        if (!data?.ok) {
          return {
            ok: false,
            error:
              data?.error ??
              (locale === "zh" ? "请求过于频繁，请稍后再试。" : "Too many requests. Try again later.")
          };
        }
        markSent();
        return {
          ok: true,
          message:
            data.message ??
            (locale === "zh" ? "验证码已重新发送。" : "Verification code resent.")
        };
      } catch {
        return {
          ok: false,
          error: locale === "zh" ? "网络错误，请稍后重试。" : "Network error. Please try again."
        };
      } finally {
        setResending(false);
      }
    },
    [locale, markSent, resending, secondsLeft]
  );

  return {
    resend,
    resending,
    secondsLeft,
    canResend: secondsLeft === 0 && !resending,
    markSent
  };
}
