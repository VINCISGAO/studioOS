"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Copy, LoaderCircle, Plus, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminApiJson } from "@/lib/studioos/admin-api-client";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";
import { SUPPORTED_PACKAGE_REGIONS } from "@/lib/credits/regional-package.constants";
import { withLocale } from "@/lib/i18n";

type RegionalPriceRow = {
  id: string;
  regionCode: string;
  currency: string;
  amountMinor: number;
  displayAmount: string;
  bonusCredits: number;
  stripePriceId: string | null;
  active: boolean;
  version: number;
  startsAt: string | null;
  endsAt: string | null;
};

type PackageSummary = {
  id: string;
  name: string;
  version: number;
  credits: number;
  bonusCredits: number;
  enabled: boolean;
  visible: boolean;
};

export function AdminRegionalPackagePricingPanel({
  locale,
  packageId
}: {
  locale: "zh" | "en";
  packageId: string;
}) {
  const zh = locale === "zh";
  const [pkg, setPkg] = useState<PackageSummary | null>(null);
  const [rows, setRows] = useState<RegionalPriceRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validation, setValidation] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [draftRegion, setDraftRegion] = useState("EU");
  const [draftAmount, setDraftAmount] = useState("900");

  const load = useCallback(async () => {
    const result = await adminApiJson<{
      package: PackageSummary;
      regionalPrices: RegionalPriceRow[];
    }>(`/api/admin/credits/packages/${packageId}/regional-pricing`);
    if (result.ok && result.payload.data) {
      setPkg(result.payload.data.package);
      setRows(result.payload.data.regionalPrices);
      setError(null);
      return;
    }
    setError(result.errorMessage);
  }, [packageId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createRegionalPrice() {
    setBusy("create");
    const result = await adminApiJson(`/api/admin/credits/packages/${packageId}/regional-pricing`, {
      method: "POST",
      json: {
        regionCode: draftRegion,
        amountMinor: Number(draftAmount),
        bonusCredits: 0,
        enabled: false
      }
    });
    setBusy(null);
    if (!result.ok) {
      setError(result.errorMessage);
      return;
    }
    await load();
  }

  async function toggleActive(row: RegionalPriceRow) {
    setBusy(row.id);
    const result = await adminApiJson(
      `/api/admin/credits/packages/${packageId}/regional-pricing/${row.id}`,
      { method: "PATCH", json: { enabled: !row.active } }
    );
    setBusy(null);
    if (!result.ok) setError(result.errorMessage);
    await load();
  }

  async function validateFallback() {
    setBusy("validate");
    const result = await adminApiJson<{ ok: boolean; issues: Array<{ message: string }> }>(
      `/api/admin/credits/packages/${packageId}/regional-pricing/validate`
    );
    setBusy(null);
    if (result.ok && result.payload.data) {
      setValidation(
        result.payload.data.issues.length
          ? result.payload.data.issues.map((issue) => issue.message).join(" · ")
          : zh
            ? "GLOBAL 回退校验通过"
            : "GLOBAL fallback validation passed"
      );
    } else {
      setError(result.errorMessage);
    }
  }

  async function previewRegion(regionCode: string) {
    setBusy(`preview-${regionCode}`);
    const result = await adminApiJson<{
      displayAmount: string;
      totalCredits: number;
      pricingSource: string;
    }>(`/api/admin/credits/packages/${packageId}/regional-pricing/preview`, {
      method: "POST",
      json: { regionCode }
    });
    setBusy(null);
    if (result.ok && result.payload.data) {
      setPreview(
        `${regionCode}: ${result.payload.data.displayAmount} · ${result.payload.data.totalCredits} Token · ${result.payload.data.pricingSource}`
      );
    } else {
      setError(result.errorMessage);
    }
  }

  async function duplicateToRegion(row: RegionalPriceRow, targetRegionCode: string) {
    setBusy(`dup-${row.id}`);
    const result = await adminApiJson(
      `/api/admin/credits/packages/${packageId}/regional-pricing/${row.id}/duplicate`,
      { method: "POST", json: { targetRegionCode } }
    );
    setBusy(null);
    if (!result.ok) setError(result.errorMessage);
    await load();
  }

  return (
    <div className="space-y-4">
      <Link href={withLocale(adminPortalRoutes.creditsPackages, locale)} className="text-sm text-zinc-500 underline">
        {zh ? "返回套餐列表" : "Back to packages"}
      </Link>

      {pkg ? (
        <Card>
          <CardContent className="grid gap-2 p-5 text-sm">
            <div className="text-lg font-semibold text-zinc-950">{pkg.name}</div>
            <div className="text-zinc-500">
              {pkg.credits} Token · v{pkg.version} · {pkg.enabled ? "Enabled" : "Disabled"}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p> : null}
      {validation ? <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">{validation}</p> : null}
      {preview ? <p className="rounded-lg bg-violet-50 px-4 py-3 text-sm text-violet-900">{preview}</p> : null}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" disabled={busy === "validate"} onClick={() => void validateFallback()}>
          <ShieldCheck className="h-4 w-4" />
          {zh ? "回退校验" : "Validate fallback"}
        </Button>
        <select
          value={draftRegion}
          onChange={(event) => setDraftRegion(event.target.value)}
          className="h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm"
        >
          {SUPPORTED_PACKAGE_REGIONS.map((region) => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </select>
        <Input value={draftAmount} onChange={(event) => setDraftAmount(event.target.value)} className="w-32" />
        <Button type="button" disabled={busy === "create"} onClick={() => void createRegionalPrice()}>
          {busy === "create" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {zh ? "新增区域价" : "Add regional price"}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{zh ? "区域" : "Region"}</TableHead>
                <TableHead>{zh ? "币种" : "Currency"}</TableHead>
                <TableHead>{zh ? "金额" : "Amount"}</TableHead>
                <TableHead>Bonus</TableHead>
                <TableHead>Stripe</TableHead>
                <TableHead>{zh ? "状态" : "Status"}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.regionCode}</TableCell>
                  <TableCell>{row.currency}</TableCell>
                  <TableCell className="tabular-nums">{row.displayAmount}</TableCell>
                  <TableCell className="tabular-nums">{row.bonusCredits}</TableCell>
                  <TableCell className="max-w-[120px] truncate text-xs">{row.stripePriceId ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={row.active ? "default" : "secondary"}>
                      {row.active ? "Active" : "Disabled"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" disabled={Boolean(busy)} onClick={() => void previewRegion(row.regionCode)}>
                        {zh ? "预览" : "Preview"}
                      </Button>
                      <Button size="sm" variant="outline" disabled={Boolean(busy)} onClick={() => void duplicateToRegion(row, "JP")}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button size="sm" disabled={busy === row.id} onClick={() => void toggleActive(row)}>
                        {row.active ? (zh ? "停用" : "Disable") : zh ? "启用" : "Enable"}
                      </Button>
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
