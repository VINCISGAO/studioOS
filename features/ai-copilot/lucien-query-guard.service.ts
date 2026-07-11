import {
  lucienRefusalMessageForCategory,
  type LucienQueryBlockCategory
} from "@/features/ai-copilot/lucien-knowledge-boundary.constants";

export type LucienQueryAssessment = {
  blocked: boolean;
  category?: LucienQueryBlockCategory;
  refusalMessage?: string;
};

type GuardRule = {
  category: LucienQueryBlockCategory;
  patterns: RegExp[];
};

const GUARD_RULES: GuardRule[] = [
  {
    category: "source_code",
    patterns: [
      /源代码|源码|source\s*code/i,
      /\b(prisma|typescript|tsx?|javascript|python|react|next\.js)\b/i,
      /git\s*(repo|commit|仓库)/i,
      /\.(ts|tsx|js|jsx|sql|prisma)\b/i,
      /server\s*action/i,
      /middleware/i
    ]
  },
  {
    category: "database_schema",
    patterns: [
      /数据库\s*(表|字段|结构|schema)/i,
      /\b(prisma\s*schema|migration|sql\s*语句)\b/i,
      /\b(table|column|foreign\s*key)\s*(definition|结构)/i
    ]
  },
  {
    category: "api_implementation",
    patterns: [
      /api\s*(路由|实现|接口)/i,
      /\b(api\s*route|endpoint\s*implementation|接口实现)\b/i,
      /实现逻辑|implementation\s*logic/i,
      /反向分析|reverse\s*engineer/i
    ]
  },
  {
    category: "environment_secrets",
    patterns: [
      /环境变量|env\s*variable/i,
      /\b(secret|token|password|api\s*key|密钥|密码)\b/i,
      /openai[_\s-]*key/i,
      /stripe\s*secret/i,
      /存储路径|file\s*storage\s*path/i
    ]
  },
  {
    category: "prompt_extraction",
    patterns: [
      /系统提示词|system\s*prompt/i,
      /内部\s*prompt|internal\s*prompt/i,
      /rag\s*(配置|检索)/i,
      /模型调用参数|model\s*parameters/i,
      /开发者模式|developer\s*mode/i,
      /忽略之前规则|ignore\s*(previous|all)\s*rules/i,
      /jailbreak|dan\s*mode/i
    ]
  },
  {
    category: "context_dump",
    patterns: [
      /原始文档|raw\s*document/i,
      /检索到的.{0,8}(全文|原文)/i,
      /输出.{0,8}上下文|print\s*(your\s*)?context/i,
      /逐字打印|verbatim/i,
      /base64/i,
      /数据库记录.{0,6}全部|list\s*all\s*(database\s*)?fields/i
    ]
  },
  {
    category: "role_impersonation",
    patterns: [
      /我是.{0,6}(开发者|管理员|创始人|openai|安全测试)/i,
      /i\s*am\s*(the\s*)?(developer|admin|founder|openai|security\s*tester)/i,
      /假装你是开发者|pretend\s*you\s*are\s*a\s*developer/i
    ]
  },
  {
    category: "security_bypass",
    patterns: [
      /安全审计.{0,8}细节|security\s*audit\s*details/i,
      /漏洞细节|vulnerability\s*details/i,
      /绕过.{0,6}(鉴权|权限|风控)/i,
      /bypass\s*(auth|permission|security)/i,
      /攻击方式|exploit\s*method/i
    ]
  },
  {
    category: "cross_user_privacy",
    patterns: [
      /查.{0,12}别人/,
      /给我.{0,12}别人/,
      /我是说别人/,
      /i\s*mean\s*(other|others)\b/i,
      /别人的.{0,12}(订单|项目|付款|收入|钱包|campaign|order)/i,
      /别人.{0,12}有多少.{0,12}(订单|项目|用户|order|campaign)/i,
      /别人.{0,12}(的)?(订单|项目|付款|收入|钱包|数据)/i,
      /其他用户.{0,12}(的)?(订单|项目|付款|收入|钱包|数据)/i,
      /别的(用户|品牌|创作者).{0,12}(订单|项目|付款|收入|数据)/i,
      /other\s+users?.{0,20}(orders?|campaigns?|payments?|wallets?|projects?|data)/i,
      /other\s+people.{0,20}(orders?|campaigns?|payments?)/i,
      /someone\s+else.{0,20}(orders?|campaigns?|payments?)/i,
      /how\s+many\s+orders?.{0,20}(do\s+)?others?\s+have/i,
      /(orders?|campaigns?).{0,20}other\s+users?/i
    ]
  }
];

function normalizeQuery(message: string) {
  return message.trim().toLowerCase();
}

export class LucienQueryGuardService {
  assess(message: string, language: string): LucienQueryAssessment {
    const normalized = normalizeQuery(message);
    if (!normalized) {
      return { blocked: false };
    }

    for (const rule of GUARD_RULES) {
      if (rule.patterns.some((pattern) => pattern.test(normalized))) {
        return {
          blocked: true,
          category: rule.category,
          refusalMessage: lucienRefusalMessageForCategory(rule.category, language)
        };
      }
    }

    return { blocked: false };
  }
}

export const lucienQueryGuardService = new LucienQueryGuardService();
