"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Copy, Eye, LoaderCircle, Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { adminApiJson } from "@/lib/studioos/admin-api-client";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";
import { withLocale } from "@/lib/i18n";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type AdminPackage = {
  id: string;
  name: string;
  slug: string | null;
  version: number;
  versionLabel: string | null;
  credits: number;
  bonusCredits: number;
  totalCredits: number;
  displayPrice: string;
  currency: string;
  amountMinor: number;
  regionCodes: string[];
  membershipTier: string | null;
  visible: boolean;
  isDefault: boolean;
  enabled: boolean;
  sortOrder: number;
};

export function AdminCreditPackagesPanel({ locale }: { locale: "zh" | "en" }) {
  const zh = locale === "zh";
  const [packages, setPackages] = useState<AdminPackage[]>([]);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/credits/packages");
    const payload = (await response.json()) as { success: boolean; data?: { packages: AdminPackage[] } };
    if (response.ok && payload.success && payload.data) {
      setPackages(payload.data.packages);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return packages;
    return packages.filter(
      (pkg) =>
        pkg.name.toLowerCase().includes(q) ||
        (pkg.slug ?? "").toLowerCase().includes(q) ||
        (pkg.versionLabel ?? "").toLowerCase().includes(q)
    );
  }, [packages, query]);

  async function toggleEnabled(pkg: AdminPackage) {
    setBusy(pkg.id);
    setError(null);
    const result = await adminApiJson(`/api/admin/credits/packages/${pkg.id}`, {
      method: "PATCH",
      json: { enabled: !pkg.enabled, visible: !pkg.enabled ? true : pkg.visible }
    });
    if (!result.ok) setError(result.errorMessage);
    await load();
    setBusy(null);
  }

  async function duplicatePackage(pkg: AdminPackage) {
    setBusy(`dup-${pkg.id}`);
    setError(null);
    const result = await adminApiJson(`/api/admin/credits/packages/${pkg.id}/duplicate`, { method: "POST" });
    if (!result.ok) setError(result.errorMessage);
    await load();
    setBusy(null);
  }

  async function showPreview(pkg: AdminPackage) {
    setBusy(`preview-${pkg.id}`);
    const response = await fetch(`/api/admin/credits/packages/${pkg.id}/preview`);
    const payload = (await response.json()) as { success: boolean; data?: { totalCredits: number; displayPrice: string } };
    if (response.ok && payload.success && payload.data) {
      setPreview(
        `${pkg.name}: ${payload.data.totalCredits} Credits · ${payload.data.displayPrice}${
          pkg.regionCodes.length ? ` · ${pkg.regionCodes.join(", ")}` : ""
        }`
      );
    }
    setBusy(null);
  }

  async function createStarterDraft() {
    setBusy("create");
    setError(null);
    const result = await adminApiJson("/api/admin/credits/packages", {
      method: "POST",
      json: {
        name: "Starter",
        versionLabel: "Starter Draft",
        credits: 500,
        bonusCredits: 50,
        amountMinor: 500,
        currency: "USD",
        visible: false,
        enabled: false,
        sortOrder: 99,
        regionCodes: ["US"]
      }
    });
    if (!result.ok) setError(result.errorMessage);
    await load();
    setBusy(null);
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
            className="pl-9"
            placeholder={zh ? "搜索套餐 / 版本 / 区域" : "Search packages / versions / regions"}
          />
        </div>
        <Button type="button" disabled={busy === "create"} onClick={() => void createStarterDraft()}>
          {busy === "create" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {zh ? "新增草稿" : "New draft"}
        </Button>
      </div>

      {preview ? (
        <Card className="border-zinc-200/80 shadow-none">
          <CardContent className="p-4 text-sm text-zinc-700">{preview}</CardContent>
        </Card>
      ) : null}

      <Card className="border-zinc-200/80 shadow-none">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{zh ? "套餐" : "Package"}</TableHead>
                <TableHead>{zh ? "Credits" : "Credits"}</TableHead>
                <TableHead>{zh ? "价格" : "Price"}</TableHead>
                <TableHead>{zh ? "区域" : "Regions"}</TableHead>
                <TableHead>{zh ? "状态" : "Status"}</TableHead>
                <TableHead className="text-right">{zh ? "操作" : "Actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((pkg) => (
                <TableRow key={pkg.id}>
                  <TableCell>
                    <div className="font-medium text-zinc-900">{pkg.name}</div>
                    <div className="text-xs text-zinc-500">
                      {pkg.versionLabel ?? `V${pkg.version}`}
                      {pkg.slug ? ` · ${pkg.slug}` : ""}
                      {pkg.isDefault ? " · default" : ""}
                    </div>
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {pkg.credits}
                    {pkg.bonusCredits ? ` + ${pkg.bonusCredits}` : ""}
                  </TableCell>
                  <TableCell className="tabular-nums">{pkg.displayPrice}</TableCell>
                  <TableCell className="text-xs">
                    {pkg.regionCodes.length ? pkg.regionCodes.join(", ") : zh ? "全球" : "Global"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant={pkg.enabled ? "default" : "secondary"}>
                        {pkg.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                      {pkg.visible ? <Badge variant="outline">Visible</Badge> : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={withLocale(adminPortalRoutes.creditsPackageRegionalPricing(pkg.id), locale)}
                        className="text-xs text-violet-700 underline"
                      >
                        {zh ? "区域价" : "Regional"}
                      </Link>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={Boolean(busy)}
                        onClick={() => void showPreview(pkg)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={Boolean(busy)}
                        onClick={() => void duplicatePackage(pkg)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant={pkg.enabled ? "secondary" : "default"}
                        disabled={busy === pkg.id}
                        onClick={() => void toggleEnabled(pkg)}
                      >
                        {busy === pkg.id ? (
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                        ) : pkg.enabled ? (
                          zh ? "停用" : "Disable"
                        ) : (
                          zh ? "启用" : "Enable"
                        )}
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
