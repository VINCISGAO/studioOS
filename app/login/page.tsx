import { redirect } from "next/navigation";
import { LoginPageShell, type LoginPageCopy } from "@/components/studioos/login-page-shell";
import { isDemoLoginUiEnabled } from "@/lib/can-persist-local-store";
import { resolvePostLoginDestination, toSafeNextPath } from "@/lib/auth/post-login-redirect";
import { hasSupabaseConfig } from "@/lib/auth-config";
import { getAppUiLocale } from "@/lib/app-language";
import type { Locale, SearchParams } from "@/lib/i18n";
import { getCurrentSession } from "@/lib/session-user";
import type { LoginRole } from "@/lib/studioos/login-theme";

type LoginPageProps = {
  searchParams: Promise<SearchParams & { error?: string; site?: string; role?: string; next?: string; email?: string }>;
};

const copy: Record<Locale, LoginPageCopy & { configError: string; unsupported: string; wrongRoleHint: string }> = {
  en: {
    welcome: "Welcome back",
    brandLoginTitle: "Welcome back",
    welcomeSubtitleBrand: "Sign in in three simple steps.",
    creatorWelcome: "Welcome back",
    creatorWelcomeSubtitle: "Sign in in three simple steps.",
    brandTab: "Brand",
    creatorTab: "Creator",
    brandHeroLine1: "Connect global creators",
    brandHeroLine2: "Creativity without borders",
    brandHeroHighlight: "Creativity without borders",
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
    brandLogos: ["GOOGLE", "COCA-COLA", "SAMSUNG", "NIKE"],
    email: "Enter email",
    emailPlaceholder: "you@company.com",
    password: "Password",
    passwordPlaceholder: "Enter password",
    rememberMe: "Remember me",
    forgotPassword: "Forgot password?",
    login: "Sign in",
    socialDivider: "Or continue with",
    noAccount: "",
    signUp: "",
    configError: "Add Supabase environment keys to enable authentication.",
    unsupported: "This login provider is not configured yet.",
    wrongRoleHint: "This account belongs to the other role. Switch tabs or use a matching demo account.",
    rights: "All rights reserved."
  },
  zh: {
    welcome: "欢迎回来",
    brandLoginTitle: "欢迎回来",
    welcomeSubtitleBrand: "简单三步完成登录",
    creatorWelcome: "欢迎回来",
    creatorWelcomeSubtitle: "简单三步完成登录",
    brandTab: "广告主",
    creatorTab: "创作者",
    brandHeroLine1: "连接全球创作者",
    brandHeroLine2: "让创意没有边界",
    brandHeroHighlight: "让创意没有边界",
    brandHeroSubtitle: "从想法到交付，一站完成高质量广告制作",
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
    creatorHeroSubtitle: "加入全球创作者社区，让优秀作品连接更多可能",
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
    brandLogos: ["GOOGLE", "COCA-COLA", "SAMSUNG", "NIKE"],
    email: "输入邮箱",
    emailPlaceholder: "you@company.com",
    password: "密码",
    passwordPlaceholder: "输入密码",
    rememberMe: "记住我",
    forgotPassword: "忘记密码？",
    login: "登录",
    socialDivider: "或使用其他方式快速进入",
    noAccount: "",
    signUp: "",
    configError: "请配置 Supabase 环境密钥以启用登录。",
    unsupported: "该登录方式尚未配置。",
    wrongRoleHint: "该账号属于另一种身份，请切换标签或使用对应演示账号。",
    rights: "保留所有权利。"
  }
};

function resolveLoginRole(raw?: string): LoginRole {
  return raw === "creator" ? "creator" : "brand";
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
  if (rawError === "wrong-role" || rawError === "admin-required") {
    return t.wrongRoleHint;
  }
  try {
    return decodeURIComponent(rawError.replace(/\+/g, " "));
  } catch {
    return rawError;
  }
}

function resolveLoginErrorCode(rawError: string | undefined) {
  if (
    rawError === "wrong-role" ||
    rawError === "auth-config" ||
    rawError === "unsupported-provider" ||
    rawError === "admin-required"
  ) {
    return rawError;
  }
  return undefined;
}

function resolveNextPath(raw: SearchParams["next"]) {
  const value = typeof raw === "string" ? raw : Array.isArray(raw) ? (raw[0] ?? "") : "";
  if (!value) {
    return "";
  }

  try {
    return toSafeNextPath(decodeURIComponent(value.replace(/\+/g, " ")));
  } catch {
    return toSafeNextPath(value);
  }
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const locale = await getAppUiLocale();
  const nextPath = resolveNextPath(params.next);

  const t = copy[locale];
  const rawError = typeof params.error === "string" ? params.error : undefined;
  const session = await getCurrentSession();
  const role = resolveLoginRole(typeof params.role === "string" ? params.role : undefined);

  const demoMode = isDemoLoginUiEnabled();
  const googleOAuthEnabled = hasSupabaseConfig();
  const googleOneTapClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ?? "";

  if (session && (session.role === "client" || session.role === "creator") && !rawError) {
    redirect(resolvePostLoginDestination(session, nextPath, locale));
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
      googleOneTapClientId={googleOneTapClientId}
      t={t}
    />
  );
}
