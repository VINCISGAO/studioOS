"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { LoaderCircle, ShieldCheck, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { adminApiJson } from "@/lib/studioos/admin-api-client";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";
import { withLocale } from "@/lib/i18n";

type RuleDetail = {
  id: string;
  model: string;
  provider: string;
  generationType: "IMAGE" | "VIDEO" | "MUSIC";
  mode: string | null;
  durationSec: number | null;
  resolution: string | null;
  aspectRatio: string | null;
  outputCount: number;
  providerCostMinor: number | null;
  creditPrice: number;
  marginPercent: number | null;
  marginAmountMinor: number | null;
  status: "DRAFT" | "VALIDATED" | "PUBLISHED" | "ARCHIVED";
  version: number;
  changeReason: string | null;
  internalNotes: string | null;
  startsAt: string | null;
  endsAt: string | null;
};

type ValidationResult = {
  ok: boolean;
  issues: Array<{ code: string; message: string; severity: "error" | "warning" }>;
};

export function AdminPricingRuleEditor({ locale, ruleId }: { locale: "zh" | "en"; ruleId: string }) {
  const zh = locale === "zh";
  const [rule, setRule] = useState<RuleDetail | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [simulation, setSimulation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const response = await fetch(`/api/admin/credits/pricing-rules/${ruleId}`);
    const payload = (await response.json()) as { success: boolean; data?: { rule: RuleDetail } };
    if (response.ok && payload.success && payload.data) setRule(payload.data.rule);
  }, [ruleId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    if (!rule) return;
    setBusy("save");
    setError(null);
    const result = await adminApiJson(`/api/admin/credits/pricing-rules/${ruleId}`, {
      method: "PATCH",
      json: rule
    });
    setBusy(null);
    if (!result.ok) {
      setError(result.errorMessage);
      return;
    }
    await load();
  }

  async function validateRule() {
    setBusy("validate");
    setError(null);
    const result = await adminApiJson<ValidationResult>(
      `/api/admin/credits/pricing-rules/${ruleId}/validate`,
      { method: "POST" }
    );
    if (result.payload.data) setValidation(result.payload.data);
    setBusy(null);
    if (!result.ok) {
      setError(result.errorMessage);
      return;
    }
    await load();
  }

  async function publishRule() {
    if (!rule) return;
    const confirmed = window.confirm(
      zh
        ? `确认发布 v${rule.version} 定价规则？发布后会影响新的 Canvas 报价。`
        : `Publish pricing rule v${rule.version}? This affects new Canvas quotes.`
    );
    if (!confirmed) return;
    setBusy("publish");
    setError(null);
    const result = await adminApiJson(`/api/admin/credits/pricing-rules/${ruleId}/publish`, {
      method: "POST",
      json: {
        confirm: true,
        idempotencyKey: crypto.randomUUID()
      }
    });
    setBusy(null);
    if (!result.ok) {
      setError(result.errorMessage);
      return;
    }
    await load();
  }

  async function simulate() {
    if (!rule) return;
    setBusy("simulate");
    setError(null);
    const result = await adminApiJson<{
      current: { credits: number };
      draft: { credits: number } | null;
      deltaCredits: number;
      deltaPercent: number | null;
    }>("/api/admin/credits/pricing-rules/simulate", {
      method: "POST",
      json: {
        type: rule.generationType,
        model: rule.model,
        draftRuleId: rule.status === "PUBLISHED" ? undefined : rule.id,
        parameters: {
          duration: rule.durationSec ?? 5,
          quality: rule.resolution ?? "720p",
          aspectRatio: rule.aspectRatio ?? "auto",
          outputs: rule.outputCount
        }
      }
    });
    if (result.ok && result.payload.data) {
      const data = result.payload.data;
      const current = data.current.credits;
      const draft = data.draft?.credits ?? current;
      setSimulation(
        zh
          ? `当前 ${current} Token · 草稿 ${draft} Token · 变化 ${data.deltaCredits} (${data.deltaPercent ?? 0}%)`
          : `Current ${current} · Draft ${draft} · Delta ${data.deltaCredits} (${data.deltaPercent ?? 0}%)`
      );
    } else {
      setError(result.errorMessage);
    }
    setBusy(null);
  }

  if (!rule) {
    return (
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <LoaderCircle className="h-4 w-4 animate-spin" />
        {zh ? "加载规则…" : "Loading rule…"}
      </div>
    );
  }

  const readOnly = rule.status === "PUBLISHED" || rule.status === "ARCHIVED";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link href={withLocale(adminPortalRoutes.creditsPricing, locale)} className="text-sm text-zinc-500 underline">
          {zh ? "返回列表" : "Back to list"}
        </Link>
        <Badge>{rule.status}</Badge>
        <span className="text-sm text-zinc-500">v{rule.version}</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{zh ? "基础条件" : "Conditions"}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Input value={rule.model} disabled readOnly />
            <Input
              value={rule.mode ?? ""}
              disabled={readOnly}
              placeholder="Mode"
              onChange={(event) => setRule({ ...rule, mode: event.target.value || null })}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                value={rule.durationSec ?? ""}
                disabled={readOnly}
                placeholder="Duration (s)"
                onChange={(event) =>
                  setRule({ ...rule, durationSec: event.target.value ? Number(event.target.value) : null })
                }
              />
              <Input
                value={rule.resolution ?? ""}
                disabled={readOnly}
                placeholder="Resolution"
                onChange={(event) => setRule({ ...rule, resolution: event.target.value || null })}
              />
            </div>
            <Input
              value={rule.aspectRatio ?? ""}
              disabled={readOnly}
              placeholder="Aspect ratio"
              onChange={(event) => setRule({ ...rule, aspectRatio: event.target.value || null })}
            />
            <Input
              type="number"
              value={rule.outputCount}
              disabled={readOnly}
              onChange={(event) => setRule({ ...rule, outputCount: Number(event.target.value) || 1 })}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{zh ? "成本与售价" : "Cost & price"}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Input
              type="number"
              value={rule.providerCostMinor ?? ""}
              disabled={readOnly}
              placeholder="Provider cost (minor)"
              onChange={(event) =>
                setRule({ ...rule, providerCostMinor: event.target.value ? Number(event.target.value) : null })
              }
            />
            <Input
              type="number"
              value={rule.creditPrice}
              disabled={readOnly}
              onChange={(event) => setRule({ ...rule, creditPrice: Number(event.target.value) || 1 })}
            />
            <div className="rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
              {zh ? "毛利" : "Margin"}: {rule.marginPercent ?? "—"}% · {rule.marginAmountMinor ?? "—"} minor
            </div>
            <Textarea
              value={rule.changeReason ?? ""}
              disabled={readOnly}
              placeholder={zh ? "修改原因" : "Change reason"}
              onChange={(event) => setRule({ ...rule, changeReason: event.target.value })}
            />
            <Textarea
              value={rule.internalNotes ?? ""}
              disabled={readOnly}
              placeholder={zh ? "内部备注" : "Internal notes"}
              onChange={(event) => setRule({ ...rule, internalNotes: event.target.value })}
            />
          </CardContent>
        </Card>
      </div>

      {validation ? (
        <Card>
          <CardContent className="space-y-2 p-4 text-sm">
            {validation.issues.map((issue) => (
              <p key={issue.code} className={issue.severity === "error" ? "text-red-700" : "text-amber-700"}>
                {issue.message}
              </p>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      ) : null}

      {simulation ? <p className="rounded-lg bg-violet-50 px-4 py-3 text-sm text-violet-900">{simulation}</p> : null}

      <div className="flex flex-wrap gap-2">
        {!readOnly ? (
          <Button type="button" onClick={() => void save()} disabled={busy === "save"}>
            {busy === "save" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            {zh ? "保存草稿" : "Save draft"}
          </Button>
        ) : null}
        {!readOnly ? (
          <Button type="button" variant="outline" onClick={() => void validateRule()} disabled={busy === "validate"}>
            <ShieldCheck className="h-4 w-4" />
            {zh ? "验证" : "Validate"}
          </Button>
        ) : null}
        {rule.status === "VALIDATED" ? (
          <Button type="button" onClick={() => void publishRule()} disabled={busy === "publish"}>
            <Zap className="h-4 w-4" />
            {zh ? "发布" : "Publish"}
          </Button>
        ) : null}
        <Button type="button" variant="secondary" onClick={() => void simulate()} disabled={busy === "simulate"}>
          {zh ? "价格模拟" : "Simulate price"}
        </Button>
      </div>
    </div>
  );
}
