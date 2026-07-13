"use client";

import type { RefObject } from "react";
import { CheckCircle2, Lock, UploadCloud } from "lucide-react";
import { ReviewerApproveSettlementButton } from "@/components/studioos/reviewer-skeleton/reviewer-header-actions";
import {
  ReviewerVersionUploadZone,
  type ReviewerVersionUploadUI
} from "@/components/studioos/reviewer-skeleton/reviewer-version-upload-zone";
import type { ReviewerVersionReadyState } from "@/components/studioos/reviewer-skeleton/reviewer-timestamp-use-versions";
import { MAX_CAMPAIGN_VERSIONS } from "@/features/delivery/version.repository";
import type { Locale } from "@/lib/i18n";
import type { OrderStatus, StoredDeliverable } from "@/lib/order-types";
import { formatTimestamp } from "@/lib/studioos/review-utils";
import { cn, formatDate } from "@/lib/utils";

const copy = {
  zh: {
    versionList: "版本列表",
    current: "当前版本",
    upload: "上传新版本",
    duration: "时长",
    creator: "Creator",
    processing: "正在处理中…",
    ready: "Ready ✓",
    pending: "待上传",
    completed: "已完成",
    currentReview: "当前审片",
    waitingReview: "等待审片",
    history: "历史版本",
    annotationsDone: "批注完成",
    waitingStudio: "等待创作者上传",
    brandDone: "品牌方已完成本版本审片",
    reviseHint: "请根据批注修改后上传下一版本",
    requestRevision: "确认版本修改",
    approveSettle: "无需修改，直接通过",
    uploadNext: "上传",
    formats: "支持 MP4 / MOV",
    maxSize: "最大 500MB",
    waitingBrand: "等待品牌方审片",
    brandReviewHint: "请完成本轮审核：确认需要修改，或无需修改直接通过",
    revisionDecisionHint: "批注已完成，请创作者根据意见修改并上传下一版本",
    approveDecisionHint: "确认后项目将进入最终交付确认，完成后开放原片下载",
    revisionRequirement: "需要至少 1 条批注或修改意见",
    historyReadonly: "此版本已归档，只能查看历史批注",
    finalComplete: "最终版已完成审片"
  },
  en: {
    versionList: "Versions",
    current: "Current",
    upload: "Upload version",
    duration: "Duration",
    creator: "Creator",
    processing: "Processing…",
    ready: "Ready ✓",
    pending: "Not yet",
    completed: "Complete",
    currentReview: "Current review",
    waitingReview: "Waiting review",
    history: "History",
    annotationsDone: "annotations complete",
    waitingStudio: "Waiting for Studio to upload",
    brandDone: "Brand completed this review round",
    reviseHint: "Apply the notes and upload the next version",
    requestRevision: "Confirm version changes",
    approveSettle: "No changes needed, approve",
    uploadNext: "Upload",
    formats: "MP4 / MOV supported",
    maxSize: "Up to 500 MB",
    waitingBrand: "Waiting for Brand review",
    brandReviewHint: "Finish this review round: request changes or approve without changes",
    revisionDecisionHint: "Feedback is complete. Studio should revise and upload the next version.",
    approveDecisionHint: "After final confirmation, the project completes and original downloads open.",
    revisionRequirement: "At least 1 annotation or revision note is required",
    historyReadonly: "This version is archived and read-only",
    finalComplete: "Final review completed"
  }
};

export function ReviewerReviewVersionDock({
  locale,
  role,
  versions,
  activeVersion,
  orderId,
  projectId,
  orderStatus,
  reviewCompleted,
  durationSec,
  uploadUI,
  versionReadyState,
  fileRef,
  onSelectVersion,
  onRequestRevision,
  onApproveSuccess,
  onApproveError,
  onFileInputChange,
  onUploadFile,
  onCancelUpload,
  onOpenPicker
}: {
  locale: Locale;
  role: "brand" | "creator";
  versions: StoredDeliverable[];
  activeVersion: number;
  orderId: string;
  projectId: string | null;
  orderStatus: OrderStatus;
  reviewCompleted: boolean;
  durationSec: number;
  uploadUI: ReviewerVersionUploadUI;
  versionReadyState: Record<number, ReviewerVersionReadyState>;
  fileRef: RefObject<HTMLInputElement | null>;
  onSelectVersion: (version: number) => void;
  onRequestRevision: () => void;
  onApproveSuccess?: (message: string) => void;
  onApproveError?: (message: string) => void;
  onFileInputChange: () => void;
  onUploadFile: (file: File) => void;
  onCancelUpload: () => void;
  onOpenPicker: () => void;
}) {
  const t = copy[locale];
  const versionByNumber = new Map(versions.map((item) => [item.version, item]));
  const versionSlots = Array.from({ length: MAX_CAMPAIGN_VERSIONS }, (_, index) => index + 1);
  const canUploadNext = versions.length < MAX_CAMPAIGN_VERSIONS;
  const latestVersion = Math.max(...versions.map((item) => item.version), 0);
  const nextVersion = Math.min(latestVersion + 1, MAX_CAMPAIGN_VERSIONS);
  const activeIsLatest = activeVersion === latestVersion;
  const activeIsHistory = latestVersion > 0 && activeVersion < latestVersion;
  const activeRoundDone = reviewCompleted || activeIsHistory || orderStatus === "revision";
  const canBrandRequestRevision =
    role === "brand" &&
    !reviewCompleted &&
    orderStatus === "review" &&
    activeIsLatest &&
    canUploadNext;
  const canCreatorUploadNext = role === "creator" && orderStatus === "revision" && activeIsLatest && canUploadNext;

  return (
    <section
      className="z-10 shrink-0 border-t border-zinc-200 bg-white px-3 pb-3 pt-2 sm:px-4 md:px-5"
      aria-label={t.versionList}
    >
      <div className="grid min-w-0 grid-cols-1 gap-2 xl:grid-cols-[minmax(220px,280px)_minmax(0,1fr)] xl:items-stretch xl:gap-3">
        <div className="flex min-w-0 flex-col rounded-xl border border-zinc-200 bg-white p-2.5">
          <h3 className="mb-2 text-sm font-semibold text-zinc-900">{t.versionList}</h3>
          <ul className="flex gap-1.5 overflow-x-auto pb-0.5 xl:grid xl:min-h-[132px] xl:flex-1 xl:grid-rows-3 xl:gap-2 xl:overflow-visible xl:pb-0">
            {versionSlots.map((versionNumber) => {
              const item = versionByNumber.get(versionNumber);
              if (!item) {
                return (
                  <li key={`version-slot-${versionNumber}`}>
                    <div aria-disabled className="flex min-w-[92px] flex-col justify-center rounded-lg border border-zinc-100 bg-zinc-50 px-2.5 py-2 xl:h-full xl:min-w-0 xl:px-3">
                      <span className="text-sm font-semibold text-zinc-300">V{versionNumber}</span>
                      <span className="mt-0.5 text-[11px] text-zinc-300">{t.pending}</span>
                    </div>
                  </li>
                );
              }

              const selected = item.version === activeVersion;
              const readyState = versionReadyState[item.version];
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onSelectVersion(item.version)}
                    className={cn(
                      "flex min-w-[148px] flex-col justify-center rounded-lg border px-2.5 py-2 text-left transition xl:h-full xl:w-full xl:min-w-0 xl:px-3",
                      selected
                        ? "border-sky-300 bg-sky-50 ring-1 ring-sky-200"
                        : "border-zinc-200 bg-white hover:border-zinc-300"
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "text-[13px] font-semibold",
                          selected ? "text-sky-700" : "text-zinc-900"
                        )}
                      >
                        V{item.version}
                      </span>
                      {item.version < latestVersion ||
                      reviewCompleted ||
                      (orderStatus === "revision" && item.version === latestVersion) ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                          ✓ {t.completed}
                        </span>
                      ) : readyState === "processing" ? (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                          {t.processing}
                        </span>
                      ) : readyState === "ready" ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                          {t.ready}
                        </span>
                      ) : selected ? (
                        <span className="rounded-full bg-sky-500 px-2 py-0.5 text-[10px] font-medium text-white">
                          {t.current}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-[11px] leading-tight text-zinc-500">
                      {t.duration} {formatTimestamp(durationSec)} ·{" "}
                      {item.created_at ? formatDate(item.created_at) : "—"}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex min-w-0 rounded-xl border border-zinc-200 bg-white p-2.5">
          <div className="flex min-h-[104px] flex-1 items-center gap-3 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/60 px-3 py-3 sm:gap-4 sm:px-5 xl:min-h-[132px]">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-100 text-lg font-bold text-violet-700 sm:h-14 sm:w-14 sm:text-2xl">
              V{activeVersion || latestVersion || 1}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-zinc-950 sm:text-base">
                  {reviewCompleted
                    ? t.finalComplete
                    : activeIsHistory
                        ? `V${activeVersion} ${t.history}`
                        : activeRoundDone
                          ? `V${activeVersion} ${t.annotationsDone}`
                          : `V${activeVersion} ${role === "brand" ? t.currentReview : t.waitingReview}`}
                </h3>
                {activeRoundDone ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : null}
                {activeIsHistory ? <Lock className="h-3.5 w-3.5 text-zinc-400" /> : null}
              </div>

              <p className="mt-1 text-xs text-zinc-600 sm:text-sm">
                {reviewCompleted
                  ? t.finalComplete
                  : activeIsHistory
                    ? t.historyReadonly
                    : activeRoundDone && canUploadNext
                      ? `${t.waitingStudio} V${nextVersion}`
                      : role === "brand"
                        ? t.brandReviewHint
                        : t.waitingBrand}
              </p>
              {activeRoundDone && canUploadNext && !activeIsHistory ? (
                <p className="mt-1 text-xs text-zinc-500">
                  {t.brandDone} · {t.reviseHint}
                </p>
              ) : null}

              <div className="mt-3 border-t border-zinc-200 pt-3">
                {canBrandRequestRevision ? (
                  <div className="grid gap-3 lg:grid-cols-2">
                    <button
                      type="button"
                      onClick={onRequestRevision}
                      className="group flex min-h-[104px] flex-col items-center justify-center rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white px-4 py-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md"
                    >
                      <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-violet-700 transition group-hover:bg-violet-600 group-hover:text-white">
                        <CheckCircle2 className="h-5 w-5" />
                      </span>
                      <span className="text-sm font-semibold text-violet-800">
                        {locale === "zh"
                          ? `确认 V${activeVersion} 版本修改`
                          : `${t.requestRevision} V${activeVersion}`}
                      </span>
                      <span className="mt-1 text-xs leading-relaxed text-violet-500">
                        {t.revisionDecisionHint}
                      </span>
                      <span className="mt-2 text-[11px] text-violet-400">
                        {t.revisionRequirement}
                      </span>
                    </button>
                    <div className="flex min-h-[104px] flex-col items-center justify-center rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white px-4 py-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md">
                      <ReviewerApproveSettlementButton
                        locale={locale}
                        role={role}
                        orderId={orderId}
                        projectId={projectId}
                        activeVersion={activeVersion}
                        reviewCompleted={reviewCompleted}
                        orderStatus={orderStatus}
                        label={t.approveSettle}
                        className="h-auto min-h-0 rounded-full bg-emerald-600 px-5 py-2.5 text-sm hover:bg-emerald-700"
                        onSuccess={onApproveSuccess}
                        onError={onApproveError}
                      />
                      <p className="mt-2 max-w-[280px] text-xs leading-relaxed text-emerald-600">
                        {t.approveDecisionHint}
                      </p>
                    </div>
                  </div>
                ) : canCreatorUploadNext ? (
                  <ReviewerVersionUploadZone
                    locale={locale}
                    variant="panel"
                    uploadLabel={`${t.uploadNext} V${nextVersion}`}
                    panelTitle={t.brandDone}
                    panelSubtitle={`${t.formats} · ${t.maxSize}`}
                    inputId="review-version-dock-upload"
                    fileRef={fileRef}
                    uploadUI={uploadUI}
                    onFileInputChange={onFileInputChange}
                    onUploadFile={onUploadFile}
                    onCancelUpload={onCancelUpload}
                    onOpenPicker={onOpenPicker}
                  />
                ) : (
                  <div className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs text-zinc-500 ring-1 ring-zinc-200">
                    <UploadCloud className="h-3.5 w-3.5" />
                    {canUploadNext ? `${t.waitingStudio} V${nextVersion}` : t.pending}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
