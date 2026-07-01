import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { applyToProjectAction } from "@/app/project-actions";
import { PageShell } from "@/components/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { creatorWorks } from "@/lib/data";
import { DepositRequiredCallout } from "@/components/studioos/deposit-required-callout";
import { getCurrentCreator, getCurrentCreatorId } from "@/lib/creator-session";
import { canAcceptCreatorOrders, countCompletedCreatorOrders } from "@/lib/studioos/deposit-guard";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { matchProjectsForCreator } from "@/lib/matching-engine";
import { listOrdersForCreator } from "@/lib/order-service";
import { getProject, listApplicationsForProject } from "@/lib/project-service";
import { formatDate } from "@/lib/utils";

const copy = {
  en: {
    back: "Back to project desk",
    match: "AI match score",
    reasons: "Why this brief fits you",
    apply: "Apply to produce",
    proposal: "Production plan",
    timeline: "Timeline",
    amount: "Proposed amount (USD)",
    submit: "Submit application",
    login: "Sign in as creator to apply",
    applied: "Application submitted.",
    applications: "Applications so far"
  },
  zh: {
    back: "返回项目大厅",
    match: "AI 匹配分",
    reasons: "为什么适合你的作品集",
    apply: "申请承接",
    proposal: "制作方案",
    timeline: "交付周期",
    amount: "报价（USD）",
    submit: "提交申请",
    login: "请登录创作者账号后申请",
    applied: "申请已提交。",
    applications: "当前申请数"
  }
};

type ProjectDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams & { applied?: string; error?: string }>;
};

export default async function ProjectDetailPage({ params, searchParams }: ProjectDetailPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const locale = getLocale(query);
  const t = copy[locale];
  const project = await getProject(id);
  const creator = await getCurrentCreator();
  const creatorId = await getCurrentCreatorId();

  if (!project) {
    return (
      <PageShell locale={locale}>
        <main className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h1 className="text-3xl font-semibold">{locale === "zh" ? "项目不存在" : "Project not found"}</h1>
        </main>
      </PageShell>
    );
  }

  const applications = await listApplicationsForProject(project.id);
  const match = creator
    ? matchProjectsForCreator(
        creator,
        creatorWorks.filter((work) => work.creator_id === creator.id),
        [project]
      )[0]
    : null;
  const completedOrders = creator ? countCompletedCreatorOrders(await listOrdersForCreator(creator.id)) : 0;
  const canApply = canAcceptCreatorOrders(creator, completedOrders);

  return (
    <PageShell locale={locale}>
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Button asChild variant="outline" size="sm">
          <Link href={withLocale("/projects", locale)}>
            <ArrowLeft className="h-4 w-4" /> {t.back}
          </Link>
        </Button>

        <div className="mt-8 grid gap-8 lg:grid-cols-[0.58fr_0.42fr]">
          <Card className="shadow-none">
            <CardContent className="p-6 sm:p-8">
              <p className="text-sm text-muted-foreground">{project.category}</p>
              <h1 className="mt-2 text-4xl font-semibold">{project.company_name}</h1>
              <p className="mt-4 text-base leading-8 text-muted-foreground">{project.campaign_goal}</p>
              {project.notes ? <p className="mt-4 text-sm leading-7 text-muted-foreground">{project.notes}</p> : null}
              <div className="mt-6 flex flex-wrap gap-2">
                <Badge variant="secondary">{project.budget_range}</Badge>
                <Badge variant="secondary">{project.target_platform}</Badge>
                <Badge variant="outline">
                  {project.video_count} × {project.video_format}
                </Badge>
                <Badge variant="outline">{formatDate(project.deadline)}</Badge>
              </div>
              {match ? (
                <div className="mt-8 rounded-lg border bg-muted/30 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Sparkles className="h-4 w-4" />
                    {t.match}: {match.score}%
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {match.reasons.slice(0, 5).map((reason) => (
                      <Badge key={reason.en} variant="secondary">
                        {locale === "zh" ? reason.zh : reason.en}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}
              <p className="mt-6 text-sm text-muted-foreground">
                {t.applications}: {applications.length}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="p-6 sm:p-8">
              <h2 className="text-xl font-semibold">{t.apply}</h2>
              {query.applied ? <p className="mt-3 text-sm text-emerald-700">{t.applied}</p> : null}
              {creatorId ? (
                canApply ? (
                <form action={applyToProjectAction} className="mt-6 grid gap-4">
                  <input type="hidden" name="lang" value={locale} />
                  <input type="hidden" name="project_id" value={project.id} />
                  <input type="hidden" name="creator_id" value={creatorId} />
                  <div className="grid gap-2">
                    <Label htmlFor="proposal">{t.proposal}</Label>
                    <Textarea
                      id="proposal"
                      name="proposal"
                      required
                      rows={5}
                      placeholder={
                        locale === "zh"
                          ? "说明你的制作思路、参考风格、交付内容和修改次数..."
                          : "Explain your production approach, references, deliverables, and revision policy..."
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="timeline">{t.timeline}</Label>
                    <Input id="timeline" name="timeline" required placeholder="72 hours" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="proposed_amount">{t.amount}</Label>
                    <Input id="proposed_amount" name="proposed_amount" type="number" min="1" required />
                  </div>
                  <Button type="submit">{t.submit}</Button>
                </form>
                ) : (
                  <div className="mt-6">
                    <DepositRequiredCallout locale={locale} compact />
                  </div>
                )
              ) : (
                <div className="mt-6">
                  <p className="text-sm text-muted-foreground">{t.login}</p>
                  <Button asChild className="mt-4">
                    <Link href={withLocale("/login?role=creator", locale)}>{locale === "zh" ? "登录" : "Sign in"}</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </PageShell>
  );
}
