import type { ConfirmedBriefField } from "@/lib/studioos/confirmed-brief";
import type { PayoutMethodType } from "@/lib/studioos/withdrawal-types";

export type CertificationFormStatus = "issued" | "profile_completed";

export type StoredCertificationForm = {
  id: string;
  form_id: string;
  creator_id: string;
  notification_id: string | null;
  deposit_payment_id: string | null;
  payment_method: PayoutMethodType | null;
  payment_reference: string | null;
  status: CertificationFormStatus;
  fields: ConfirmedBriefField[];
  full_text: string;
  issued_at: string;
  submitted_at: string | null;
  /** Set when the creator deletes the onboarding message — prevents auto-respawn. */
  message_dismissed_at?: string | null;
};

export type CertificationFormStore = {
  forms: StoredCertificationForm[];
};
