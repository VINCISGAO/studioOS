import { redirect } from "next/navigation";
import { LoginPageShell, type LoginPageCopy } from "@/components/studioos/login-page-shell";
import { isDemoLoginUiEnabled, preferDemoAuth } from "@/lib/can-persist-local-store";
import { resolvePostLoginDestination } from "@/lib/auth/post-login-redirect";
import { hasSupabaseConfig } from "@/lib/auth-config";
import { type DemoRole } from "@/lib/demo-auth";
import { getLocale, type Locale, type SearchParams, withLocale } from "@/lib/i18n";
import { getCurrentSession } from "@/lib/session-user";
import type { LoginRole } from "@/lib/studioos/login-theme";

type LoginPageProps = {
  searchParams: Promise<SearchParams & { error?: string; site?: string; role?: string; next?: string; email?: string }>;
};

const copy: Record<Locale, LoginPageCopy & { configError: string; unsupported: string; wrongRoleHint: string }> = {
  en: {
    welcome: "Welcome back",
    brandLoginTitle: "Advertiser sign in",
    welcomeSubtitleBrand: "Sign in to StudioOS Advertiser Center",
    creatorWelcome: "Creator sign in",
    creatorWelcomeSubtitle: "Sign in to StudioOS Creator Center",
    brandTab: "Brand",
    creatorTab: "Creator",
    brandHeroLine1: "Lowest budget",
    brandHeroLine2: "Hollywood-level ads",
    brandHeroHighlight: "Hollywood-level",
    brandHeroSubtitle:
      "AI matches global creators — from brief and production to review and delivery, all in one place.",
    brandFeatures: [
      {
        title: "Precision creator matching",
        description:
          "Find the right team automatically by industry, style, budget, and portfolio history.",
        icon: "target"
      },
      {
        title: "Cinema-grade ad production",
        description: "Access top global directors, cinematographers, and AIGC creator teams.",
        icon: "clapperboard"
      },
      {
        title: "Escrow payment protection",
        description: "Funds held in escrow, online review, and verified delivery — transparent at every step.",
        icon: "shield"
      }
    ],
    creatorHeroLine1: "Creativity deserves to be seen",
    creatorHeroLine2: "Talent deserves to be fulfilled",
    creatorHeroHighlightLine1: "seen",
    creatorHeroHighlightLine2: "fulfilled",
    creatorHeroSubtitle: "Join a global creator community and connect great work with more opportunities.",
    creatorFeatures: [
      {
        title: "Global projects",
        description: "Collaborate with brands around the world",
        icon: "users"
      },
      {
        title: "Showcase your work",
        description: "Build your portfolio and get more exposure",
        icon: "trending"
      },
      {
        title: "Fair collaboration",
        description: "Clear workflows that protect creator rights",
        icon: "shield"
      }
    ],
    brandLogos: ["GOOGLE", "COCA-COLA", "P&G", "SAMSUNG", "NIKE"],
    email: "Email",
    emailPlaceholder: "you@company.com",
    password: "Password",
    passwordPlaceholder: "Enter password",
    rememberMe: "Remember me",
    forgotPassword: "Forgot password?",
    login: "Sign in",
    socialDivider: "Or sign in with a third-party account",
    noAccount: "Don't have an account?",
    signUp: "Sign up",
    configError: "Add Supabase environment keys to enable authentication.",
    unsupported: "This login provider is not configured yet.",
    wrongRoleHint: "This account belongs to the other role. Switch tabs or use a matching demo account.",
    rights: "All rights reserved."
  },
  zh: {
    welcome: "欢迎回来",
    brandLoginTitle: "广告主登录",
    welcomeSubtitleBrand: "登录 StudioOS 广告主中心",
    creatorWelcome: "创作者登录",
    creatorWelcomeSubtitle: "登录 StudioOS 创作者中心",
    brandTab: "广告主",
    creatorTab: "创作者",
    brandHeroLine1: "最低的预算",
    brandHeroLine2: "好莱坞级别的广告",
    brandHeroHighlight: "好莱坞级别",
    brandHeroSubtitle: "AI 智能匹配全球创作者，从 Brief、制作、审片到交付，一站完成高质量广告制作。",
    brandFeatures: [
      {
        title: "精准匹配创作者",
        description: "根据行业、风格、预算与历史作品，自动找到最适合你的团队。",
        icon: "target"
      },
      {
        title: "电影级广告制作",
        description: "覆盖全球优秀导演、摄影、AIGC创作者团队。",
        icon: "clapperboard"
      },
      {
        title: "托管支付保障",
        description: "资金托管、在线审片、验收交付，每一步都透明、安全。",
        icon: "shield"
      }
    ],
    creatorHeroLine1: "创意值得被看见",
    creatorHeroLine2: "才华值得被成就",
    creatorHeroHighlightLine1: "被看见",
    creatorHeroHighlightLine2: "被成就",
    creatorHeroSubtitle: "加入全球创作者社区，让优秀作品连接更多可能。",
    creatorFeatures: [
      {
        title: "连接全球项目",
        description: "与世界各地的广告主合作",
        icon: "users"
      },
      {
        title: "展示你的作品",
        description: "建立个人作品集，获得更多曝光",
        icon: "trending"
      },
      {
        title: "公平透明的合作",
        description: "清晰流程，保障创作者权益",
        icon: "shield"
      }
    ],
    brandLogos: ["GOOGLE", "COCA-COLA", "P&G", "SAMSUNG", "NIKE"],
    email: "邮箱",
    emailPlaceholder: "you@company.com",
    password: "密码",
    passwordPlaceholder: "输入密码",
    rememberMe: "记住我",
    forgotPassword: "忘记密码？",
    login: "登录",
    socialDivider: "或使用第三方账号登录",
    noAccount: "还没有账号？",
    signUp: "立即注册",
    configError: "请配置 Supabase 环境密钥以启用登录。",
    unsupported: "该登录方式尚未配置。",
    wrongRoleHint: "该账号属于另一种身份，请切换标签或使用对应演示账号。",
    rights: "保留所有权利。"
  }
};

function resolveLoginRole(raw?: string): LoginRole {
  return raw === "creator" ? "creator" : "brand";
}

function redirectIfAlreadySignedIn(
  session: { email: string; role: DemoRole } | null,
  role: LoginRole,
  nextPath: string,
  locale: Locale
) {
  if (!session) {
    return;
  }

  const destination = resolvePostLoginDestination(session, nextPath, locale);

  if (role === "brand" && session.role === "client") {
    redirect(destination);
  }

  if (role === "creator" && (session.role === "creator" || session.role === "admin")) {
    redirect(destination);
  }

  if (role === "brand" && session.role === "admin") {
    redirect(destination);
  }
}

function resolveLoginErrorMessage(
  rawError: string | undefined,
  t: { configError: string; unsupported: string; wrongRoleHint: string }
) {
  if (!rawError) {
    return undefined;
  }
  if (rawError === "auth-config") {
    return t.configError;
  }
  if (rawError === "unsupported-provider") {
    return t.unsupported;
  }
  if (rawError === "wrong-role") {
    return t.wrongRoleHint;
  }
  try {
    return decodeURIComponent(rawError.replace(/\+/g, " "));
  } catch {
    return rawError;
  }
}

function resolveLoginErrorCode(rawError: string | undefined) {
  if (rawError === "wrong-role" || rawError === "auth-config" || rawError === "unsupported-provider") {
    return rawError;
  }
  return undefined;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const locale = getLocale(params);
  const t = copy[locale];
  const role = resolveLoginRole(typeof params.role === "string" ? params.role : undefined);
  const nextPath = typeof params.next === "string" ? params.next : "";

  const demoMode = isDemoLoginUiEnabled();
  const googleOAuthEnabled = hasSupabaseConfig() && !preferDemoAuth();
  const rawError = typeof params.error === "string" ? params.error : undefined;
  const session = await getCurrentSession();

  if (session && !rawError) {
    redirect(resolvePostLoginDestination(session, nextPath, locale));
  }

  // Only bounce back when middleware sent the user here with ?next= — not when switching brand/creator tabs.
  if (demoMode && nextPath) {
    redirectIfAlreadySignedIn(session, role, nextPath, locale);
  }
  const initialEmail = typeof params.email === "string" ? params.email : "";
  const errorCode = resolveLoginErrorCode(rawError);
  const error = resolveLoginErrorMessage(rawError, t);

  return (
    <LoginPageShell
      locale={locale}
      role={role}
      nextPath={nextPath}
      initialEmail={initialEmail}
      error={error}
      errorCode={errorCode}
      demoMode={demoMode}
      googleOAuthEnabled={googleOAuthEnabled}
      t={t}
    />
  );
}
