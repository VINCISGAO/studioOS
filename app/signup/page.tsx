import Link from "next/link";
import { redirect } from "next/navigation";
import { signUpMvpAction } from "@/app/signup-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoginLanguageSwitcher } from "@/components/studioos/login-language-switcher";
import { MarketingHomeLink } from "@/components/studioos/marketing-home-link";
import { hasSupabaseConfig } from "@/lib/auth-config";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import { getLocale, type Locale, type SearchParams, withLocale } from "@/lib/i18n";
import { getLoginVisual, type LoginRole } from "@/lib/studioos/login-theme";
import { studioOS } from "@/lib/studioos/vocabulary";
import { cn } from "@/lib/utils";
import { Clapperboard, Globe2, LockKeyhole, Mail, Sparkles, UserRound } from "lucide-react";

type SignUpParams = SearchParams & { error?: string; role?: string };

const copy = {
  en: {
    brandTitle: "Create advertiser account",
    creatorTitle: "Create creator account",
    brandSubtitle: "Start building campaigns, matching creators, and managing delivery in StudioOS.",
    creatorSubtitle: "Build your creator profile and start receiving commercial opportunities.",
    brandTab: "Brand",
    creatorTab: "Creator",
    name: "Name",
    namePlaceholder: "Your name",
    company: "Company name",
    companyPlaceholder: "Your company or brand",
    creatorNamePlaceholder: "Your creator or studio name",
    email: "Email",
    emailPlaceholder: "you@company.com",
    password: "Password",
    passwordPlaceholder: "At least 8 characters",
    submit: "Create account",
    haveAccount: "Already have an account?",
    login: "Sign in",
    rights: "All rights reserved.",
    disabled: "Registration is not available until database authentication is configured."
  },
  zh: {
    brandTitle: "广告主注册",
    creatorTitle: "创作者注册",
    brandSubtitle: "创建账号后即可发布广告需求、匹配创作者、管理交付。",
    creatorSubtitle: "创建创作者主页，开始接收品牌合作机会。",
    brandTab: "广告主",
    creatorTab: "创作者",
    name: "姓名",
    namePlaceholder: "你的姓名",
    company: "公司 / 品牌名称",
    companyPlaceholder: "你的公司或品牌",
    creatorNamePlaceholder: "你的创作者或 Studio 名称",
    email: "邮箱",
    emailPlaceholder: "you@company.com",
    password: "密码",
    passwordPlaceholder: "至少 8 位字符",
    submit: "立即注册",
    haveAccount: "已有账号？",
    login: "去登录",
    rights: "保留所有权利。",
    disabled: "数据库认证未配置，暂时无法注册账号。"
  }
};

function resolveRole(raw?: string): LoginRole {
  return raw === "creator" ? "creator" : "brand";
}

function roleHref(locale: Locale, role: LoginRole) {
  return `/signup?lang=${locale}&role=${role}`;
}

function decodeError(raw?: string) {
  if (!raw) return null;
  try {
    return decodeURIComponent(raw.replace(/\+/g, " "));
  } catch {
    return raw;
  }
}

export default async function SignUpPage({
  searchParams
}: {
  searchParams: Promise<SignUpParams>;
}) {
  const params = await searchParams;
  const locale = getLocale(params);
  const role = resolveRole(typeof params.role === "string" ? params.role : undefined);
  const t = copy[locale];
  const visual = getLoginVisual(role);
  const isBrand = role === "brand";
  const error = decodeError(typeof params.error === "string" ? params.error : undefined);
  const signupEnabled = hasDatabaseUrl() || hasSupabaseConfig();

  if (!signupEnabled) {
    redirect(withLocale("/login", locale));
  }

  return (
    <main className="relative min-h-[100dvh] overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${visual.bg})` }} aria-hidden />
      <div className="absolute inset-0" style={{ background: visual.overlay }} aria-hidden />

      <div className={cn("relative z-10 flex min-h-[100dvh] flex-col", visual.panelText)}>
        <header className="mx-auto flex w-full max-w-[1320px] items-center justify-between px-5 py-5 sm:px-8 sm:py-6 lg:px-10 xl:px-12">
          <MarketingHomeLink locale={locale} className="inline-flex items-center gap-2.5">
            <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", isBrand ? "bg-white text-zinc-950" : "bg-zinc-950 text-white")}>
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold tracking-tight">{studioOS.productName}</span>
          </MarketingHomeLink>

          <div className="flex items-center gap-2">
            <Globe2 className={cn("hidden h-4 w-4 sm:block", isBrand ? "text-zinc-400" : "text-zinc-500")} />
            <LoginLanguageSwitcher locale={locale} compact={isBrand} />
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-[1320px] flex-1 items-center justify-center px-5 pb-8 sm:px-8 lg:px-10 lg:pb-12 xl:px-12">
          <section className="w-full max-w-[520px]">
            <div className={cn("rounded-[1.35rem] p-5 sm:p-8 lg:p-9", visual.card)}>
              <h1 className={cn("text-2xl font-semibold tracking-[-0.03em] sm:text-[1.85rem]", visual.cardTitle)}>
                {isBrand ? t.brandTitle : t.creatorTitle}
              </h1>
              <p className={cn("mt-1 text-[13px] leading-5 sm:text-sm", visual.cardMuted)}>
                {isBrand ? t.brandSubtitle : t.creatorSubtitle}
              </p>

              <nav className={cn("mt-5 grid grid-cols-2 gap-1 rounded-xl sm:mt-6", visual.tabWrap)} aria-label={locale === "zh" ? "注册身份" : "Sign-up role"}>
                <Link
                  href={roleHref(locale, "brand")}
                  className={cn("flex items-center justify-center gap-2 rounded-[0.65rem] py-2 text-[13px] font-medium transition-all", isBrand ? visual.tabActive : visual.tabInactive)}
                >
                  <UserRound className="h-4 w-4" />
                  {t.brandTab}
                </Link>
                <Link
                  href={roleHref(locale, "creator")}
                  className={cn("flex items-center justify-center gap-2 rounded-[0.65rem] py-2 text-[13px] font-medium transition-all", !isBrand ? visual.tabActive : visual.tabInactive)}
                >
                  <Clapperboard className="h-4 w-4" />
                  {t.creatorTab}
                </Link>
              </nav>

              <form action={signUpMvpAction} className="mt-6 space-y-4">
                <input type="hidden" name="lang" value={locale} />
                <input type="hidden" name="role" value={role} />
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">{isBrand ? t.name : t.company}</Label>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 opacity-55" />
                    <Input id="name" name="name" placeholder={isBrand ? t.namePlaceholder : t.creatorNamePlaceholder} required className={visual.input} />
                  </div>
                </div>
                {isBrand ? (
                  <div className="space-y-2">
                    <Label htmlFor="company_name" className="text-sm font-medium">{t.company}</Label>
                    <div className="relative">
                      <Sparkles className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 opacity-55" />
                      <Input id="company_name" name="company_name" placeholder={t.companyPlaceholder} className={visual.input} />
                    </div>
                  </div>
                ) : null}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">{t.email}</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 opacity-55" />
                    <Input id="email" name="email" type="email" placeholder={t.emailPlaceholder} required className={visual.input} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">{t.password}</Label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 opacity-55" />
                    <Input id="password" name="password" type="password" minLength={8} placeholder={t.passwordPlaceholder} required className={visual.input} />
                  </div>
                </div>
                {error ? (
                  <p className={cn("rounded-xl border px-3 py-2 text-sm", isBrand ? "border-red-400/30 bg-red-500/10 text-red-300" : "border-red-200 bg-red-50 text-red-600")}>
                    {error}
                  </p>
                ) : null}
                <Button type="submit" className={visual.btn}>
                  {t.submit}
                </Button>
              </form>

              <p className={cn("mt-6 text-center text-sm", visual.cardMuted)}>
                {t.haveAccount}{" "}
                <Link href={withLocale(`/login?role=${role}`, locale)} className={cn("font-medium", visual.link)}>
                  {t.login}
                </Link>
              </p>
            </div>

            <p className={cn("mt-5 text-center text-xs", visual.panelMuted)}>
              © {new Date().getFullYear()} {studioOS.productName}. {t.rights}
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
