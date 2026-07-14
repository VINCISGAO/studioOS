export type StoredCreatorProfile = {
  creator_id: string;
  name: string;
  headline: string;
  bio: string;
  avatar_url?: string;
  cover_url?: string;
  country: string;
  city?: string;
  portfolio_url: string;
  specialties: string[];
  expertise_domains: string[];
  tools: string[];
  delivery_speed: string;
  min_project_budget_usd: number;
  ai_tags: string[];
  profile_completed_at: string | null;
  updated_at: string;
};

export type CreatorProfileStore = {
  profiles: Record<string, StoredCreatorProfile>;
};
