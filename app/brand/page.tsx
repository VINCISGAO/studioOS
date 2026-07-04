import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { BrandWorkspaceOverview } from "@/components/studioos/brand-workspace-overview";
import { DEMO_SESSION_COOKIE } from "@/lib/auth-config";
import { DEMO_USERS, parseDemoSession } from "@/lib/demo-auth";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { getBrandProfileByEmail } from "@/lib/brand-profile-service";
import { listOrdersForClient } from "@/lib/order-service";
import { listProjectsForClient } from "@/lib/project-service";
import { toBrandProjectRows } from "@/lib/studioos/brand-dashboard";

function fallbackDisplayName(email: string): string {
  const demo = DEMO_USERS.find((user) => user.email === email.toLowerCase());
  if (demo) {
    return (
      demo.label
        .split(" ")[0]
        ?.replace(/[()（）]/g, "")
        .replace(/\s*\(brand\)/i, "")
        .trim() ?? demo.label
    );
  }
  return email.split("@")[0] ?? "there";
}

function brandDisplayName(email: string, profile: Awaited<ReturnType<typeof getBrandProfileByEmail>>) {
  return profile?.display_name.trim() || profile?.company_name.trim() || fallbackDisplayName(email);
}

export default async function BrandHomePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const query = await searchParams;
  const locale = getLocale(query);
  const cookieStore = await cookies();
  const session = parseDemoSession(cookieStore.get(DEMO_SESSION_COOKIE)?.value);

  if (!session || session.role !== "client") {
    redirect(withLocale("/login?role=brand", locale));
  }

  const clientEmail = session.email.toLowerCase();
  const profile = await getBrandProfileByEmail(clientEmail);
  const orders = await listOrdersForClient(clientEmail);
  const projects = await listProjectsForClient(clientEmail);
  const rows = toBrandProjectRows(orders, projects, locale);
  const orderProjectMap = Object.fromEntries(orders.map((order) => [order.id, order.project_id]));
  const startBriefError =
    query.error === "wizard-access"
      ? locale === "zh"
        ? "无法打开该广告草稿。系统已阻止访问不属于当前账号的草稿，请重新点击发布广告需求。"
        : "Could not open that ad draft. StudioOS blocked access to a draft outside this account. Click Publish ad brief again."
      : query.error === "start-brief" || query.error === "draft-failed"
      ? locale === "zh"
        ? "广告需求草稿创建失败，请刷新后重试。如果仍失败，请检查 production database。"
        : "Could not create the ad brief draft. Refresh and try again. If it still fails, check the production database."
      : null;

  return (
    <div className="space-y-4">
      {startBriefError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {startBriefError}
        </div>
      ) : null}
      <BrandWorkspaceOverview
        locale={locale}
        name={brandDisplayName(clientEmail, profile)}
        rows={rows}
        orderProjectMap={orderProjectMap}
      />
    </div>
  );
}
