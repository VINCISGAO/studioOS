"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ExternalLink, Loader2, UploadCloud } from "lucide-react";
import {
  createReviewVersionAction,
  ensureReviewSessionAction
} from "@/app/review-engine-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import type { StoredOrder } from "@/lib/order-types";
import type { ReviewSession } from "@/lib/review-engine/types";
import { reviewSessionStatusLabel } from "@/lib/review-engine/types";
import { cn } from "@/lib/utils";

const copy = {
  en: {
    orderInfo: "Order",
    uploadTitle: "Upload review version",
    versionNotes: "Version notes",
    upload: "Upload Review Version",
    createVersion: "Create New Version",
    viewRoom: "View Review Room",
    status: "Upload status",
    transcoding: "Frame.io is processing your video. The brand will be notified when ready.",
    ready: "Ready for brand review.",
    demo: "Demo mode — Frame.io credentials not configured. Uploads are simulated locally.",
    pickFile: "Choose MP4 file",
    noSession: "Create a review session to begin.",
    history: "Version history"
  },
  zh: {
    orderInfo: "订单",
    uploadTitle: "上传审片版",
    versionNotes: "版本说明",
    upload: "上传审片版",
    createVersion: "创建新版本",
    viewRoom: "查看审片室",
    status: "上传状态",
    transcoding: "Frame.io 正在转码，就绪后将通知品牌方。",
    ready: "已就绪，品牌方可审片。",
    demo: "演示模式 — 未配置 Frame.io 凭证，上传在本地模拟。",
    pickFile: "选择 MP4 文件",
    noSession: "请先创建审片 Session。",
    history: "版本历史"
  }
};

export function CreatorReviewUploadPanel({
  locale,
  order,
  session,
  sessions,
  demoMode
}: {
  locale: Locale;
  order: StoredOrder;
  session: ReviewSession | null;
  sessions: ReviewSession[];
  demoMode: boolean;
}) {
  const t = copy[locale];
  const fileRef = useRef<HTMLInputElement>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const canUpload = ["in_production", "revision", "review"].includes(order.status);
  const activeSession = session;
  const canCreateVersion =
    activeSession &&
    ["approved", "changes_requested", "failed"].includes(activeSession.status);

  function handleEnsureSession() {
    startTransition(async () => {
      setError(null);
      const result = await ensureReviewSessionAction(order.id, locale);
      if (!result.ok) {
        setError(result.error);
      }
    });
  }

  function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file || !activeSession) {
      setError(locale === "zh" ? "请选择 MP4 文件" : "Select an MP4 file");
      return;
    }

    startTransition(async () => {
      setError(null);
      const formData = new FormData();
      formData.set("reviewSessionId", activeSession.id);
      formData.set("file", file);
      if (notes.trim()) {
        formData.set("versionNotes", notes);
      }

      const res = await fetch("/api/review/upload", { method: "POST", body: formData });
      const result = (await res.json()) as { ok: boolean; error?: string };

      if (!res.ok || !result.ok) {
        setError(result.error ?? (locale === "zh" ? "上传失败" : "Upload failed"));
        return;
      }

      setNotes("");
      if (fileRef.current) {
        fileRef.current.value = "";
      }
      window.location.reload();
    });
  }

  function handleNewVersion() {
    startTransition(async () => {
      setError(null);
      const result = await createReviewVersionAction(order.id, notes, locale);
      if (!result.ok) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      {demoMode ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {t.demo}
        </div>
      ) : null}

      <Card className="shadow-none">
        <CardContent className="p-6">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{t.orderInfo}</p>
          <h2 className="mt-2 text-xl font-semibold">{order.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{order.client_name}</p>
        </CardContent>
      </Card>

      {!activeSession ? (
        <Card className="shadow-none">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">{t.noSession}</p>
            <Button className="mt-4" disabled={pending || !canUpload} onClick={handleEnsureSession}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {locale === "zh" ? "创建审片 Session" : "Create review session"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-none">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold">{t.uploadTitle}</h3>
              <StatusPill locale={locale} status={activeSession.status} />
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <Label htmlFor="version-notes">{t.versionNotes}</Label>
                <Textarea
                  id="version-notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="mt-2 min-h-[88px]"
                  placeholder={locale === "zh" ? "本版修改说明…" : "What changed in this version…"}
                />
              </div>

              <div>
                <Label htmlFor="review-file">{t.pickFile}</Label>
                <input
                  ref={fileRef}
                  id="review-file"
                  type="file"
                  accept="video/mp4,.mp4"
                  className="mt-2 block w-full text-sm"
                  disabled={!canUpload || pending || activeSession.status === "uploading"}
                />
              </div>

              {error ? <p className="text-sm text-destructive">{error}</p> : null}

              <div className="flex flex-wrap gap-3">
                <Button
                  disabled={pending || !canUpload || activeSession.status === "uploading"}
                  onClick={handleUpload}
                >
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                  {t.upload}
                </Button>

                {canCreateVersion ? (
                  <Button variant="outline" disabled={pending} onClick={handleNewVersion}>
                    {t.createVersion}
                  </Button>
                ) : null}

                {activeSession.frame_review_link ? (
                  <Button asChild variant="outline">
                    <Link href={activeSession.frame_review_link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                      {t.viewRoom}
                    </Link>
                  </Button>
                ) : null}
              </div>

              {activeSession.status === "transcoding" ? (
                <p className="text-sm text-muted-foreground">{t.transcoding}</p>
              ) : null}
              {activeSession.status === "ready_for_review" ? (
                <p className="text-sm text-emerald-600">{t.ready}</p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      )}

      {sessions.length ? (
        <Card className="shadow-none">
          <CardContent className="p-6">
            <h3 className="font-semibold">{t.history}</h3>
            <ul className="mt-4 space-y-2">
              {sessions.map((item) => (
                <li key={item.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                  <span>
                    V{item.version_number} · {item.title}
                  </span>
                  <StatusPill locale={locale} status={item.status} small />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function StatusPill({
  locale,
  status,
  small
}: {
  locale: Locale;
  status: ReviewSession["status"];
  small?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-0.5 font-medium",
        small ? "text-[10px]" : "text-xs",
        status === "ready_for_review" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
        status === "approved" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
        status === "changes_requested" && "border-amber-500/30 bg-amber-500/10 text-amber-800",
        status === "failed" && "border-red-500/30 bg-red-500/10 text-red-700",
        (status === "uploading" || status === "transcoding") &&
          "border-blue-500/30 bg-blue-500/10 text-blue-700",
        status === "pending_upload" && "border-zinc-300 bg-zinc-50 text-zinc-600"
      )}
    >
      {reviewSessionStatusLabel(status, locale)}
    </span>
  );
}
