import Link from "next/link";
import { cookies } from "next/headers";
import { BrandLogoLockup } from "@/components/brand-logo-mark";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import { DEMO_SESSION_COOKIE } from "@/lib/auth-config";
import { parseDemoSession } from "@/lib/demo-auth";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";

const navText = {
  en: {
    studios: "Studios",
    howItWorks: "How it works",
    pricing: "Pricing",
    signIn: "Sign in",
    signOut: "Sign out",
    brandPortal: "Brand portal",
    studioPortal: "Studio portal",
    admin: "Admin"
  },
  zh: {
    studios: "Studio 作品库",
    howItWorks: "如何运作",
    pricing: "价格",
    signIn: "登录",
    signOut: "退出",
    brandPortal: "Brand 门户",
    studioPortal: "创作者",
    admin: "管理后台"
  }
};

async function getNavSession() {
  const cookieStore = await cookies();
  const session = parseDemoSession(cookieStore.get(DEMO_SESSION_COOKIE)?.value);
  return { session };
}

export async function SiteHeader({ locale }: { locale: Locale }) {
  const t = navText[locale];
  const { session } = await getNavSession();

  const accountLink = !session
    ? { href: "/login?role=brand", label: t.signIn }
    : session.role === "client"
      ? { href: "/brand", label: t.brandPortal }
      : session.role === "creator"
        ? { href: "/studio", label: t.studioPortal }
        : { href: "/admin", label: t.admin };

  const links = [
    { href: "/creators", label: t.studios },
    { href: "/how-it-works", label: t.howItWorks },
    { href: "/pricing", label: t.pricing },
    accountLink
  ];

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href={withLocale("/", locale)} className="flex items-center gap-2 text-sm font-semibold">
          <BrandLogoLockup
            contrastOn="light"
            markClassName="h-8 w-8 rounded-lg shadow-sm"
            wordmarkClassName="h-[17px] w-[106px]"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-1 rounded-md border bg-white/70 p-1 text-sm text-muted-foreground shadow-sm backdrop-blur md:flex">
          {links.map((link) => (
            <Link key={link.href} href={withLocale(link.href, locale)} className="hover:text-foreground">
              <span className="block rounded px-3 py-1.5 hover:bg-white">{link.label}</span>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher locale={locale} />
          {session ? (
            <form action="/auth/sign-out" method="post">
              <input type="hidden" name="lang" value={locale} />
              <Button type="submit" variant="outline" size="sm">
                {t.signOut}
              </Button>
            </form>
          ) : (
            <Button asChild size="sm" variant="outline" className="md:hidden">
              <Link href={withLocale("/login?role=brand", locale)}>{t.signIn}</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
