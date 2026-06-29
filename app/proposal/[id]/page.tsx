import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { LivePitchForm } from "@/components/proposal/live-pitch-form";
import { ProposalChatRoom } from "@/components/proposal/proposal-chat-room";
import { ProposalContractPanel } from "@/components/proposal/proposal-contract-panel";
import { ProposalStageBar } from "@/components/proposal/proposal-stage-bar";
import { PageShell } from "@/components/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getInquiry, getMessagesForPair, consolidateInquiryThreads } from "@/lib/chat-service";
import { getCurrentCreator, getCurrentCreatorId } from "@/lib/creator-session";
import { getCreatorById } from "@/lib/creator-service";
import { hasPaidCreatorDeposit } from "@/lib/studioos/deposit-guard";
import { creatorWorks } from "@/lib/data";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { getActiveQuoteForPair, getOrderForPair } from "@/lib/order-service";
import { isProposalChatLocked, resolveProposalStage } from "@/lib/studioos/project-contract";

const copy = {
  en: {
    back: "Back to match",
    backStudio: "Studio portal",
    title: "Proposal Room",
    subtitle: "Professional communication on-platform. Contract auto-generated from agreement. Chat locks when production starts.",
    brand: "Brand",
    studio: "Studio",
    dashboard: "Brand portal"
  },
  zh: {
    back: "返回匹配",
    backStudio: "Studio 门户",
    title: "Proposal Room",
    subtitle: "专业沟通留在平台内。达成一致后自动生成合同。进入制作后聊天锁定，改用时轴审片。",
    brand: "Brand",
    studio: "Studio",
    dashboard: "Brand 门户"
  }
};

export const dynamic = "force-dynamic";

export default async function ProposalRoomPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const locale = getLocale(query);
  const t = copy[locale];
  const inquiry = await getInquiry(id);

  if (!inquiry) notFound();

  const canonical =
    (await consolidateInquiryThreads(inquiry.client_email, inquiry.creator_id)) ?? inquiry;

  if (canonical.id !== id) {
    redirect(withLocale(`/proposal/${canonical.id}`, locale));
  }

  const creator = await getCreatorById(inquiry.creator_id);
  if (!creator) notFound();

  const currentCreatorId = await getCurrentCreatorId();
  const currentCreator = await getCurrentCreator();
  const viewerRole = currentCreatorId === inquiry.creator_id ? "studio" : "brand";
  const depositPaid = viewerRole === "studio" ? hasPaidCreatorDeposit(currentCreator) : true;
  const messages = await getMessagesForPair(inquiry.client_email, inquiry.creator_id);
  const quote = await getActiveQuoteForPair(inquiry.client_email, inquiry.creator_id);
  const order = await getOrderForPair(inquiry.client_email, inquiry.creator_id);
  const proposalLocked = isProposalChatLocked(order);
  const stage = resolveProposalStage(order, quote);
  const work = creatorWorks.find((w) => w.id === inquiry.work_id);

  return (
    <PageShell locale={locale}>
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Button asChild variant="outline" size="sm">
          <Link href={withLocale(viewerRole === "studio" ? "/studio" : "/brand/projects", locale)}>
            <ArrowLeft className="h-4 w-4" /> {viewerRole === "studio" ? t.backStudio : t.dashboard}
          </Link>
        </Button>

        <div className="mt-6">
          <h1 className="text-3xl font-semibold tracking-tight">{t.title}</h1>
          <p className="mt-2 text-sm text-zinc-500">{t.subtitle}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge>{creator.name}</Badge>
            <Badge variant="outline">
              {t.brand}: {inquiry.client_name}
            </Badge>
            {inquiry.budget_range ? <Badge variant="outline">{inquiry.budget_range}</Badge> : null}
            {work ? <Badge variant="outline">{work.title}</Badge> : null}
          </div>
        </div>

        <div className="mt-6">
          <ProposalStageBar locale={locale} current={stage} />
        </div>

        <ProposalContractPanel
          locale={locale}
          inquiry={inquiry}
          messages={messages}
          inquiryId={inquiry.id}
          clientEmail={inquiry.client_email}
          clientName={inquiry.client_name}
          viewerRole={viewerRole}
          quote={quote}
          order={order}
          proposalLocked={proposalLocked}
          depositPaid={depositPaid}
        />

        {viewerRole === "studio" ? (
          <LivePitchForm locale={locale} inquiryId={inquiry.id} disabled={proposalLocked} />
        ) : null}

        <div className="mt-8">
          <ProposalChatRoom
            locale={locale}
            inquiryId={inquiry.id}
            creator={creator}
            viewerRole={viewerRole}
            clientName={inquiry.client_name}
            initialMessages={messages}
            locked={proposalLocked}
          />
        </div>
      </main>
    </PageShell>
  );
}
