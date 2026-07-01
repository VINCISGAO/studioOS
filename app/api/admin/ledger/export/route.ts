import { NextResponse } from "next/server";
import { adminLedgerService } from "@/features/admin/ledger/admin-ledger.service";
import { getSessionUser } from "@/features/auth/session.service";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
      "Content-Disposition": `attachment; filename="ledger-export-${Date.now()}.csv"`
    }
  });
}
