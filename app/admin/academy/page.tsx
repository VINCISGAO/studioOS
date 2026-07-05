import Link from "next/link";
import { ArrowLeft, BookOpen, CheckCircle2, Clock, GraduationCap } from "lucide-react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getAdminSessionUser } from "@/features/admin/auth/admin-auth.service";
import { partnerAcademyAdminService } from "@/features/partner-academy/partner-academy-admin.service";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";

const copy = {
  en: {
    back: "Back to admin",
    kicker: "Enablement",
    title: "VINCIS Academy",
    subtitle: "Manage onboarding, creator training, brand education, and partner enablement content from the database.",
    published: "Published",
    lessons: "Lessons",
    minutes: "Training minutes",
    completions: "Completions",
    courses: "Course library",
    empty: "No academy courses yet. Seed the database or create course records to activate Academy.",
    audience: "Audience",
    status: "Status",
    level: "Level",
    duration: "Duration",
    owner: "Owner"
  },
  zh: {
    back: "返回管理后台",
    kicker: "培训赋能",
    title: "VINCIS 学院",
    subtitle: "从数据库管理入驻培训、创作者课程、品牌教育和合伙人赋能内容。",
    published: "已发布",
    lessons: "课程节数",
    minutes: "培训分钟",
    completions: "完成人次",
    courses: "课程库",
    empty: "还没有 Academy 课程。运行 seed 或创建课程记录后即可启用学院。",
    audience: "受众",
    status: "状态",
    level: "等级",
    duration: "时长",
    owner: "负责人"
  }
};

function statusBadge(status: string): BadgeProps["variant"] {
  if (status === "PUBLISHED") return "success";
  if (status === "DRAFT") return "warning";
  return "outline";
}

export default async function AdminAcademyPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const locale = getLocale(await searchParams);
  const t = copy[locale];
  const user = await getAdminSessionUser();
  const data = user
    ? await partnerAcademyAdminService.getAcademyDashboard(user)
    : { totals: { lessons: 0, minutes: 0, completions: 0, published: 0 }, byAudience: [], byStatus: [], courses: [] };

  return (
    <div>
      <Button asChild variant="outline" size="sm">
        <Link href={withLocale(adminPortalRoutes.dashboard, locale)}>
          <ArrowLeft className="h-4 w-4" /> {t.back}
        </Link>
      </Button>

      <div className="mt-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">{t.kicker}</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">{t.title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{t.subtitle}</p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        {[
          { label: t.published, value: String(data.totals.published), icon: CheckCircle2 },
          { label: t.lessons, value: String(data.totals.lessons), icon: BookOpen },
          { label: t.minutes, value: String(data.totals.minutes), icon: Clock },
          { label: t.completions, value: String(data.totals.completions), icon: GraduationCap }
        ].map((item) => (
          <Card key={item.label} className="shadow-none">
            <CardContent className="flex items-center justify-between gap-4 p-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold">{item.value}</p>
              </div>
              <item.icon className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card className="shadow-none">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold">{t.courses}</h2>
            {data.courses.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">{t.empty}</p>
            ) : (
              <div className="mt-5 space-y-4">
                {data.courses.map((course) => (
                  <div key={course.id} className="rounded-2xl border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{course.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{course.subtitle ?? course.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={statusBadge(course.status)}>{course.status}</Badge>
                        <Badge variant="outline">{course.audience}</Badge>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-4">
                      <p>{t.level}: {course.level}</p>
                      <p>{t.duration}: {course.durationMinutes}m</p>
                      <p>{t.lessons}: {course.lessonCount}</p>
                      <p>{t.owner}: {course.owner}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="shadow-none">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold">{t.audience}</h2>
              <div className="mt-4 space-y-3">
                {data.byAudience.map((item) => (
                  <div key={item.audience} className="flex items-center justify-between text-sm">
                    <span>{item.audience}</span>
                    <span className="font-semibold">{item.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-none">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold">{t.status}</h2>
              <div className="mt-4 space-y-3">
                {data.byStatus.map((item) => (
                  <div key={item.status} className="flex items-center justify-between text-sm">
                    <span>{item.status}</span>
                    <span className="font-semibold">{item.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
