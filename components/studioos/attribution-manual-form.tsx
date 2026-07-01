"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { bindDeliverablePerformanceAction } from "@/app/creative-intelligence-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Locale } from "@/lib/i18n";
import type { CreativePerformanceRecord } from "@/lib/studioos/creative-performance-types";
import { cn } from "@/lib/utils";

const HOOK_TYPES = [
  { id: "first_person", en: "First person", zh: "第一人称" },
  { id: "product_macro", en: "Product macro", zh: "产品特写" },
  { id: "ugc_handheld", en: "Handheld UGC", zh: "手持 UGC" },
  { id: "question", en: "Question", zh: "提问式" },
  { id: "voiceover", en: "Voiceover", zh: "旁白" }
] as const;

type Deliverable = {
  id: string;
  version: number;
  notes?: string;
};

type Props = {
  locale: Locale;
  orderId: string;
  deliverable: Deliverable;
  defaultCategory: string;
  linked?: CreativePerformanceRecord;
  compact?: boolean;
  copy: {
    manualAdvanced: string;
    platform: string;
    update: string;
    bind: string;
    saved: string;
  };
};

export function AttributionManualForm({
  locale,
  orderId,
  deliverable,
  defaultCategory,
  linked,
  compact,
  copy: t
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleManualSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    const fd = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await bindDeliverablePerformanceAction(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSuccess(true);
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={handleManualSubmit}
      className={cn("space-y-4 p-5 sm:p-6", compact && "p-4 sm:p-5")}
    >
      <input type="hidden" name="lang" value={locale} />
      <input type="hidden" name="order_id" value={orderId} />
      <input type="hidden" name="deliverable_id" value={deliverable.id} />
      <input type="hidden" name="deliverable_version" value={String(deliverable.version)} />
      <input type="hidden" name="name" value={deliverable.notes ?? `v${deliverable.version}`} />
      <input type="hidden" name="category" value={defaultCategory} />

      <p className="text-sm text-zinc-500">{t.manualAdvanced}</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label>{t.platform}</Label>
          <select name="platform" className="h-10 rounded-md border px-3 text-sm" defaultValue="tiktok">
            <option value="tiktok">TikTok</option>
            <option value="youtube">YouTube</option>
            <option value="meta">Meta</option>
            <option value="manual">{locale === "zh" ? "手动" : "Manual"}</option>
          </select>
        </div>
        <div className="grid gap-2">
          <Label>{locale === "zh" ? "广告 ID" : "Ad ID"}</Label>
          <Input name="platform_ad_id" placeholder="tiktok_ad_001" required />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="grid gap-2">
          <Label>CTR (%)</Label>
          <Input name="ctr" type="number" step="0.1" defaultValue={linked?.metrics.ctr ?? 2.5} />
        </div>
        <div className="grid gap-2">
          <Label>Hook score</Label>
          <Input name="hook_score" type="number" defaultValue={linked?.metrics.hook_score ?? 75} />
        </div>
        <div className="grid gap-2">
          <Label>{locale === "zh" ? "完播率 (%)" : "Completion (%)"}</Label>
          <Input
            name="completion_rate"
            type="number"
            step="0.1"
            defaultValue={linked?.metrics.completion_rate ?? 45}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label>{locale === "zh" ? "Hook 类型" : "Hook type"}</Label>
          <select name="hook_type" className="h-10 rounded-md border px-3 text-sm" defaultValue="first_person">
            {HOOK_TYPES.map((item) => (
              <option key={item.id} value={item.id}>
                {item[locale]}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <Label>{locale === "zh" ? "时长 (秒)" : "Length (sec)"}</Label>
          <Input name="length_sec" type="number" defaultValue={linked?.tags.length_sec ?? 15} />
        </div>
      </div>

      <input type="hidden" name="style_presets" value="ugc,cinematic" />
      <input type="hidden" name="aspect_ratio" value="9:16" />
      <input type="hidden" name="watch_time_sec" value={String(linked?.metrics.watch_time_sec ?? 8)} />
      <input type="hidden" name="engagement_rate" value={String(linked?.metrics.engagement_rate ?? 5)} />
      <input type="hidden" name="conversion_rate" value={String(linked?.metrics.conversion_rate ?? 2)} />
      <input type="hidden" name="roas" value={String(linked?.metrics.roas ?? 2)} />
      <input type="hidden" name="spend_usd" value={String(linked?.spend_usd ?? 400)} />
      <input type="hidden" name="impressions" value={String(linked?.impressions ?? 50000)} />

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{t.saved}</p> : null}

      <Button type="submit" disabled={isPending} className="rounded-lg bg-zinc-900 hover:bg-zinc-800">
        {linked ? t.update : t.bind}
      </Button>
    </form>
  );
}
