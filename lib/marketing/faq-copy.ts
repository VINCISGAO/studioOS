import type { Locale } from "@/lib/i18n";

export type FaqCategoryId = "account" | "publish" | "creators" | "ai" | "payment" | "partners";

export type FaqItem = {
  question: string;
  answer: string;
  bullets?: string[];
};

export type FaqCategory = {
  id: FaqCategoryId;
  title: string;
  items: FaqItem[];
};

export type PublicLucienCopy = {
  welcome: string;
  identity: {
    guest: string;
    brand: string;
    creator: string;
    admin: string;
    support: string;
  };
  inputPlaceholder: string;
  close: string;
  loading: string;
  unavailable: string;
  requestFailed: string;
  loginHint: string;
  loginLabel: string;
  suggestions: string[];
};

export type FaqCopy = {
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
  };
  categories: FaqCategory[];
  cta: {
    title: string;
    contactLabel: string;
  };
  labels: {
    questionCount: string;
    totalQuestions: string;
  };
  publicLucien: PublicLucienCopy;
};

const zh: FaqCopy = {
  hero: {
    eyebrow: "常见问题",
    title: "你关心的问题，这里都有答案。",
    subtitle:
      "我们整理了最常见的问题，帮助你更好地了解 VINCIS。如果没有找到答案，可以随时联系我们。"
  },
  categories: [
    {
      id: "account",
      title: "账户与注册",
      items: [
        {
          question: "VINCIS 是什么？",
          answer:
            "VINCIS 是一个连接全球品牌与智能创作者的平台。品牌可以快速找到合适的创作者完成广告制作，创作者也能获得来自全球的真实商业项目。"
        },
        {
          question: "注册需要付费吗？",
          answer:
            "注册、浏览平台和完善个人资料均免费。部分智能专业功能及高级会员服务需要升级后使用。"
        },
        {
          question: "品牌和创作者需要注册不同账号吗？",
          answer:
            "需要分别注册。同一邮箱在注册时只能选择品牌方或创作者其中一种身份，注册后不能在同账号内切换。如需同时使用两种身份，请用不同邮箱分别注册。"
        }
      ]
    },
    {
      id: "publish",
      title: "发布项目",
      items: [
        {
          question: "如何发布一个项目？",
          answer:
            "进入品牌工作台，点击「发布项目」，填写需求、预算、交付时间等信息即可。系统会帮助整理需求并生成专业创意简报。"
        },
        {
          question: "为什么会给我预算建议？",
          answer:
            "VINCIS 不采用随机报价。系统会根据项目复杂度、视频时长、智能制作成本、创作者工时、修改次数以及历史成交数据，智能计算合理预算。"
        },
        {
          question: "我的预算低于系统建议怎么办？",
          answer:
            "仍然可以发布。但预算过低可能减少可匹配创作者数量，降低匹配成功率，并延长等待时间。"
        },
        {
          question: "为什么最多只能同时进行三个项目？",
          answer:
            "为了保证项目质量与创作者资源分配，每个品牌默认最多可同时进行三个项目。这样能够避免资源浪费，也提升项目成功率。"
        }
      ]
    },
    {
      id: "creators",
      title: "创作者",
      items: [
        {
          question: "创作者如何接单？",
          answer:
            "项目发布后，系统会根据专业能力、作品、报价、地区及项目需求智能匹配创作者，也支持品牌主动邀请。"
        },
        {
          question: "我可以拒绝项目吗？",
          answer: "可以。拒绝不会影响账号，但建议填写拒绝原因，帮助系统提供更精准的项目推荐。"
        },
        {
          question: "创作者如何获得付款？",
          answer: "项目完成并经品牌确认交付后，平台会自动释放托管资金，并结算至创作者账户。"
        }
      ]
    },
    {
      id: "ai",
      title: "智能功能",
      items: [
        {
          question: "智能助手会替我完成整个广告吗？",
          answer:
            "不会。智能助手更像一位创意顾问，它可以帮助整理需求、生成创意方向、推荐制作方案，并协助品牌与创作者提升效率。最终作品仍由专业创作者完成。"
        },
        {
          question: "为什么推荐这位创作者？",
          answer: "系统会综合分析以下维度，所有推荐都来自真实数据，而不是随机排序。",
          bullets: [
            "专业能力",
            "历史作品",
            "项目经验",
            "成交率",
            "准时率",
            "用户评价",
            "当前档期",
            "项目匹配度"
          ]
        },
        {
          question: "为什么专业版会员才能使用情绪板？",
          answer:
            "情绪板、分镜板和提示词包等功能需要大量智能计算资源。专业版会员可解锁这些高级创意工具，以获得更完整的创意策划体验。"
        }
      ]
    },
    {
      id: "payment",
      title: "支付与结算",
      items: [
        {
          question: "为什么需要托管付款？",
          answer:
            "托管支付可以同时保护品牌与创作者。品牌确认最终交付前，资金不会直接支付给创作者；创作者完成交付后，也无需担心无法收款。"
        },
        {
          question: "平台如何收费？",
          answer:
            "VINCIS 采用透明的平台服务费模式。服务费包含智能分析、项目匹配、托管支付、审片中心、文件管理及平台运营等完整服务。"
        },
        {
          question: "为什么平台收取服务费？",
          answer:
            "平台不仅提供交易撮合，还提供完整的广告制作协作系统，包括智能工具、在线审片、版本管理、全球支付、安全保障及项目管理服务。"
        }
      ]
    },
    {
      id: "partners",
      title: "合作伙伴",
      items: [
        {
          question: "如何加入合作伙伴计划？",
          answer: "申请通过后即可获得专属推广链接或邀请码。成功推荐品牌完成交易后，即可获得平台奖励。"
        },
        {
          question: "合作伙伴如何获得佣金？",
          answer:
            "佣金根据实际成交项目计算。所有奖励均来自平台服务费，不会增加品牌支付金额，也不会减少创作者收入。"
        }
      ]
    }
  ],
  cta: {
    title: "没有找到你的答案？",
    contactLabel: "问问智能助手卢西恩"
  },
  labels: {
    questionCount: "{count} 个问题",
    totalQuestions: "共 {count} 个问题"
  },
  publicLucien: {
    welcome:
      "你好，我是卢西恩。登录前我可以解答平台常见问题，例如注册、发布项目、付款与合作伙伴计划。",
    identity: {
      guest: "访客",
      brand: "品牌方",
      creator: "创作者",
      admin: "管理员",
      support: "平台支持"
    },
    inputPlaceholder: "问问卢西恩…",
    close: "关闭",
    loading: "卢西恩正在思考…",
    unavailable: "卢西恩暂时不可用，请稍后再试。",
    requestFailed: "卢西恩请求失败",
    loginHint: "登录后可使用完整版卢西恩，查看项目与账号专属信息。",
    loginLabel: "登录 VINCIS",
    suggestions: [
      "VINCIS 是什么？",
      "如何发布一个项目？",
      "什么是托管付款？",
      "为什么专业版会员才能使用情绪板？"
    ]
  }
};

const en: FaqCopy = {
  hero: {
    eyebrow: "FAQ",
    title: "Answers to the questions you care about.",
    subtitle:
      "We gathered the most common questions to help you understand VINCIS. If you cannot find an answer, contact us anytime."
  },
  categories: [
    {
      id: "account",
      title: "Account & registration",
      items: [
        {
          question: "What is VINCIS?",
          answer:
            "VINCIS connects global brands with AI creators. Brands find the right creators for ads; creators access real commercial projects worldwide."
        },
        {
          question: "Does registration cost money?",
          answer:
            "Registration, browsing, and profile setup are free. Some professional AI features and premium membership require an upgrade."
        },
        {
          question: "Do brands and creators need separate accounts?",
          answer:
            "Yes — one email maps to one identity. At signup you choose Brand or Creator, and you cannot switch later on the same account. Use separate emails if you need both roles."
        }
      ]
    },
    {
      id: "publish",
      title: "Publishing projects",
      items: [
        {
          question: "How do I publish a project?",
          answer:
            'Open Brand Portal, click "Publish project," and fill in requirements, budget, and timeline. AI helps structure the brief.'
        },
        {
          question: "Why does AI suggest a budget?",
          answer:
            "VINCIS does not use random quotes. The engine weighs complexity, duration, AI cost, creator hours, revisions, and historical deals."
        },
        {
          question: "What if my budget is below the AI suggestion?",
          answer:
            "You can still publish. A lower budget may reduce matched creators, lower match success, and increase wait time."
        },
        {
          question: "Why can I only run three projects at once?",
          answer:
            "To protect quality and creator capacity, each brand can run up to three active projects by default."
        }
      ]
    },
    {
      id: "creators",
      title: "Creators",
      items: [
        {
          question: "How do creators get projects?",
          answer:
            "After a project is published, AI matches creators by skill, portfolio, rate, region, and fit. Brands can also invite directly."
        },
        {
          question: "Can I decline a project?",
          answer:
            "Yes. Declining does not penalize your account, but sharing a reason helps AI improve future recommendations."
        },
        {
          question: "How do creators get paid?",
          answer:
            "After delivery is confirmed by the brand, escrow funds are released and settled to the creator account."
        }
      ]
    },
    {
      id: "ai",
      title: "AI features",
      items: [
        {
          question: "Will AI make the entire ad for me?",
          answer:
            "No. AI acts as a creative advisor — briefing, directions, production options, and efficiency support. Final work is done by professional creators."
        },
        {
          question: "Why did AI recommend this creator?",
          answer: "AI weighs real data across these dimensions — not random ranking:",
          bullets: [
            "Professional capability",
            "Portfolio history",
            "Project experience",
            "Close rate",
            "On-time delivery",
            "User ratings",
            "Current availability",
            "Project fit"
          ]
        },
        {
          question: "Why is Moodboard limited to Professional?",
          answer:
            "AI Moodboard, Storyboard, and Prompt Package require significant compute. Professional unlocks these advanced planning tools."
        }
      ]
    },
    {
      id: "payment",
      title: "Payment & settlement",
      items: [
        {
          question: "Why is escrow required?",
          answer:
            "Escrow protects both sides. Brands do not pay out before final delivery; creators do not worry about non-payment after delivery."
        },
        {
          question: "How does the platform charge?",
          answer:
            "VINCIS uses a transparent platform service fee covering AI analysis, matching, escrow, review center, file management, and operations."
        },
        {
          question: "Why is there a platform service fee?",
          answer:
            "Beyond matching, VINCIS provides full production infrastructure: AI tools, online review, version control, global payments, security, and project management."
        }
      ]
    },
    {
      id: "partners",
      title: "Partners",
      items: [
        {
          question: "How do I join the Partner Program?",
          answer:
            "After approval you receive a referral link or invite code. Successful brand referrals earn platform rewards."
        },
        {
          question: "How do partners earn commission?",
          answer:
            "Rewards are calculated from completed deals. All partner earnings come from the platform service fee — never added to brand spend or deducted from creator payout."
        }
      ]
    }
  ],
  cta: {
    title: "Didn't find your answer?",
    contactLabel: "Ask AI assistant Lucien"
  },
  labels: {
    questionCount: "{count} questions",
    totalQuestions: "{count} questions total"
  },
  publicLucien: {
    welcome:
      "Hi, I'm Lucien. Before you sign in, I can answer common questions about registration, publishing, payments, and the partner program.",
    identity: {
      guest: "Guest",
      brand: "Brand",
      creator: "Creator",
      admin: "Admin",
      support: "Support"
    },
    inputPlaceholder: "Ask Lucien…",
    close: "Close",
    loading: "Lucien is thinking…",
    unavailable: "Lucien is temporarily unavailable. Please try again later.",
    requestFailed: "Lucien request failed",
    loginHint: "Sign in for the full Lucien assistant with project and account context.",
    loginLabel: "Sign in to VINCIS",
    suggestions: [
      "What is VINCIS?",
      "How do I publish a project?",
      "What is escrow payment?",
      "Why is Moodboard limited to Professional?"
    ]
  }
};

export function faqText(locale: Locale): FaqCopy {
  return locale === "zh" ? zh : en;
}

export function formatFaqCount(template: string, count: number): string {
  return template.replace("{count}", String(count));
}

export function publicLucienCopy(locale: Locale): PublicLucienCopy {
  return faqText(locale).publicLucien;
}

export function publicLucienSuggestions(locale: Locale): string[] {
  return publicLucienCopy(locale).suggestions;
}
