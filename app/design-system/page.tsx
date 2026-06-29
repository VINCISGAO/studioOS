import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/studioos/ui/empty-state";
import { PageHeader } from "@/components/studioos/ui/page-header";
import { StatCard } from "@/components/studioos/ui/stat-card";
import { WizardStepper } from "@/components/studioos/ui/wizard-stepper";
import { radius, spacing, studioClasses, typography } from "@/lib/design/tokens";

export const metadata = {
  title: "Design System — StudioOS"
};

export default function DesignSystemPage() {
  return (
    <div className={studioClasses.shellBg}>
      <div className="mx-auto max-w-5xl px-6 py-12">
        <PageHeader
          eyebrow="Sprint 11"
          title="StudioOS Design System"
          description="Token 统一参考页 — 禁止页面自行发明 padding / radius / 语义色。"
        />

        <section className="mb-12 space-y-4">
          <h2 className={typography.subtitle}>Spacing & Radius</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Spacing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-caption">
                {Object.entries(spacing).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span>{key}</span>
                    <span>{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Radius</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-caption">
                {Object.entries(radius).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span>{key}</span>
                    <span>{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mb-12 space-y-4">
          <h2 className={typography.subtitle}>Typography</h2>
          <Card className="p-6">
            <p className={typography.display}>Display — Hero headline</p>
            <p className={`mt-4 ${typography.title}`}>Title — Page title</p>
            <p className={`mt-4 ${typography.subtitle}`}>Subtitle — Section header</p>
            <p className={`mt-4 ${typography.body}`}>Body — Default content copy for forms and lists.</p>
            <p className={`mt-4 ${typography.caption}`}>Caption — Meta / timestamps</p>
            <p className={`mt-4 ${typography.label}`}>LABEL — FORM FIELD</p>
          </Card>
        </section>

        <section className="mb-12 space-y-4">
          <h2 className={typography.subtitle}>Buttons</h2>
          <div className="flex flex-wrap gap-3">
            <Button size="sm">Small 32px</Button>
            <Button>Medium 40px</Button>
            <Button size="lg">Large 48px</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="brand">Brand</Button>
            <Button variant="studio">Studio</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="success">Success</Button>
            <Button disabled>Disabled</Button>
          </div>
        </section>

        <section className="mb-12 space-y-4">
          <h2 className={typography.subtitle}>Badges & Inputs</h2>
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="destructive">Danger</Badge>
            <Badge variant="review">Review</Badge>
          </div>
          <Input placeholder="Input — 14px radius, 40px height" className="max-w-md" />
        </section>

        <section className="mb-12 space-y-4">
          <h2 className={typography.subtitle}>Stat Cards</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Active campaigns" value="12" hint="+2 this week" trend="up" />
            <StatCard label="In review" value="3" hint="On track" trend="neutral" />
            <StatCard label="Escrow held" value="$24.8k" hint="-5% vs last month" trend="down" />
          </div>
        </section>

        <section className="mb-12 space-y-4">
          <h2 className={typography.subtitle}>Wizard Stepper (7 steps)</h2>
          <Card className="p-6">
            <WizardStepper locale="en" currentStep={4} />
          </Card>
        </section>

        <section className="space-y-4">
          <h2 className={typography.subtitle}>Empty State</h2>
          <EmptyState
            title="No campaigns yet"
            description="Create your first campaign to start matching creators."
            actionLabel="Create campaign"
            actionHref="/brand/projects/new"
          />
        </section>
      </div>
    </div>
  );
}
