export type ChatSender = "brand" | "creator" | "system";

export type MessageKind = "text" | "reference" | "pitch";

export type StoredInquiry = {
  id: string;
  creator_id: string;
  work_id: string | null;
  client_name: string;
  client_email: string;
  company_name: string;
  budget_range: string;
  message: string;
  status: "new" | "quoted" | "escrow_pending" | "converted" | "closed";
  created_at: string;
  project_id?: string | null;
};

export type StoredMessage = {
  id: string;
  inquiry_id: string;
  sender: ChatSender;
  body: string;
  kind?: MessageKind;
  attachment_url?: string | null;
  contact_filtered?: boolean;
  created_at: string;
};

export type ChatStore = {
  inquiries: StoredInquiry[];
  messages: StoredMessage[];
};

export type CreateInquiryInput = {
  creator_id: string;
  work_id?: string | null;
  client_name: string;
  client_email: string;
  company_name?: string;
  budget_range?: string;
  message: string;
  project_id?: string | null;
};
