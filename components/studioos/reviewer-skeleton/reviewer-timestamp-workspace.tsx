"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CreditCard } from "lucide-react";
import {
  requestBrandReviewAction,
  requestReviewRevisionAction,
  revertCreatorReviewUploadAction,
  startPaidRevisionStripeCheckoutAction,
  unlockPaidRevisionSlotAction
} from "@/app/review-actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { ReviewerFocusHeader } from "@/components/studioos/reviewer-skeleton/reviewer-focus-header";
import { ReviewerReviewSuccessToast } from "@/components/studioos/reviewer-skeleton/reviewer-comment-deleted-toast";
import { ReviewerReviewLayout } from "@/components/studioos/reviewer-skeleton/reviewer-review-layout";
import { ReviewerShellHeader } from "@/components/studioos/reviewer-skeleton/reviewer-shell-header";
import { useReviewFocusMode } from "@/components/studioos/reviewer-skeleton/use-review-focus-mode";
import { useReviewerPlaybackKeyboard } from "@/components/studioos/reviewer-skeleton/use-reviewer-playback-keyboard";
import { useReviewerTimestampComments } from "@/components/studioos/reviewer-skeleton/reviewer-timestamp-use-comments";
import { useReviewerTimestampVersions } from "@/components/studioos/reviewer-skeleton/reviewer-timestamp-use-versions";
import { reviewStatusLabel } from "@/components/studioos/reviewer-skeleton/reviewer-shell-types";
import type { ReviewerTool } from "@/components/studioos/reviewer-v1/reviewer-v1-types";
import { useReviewerPlayback } from "@/components/studioos/reviewer-v1/reviewer-v1-use-playback";
import { assertRevisionRequestAllowed } from "@/features/review/review-round-policy";
import type { ReviewPortalUiState } from "@/features/review/review-portal-ui-state";
import type { Locale } from "@/lib/i18n";
import type { StoredDeliverable, StoredOrder } from "@/lib/order-types";
import type { ReviewComment } from "@/lib/studioos/review-comment-types";
import { latestSubmittedDeliverableVersion } from "@/lib/studioos/review-upload-version-shared";
import { formatDate } from "@/lib/utils";
import { studioNav } from "@/lib/studioos/vocabulary";

type UnlockPaidRevisionResult = Awaited<ReturnType<typeof unlockPaidRevisionSlotAction>>;
type UnlockPaidRevisionSuccess = Extract<UnlockPaidRevisionResult, { ok: true }>;
type PaidRevisionInvoice = {
  invoiceId: string | null;
  addOnAmount: number;
  shortfallAmount: number;
  currency: string;
};

export function ReviewerTimestampWorkspace(props: {
  locale: Locale;
  role: "brand" | "creator";
  order: StoredOrder;
  campaignTitle: string;
  deliverables: StoredDeliverable[];
  initialComments: ReviewComment[];
  initialVersion: number;
  portalUi?: ReviewPortalUiState | null;
  backHref: string;
  backLabel?: string;
  replaceUploadVersion?: number | null;
  canRevertUpload?: boolean;
  stripeCheckoutEnabled?: boolean;
}) {
  return <ReviewerTimestampWorkspaceInner {...props} />;
}

function ReviewerTimestampWorkspaceInner({
  locale,
  role,
  order,
  campaignTitle,
  deliverables,
  initialComments,
  initialVersion,
  portalUi,
  backHref,
  backLabel,
  replaceUploadVersion = null,
  canRevertUpload = true,
  stripeCheckoutEnabled = false
}: {
  locale: Locale;
  role: "brand" | "creator";
  order: StoredOrder;
  campaignTitle: string;
  deliverables: StoredDeliverable[];
  initialComments: ReviewComment[];
  initialVersion: number;
  portalUi?: ReviewPortalUiState | null;
  backHref: string;
  backLabel?: string;
  replaceUploadVersion?: number | null;
  canRevertUpload?: boolean;
  stripeCheckoutEnabled?: boolean;
}) {
  const { isFocusMode, focusTheme, exitFocusMode, enterFocusMode, setFocusTheme } = useReviewFocusMode();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletedToast, setDeletedToast] = useState<string | null>(null);
  const [reviewNotice, setReviewNotice] = useState<{
    message: string;
    description: string;
    variant: "success" | "warning";
  } | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<PaidRevisionInvoice | null>(null);
  const [reviewCompleted, setReviewCompleted] = useState(
    portalUi?.orderApproved ?? order.status === "completed"
  );
  const [reviewPhase, setReviewPhase] = useState(portalUi?.derivedOrderStatus ?? order.status);
  const [revisionPending, startRevisionTransition] = useTransition();
  const [revertPending, startRevertTransition] = useTransition();
  const [brandReviewRequestPending, startBrandReviewRequestTransition] = useTransition();
  const [unlockPending, startUnlockTransition] = useTransition();
  const [paidRevisionSlotsUnlocked, setPaidRevisionSlotsUnlocked] = useState(
    portalUi?.paidRevisionSlotsUnlocked ?? order.paid_revision_slots_unlocked ?? 0
  );
  const [canRevertCurrentUpload, setCanRevertCurrentUpload] = useState(canRevertUpload);
  const [activeTool, setActiveTool] = useState<ReviewerTool>("select");
  const [penColor, setPenColor] = useState("#FF4D4F");
  const [penSize, setPenSize] = useState(1);

  const {
    fileRef,
    uploadUI,
    versionReadyState,
    deliverablesState,
    activeVersion,
    setActiveVersion,
    playbackUrl,
    handleVideoError,
    openFilePicker,
    cancelUpload,
    handleFileInputChange,
    handleUploadFile
  } = useReviewerTimestampVersions({
    locale,
    orderId: order.id,
    deliverables,
    initialVersion
  });

  const playback = useReviewerPlayback(videoRef, playbackUrl, activeVersion);
  const {
    videoStatus,
    currentSec,
    durationSec,
    isPlaying,
    handleLoadedMetadata,
    handleLoadedData,
    handleDurationChange,
    handleCanPlay,
    handleError,
    handlePlay,
    handlePause,
    handleEnded,
    handleTimeUpdate,
    handlePlayPause,
    seekTo,
    pauseAt
  } = playback;

  useReviewerPlaybackKeyboard(
    handlePlayPause,
    Boolean(playbackUrl) && videoStatus !== "error" && videoStatus !== "missing"
  );

  const sortedVersions = [...deliverablesState].sort((a, b) => a.version - b.version);
  const latestVersion = sortedVersions[sortedVersions.length - 1]?.version ?? activeVersion;
  const latestSubmittedVersion = latestSubmittedDeliverableVersion(sortedVersions);
  const revisionGate = assertRevisionRequestAllowed({
    currentVersionNumber: latestSubmittedVersion,
    paidSlotsUnlocked: paidRevisionSlotsUnlocked
  });
  const activeIsLatest = activeVersion === latestVersion;
  const revisionLimitLocked =
    role === "brand" &&
    activeIsLatest &&
    !reviewCompleted &&
    reviewPhase === "review" &&
    latestSubmittedVersion > 0 &&
    !revisionGate.ok &&
    revisionGate.code === "PAYMENT_REQUIRED";
  const revisionLimitMessage =
    locale === "zh" ? "修改次数已达交付上限" : "Revision limit reached";
  const canRequestRevision =
    role === "brand" &&
    activeIsLatest &&
    !reviewCompleted &&
    reviewPhase === "review" &&
    !revisionLimitLocked;
  const canReviewActiveVersion =
    role === "brand" &&
    activeIsLatest &&
    !reviewCompleted &&
    reviewPhase === "review" &&
    !revisionLimitLocked;
  const canDeleteComment =
    role === "brand" &&
    activeIsLatest &&
    !reviewCompleted &&
    ["review", "revision"].includes(reviewPhase);
  const canReplyActiveVersion =
    role === "creator" &&
    activeIsLatest &&
    !reviewCompleted &&
    ["review", "revision"].includes(reviewPhase);
  const canSetCommentStatus =
    activeIsLatest &&
    !reviewCompleted &&
    (role === "creator" || role === "brand");
  const stageLocked = activeIsLatest && !reviewCompleted && reviewPhase === "revision";
  const toolDisabledMessage =
    revisionLimitLocked
      ? revisionLimitMessage
      : stageLocked && role === "brand"
      ? locale === "zh"
        ? "阶段审批完成过程中，工具暂不可使用"
        : "Tools are unavailable while this review stage is being finalized"
      : undefined;
  const commentDisabledMessage =
    revisionLimitLocked
      ? revisionLimitMessage
      : stageLocked && role === "brand"
      ? locale === "zh"
        ? "阶段审批完成过程中，批注暂不可使用"
        : "Annotations are unavailable while this review stage is being finalized"
      : undefined;
  const canComment =
    canReviewActiveVersion && !isPlaying && videoStatus === "ready";
  const canReply =
    canReplyActiveVersion && !isPlaying && videoStatus === "ready";
  const canUseTools = canReviewActiveVersion && videoStatus === "ready";
  const canDraw = canReviewActiveVersion && !isPlaying && videoStatus === "ready";
  const headerInfo = {
    campaignTitle:
      role === "creator" ? studioNav[locale].reviewRoom : campaignTitle,
    orderId: order.id,
    createdAtLabel: order.created_at ? formatDate(order.created_at) : undefined,
    statusLabel: reviewStatusLabel(locale, reviewCompleted ? "completed" : reviewPhase)
  };

  const {
    pending,
    versionComments,
    visibleAnnotations,
    visiblePendingAnnotations,
    activeCommentId,
    setActiveCommentId,
    draftBody,
    setDraftBody,
    resetVersionSelection,
    handleUndo,
    handleCreateAnnotation,
    handleSelectComment,
    handleCommentSeek,
    handleSelectAnnotation,
    handleDeleteAnnotation,
    handleDeleteComment,
    handleSetCommentStatus,
    handleClearAnnotations,
    handleSubmitComment,
    replyTargetId,
    replyTargetComment,
    startReply,
    cancelReply
  } = useReviewerTimestampComments({
    locale,
    orderId: order.id,
    role,
    initialComments,
    activeVersion,
    videoRef,
    currentSec,
    canComment,
    canReply,
    onCommentDeleted: () => setDeletedToast(locale === "zh" ? "已删除" : "Deleted")
  });

  useEffect(() => {
    if (!isFocusMode) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isFocusMode]);

  useEffect(() => {
    if (!deletedToast) return;
    const timer = window.setTimeout(() => setDeletedToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [deletedToast]);

  useEffect(() => {
    if (!reviewNotice) return;
    const timer = window.setTimeout(() => setReviewNotice(null), 4000);
    return () => window.clearTimeout(timer);
  }, [reviewNotice]);

  useEffect(() => {
    setReviewPhase(order.status);
    setReviewCompleted(order.status === "completed");
  }, [order.status]);

  useEffect(() => {
    setPaidRevisionSlotsUnlocked(
      portalUi?.paidRevisionSlotsUnlocked ?? order.paid_revision_slots_unlocked ?? 0
    );
  }, [portalUi?.paidRevisionSlotsUnlocked, order.paid_revision_slots_unlocked]);

  useEffect(() => {
    setCanRevertCurrentUpload(canRevertUpload);
  }, [canRevertUpload]);

  function handleOrderStatusChange(status: StoredOrder["status"]) {
    setReviewPhase(status);
    setReviewCompleted(status === "completed");
  }

  function handleApproveSuccess(message: string) {
    setReviewNotice({
      message,
      description: locale === "zh" ? "项目方将尽快处理，请耐心等待" : "The brand will review it soon. Please wait patiently.",
      variant: "success"
    });
    setError(null);
    router.refresh();
  }

  function handleApproveError(message: string) {
    setError(message);
  }

  function handleSelectVersion(version: number) {
    if (version === activeVersion) return;
    setActiveVersion(version);
    resetVersionSelection();
  }

  function handleToolChange(tool: ReviewerTool) {
    if (!canUseTools && tool !== "select") return;
    if (tool !== "select" && isPlaying) {
      videoRef.current?.pause();
    }
    if (tool === "delete" && activeTool === "delete" && activeCommentId) {
      handleDeleteComment(activeCommentId, setError);
      return;
    }
    setActiveTool(tool);
  }

  function handleRequestRevision() {
    if (!canRequestRevision) return;
    startRevisionTransition(async () => {
      const fd = new FormData();
      fd.set("lang", locale);
      fd.set("order_id", order.id);
      if (order.project_id) fd.set("project_id", order.project_id);
      fd.set("version", String(activeVersion));

      const result = await requestReviewRevisionAction(fd);
      if (!result.ok) {
        if (
          "paymentRequired" in result &&
          result.paymentRequired &&
          "paymentUrl" in result &&
          typeof result.paymentUrl === "string"
        ) {
          router.push(result.paymentUrl);
          return;
        }
        const isMissingRevisionNote =
          result.error.includes("请至少添加一条修改意见") ||
          result.error.includes("Please add at least one revision note");
        if (isMissingRevisionNote) {
          setReviewNotice({
            message: result.error,
            description:
              locale === "zh"
                ? "请先在视频时间轴或画面上添加批注，再提交修改。"
                : "Add at least one timestamp or on-screen note before requesting changes.",
            variant: "warning"
          });
          setError(null);
          return;
        }
        setError(result.error);
        return;
      }

      resetVersionSelection();
      setReviewPhase("revision");
      setReviewNotice({
        message: result.message,
        description: locale === "zh" ? "项目方将尽快处理，请耐心等待" : "The brand will review it soon. Please wait patiently.",
        variant: "success"
      });
      setCanRevertCurrentUpload(false);
      setError(null);
      router.refresh();
    });
  }

  function handleRevertUpload() {
    if (role !== "creator" || revertPending) return;
    startRevertTransition(async () => {
      const fd = new FormData();
      fd.set("lang", locale);
      fd.set("order_id", order.id);
      fd.set("version", String(activeVersion));
      const result = await revertCreatorReviewUploadAction(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setReviewPhase(result.orderStatus);
      setActiveVersion(result.version);
      setReviewNotice({
        message: result.message,
        description: locale === "zh" ? "请重新上传当前稿件" : "Please upload the current draft again.",
        variant: "success"
      });
      setError(null);
      router.refresh();
    });
  }

  function handleRequestBrandReview() {
    if (role !== "creator" || brandReviewRequestPending) return;
    startBrandReviewRequestTransition(async () => {
      const fd = new FormData();
      fd.set("lang", locale);
      fd.set("order_id", order.id);
      fd.set("version", String(activeVersion));
      const result = await requestBrandReviewAction(fd);
      if (!result.ok) {
        if (result.error === "请勿重复提交" || result.error === "Please do not submit repeatedly") {
          setReviewNotice({
            message: result.error,
            description: locale === "zh" ? "该版本已提交给项目方，请等待处理" : "This version was already submitted. Please wait for review.",
            variant: "warning"
          });
          setCanRevertCurrentUpload(false);
          setError(null);
          return;
        }
        setError(result.error);
        return;
      }
      setReviewNotice({
        message: result.message,
        description: locale === "zh" ? "项目方将尽快处理，请耐心等待" : "The brand will review it soon. Please wait patiently.",
        variant: "success"
      });
      setCanRevertCurrentUpload(false);
      setError(null);
      router.refresh();
    });
  }

  function handleUnlockPaidRevision() {
    if (role !== "brand" || unlockPending) return;
    startUnlockTransition(async () => {
      const fd = new FormData();
      fd.set("lang", locale);
      fd.set("order_id", order.id);
      if (order.project_id) fd.set("project_id", order.project_id);
      const result = await unlockPaidRevisionSlotAction(fd);
      if (!result.ok) {
        if ("paymentRequired" in result && result.paymentRequired) {
          setPaymentInvoice({
            invoiceId: result.invoiceId ?? null,
            addOnAmount: result.addOnAmount ?? 0,
            shortfallAmount: result.shortfallAmount ?? result.addOnAmount ?? 0,
            currency: result.currency
          });
          setError(null);
          return;
        }
        setError(result.error);
        return;
      }
      showPaidRevisionSuccess(result);
    });
  }

  function showPaidRevisionSuccess(result: UnlockPaidRevisionSuccess) {
    setPaidRevisionSlotsUnlocked(result.paidRevisionSlotsUnlocked);
    const formattedAddOnAmount = new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en-US", {
      style: "currency",
      currency: result.currency
    }).format(result.addOnAmount);
    const formattedShortfallAmount = new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en-US", {
      style: "currency",
      currency: result.currency
    }).format(result.shortfallAmount);
    const paymentDescription =
      result.paymentSource === "balance"
        ? locale === "zh"
          ? `已从品牌账户余额扣款：${formattedAddOnAmount}（当前订单金额 20%），第 4-5 轮修订已解锁。`
          : `Paid from brand account balance: ${formattedAddOnAmount} (20% of this order). Revision rounds 4-5 are now unlocked.`
        : result.paymentSource === "invoice"
          ? locale === "zh"
            ? `已完成加购账单 ${result.invoiceId} 支付：${formattedShortfallAmount}；已扣除加购费 ${formattedAddOnAmount}，第 4-5 轮修订已解锁。`
            : `Invoice ${result.invoiceId} paid for ${formattedShortfallAmount}; the add-on fee ${formattedAddOnAmount} was charged and rounds 4-5 are now unlocked.`
          : result.paymentSource === "stripe"
            ? locale === "zh"
              ? `Stripe 付款已完成：${formattedAddOnAmount}（当前订单金额 20%），第 4-5 轮修订已解锁。`
              : `Stripe payment completed: ${formattedAddOnAmount} (20% of this order). Revision rounds 4-5 are now unlocked.`
            : locale === "zh"
            ? `已支付加购账单：${formattedAddOnAmount}（当前订单金额 20%），第 4-5 轮修订已解锁。`
            : `Add-on invoice paid: ${formattedAddOnAmount} (20% of this order). Revision rounds 4-5 are now unlocked.`;
    setPaymentInvoice(null);
    setReviewNotice({
      message: result.message,
      description: paymentDescription,
      variant: "success"
    });
    setError(null);
    router.refresh();
  }

  function handlePayRevisionInvoice() {
    if (!paymentInvoice || unlockPending) return;
    if (stripeCheckoutEnabled) {
      startUnlockTransition(async () => {
        const fd = new FormData();
        fd.set("lang", locale);
        fd.set("order_id", order.id);
        if (order.project_id) fd.set("project_id", order.project_id);
        await startPaidRevisionStripeCheckoutAction(fd);
      });
      return;
    }
    startUnlockTransition(async () => {
      const fd = new FormData();
      fd.set("lang", locale);
      fd.set("order_id", order.id);
      fd.set("pay_invoice", "1");
      if (order.project_id) fd.set("project_id", order.project_id);
      const result = await unlockPaidRevisionSlotAction(fd);
      if (!result.ok) {
        if ("paymentRequired" in result && result.paymentRequired) {
          setPaymentInvoice({
            invoiceId: result.invoiceId ?? paymentInvoice.invoiceId,
            addOnAmount: result.addOnAmount ?? paymentInvoice.addOnAmount,
            shortfallAmount: result.shortfallAmount ?? paymentInvoice.shortfallAmount,
            currency: result.currency
          });
          return;
        }
        setError(result.error);
        return;
      }
      showPaidRevisionSuccess(result);
    });
  }

  const onUploadSuccess = () => {
    resetVersionSelection();
    setReviewPhase("review");
  };
  const onUploadError = (message: string) => setError(message);
  const onFileInputChange = () => handleFileInputChange(onUploadSuccess, onUploadError);
  const onUploadFile = (file: File) => handleUploadFile(file, onUploadSuccess, onUploadError);

  const layoutProps = {
    locale,
    role,
    canUseTools,
    toolDisabledMessage,
    activeTool,
    canDraw,
    canComment,
    canReply,
    commentDisabledMessage,
    replyTargetId,
    replyTargetComment,
    onStartReply: startReply,
    onCancelReply: cancelReply,
    penColor,
    penSize,
    onToolChange: handleToolChange,
    onUndo: () => handleUndo(currentSec, setError),
    onClearAnnotations: () => handleClearAnnotations(setError),
    onPenColorChange: setPenColor,
    onPenSizeChange: setPenSize,
    videoRef,
    playbackVersion: activeVersion,
    playbackUrl,
    videoStatus,
    isPlaying,
    currentSec,
    durationSec,
    annotations: visibleAnnotations,
    pendingAnnotations: visiblePendingAnnotations,
    onCreateAnnotation: (annotation: Parameters<typeof handleCreateAnnotation>[0]) =>
      handleCreateAnnotation(annotation),
    onSelectAnnotation: (annotationId: string) => handleSelectAnnotation(annotationId, pauseAt),
    onDeleteAnnotation: (annotationId: string) => handleDeleteAnnotation(annotationId, setError),
    onClearSelection: () => setActiveCommentId(null),
    onPlayPause: handlePlayPause,
    onSeek: seekTo,
    onTimeUpdate: handleTimeUpdate,
    onLoadedMetadata: handleLoadedMetadata,
    onLoadedData: handleLoadedData,
    onDurationChange: handleDurationChange,
    onCanPlay: handleCanPlay,
    onError: () => handleVideoError(handleError),
    onPlay: handlePlay,
    onPause: handlePause,
    onEnded: handleEnded,
    versionComments,
    onCommentSeek: (sec: number) => handleCommentSeek(sec, pauseAt),
    onSelectComment: (comment: ReviewComment) => handleSelectComment(comment, pauseAt),
    draftBody,
    onDraftBodyChange: setDraftBody,
    onSubmitComment: () => handleSubmitComment(setError),
    pending: pending || revisionPending,
    activeCommentId,
    onDeleteComment: canDeleteComment ? (commentId: string) => handleDeleteComment(commentId, setError) : undefined,
    onSetCommentStatus: canSetCommentStatus
      ? (commentId: string, status: Parameters<typeof handleSetCommentStatus>[1]) =>
          handleSetCommentStatus(commentId, status, setError)
      : undefined,
    deletedToast,
    sortedVersions,
    activeVersion,
    orderId: order.id,
    projectId: order.project_id,
    orderStatus: reviewPhase,
    reviewCompleted,
    onSelectVersion: handleSelectVersion,
    onRequestRevision: handleRequestRevision,
    onApproveSuccess: handleApproveSuccess,
    onApproveError: handleApproveError,
    onOrderStatusChange: handleOrderStatusChange,
    revisionPending,
    fileRef,
    uploadUI,
    versionReadyState,
    onFileInputChange,
    onUploadFile,
    onCancelUpload: cancelUpload,
    onOpenPicker: openFilePicker,
    replaceUploadVersion,
    videoPlaybackFailed: videoStatus === "error",
    onRevertUpload: role === "creator" ? handleRevertUpload : undefined,
    revertPending,
    onViewReviewRecords: handleRequestBrandReview,
    brandReviewRequestPending,
    canRevertUpload: canRevertCurrentUpload,
    paidRevisionSlotsUnlocked,
    onUnlockPaidRevision: role === "brand" ? handleUnlockPaidRevision : undefined,
    unlockPending
  };

  const layoutHeader = isFocusMode ? (
    <ReviewerFocusHeader
      locale={locale}
      theme={focusTheme}
      onThemeChange={setFocusTheme}
      onExit={exitFocusMode}
      errorMessage={error}
      onDismissError={() => setError(null)}
    />
  ) : (
    <ReviewerShellHeader
      locale={locale}
      backHref={backHref}
      backLabel={backLabel}
      focusMode={false}
      onEnterFocusMode={enterFocusMode}
      errorMessage={error}
      onDismissError={() => setError(null)}
      info={headerInfo}
    />
  );
  const paymentInvoiceAmountLabel = paymentInvoice
    ? new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en-US", {
        style: "currency",
        currency: paymentInvoice.currency
      }).format(paymentInvoice.shortfallAmount)
    : "";
  const paymentInvoiceTotalLabel = paymentInvoice
    ? new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en-US", {
        style: "currency",
        currency: paymentInvoice.currency
      }).format(paymentInvoice.addOnAmount)
    : "";

  return (
    <>
      {reviewNotice ? (
        <div className="pointer-events-none fixed left-1/2 top-1/2 z-[60] w-max max-w-[420px] -translate-x-1/2 -translate-y-1/2">
          <ReviewerReviewSuccessToast
            message={reviewNotice.message}
            description={reviewNotice.description}
            variant={reviewNotice.variant}
          />
        </div>
      ) : null}
      <Dialog open={Boolean(paymentInvoice)} onOpenChange={(open) => !open && setPaymentInvoice(null)}>
        <DialogContent className="w-[min(92vw,460px)] overflow-hidden rounded-3xl border-0 bg-white p-0 shadow-[0_24px_60px_rgba(15,23,42,0.24)]">
          <div className="px-6 pb-5 pt-7 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
              <CreditCard className="h-7 w-7" strokeWidth={2.2} />
            </div>
            <DialogHeader className="mt-5 items-center space-y-0 text-center">
              <DialogTitle className="text-lg font-semibold tracking-tight text-zinc-950">
                {locale === "zh" ? "加购修订付款账单" : "Paid Revision Invoice"}
              </DialogTitle>
              <DialogDescription className="mt-3 max-w-[320px] text-sm leading-6 text-zinc-500">
                {locale === "zh"
                  ? "品牌账户余额不足，系统已自动拉起本次加购付款账单。完成支付后将立即解锁第 4–5 轮修订。"
                  : "Your brand account balance is insufficient, so VINCIS opened this add-on payment invoice. Payment unlocks rounds 4-5 immediately."}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6 space-y-4 rounded-2xl border border-zinc-100 bg-zinc-50 p-4 text-left">
              <div className="space-y-1">
                <span className="text-xs font-medium text-zinc-500">
                  {locale === "zh" ? "账单编号" : "Invoice"}
                </span>
                <p className="break-all text-sm font-semibold leading-5 text-zinc-800">
                  {paymentInvoice?.invoiceId ?? "-"}
                </p>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-medium text-zinc-500">
                  {locale === "zh" ? "加购费用" : "Add-on fee"}
                </span>
                <span className="shrink-0 text-sm font-semibold text-zinc-950">{paymentInvoiceTotalLabel}</span>
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-zinc-200/70 pt-4">
                <span className="text-xs font-medium text-zinc-500">
                  {locale === "zh" ? "需支付金额" : "Amount due"}
                </span>
                <span className="shrink-0 text-2xl font-semibold text-violet-700">{paymentInvoiceAmountLabel}</span>
              </div>
            </div>
          </div>
          <DialogFooter className="grid grid-cols-2 gap-3 border-t border-zinc-100 px-5 py-4 sm:space-x-0">
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-600 shadow-sm transition hover:bg-zinc-50"
              onClick={() => setPaymentInvoice(null)}
            >
              {locale === "zh" ? "取消" : "Cancel"}
            </button>
            <button
              type="button"
              disabled={unlockPending}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-violet-600 px-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(124,58,237,0.24)] transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={handlePayRevisionInvoice}
            >
              {unlockPending
                ? locale === "zh"
                  ? "支付中..."
                  : "Paying..."
                : stripeCheckoutEnabled
                  ? locale === "zh"
                    ? "Stripe 付款"
                    : "Pay with Stripe"
                  : locale === "zh"
                    ? "立即支付"
                    : "Pay now"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ReviewerReviewLayout
        shell={isFocusMode ? "focus" : "portal"}
        focusTheme={focusTheme}
        header={layoutHeader}
        {...layoutProps}
      />
    </>
  );
}
