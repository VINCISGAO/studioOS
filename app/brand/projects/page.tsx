import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { DEMO_SESSION_COOKIE } from "@/lib/auth-config";
import { parseDemoSession } from "@/lib/demo-auth";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { listOrdersForClient } from "@/lib/order-service";
import { listProjectsForClient } from "@/lib/project-service";
import { toBrandProjectRows } from "@/lib/studioos/brand-dashboard";
import { BrandProjectsBoard } from "@/components/studioos/brand-projects-board";

export default async function BrandProjectsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
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

  return <BrandProjectsBoard locale={locale} rows={rows} />;
}
