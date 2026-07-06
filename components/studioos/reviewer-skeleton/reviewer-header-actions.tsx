"use client";

import { useState, useTransition } from "react";
import { Check, Download, MoreHorizontal } from "lucide-react";
import {
  confirmReviewApproveAndSettleAction,
  getReviewSettlementPreviewAction,
  markReviewReadyForCompletionAction,
  resumeReviewFromReadyAction
} from "@/app/review-actions";
import { ReviewerApproveSettlementDialog } from "@/components/studioos/reviewer-skeleton/reviewer-approve-settlement-dialog";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import type { OrderStatus } from "@/lib/order-types";
import { deliverableDownloadHref } from "@/lib/studioos/deliverable-video-policy-shared";
import type { ReviewSettlementPreview } from "@/lib/studioos/reviewer-settlement-ui";
import { cn } from "@/lib/utils";

const copy = {
  zh: {
    download: "下载原片",
    downloadShort: "下载",
    approve: "无需修改",
    confirmDelivery: "确认最终交付"
  },
  en: {
    download: "Download original",
    downloadShort: "Download",
    approve: "No changes needed",
    confirmDelivery: "Confirm delivery"
  }
};

export function ReviewerHeaderActions({
  locale,
  role,
  orderId,
  projectId,
  activeVersion,
  downloadUrl,
  reviewCompleted,
  orderStatus,
  onOrderStatusChange,
  onSuccess,
  onError,
  variant = "shell",
  showApprove = true
}: {
  locale: Locale;
  role: "brand" | "creator";
  orderId: string;
  projectId: string | null;
  activeVersion: number;
  downloadUrl: string;
  reviewCompleted: boolean;
  orderStatus: OrderStatus;
  onOrderStatusChange?: (status: OrderStatus) => void;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
  variant?: "shell" | "focus";
  showApprove?: boolean;
}) {
  const t = copy[locale];
  const [dialogOpen, setDialogOpen] = useState(false);
  const [preview, setPreview] = useState<ReviewSettlementPreview | null>(null);
  const [pending, startTransition] = useTransition();
  const canMarkNoChanges =
    role === "brand" && !reviewCompleted && ["review", "revision"].includes(orderStatus);
  const canConfirmDelivery = role === "brand" && !reviewCompleted && orderStatus === "ready_for_completion";
  const safeDownloadUrl = deliverableDownloadHref(downloadUrl);
  const canDownload = role === "brand" && reviewCompleted && Boolean(safeDownloadUrl);
  const compact = variant === "shell";

  function markReadyForCompletion() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("lang", locale);
      fd.set("order_id", orderId);
      const result = await markReviewReadyForCompletionAction(fd);
      if (!result.ok) {
        onError?.(result.error);
        return;
      }
      onOrderStatusChange?.(result.orderStatus);
      onSuccess?.(result.message);
    });
  }

  function openSettlementDialog() {
    startTransition(async () => {
      const result = await getReviewSettlementPreviewAction({
        lang: locale,
        orderId,
        projectId: projectId ?? undefined,
        version: activeVersion
      });
      if (!result.ok) {
        onError?.(result.error);
        return;
      }
      setPreview(result.preview);
      setDialogOpen(true);
    });
  }

  function confirmApprove() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("lang", locale);
      fd.set("order_id", orderId);
      if (projectId) fd.set("project_id", projectId);
      fd.set("version", String(activeVersion));

      const result = await confirmReviewApproveAndSettleAction(fd);
      if (!result.ok) {
        onError?.(result.error);
        return;
      }

      setDialogOpen(false);
      onOrderStatusChange?.("completed");
      onSuccess?.(result.message);
    });
  }

  function resumeReview() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("lang", locale);
      fd.set("order_id", orderId);
      const result = await resumeReviewFromReadyAction(fd);
      if (!result.ok) {
        onError?.(result.error);
        return;
      }
      setDialogOpen(false);
      onOrderStatusChange?.(result.orderStatus);
      onSuccess?.(result.message);
    });
  }

  return (
    <>
      <ReviewerApproveSettlementDialog
        locale={locale}
        open={dialogOpen}
        pending={pending}
        preview={preview}
        onOpenChange={setDialogOpen}
        onConfirm={confirmApprove}
        onResumeReview={resumeReview}
      />
      {role === "brand" && canDownload ? (
        <Button
          asChild
          variant="outline"
          size="sm"
          className={cn(
            compact ? "h-8 gap-1 rounded-lg px-2.5 text-xs" : "h-9 gap-1.5 rounded-lg px-3 text-xs"
          )}
        >
          <a href={safeDownloadUrl} download>
            <Download className="h-3.5 w-3.5" />
            {compact ? t.downloadShort : t.download}
          </a>
        </Button>
      ) : null}
      {showApprove && canMarkNoChanges ? (
        <Button
          type="button"
          size="sm"
          disabled={pending}
          className={cn(
            "gap-1.5 rounded-lg bg-violet-600 text-xs font-semibold text-white hover:bg-violet-700",
            compact ? "h-8 px-3" : "h-9 px-4"
          )}
          onClick={markReadyForCompletion}
        >
          <Check className="h-3.5 w-3.5" />
          {t.approve}
        </Button>
      ) : null}
      {showApprove && canConfirmDelivery ? (
        <Button
          type="button"
          size="sm"
          disabled={pending}
          className={cn(
            "gap-1.5 rounded-lg bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700",
            compact ? "h-8 px-3" : "h-9 px-4"
          )}
          onClick={openSettlementDialog}
        >
          <Check className="h-3.5 w-3.5" />
          {t.confirmDelivery}
        </Button>
      ) : null}
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled
        className={cn(compact ? "h-8 w-8 rounded-lg border-zinc-200" : "h-9 w-9 rounded-lg border-zinc-200")}
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </>
  );
}

export function ReviewerApproveSettlementButton({
  locale,
  role,
  orderId,
  projectId,
  activeVersion,
  reviewCompleted,
  orderStatus,
  onOrderStatusChange,
  label,
  className,
  onSuccess,
  onError
}: {
  locale: Locale;
  role: "brand" | "creator";
  orderId: string;
  projectId: string | null;
  activeVersion: number;
  reviewCompleted: boolean;
  orderStatus: OrderStatus;
  onOrderStatusChange?: (status: OrderStatus) => void;
  label?: string;
  className?: string;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}) {
  const t = copy[locale];
  const [dialogOpen, setDialogOpen] = useState(false);
  const [preview, setPreview] = useState<ReviewSettlementPreview | null>(null);
  const [pending, startTransition] = useTransition();
  const canMarkNoChanges =
    role === "brand" && !reviewCompleted && ["review", "revision"].includes(orderStatus);
  const canConfirmDelivery = role === "brand" && !reviewCompleted && orderStatus === "ready_for_completion";

  function markReadyForCompletion() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("lang", locale);
      fd.set("order_id", orderId);
      const result = await markReviewReadyForCompletionAction(fd);
      if (!result.ok) {
        onError?.(result.error);
        return;
      }
      onOrderStatusChange?.(result.orderStatus);
      onSuccess?.(result.message);
    });
  }

  function openSettlementDialog() {
    startTransition(async () => {
      const result = await getReviewSettlementPreviewAction({
        lang: locale,
        orderId,
        projectId: projectId ?? undefined,
        version: activeVersion
      });
      if (!result.ok) {
        onError?.(result.error);
        return;
      }
      setPreview(result.preview);
      setDialogOpen(true);
    });
  }

  function confirmApprove() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("lang", locale);
      fd.set("order_id", orderId);
      if (projectId) fd.set("project_id", projectId);
      fd.set("version", String(activeVersion));

      const result = await confirmReviewApproveAndSettleAction(fd);
      if (!result.ok) {
        onError?.(result.error);
        return;
      }

      setDialogOpen(false);
      onOrderStatusChange?.("completed");
      onSuccess?.(result.message);
    });
  }

  function resumeReview() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("lang", locale);
      fd.set("order_id", orderId);
      const result = await resumeReviewFromReadyAction(fd);
      if (!result.ok) {
        onError?.(result.error);
        return;
      }
      setDialogOpen(false);
      onOrderStatusChange?.(result.orderStatus);
      onSuccess?.(result.message);
    });
  }

  if (canConfirmDelivery) {
    return (
      <>
        <ReviewerApproveSettlementDialog
          locale={locale}
          open={dialogOpen}
          pending={pending}
          preview={preview}
          onOpenChange={setDialogOpen}
          onConfirm={confirmApprove}
          onResumeReview={resumeReview}
        />
        <Button
          type="button"
          size="sm"
          disabled={pending}
          className={cn(
            "h-9 gap-1.5 rounded-lg bg-emerald-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50",
            className
          )}
          onClick={openSettlementDialog}
        >
          <Check className="h-3.5 w-3.5" />
          {label ?? t.confirmDelivery}
        </Button>
      </>
    );
  }

  return (
    <>
      <ReviewerApproveSettlementDialog
        locale={locale}
        open={dialogOpen}
        pending={pending}
        preview={preview}
        onOpenChange={setDialogOpen}
        onConfirm={confirmApprove}
        onResumeReview={resumeReview}
      />
      <Button
        type="button"
        size="sm"
        disabled={!canMarkNoChanges || pending}
        className={cn(
          "h-9 gap-1.5 rounded-lg bg-violet-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-violet-700 disabled:opacity-50",
          className
        )}
        onClick={markReadyForCompletion}
      >
        <Check className="h-3.5 w-3.5" />
        {label ?? t.approve}
      </Button>
    </>
  );
}
