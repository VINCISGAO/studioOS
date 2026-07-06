import { NextResponse } from "next/server";
import { adminLedgerService } from "@/features/admin/ledger/admin-ledger.service";
import { requireAdminAuthUser } from "@/features/admin/auth/admin-api-guard";
import { handleRouteError } from "@/lib/core/api-route";

export async function GET(request: Request) {
  try {
    const user = await requireAdminAuthUser(request);
    const url = new URL(request.url);
    const filters = {
      userId: url.searchParams.get("userId") ?? undefined,
      campaignId: url.searchParams.get("campaignId") ?? undefined,
      entryType: url.searchParams.get("entryType") ?? undefined,
      search: url.searchParams.get("search") ?? undefined,
      from: url.searchParams.get("from") ?? undefined,
      to: url.searchParams.get("to") ?? undefined,
      limit: 5000
    };

    const { items } = await adminLedgerService.list(user, filters);
    const csv = adminLedgerService.toCsv(items);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="ledger-export-${Date.now()}.csv"`,
        "Cache-Control": "no-store",
        Pragma: "no-cache"
      }
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
