export type ApplicationStatus = "pending" | "approved" | "rejected";

export type CreatorApplication = {
  id: string;
  studio_name: string;
  email: string;
  country: string;
  portfolio_url: string;
  specialties: string;
  tools: string;
  base_price: string;
  delivery_speed: string;
  notes: string;
  status: ApplicationStatus;
  created_at: string;
  reviewed_at: string | null;
};

export type OnboardingStore = {
  applications: CreatorApplication[];
};

export type CreateApplicationInput = {
  studio_name: string;
  email: string;
  country: string;
  portfolio_url: string;
  specialties: string;
  tools: string;
  base_price: string;
  delivery_speed: string;
  notes: string;
};
