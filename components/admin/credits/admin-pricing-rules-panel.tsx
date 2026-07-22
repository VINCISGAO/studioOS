"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Copy, LoaderCircle, Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminApiJson } from "@/lib/studioos/admin-api-client";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";
import { withLocale } from "@/lib/i18n";

type PricingRuleRow = {
  id: string;
  provider: string;
  model: string;
  generationType: "IMAGE" | "VIDEO" | "MUSIC";
  mode: string | null;
  durationSec: number | null;
  resolution: string | null;
  creditPrice: number;
  marginPercent: number | null;
  status: "DRAFT" | "VALIDATED" | "PUBLISHED" | "ARCHIVED";
  version: number;
  startsAt: string | null;
  publishedAt: string | null;
};

const statusVariant: Record<PricingRuleRow["status"], "default" | "secondary" | "outline" | "destructive"> = {
  DRAFT: "secondary",
  VALIDATED: "outline",
  PUBLISHED: "default",
  ARCHIVED: "destructive"
};

export function AdminPricingRulesPanel({ locale }: { locale: "zh" | "en" }) {
  const zh = locale === "zh";
  const [rules, setRules] = useState<PricingRuleRow[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (status) params.set("status", status);
    const response = await fetch(`/api/admin/credits/pricing-rules?${params.toString()}`);
    const payload = (await response.json()) as { success: boolean; data?: { rules: PricingRuleRow[] } };
    if (response.ok && payload.success && payload.data) setRules(payload.data.rules);
  }, [query, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => rules, [rules]);

  async function duplicateRule(rule: PricingRuleRow) {
    setBusy(`dup-${rule.id}`);
    setError(null);
    const result = await adminApiJson<{ id: string }>(
      `/api/admin/credits/pricing-rules/${rule.id}/duplicate`,
      { method: "POST" }
    );
    setBusy(null);
    if (result.ok && result.payload.data) {
      window.location.href = withLocale(`${adminPortalRoutes.creditsPricing}/${result.payload.data.id}`, locale);
      return;
    }
    setError(result.errorMessage);
    await load();
  }

  async function createDraft() {
    setBusy("create");
    setError(null);
    const result = await adminApiJson<{ id: string }>("/api/admin/credits/pricing-rules", {
      method: "POST",
      json: {
        provider: "vincis",
        model: "seedance-2.0",
        generationType: "VIDEO",
        creditPrice: 90,
        providerCostMinor: 5000,
        changeReason: zh ? "新建定价草稿" : "New pricing draft"
      }
    });
    setBusy(null);
    if (result.ok && result.payload.data) {
      window.location.href = withLocale(`${adminPortalRoutes.creditsPricing}/${result.payload.data.id}`, locale);
      return;
    }
    setError(result.errorMessage);
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={zh ? "搜索模型 / 供应商 / 备注" : "Search model / provider / notes"}
            className="pl-9"
          />
        </div>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm"
        >
          <option value="">{zh ? "全部状态" : "All statuses"}</option>
          <option value="DRAFT">DRAFT</option>
          <option value="VALIDATED">VALIDATED</option>
          <option value="PUBLISHED">PUBLISHED</option>
          <option value="ARCHIVED">ARCHIVED</option>
        </select>
        <Button type="button" onClick={() => void load()} variant="outline">
          {zh ? "刷新" : "Refresh"}
        </Button>
        <Button type="button" onClick={() => void createDraft()} disabled={busy === "create"}>
          {busy === "create" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {zh ? "新建草稿" : "New draft"}
        </Button>
      </div>

      <Card className="border-zinc-200/80 shadow-none">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{zh ? "模型" : "Model"}</TableHead>
                <TableHead>{zh ? "类型" : "Type"}</TableHead>
                <TableHead>{zh ? "模式" : "Mode"}</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>{zh ? "毛利率" : "Margin"}</TableHead>
                <TableHead>{zh ? "状态" : "Status"}</TableHead>
                <TableHead>{zh ? "版本" : "Version"}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>
                    <div className="font-medium text-zinc-900">{rule.model}</div>
                    <div className="text-xs text-zinc-500">{rule.provider}</div>
                  </TableCell>
                  <TableCell className="text-xs">{rule.generationType}</TableCell>
                  <TableCell className="text-xs">{rule.mode ?? "—"}</TableCell>
                  <TableCell className="tabular-nums font-medium">{rule.creditPrice}</TableCell>
                  <TableCell className="text-xs tabular-nums">
                    {rule.marginPercent != null ? `${rule.marginPercent}%` : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[rule.status]}>{rule.status}</Badge>
                  </TableCell>
                  <TableCell className="text-xs tabular-nums">v{rule.version}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={withLocale(`${adminPortalRoutes.creditsPricing}/${rule.id}`, locale)}
                        className="text-xs text-violet-700 underline"
                      >
                        {zh ? "编辑" : "Edit"}
                      </Link>
                      <button
                        type="button"
                        disabled={busy === `dup-${rule.id}`}
                        onClick={() => void duplicateRule(rule)}
                        className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-800"
                      >
                        {busy === `dup-${rule.id}` ? (
                          <LoaderCircle className="h-3 w-3 animate-spin" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        {zh ? "复制草稿" : "Duplicate"}
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
