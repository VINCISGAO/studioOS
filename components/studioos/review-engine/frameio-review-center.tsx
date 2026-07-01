"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, RotateCcw } from "lucide-react";
import { ReviewWorkspace } from "@/features/review/ReviewWorkspace";
import { ReviewCenterEmptyUpload } from "@/components/studioos/review-engine/review-center-empty-upload";
import { ReviewCenterStepper } from "@/components/studioos/review-engine/review-center-stepper";
import { ReviewCenterVersionStrip } from "@/components/studioos/review-engine/review-center-version-strip";
import { useReviewCenterActions } from "@/components/studioos/review-engine/use-review-center-actions";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import type { StoredDeliverable, StoredOrder } from "@/lib/order-types";
import type { ReviewComment } from "@/lib/studioos/review-store";
import { cn, formatDate } from "@/lib/utils";

const copy = {
  en: {
    back: "Back",
    approve: "Approve delivery",
    requestChanges: "Request changes",
    noVideo: "Waiting for the studio to upload the first version.",
    uploadVersion: "Upload new version",
    uploadFirst: "Upload Version 1",
    creatorPhaseHint: "Upload Version 1 here to start review. Upload every revision from this review center.",
    inReview: "In review",
    revision: "Revisions requested",
    completed: "Approved",
    projectId: "Order",
    created: "Created"
  },
  zh: {
    back: "返回",
    approve: "通过交付",
    requestChanges: "要求修改",
    noVideo: "等待制作方上传视频。",
    uploadVersion: "上传新版本",
    uploadFirst: "上传 Version 1",
    creatorPhaseHint: "第一版从这里上传进入审片；之后的每一版也在审片中心提交。",
    inReview: "审片中",
    revision: "修改中",
    completed: "已通过",
    projectId: "订单",
    created: "创建时间"
  }
};

function orderStatusLabel(status: StoredOrder["status"], locale: Locale) {
  const t = copy[locale];
  if (status === "completed") return t.completed;
  if (status === "revision") return t.revision;
  return t.inReview;
}

export function FrameioReviewCenter({
  locale,
  order,
  campaignTitle,
  deliverables,
  initialComments: _initialComments,
  initialVersion,
  role,
  backHref,
  backLabel,
  variant = "fullscreen",
  flash
}: {
  locale: Locale;
  order: StoredOrder;
  campaignTitle: string;
  deliverables: StoredDeliverable[];
  initialComments: ReviewComment[];
  initialVersion: number;
  role: "brand" | "creator";
  backHref: string;
  backLabel?: string;
  variant?: "fullscreen" | "embedded";
  flash?: "completed" | "revision";
}) {
  const t = copy[locale];
  const embedded = variant === "embedded";
  const resolvedBackLabel = backLabel ?? t.back;
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadNotes, setUploadNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const sortedVersions = useMemo(
    () => [...deliverables].sort((a, b) => a.version - b.version),
    [deliverables]
  );
  const [activeVersion, setActiveVersion] = useState(
    initialVersion || sortedVersions[sortedVersions.length - 1]?.version || 1
  );
  const activeDeliverable =
    sortedVersions.find((item) => item.version === activeVersion) ??
    sortedVersions[sortedVersions.length - 1];
  const videoUrl = activeDeliverable?.file_url ?? "";
  const canBrandReview = role === "brand" && ["review", "revision"].includes(order.status);
  const canCreatorUpload =
    role === "creator" && ["in_production", "revision", "review"].includes(order.status);
  const orderApproved = order.status === "completed";

  const reviewVersions = sortedVersions.map((item) => ({
    version: item.version,
    label: `Version ${item.version}`,
    uploadedAt: item.created_at
  }));

  const { pending, uploadVersion, approve, requestChanges } = useReviewCenterActions({
    locale,
    orderId: order.id,
    activeVersion,
    onCommentsChange: () => undefined,
    onError: setError,
    onUploadComplete: () => {
      if (fileRef.current) fileRef.current.value = "";
      setUploadNotes("");
    },
    onPinClear: () => undefined
  });

  function handlePickFile() {
    fileRef.current?.click();
  }

  function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    uploadVersion(file, uploadNotes);
  }

  const isFirstUpload = sortedVersions.length === 0;
  const uploadLabel = isFirstUpload ? t.uploadFirst : t.uploadVersion;
  const workspaceStatus =
    order.status === "completed"
      ? "completed"
      : order.status === "revision"
        ? "revision"
        : order.status === "in_production"
          ? "in_production"
          : "review";

  return (
    <div
      className={cn(
        "flex flex-col text-zinc-900",
        embedded ? "overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm" : "min-h-svh bg-zinc-50"
      )}
    >
      <header className="border-b border-zinc-200 bg-white px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-start gap-3">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            {resolvedBackLabel}
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-950">{campaignTitle}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
              <span>
                {t.projectId}: {order.id}
              </span>
              <span>
                {t.created}: {formatDate(order.created_at)}
              </span>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 font-medium",
                  orderApproved
                    ? "bg-emerald-50 text-emerald-700"
                    : order.status === "revision"
                      ? "bg-amber-50 text-amber-800"
                      : "bg-[#5B5CFF]/10 text-[#5B5CFF]"
                )}
              >
                {orderStatusLabel(order.status, locale)}
              </span>
            </div>
          </div>
          {role === "brand" && canBrandReview ? (
            <div className="flex w-full shrink-0 items-center gap-2 sm:ml-auto sm:w-auto">
              <Button type="button" variant="outline" size="sm" disabled={pending} onClick={requestChanges}>
                <RotateCcw className="h-4 w-4" />
                {t.requestChanges}
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={pending}
                onClick={approve}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle2 className="h-4 w-4" />
                {t.approve}
              </Button>
            </div>
          ) : null}
          {role === "creator" && canCreatorUpload ? (
            <div className="flex w-full shrink-0 items-center gap-2 sm:ml-auto sm:w-auto">
              <Button
                type="button"
                size="sm"
                disabled={pending}
                onClick={handlePickFile}
                className="rounded-lg bg-[#5B5CFF] hover:bg-[#4a4bef]"
              >
                {uploadLabel}
              </Button>
            </div>
          ) : null}
        </div>
        <div className="mt-4 overflow-x-auto">
          <ReviewCenterStepper locale={locale} order={order} deliverableCount={sortedVersions.length} />
        </div>
      </header>

      {flash === "completed" || orderApproved ? (
        <div className="bg-emerald-50 px-4 py-2 text-center text-sm text-emerald-800">
          {locale === "zh" ? "交付已通过" : "Delivery approved"}
        </div>
      ) : null}

      <div className="min-h-0 flex-1 p-4 sm:p-6">
        {videoUrl ? (
          <div className="space-y-5">
            <ReviewWorkspace
              variant="content"
              locale={locale}
              role={role}
              videoUrl={videoUrl}
              projectTitle={campaignTitle}
              orderId={order.id}
              orderStatus={workspaceStatus}
              createdAt={order.created_at}
              versions={reviewVersions}
              activeVersion={activeVersion}
              onVersionChange={setActiveVersion}
              backHref={backHref}
              canBrandReview={canBrandReview}
              onApprove={approve}
              onRequestChanges={requestChanges}
            />
            {role === "creator" && canCreatorUpload ? (
              <ReviewCenterVersionStrip
                locale={locale}
                versions={sortedVersions}
                activeVersion={activeVersion}
                onSelect={setActiveVersion}
                canUpload={canCreatorUpload}
                uploadNotes={uploadNotes}
                onUploadNotesChange={setUploadNotes}
                onUpload={handleUpload}
                pending={pending}
                fileInputRef={fileRef}
                isFirstUpload={isFirstUpload}
              />
            ) : null}
          </div>
        ) : role === "creator" && canCreatorUpload ? (
          <ReviewCenterEmptyUpload
            locale={locale}
            uploadNotes={uploadNotes}
            onUploadNotesChange={setUploadNotes}
            onUpload={handleUpload}
            onPickFile={handlePickFile}
            pending={pending}
            fileInputRef={fileRef}
          />
        ) : (
          <div className="flex aspect-video items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 text-sm text-zinc-500">
            {t.noVideo}
          </div>
        )}
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      </div>
    </div>
  );
}
