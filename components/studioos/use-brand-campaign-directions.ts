"use client";

import { useEffect, useRef, useState } from "react";
import {
  pollBrandCreativeDirectionsAction,
  startBrandCreativeDirectionsAction
} from "@/app/brand-campaign-actions";
import type { CreativeDirection } from "@/features/ai/creative-direction.types";
import type { Locale } from "@/lib/i18n";
import {
  appendWizardBriefSnapshot,
  type WizardBriefSnapshot
} from "@/lib/studioos/brand-wizard-brief-snapshot";

export type SchemeMediaPhase = "text" | "images";

export type DirectionsLoadStatus = "loading" | "ready" | "error";

const POLL_MS = 600;
const MAX_POLL_ATTEMPTS = 150;
const POLL_TIMEOUT_MS = 90_000;
const IMAGE_PHASE_DELAY_MS = 450;

function buildStartFormData(
  locale: Locale,
  projectId: string,
  options: { wizardFastPath?: boolean; briefSnapshot?: WizardBriefSnapshot | null }
) {
  const fd = new FormData();
  fd.set("lang", locale);
  fd.set("project_id", projectId);
  if (options.wizardFastPath) {
    fd.set("wizard_fast_path", "1");
  }
  if (options.briefSnapshot) {
    appendWizardBriefSnapshot(fd, options.briefSnapshot);
  }
  return fd;
}

export function useBrandCampaignDirections(
  locale: Locale,
  projectId: string,
  options?: {
    enabled?: boolean;
    briefSnapshot?: WizardBriefSnapshot | null;
    wizardFastPath?: boolean;
    textOnly?: boolean;
  }
) {
  const enabled = options?.enabled ?? true;
  const wizardFastPath = options?.wizardFastPath ?? true;
  const textOnly = options?.textOnly ?? wizardFastPath;

  const [directions, setDirections] = useState<CreativeDirection[]>([]);
  const [status, setStatus] = useState<DirectionsLoadStatus>("loading");
  const [mediaPhase, setMediaPhase] = useState<SchemeMediaPhase>("text");
  const [error, setError] = useState<string | null>(null);

  const loadCompletedRef = useRef(false);
  const startedRef = useRef(false);
  const jobIdRef = useRef<string | null>(null);
  const snapshotRef = useRef(options?.briefSnapshot ?? null);

  useEffect(() => {
    snapshotRef.current = options?.briefSnapshot ?? null;
  }, [options?.briefSnapshot]);

  useEffect(() => {
    if (!enabled || loadCompletedRef.current) return;

    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout> | undefined;
    let pollAttempts = 0;
    const pollStartedAt = Date.now();

    function failPoll(message: string) {
      setError(message);
      setStatus("error");
      startedRef.current = false;
      jobIdRef.current = null;
    }

    async function poll(jobId: string) {
      if (cancelled) return;

      pollAttempts += 1;
      const elapsedMs = Date.now() - pollStartedAt;
      if (pollAttempts > MAX_POLL_ATTEMPTS || elapsedMs >= POLL_TIMEOUT_MS) {
        failPoll(
          locale === "zh"
            ? "AI 方案生成超时，请稍后重试。"
            : "AI direction generation timed out. Please try again."
        );
        return;
      }
      const fd = new FormData();
      fd.set("lang", locale);
      fd.set("project_id", projectId);
      fd.set("job_id", jobId);
      if (wizardFastPath) {
        fd.set("wizard_fast_path", "1");
      }

      const result = await pollBrandCreativeDirectionsAction(fd);
      if (cancelled) return;

      if (!result.ok) {
        failPoll(result.error);
        return;
      }

      if (result.status === "ready") {
        setDirections(result.directions);
        setStatus("ready");
        loadCompletedRef.current = true;
        return;
      }

      pollTimer = setTimeout(() => {
        void poll(jobId);
      }, POLL_MS);
    }

    async function start() {
      if (startedRef.current && jobIdRef.current) {
        await poll(jobIdRef.current);
        return;
      }

      startedRef.current = true;
      if (!loadCompletedRef.current) {
        setStatus("loading");
        setError(null);
      }

      const fd = buildStartFormData(locale, projectId, {
        wizardFastPath,
        briefSnapshot: snapshotRef.current
      });

      const result = await startBrandCreativeDirectionsAction(fd);
      if (cancelled) return;

      if (!result.ok) {
        setError(result.error);
        setStatus("error");
        startedRef.current = false;
        return;
      }

      if (result.status === "ready") {
        setDirections(result.directions);
        setStatus("ready");
        loadCompletedRef.current = true;
        return;
      }

      jobIdRef.current = result.jobId;
      await poll(result.jobId);
    }

    void start();

    return () => {
      cancelled = true;
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, [enabled, locale, projectId, wizardFastPath]);

  useEffect(() => {
    if (!enabled || loadCompletedRef.current || !startedRef.current) return;
    const snapshot = snapshotRef.current;
    if (!snapshot) return;

    const timer = setTimeout(() => {
      const fd = buildStartFormData(locale, projectId, { wizardFastPath, briefSnapshot: snapshot });
      void startBrandCreativeDirectionsAction(fd);
    }, 400);

    return () => clearTimeout(timer);
  }, [options?.briefSnapshot, enabled, locale, projectId, wizardFastPath]);

  useEffect(() => {
    if (textOnly || status !== "ready") return;
    setMediaPhase("text");
    const timer = setTimeout(() => setMediaPhase("images"), IMAGE_PHASE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [status, textOnly]);

  return {
    directions,
    status,
    mediaPhase,
    error,
    isLoading: !enabled || (status === "loading" && directions.length === 0),
    showImages: !textOnly && status === "ready" && mediaPhase === "images"
  };
}
