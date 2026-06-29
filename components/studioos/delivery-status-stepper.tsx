"use client";

import type { Locale } from "@/lib/i18n";
import type { OrderStatus } from "@/lib/order-types";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";

export type DeliveryPipelineStage =
  | "upload_review"
  | "brand_review"
  | "revise"
  | "approved"
  | "upload_master"
  | "complete";

const copy = {
  en: {
    title: "Delivery status",
    uploadReview: "Upload review version",
    brandReview: "Brand review",
    revise: "Revise & re-upload",
    approved: "Approved",
    uploadMaster: "Upload master",
    complete: "Delivery complete",
    current: "In progress",
    waiting: "Waiting",
    done: "Done"
  },
  zh: {
    title: "交付状态",
    uploadReview: "上传审片版",
    brandReview: "品牌审片",
    revise: "修改并重新上传",
    approved: "审核通过",
    uploadMaster: "上传母版",
    complete: "交付完成",
    current: "进行中",
    waiting: "等待中",
    done: "已完成"
  }
};

const STAGES: { id: DeliveryPipelineStage; labelKey: keyof typeof copy.en }[] = [
  { id: "upload_review", labelKey: "uploadReview" },
  { id: "brand_review", labelKey: "brandReview" },
  { id: "revise", labelKey: "revise" },
  { id: "approved", labelKey: "approved" },
  { id: "upload_master", labelKey: "uploadMaster" },
  { id: "complete", labelKey: "complete" }
];

export function resolveDeliveryPipelineStage(input: {
  status: OrderStatus;
  hasVersions: boolean;
  openComments: number;
}): DeliveryPipelineStage {
  if (input.status === "completed") return "complete";
  if (input.status === "review" && input.openComments === 0) return "approved";
  if (input.status === "review") return "brand_review";
  if (input.status === "revision") return "revise";
  if (input.hasVersions) return "brand_review";
  return "upload_review";
}

function stageIndex(stage: DeliveryPipelineStage) {
  return STAGES.findIndex((item) => item.id === stage);
}

export function DeliveryStatusStepper({
  locale,
  status,
  hasVersions,
  openComments
}: {
  locale: Locale;
  status: OrderStatus;
  hasVersions: boolean;
  openComments: number;
}) {
  const t = copy[locale];
  const active = resolveDeliveryPipelineStage({ status, hasVersions, openComments });
  const activeIdx = stageIndex(active);

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-5">
      <p className="text-sm font-semibold text-zinc-900">{t.title}</p>
      <ol className="mt-4 space-y-3">
        {STAGES.map((stage, index) => {
          const done = index < activeIdx || (active === "complete" && index <= activeIdx);
          const current = index === activeIdx && active !== "complete";
          const waiting = index > activeIdx;

          return (
            <li key={stage.id} className="flex items-start gap-3">
              <span
                className={cn(
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                  done && "text-emerald-600",
                  current && "text-violet-600",
                  waiting && "text-zinc-300"
                )}
              >
                {done ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : current ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Circle className="h-5 w-5" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-sm font-medium",
                    done && "text-zinc-700",
                    current && "text-violet-900",
                    waiting && "text-zinc-400"
                  )}
                >
                  {t[stage.labelKey]}
                </p>
                <p className="text-xs text-zinc-500">
                  {done ? t.done : current ? t.current : t.waiting}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
