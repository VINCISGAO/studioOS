"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";
import { Download, Loader2, Lock, PackageCheck } from "lucide-react";
import { downloadFinalDeliveryAction } from "@/app/brand-delivery-actions";
import { markAsFinalDeliveryAction } from "@/app/studio-delivery-actions";
import type { CampaignDeliveryView } from "@/features/delivery/delivery.service";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

function PanelSubmitButton({
  variant = "default",
  className,
  children
}: {
  variant?: "outline" | "default";
  className?: string;
  children: ReactNode;
}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant={variant} size="sm" disabled={pending} className={className}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
    </Button>
  );
}

export function ReviewDeliveryFinalPanel({
  locale,
  role,
  orderId,
  projectId,
  activeVersion,
  orderApproved,
  delivery,
  className
}: {
  locale: Locale;
  role: "brand" | "creator";
  orderId: string;
  projectId?: string | null;
  activeVersion: number;
  orderApproved: boolean;
  delivery: CampaignDeliveryView | null;
  className?: string;
}) {
  if (role === "creator") {
    if (!orderApproved) return null;

    if (delivery) {
      return (
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800",
            className
          )}
        >
          <PackageCheck className="h-4 w-4 shrink-0" />
          {locale === "zh"
            ? `Version ${delivery.versionNumber} 已标记为最终版，等待品牌下载`
            : `Version ${delivery.versionNumber} marked final — awaiting brand download`}
        </div>
      );
    }

    return (
      <form action={markAsFinalDeliveryAction} className={cn("flex items-center gap-2", className)}>
        <input type="hidden" name="lang" value={locale} />
        <input type="hidden" name="order_id" value={orderId} />
        {projectId ? <input type="hidden" name="project_id" value={projectId} /> : null}
        <input type="hidden" name="version_number" value={activeVersion} />
        <span className="text-xs text-zinc-500">
          {locale === "zh" ? `Version ${activeVersion}` : `Version ${activeVersion}`}
        </span>
        <PanelSubmitButton className="bg-[#5B5CFF] hover:bg-[#4a4bef]">
          <PackageCheck className="h-4 w-4" />
          {locale === "zh" ? "标记为最终版" : "Mark as final"}
        </PanelSubmitButton>
      </form>
    );
  }

  if (!delivery) return null;

  if (delivery.status === "LOCKED") {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700",
          className
        )}
      >
        <Lock className="h-4 w-4 shrink-0" />
        {locale === "zh"
          ? `Version ${delivery.versionNumber} 已下载，交付已锁定，等待结算`
          : `Version ${delivery.versionNumber} downloaded — delivery locked, awaiting settlement`}
      </div>
    );
  }

  return (
    <form action={downloadFinalDeliveryAction} className={cn("flex items-center gap-2", className)}>
      <input type="hidden" name="lang" value={locale} />
      <input type="hidden" name="order_id" value={orderId} />
      {projectId ? <input type="hidden" name="project_id" value={projectId} /> : null}
      <span className="text-xs text-zinc-500">
        {locale === "zh"
          ? `Version ${delivery.versionNumber} 最终成片`
          : `Version ${delivery.versionNumber} final delivery`}
      </span>
      <PanelSubmitButton className="bg-emerald-600 hover:bg-emerald-700">
        <Download className="h-4 w-4" />
        {locale === "zh" ? "下载成片" : "Download final"}
      </PanelSubmitButton>
    </form>
  );
}
