import { CertifiedPartnerBadge } from "@/components/studioos/certification/certified-partner-badge";
import type { Locale } from "@/lib/i18n";
import { tCertificationExperience } from "@/lib/studioos/certification-experience-copy";
import { isCreatorVerified } from "@/lib/studioos/deposit-guard";
import type { Creator } from "@/lib/types";

export function CreatorMessageIdentity({
  locale,
  creator,
  name
}: {
  locale: Locale;
  creator: Creator;
  name: string;
}) {
  const badge = tCertificationExperience(locale).partnerBadge;

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {name}
      {isCreatorVerified(creator) ? (
        <CertifiedPartnerBadge label={badge} compact className="normal-case tracking-normal" />
      ) : null}
    </span>
  );
}
