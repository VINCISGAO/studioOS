"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LoaderCircle, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { adminApiJson } from "@/lib/studioos/admin-api-client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type AdminAiModel = {
  id: string;
  internalModelId: string;
  displayName: string;
  provider: string;
  category: string;
  enabled: boolean;
  recommended: boolean;
  isDefault: boolean;
  baseCreditPrice: number | null;
  pricingRuleCount: number;
  pricingRules: Array<{
    id: string;
    mode: string | null;
    label: string | null;
    durationSec: number | null;
    resolution: string | null;
    creditPrice: number;
    marginPercent: number | null;
  }>;
};

const CATEGORY_TABS = ["ALL", "VIDEO", "IMAGE", "MUSIC", "VOICE", "THREE_D"] as const;

export function AdminAiModelsPanel({ locale }: { locale: "zh" | "en" }) {
  const zh = locale === "zh";
  const [models, setModels] = useState<AdminAiModel[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORY_TABS)[number]>("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/credits/ai-models");
    const payload = (await response.json()) as { success: boolean; data?: { models: AdminAiModel[] } };
    if (response.ok && payload.success && payload.data) {
      setModels(payload.data.models);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return models.filter((model) => {
      if (category !== "ALL" && model.category !== category) return false;
      if (!q) return true;
      return (
        model.displayName.toLowerCase().includes(q) ||
        model.internalModelId.toLowerCase().includes(q) ||
        model.provider.toLowerCase().includes(q)
      );
    });
  }, [models, query, category]);

  const selected = filtered.find((model) => model.id === selectedId) ?? filtered[0] ?? null;

  async function toggleEnabled(model: AdminAiModel) {
    setBusy(model.id);
    setError(null);
    const result = await adminApiJson(`/api/admin/credits/ai-models/${model.id}`, {
      method: "PATCH",
      json: { enabled: !model.enabled }
    });
    if (!result.ok) {
      setError(result.errorMessage);
    }
    await load();
    setBusy(null);
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 xl:col-span-2">
          {error}
        </p>
      ) : null}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {CATEGORY_TABS.map((tab) => (
            <Button
              key={tab}
              size="sm"
              variant={category === tab ? "default" : "outline"}
              onClick={() => setCategory(tab)}
            >
              {tab === "ALL" ? (zh ? "全部" : "All") : tab}
            </Button>
          ))}
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-9"
            placeholder={zh ? "搜索模型 / Provider" : "Search models / providers"}
          />
        </div>
        <Card className="border-zinc-200/80 shadow-none">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{zh ? "模型" : "Model"}</TableHead>
                  <TableHead>{zh ? "类型" : "Type"}</TableHead>
                  <TableHead>{zh ? "基础价" : "Base"}</TableHead>
                  <TableHead>{zh ? "规则" : "Rules"}</TableHead>
                  <TableHead>{zh ? "状态" : "Status"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((model) => (
                  <TableRow
                    key={model.id}
                    className={selected?.id === model.id ? "bg-zinc-50" : "cursor-pointer"}
                    onClick={() => setSelectedId(model.id)}
                  >
                    <TableCell>
                      <div className="font-medium text-zinc-900">{model.displayName}</div>
                      <div className="text-xs text-zinc-500">
                        {model.provider} · {model.internalModelId}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{model.category}</TableCell>
                    <TableCell className="tabular-nums">{model.baseCreditPrice ?? "—"}</TableCell>
                    <TableCell className="tabular-nums">{model.pricingRuleCount}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant={model.enabled ? "default" : "secondary"}>
                          {model.enabled ? "Enabled" : "Disabled"}
                        </Badge>
                        {model.recommended ? <Badge variant="outline">Recommended</Badge> : null}
                        {model.pricingRuleCount === 0 ? (
                          <Badge variant="destructive">{zh ? "缺规则" : "Missing rules"}</Badge>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card className="border-zinc-200/80 shadow-none">
        <CardContent className="space-y-4 p-5">
          {selected ? (
            <>
              <div>
                <h3 className="text-lg font-semibold text-zinc-950">{selected.displayName}</h3>
                <p className="mt-1 text-sm text-zinc-500">
                  {selected.provider} · {selected.internalModelId}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  disabled={busy === selected.id || (selected.pricingRuleCount === 0 && !selected.enabled)}
                  onClick={() => void toggleEnabled(selected)}
                >
                  {busy === selected.id ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : selected.enabled ? (
                    zh ? "停用模型" : "Disable model"
                  ) : (
                    zh ? "启用模型" : "Enable model"
                  )}
                </Button>
              </div>
              <div>
                <h4 className="mb-2 text-sm font-medium text-zinc-900">
                  {zh ? "Pricing Rules" : "Pricing rules"}
                </h4>
                <div className="space-y-2">
                  {selected.pricingRules.map((rule) => (
                    <div key={rule.id} className="rounded-xl border border-zinc-200 px-3 py-2 text-sm">
                      <div className="font-medium text-zinc-900">{rule.label ?? rule.mode ?? rule.id}</div>
                      <div className="mt-1 text-xs text-zinc-500">
                        {rule.durationSec ? `${rule.durationSec}s · ` : ""}
                        {rule.resolution ?? "—"} · {rule.creditPrice} Token
                        {rule.marginPercent != null ? ` · ${rule.marginPercent}% margin` : ""}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-zinc-500">{zh ? "暂无模型" : "No models found"}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
