import type { Locale } from "@/lib/i18n";

export type BrandTeamRole =
  | "admin"
  | "ad_manager"
  | "creative"
  | "review_viewer"
  | "finance_viewer"
  | "member";

export type BrandTeamMemberStatus = "active" | "invited";

export type BrandTeamMember = {
  id: string;
  name: string;
  email: string;
  role: BrandTeamRole;
  joinedAt: string;
  status: BrandTeamMemberStatus;
};

export type BrandTeamStatCard = {
  key: "members" | "active" | "roles" | "collaboration";
  label: string;
  value: number;
  hint: string;
  icon: "users" | "user-check" | "shield" | "folder";
};

export type BrandTeamRoleGuide = {
  role: BrandTeamRole;
  title: string;
  description: string;
  icon: "users" | "user" | "pencil" | "eye" | "wallet";
};

const roleLabels = {
  zh: {
    admin: "管理员",
    ad_manager: "广告经理",
    creative: "创意制作",
    review_viewer: "审片查看",
    finance_viewer: "财务查看",
    member: "成员",
    all: "全部角色"
  },
  en: {
    admin: "Admin",
    ad_manager: "Ad manager",
    creative: "Creative producer",
    review_viewer: "Review viewer",
    finance_viewer: "Finance viewer",
    member: "Member",
    all: "All roles"
  }
} as const;

const statusLabels = {
  zh: { active: "活跃", invited: "已邀请" },
  en: { active: "Active", invited: "Invited" }
} as const;

export const BRAND_TEAM_PAGE_SIZE = 5;

export const BRAND_TEAM_DEMO_MEMBERS: BrandTeamMember[] = [
  {
    id: "tm_mia",
    name: "Mia Anderson",
    email: "mia@arcalloy.com",
    role: "admin",
    joinedAt: "2024-01-18",
    status: "active"
  },
  {
    id: "tm_jason",
    name: "Jason Lin",
    email: "jason@arcalloy.com",
    role: "ad_manager",
    joinedAt: "2024-02-03",
    status: "active"
  },
  {
    id: "tm_yuki",
    name: "Yuki Wang",
    email: "yuki@arcalloy.com",
    role: "creative",
    joinedAt: "2024-02-10",
    status: "active"
  },
  {
    id: "tm_tom",
    name: "Tom Chen",
    email: "tom@arcalloy.com",
    role: "finance_viewer",
    joinedAt: "2024-03-01",
    status: "invited"
  },
  {
    id: "tm_sarah",
    name: "Sarah Lee",
    email: "sarah@arcalloy.com",
    role: "review_viewer",
    joinedAt: "2024-03-15",
    status: "invited"
  },
  {
    id: "tm_alex",
    name: "Alex Wu",
    email: "alex@arcalloy.com",
    role: "ad_manager",
    joinedAt: "2024-03-20",
    status: "active"
  },
  {
    id: "tm_emma",
    name: "Emma Liu",
    email: "emma@arcalloy.com",
    role: "member",
    joinedAt: "2024-04-01",
    status: "invited"
  },
  {
    id: "tm_chris",
    name: "Chris Park",
    email: "chris@arcalloy.com",
    role: "creative",
    joinedAt: "2024-04-10",
    status: "active"
  },
  {
    id: "tm_nina",
    name: "Nina Zhou",
    email: "nina@arcalloy.com",
    role: "review_viewer",
    joinedAt: "2024-04-15",
    status: "active"
  },
  {
    id: "tm_david",
    name: "David Kim",
    email: "david@arcalloy.com",
    role: "finance_viewer",
    joinedAt: "2024-05-01",
    status: "invited"
  }
];

export function brandTeamRoleLabel(role: BrandTeamRole | "all", locale: Locale) {
  return roleLabels[locale][role];
}

export function brandTeamStatusLabel(status: BrandTeamMemberStatus, locale: Locale) {
  return statusLabels[locale][status];
}

export function brandTeamMemberInitials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

const avatarTones = [
  "bg-violet-600 text-white",
  "bg-sky-500 text-white",
  "bg-emerald-600 text-white",
  "bg-amber-500 text-white",
  "bg-rose-500 text-white",
  "bg-indigo-600 text-white",
  "bg-teal-600 text-white"
] as const;

function hashIndex(value: string, size: number) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash + value.charCodeAt(i) * (i + 1)) % size;
  }
  return hash;
}

export function brandTeamMemberAvatarTone(memberId: string) {
  return avatarTones[hashIndex(memberId, avatarTones.length)] ?? avatarTones[0];
}

export function formatBrandTeamJoinDate(isoDate: string, locale: Locale) {
  const date = new Date(`${isoDate}T00:00:00`);
  return date.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
}

export function buildBrandTeamStatCards(locale: Locale): BrandTeamStatCard[] {
  if (locale === "zh") {
    return [
      {
        key: "members",
        label: "团队成员",
        value: 12,
        hint: "已邀请 12 人",
        icon: "users"
      },
      {
        key: "active",
        label: "活跃成员",
        value: 8,
        hint: "过去 30 天活跃",
        icon: "user-check"
      },
      {
        key: "roles",
        label: "角色",
        value: 4,
        hint: "不同权限级别",
        icon: "shield"
      },
      {
        key: "collaboration",
        label: "项目协作",
        value: 24,
        hint: "跨 Campaign 协作中",
        icon: "folder"
      }
    ];
  }

  return [
    {
      key: "members",
      label: "Team members",
      value: 12,
      hint: "12 invited",
      icon: "users"
    },
    {
      key: "active",
      label: "Active members",
      value: 8,
      hint: "Active in last 30 days",
      icon: "user-check"
    },
    {
      key: "roles",
      label: "Roles",
      value: 4,
      hint: "Permission levels",
      icon: "shield"
    },
    {
      key: "collaboration",
      label: "Collaboration",
      value: 24,
      hint: "Across campaigns",
      icon: "folder"
    }
  ];
}

export function buildBrandTeamRoleGuides(locale: Locale): BrandTeamRoleGuide[] {
  if (locale === "zh") {
    return [
      {
        role: "admin",
        title: "管理员",
        description: "管理团队、成员、权限与账单",
        icon: "users"
      },
      {
        role: "ad_manager",
        title: "广告经理",
        description: "创建与管理 Campaign，查看数据与报表",
        icon: "user"
      },
      {
        role: "creative",
        title: "创意制作",
        description: "上传素材、创建广告、查看效果",
        icon: "pencil"
      },
      {
        role: "review_viewer",
        title: "审片查看",
        description: "审片与评论，无法修改项目",
        icon: "eye"
      },
      {
        role: "finance_viewer",
        title: "财务查看",
        description: "查看账单与发票，无操作权限",
        icon: "wallet"
      }
    ];
  }

  return [
    {
      role: "admin",
      title: "Admin",
      description: "Manage team, members, permissions, and billing",
      icon: "users"
    },
    {
      role: "ad_manager",
      title: "Ad manager",
      description: "Create campaigns and view performance reports",
      icon: "user"
    },
    {
      role: "creative",
      title: "Creative producer",
      description: "Upload assets, create ads, and view results",
      icon: "pencil"
    },
    {
      role: "review_viewer",
      title: "Review viewer",
      description: "Review and comment without editing projects",
      icon: "eye"
    },
    {
      role: "finance_viewer",
      title: "Finance viewer",
      description: "View bills and invoices with read-only access",
      icon: "wallet"
    }
  ];
}

export function filterBrandTeamMembers(
  members: BrandTeamMember[],
  query: string,
  roleFilter: BrandTeamRole | "all",
  locale: Locale
) {
  const normalized = query.trim().toLowerCase();
  return members.filter((member) => {
    const roleMatch = roleFilter === "all" || member.role === roleFilter;
    if (!roleMatch) return false;
    if (!normalized) return true;
    const roleLabel = brandTeamRoleLabel(member.role, locale).toLowerCase();
    return (
      member.name.toLowerCase().includes(normalized) ||
      member.email.toLowerCase().includes(normalized) ||
      roleLabel.includes(normalized)
    );
  });
}

export const BRAND_TEAM_INVITE_LINK = "https://studioos.app/invite/brand/arcalloy?token=demo";

export const brandTeamInviteRoleOptions: BrandTeamRole[] = [
  "member",
  "ad_manager",
  "creative",
  "review_viewer",
  "finance_viewer",
  "admin"
];
