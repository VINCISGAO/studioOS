import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { BrandWorkspaceOverview } from "@/components/studioos/brand-workspace-overview";
import { DEMO_SESSION_COOKIE } from "@/lib/auth-config";
import { DEMO_USERS, parseDemoSession } from "@/lib/demo-auth";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { listOrdersForClient } from "@/lib/order-service";
import { listProjectsForClient } from "@/lib/project-service";
import { toBrandProjectRows } from "@/lib/studioos/brand-dashboard";

function displayName(email: string): string {
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

export default async function BrandHomePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = getLocale(await searchParams);
  const cookieStore = await cookies();
  const session = parseDemoSession(cookieStore.get(DEMO_SESSION_COOKIE)?.value);

  if (!session || session.role !== "client") {
    redirect(withLocale("/login?role=brand", locale));
  }

  const clientEmail = session.email.toLowerCase();
  const orders = await listOrdersForClient(clientEmail);
  const projects = await listProjectsForClient(clientEmail);
  const rows = toBrandProjectRows(orders, projects, locale);
  const orderProjectMap = Object.fromEntries(orders.map((order) => [order.id, order.project_id]));

  return (
    <BrandWorkspaceOverview
      locale={locale}
      name={displayName(clientEmail)}
      rows={rows}
      orderProjectMap={orderProjectMap}
    />
  );
}
