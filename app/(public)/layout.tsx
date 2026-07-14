import { PublicLayout } from "@/components/layouts/public-layout";

/** Route group `(public)` — `/brands/*`, `/creators/*` public profiles. */
export default function PublicRouteGroupLayout({ children }: { children: React.ReactNode }) {
  return <PublicLayout useUrlLocale>{children}</PublicLayout>;
}
